# 07 — Error Handling Strategy

## Guiding Principle

> **Never crash. Always degrade gracefully.**

Errors are classified into three tiers:

| Tier | Name          | Behaviour                                      |
|------|---------------|------------------------------------------------|
| 1    | Fatal         | Server cannot start or DB is unreachable       |
| 2    | Recoverable   | Bad config, unknown component — apply defaults, log, continue |
| 3    | User-facing   | Invalid input, permission denied — return structured JSON error |

---

## 7.1 Config Validation Errors

Handled at load time by the Config Loader.

```
safeParse(rawConfig)
  │
  ├─ SUCCESS → use as-is
  └─ FAILURE (ZodError):
        ├─ Collect all issue paths and messages
        ├─ Apply field-level defaults:
        │     field.type = unknown value  → coerce to 'text'
        │     field.required missing      → default false
        │     component.type = unknown    → keep as 'unknown' (renderer handles it)
        │     page.layout = unknown       → coerce to 'default'
        ├─ Log warnings: { appId, errors: ['[resources.0.fields.2.type] Invalid value'] }
        ├─ Store errors in ConfigLoadResult.errors[]
        └─ Return coerced config (app still runs, warnings shown in builder UI)
```

Config errors that cannot be coerced (e.g., `resources` is a string instead of an array) cause the app to render an **AppConfigError** page instead of crashing the server.

---

## 7.2 Unknown Component Types

```typescript
// UnknownComponent.tsx
export function UnknownComponent({ component }: { component: Component }) {
  if (process.env.NODE_ENV === 'production') {
    return null  // silently hide in production
  }
  return (
    <div className="border border-yellow-400 bg-yellow-50 rounded p-4 text-sm">
      <p className="font-semibold text-yellow-700">Unknown component type: "{component.type}"</p>
      <p className="text-yellow-600 mt-1">
        Register this type in <code>components/runtime/registry.ts</code>
      </p>
      <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(component.config, null, 2)}</pre>
    </div>
  )
}
```

---

## 7.3 React Error Boundaries

Every `DynamicRenderer` call is wrapped in an `ErrorBoundary`. A single broken component does not take down the page.

```typescript
// ErrorBoundary.tsx
class ErrorBoundary extends React.Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error('Component render error', { error: error.message, stack: info.componentStack })
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}
```

---

## 7.4 API Error Handling

Central error handler wraps all route handlers:

```typescript
// lib/utils/apiHandler.ts
export function withErrorHandler(
  handler: (req: NextRequest, ctx: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, ctx: any): Promise<NextResponse> => {
    try {
      return await handler(req, ctx)
    } catch (err) {
      return handleApiError(err)
    }
  }
}

function handleApiError(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    return NextResponse.json({
      error: { code: 'VALIDATION_ERROR', message: 'Validation failed',
               fields: formatZodErrors(err) }
    }, { status: 422 })
  }

  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {          // Record not found
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Record not found' } }, { status: 404 })
    }
    if (err.code === 'P2002') {          // Unique constraint
      return NextResponse.json({ error: { code: 'CONFLICT', message: 'Duplicate value' } }, { status: 409 })
    }
  }

  if (err instanceof AppConfigError) {
    return NextResponse.json({ error: { code: 'CONFIG_INVALID', message: err.message } }, { status: 500 })
  }

  logger.error('Unhandled API error', { err })
  return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 })
}
```

---

## 7.5 Workflow Step Errors

```
Step execution fails:
  │
  ├─ Retry logic (BullMQ):
  │     attempts: 3, backoff: { type: 'exponential', delay: 2000 }
  │
  ├─ After 3 failures:
  │     ├─ WorkflowStep.status = FAILED
  │     ├─ WorkflowStep.error = err.message
  │     └─ Check step.onFailure:
  │           ├─ Defined → continue workflow at that step
  │           └─ Undefined → mark WorkflowRun.status = FAILED, stop
  │
  └─ Notify: send alert to app admin (email or webhook, if configured)
```

---

## 7.6 CSV Import Errors

Row-level errors do not stop the import. The job completes with partial success.

```
Each row validation:
  ├─ PASS → added to valid batch
  └─ FAIL →
        ├─ Appended to ImportJob.errors[]: { row: 42, message: "email: Invalid email" }
        ├─ ImportJob.failedRows++
        └─ Processing continues to next row

After import:
  └─ ImportJob.status = COMPLETED (even with failures)
     Frontend shows: "148 imported, 3 failed" with downloadable error report
```

---

## 7.7 Schema Mismatch (DB vs Config)

When the config references a resource that has no Prisma model:

```typescript
const model = (prisma as any)[resourceDef.name]
if (!model) {
  // Log clearly for the developer
  logger.warn('SCHEMA_MISMATCH', {
    resource: resourceDef.name,
    hint: 'Run `npm run schema:sync` then review and apply the generated migration',
  })
  return NextResponse.json({
    error: {
      code: 'SCHEMA_MISMATCH',
      message: `Resource "${resourceDef.name}" is defined in config but has no database table.`,
      hint: 'A database migration is required.',
    }
  }, { status: 500 })
}
```

---

## 7.8 Logging Strategy

| Level   | When                                             | Destination          |
|---------|--------------------------------------------------|----------------------|
| `debug` | Detailed trace (dev only)                        | Console              |
| `info`  | Normal operations (request handled, job done)    | Console + Log sink   |
| `warn`  | Config coercion, unknown component, partial fail | Console + Log sink   |
| `error` | Unhandled exception, workflow fail, DB error     | Console + Alert sink |

All logs include: `{ timestamp, level, appId, userId, traceId, message, ...meta }`

Structured JSON logging — compatible with Datadog, Logtail, Axiom, or CloudWatch.
