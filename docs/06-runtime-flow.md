# 06 — Runtime Flow

## 6.1 Application Boot Sequence

```
Server starts (next start / vercel deploy)
  │
  ├─ 1. Prisma connects to PostgreSQL
  ├─ 2. Redis connects (BullMQ queues ready)
  ├─ 3. Workflow schedule triggers registered (cron jobs)
  └─ 4. Next.js server ready

First request for app [appId]:
  │
  ├─ 1. Edge middleware runs
  │     ├─ a. Locale detection → sets Accept-Language header
  │     └─ b. Auth check → redirects to /login if unauthenticated
  │
  ├─ 2. App layout (src/app/(app)/[appId]/layout.tsx)
  │     └─ loadConfig(appId) called server-side
  │           ├─ Check LRU cache → HIT: return cached config
  │           └─ MISS:
  │                 ├─ Fetch App.configJson from PostgreSQL
  │                 ├─ Run Zod validation (AppConfigSchema.safeParse)
  │                 ├─ Collect errors, apply defaults (coerce)
  │                 ├─ Store in LRU cache (5-min TTL)
  │                 └─ Return { config, errors, valid }
  │
  └─ 3. AppContext.Provider wraps the page tree with config + errors
```

---

## 6.2 Page Render Flow

```
Browser navigates to /[appId]/contacts
  │
  ├─ 1. Next.js matches [...slug]/page.tsx
  │
  ├─ 2. DynamicPage.tsx
  │     ├─ Reads config from AppContext
  │     ├─ Finds page definition: config.pages.find(p => p.path === '/contacts')
  │     └─ Falls back to 404 page if not found
  │
  ├─ 3. Permission check
  │     └─ page.permissions.includes(session.user.role) → else 403 page
  │
  ├─ 4. Layout wrapper applied (default | blank | sidebar | centered)
  │
  └─ 5. page.components.map(component =>
              <DynamicRenderer component={component} context={pageContext} />)
          │
          ├─ componentRegistry[component.type] → resolved React component
          │     └─ UNKNOWN TYPE → <UnknownComponent> (yellow warning card, no crash)
          │
          └─ <ErrorBoundary> wraps each component
                └─ Render error → <ErrorFallback> card (component isolated)
```

---

## 6.3 API Request Flow

```
POST /api/r/contacts
  │
  ├─ 1. rateLimiter middleware (100/min per IP)
  │
  ├─ 2. getServerSession(authOptions)
  │     └─ No session → 401 JSON
  │
  ├─ 3. loadConfig(appId from header/cookie)
  │
  ├─ 4. Resolve resource definition
  │     └─ Not found in config → 404 { error: "UNKNOWN_RESOURCE" }
  │
  ├─ 5. Permission check
  │     └─ role not in resource.permissions.create → 403 { error: "FORBIDDEN" }
  │
  ├─ 6. Request body parsed + validated (buildZodSchema(resource.fields))
  │     └─ Zod fail → 422 { error: "VALIDATION_ERROR", fields: {...} }
  │
  ├─ 7. Prisma model resolved: prisma[resource.name]
  │     └─ Model not found → 500 { error: "SCHEMA_MISMATCH" }
  │        (signals that a migration is needed)
  │
  ├─ 8. prisma.contacts.create({ data: parsed })
  │
  ├─ 9. Post-create hooks:
  │     ├─ a. AuditLog.create(...)
  │     └─ b. Workflow trigger check:
  │           config.workflows
  │             .filter(w => w.trigger.type === 'record.created'
  │                       && w.trigger.resource === 'contacts')
  │             .forEach(w => workflowQueue.add(w.id, { record, trigger }))
  │
  └─ 10. Return 201 { ...record }
```

---

## 6.4 Config Update Flow

```
Admin PUTs /api/config with new JSON body
  │
  ├─ 1. Auth: must be app owner or admin role
  │
  ├─ 2. Validate new config (AppConfigSchema.safeParse)
  │     └─ Hard errors → 422, do not save
  │
  ├─ 3. Save ConfigVersion snapshot of current config
  │
  ├─ 4. Update App.configJson in DB
  │
  ├─ 5. Invalidate LRU + Redis cache for appId
  │
  ├─ 6. Run SchemaSync diff:
  │     ├─ New resources → generate CREATE TABLE migration
  │     ├─ New fields    → generate ALTER TABLE migration
  │     └─ Queue migration for manual review (never auto-run in prod)
  │
  └─ 7. Emit config:updated event to connected WebSocket clients
        (frontend re-fetches config, re-renders pages)
```

---

## 6.5 CSV Import Flow

```
User uploads contacts.csv
  │
  ├─ 1. POST /api/import/upload  → returns presigned S3/R2 URL
  ├─ 2. Browser PUTs file directly to S3/R2
  ├─ 3. POST /api/import  → creates ImportJob(status=PENDING)
  │
  ├─ 4. User maps columns:
  │     PUT /api/import/[jobId]/mapping  { "Email": "email", "Full Name": "name" }
  │     ImportJob.status → MAPPING
  │
  ├─ 5. POST /api/import/[jobId]/process → adds job to importQueue (BullMQ)
  │
  ├─ Worker (importWorker.ts):
  │     ├─ Download file from S3/R2
  │     ├─ Parse CSV → array of row objects
  │     ├─ Apply column mapping
  │     ├─ Chunk rows (500 per batch)
  │     └─ For each batch:
  │           ├─ Validate each row with buildZodSchema(resource.fields)
  │           ├─ Collect failures in ImportJob.errors[]
  │           ├─ Bulk-insert valid rows: prisma.createMany({ data: validRows })
  │           └─ Update ImportJob.processedRows + failedRows
  │
  ├─ 6. Frontend polls GET /api/import/[jobId] every 2s for progress
  └─ 7. ImportJob.status → COMPLETED | FAILED
```

---

## 6.6 GitHub Export Flow

```
Admin triggers POST /api/export
  │
  ├─ 1. Creates ExportJob(status=PENDING)
  ├─ 2. Adds job to exportQueue (BullMQ)
  │
  ├─ Generator (workers/exportWorker.ts):
  │     ├─ Load config
  │     ├─ Render Handlebars templates:
  │     │     ├─ package.json
  │     │     ├─ next.config.ts
  │     │     ├─ tailwind.config.ts
  │     │     ├─ prisma/schema.prisma  (from resources)
  │     │     ├─ src/app/api/r/[resource]/route.ts (one per resource)
  │     │     ├─ src/app/(app)/[slug]/page.tsx (one per page)
  │     │     └─ src/lib/config/appConfig.ts (embedded config)
  │     ├─ Zip all files → upload to S3/R2 → ExportJob.storageKey set
  │     │
  │     └─ If GitHub token present:
  │           ├─ POST /user/repos → create repo
  │           ├─ PUT /repos/{owner}/{repo}/contents/{path} (each file)
  │           └─ ExportJob.repoUrl = "https://github.com/..."
  │
  └─ Frontend polls GET /api/export/[jobId] → shows download link or repo URL
```
