# 04 — API Route Structure

All routes live under `src/app/api/` (Next.js App Router convention).

---

## Route Map

```
/api
├── auth
│   └── [...nextauth]         NextAuth catch-all
│       route.ts
│
├── config
│   ├── route.ts              GET  /api/config         → fetch app config
│   │                         PUT  /api/config         → update config (admin)
│   ├── validate
│   │   └── route.ts          POST /api/config/validate → dry-run validate
│   └── versions
│       └── route.ts          GET  /api/config/versions → version history
│
├── r
│   └── [resource]
│       ├── route.ts          GET  /api/r/:resource     → list
│       │                     POST /api/r/:resource     → create
│       └── [id]
│           └── route.ts      GET  /api/r/:resource/:id → get one
│                             PUT  /api/r/:resource/:id → update
│                             DELETE /api/r/:resource/:id → delete
│
├── r
│   └── [resource]
│       └── actions
│           └── [action]
│               └── route.ts  POST /api/r/:resource/actions/:action → custom action
│
├── import
│   ├── route.ts              POST /api/import         → initiate import job
│   ├── [jobId]
│   │   ├── route.ts          GET  /api/import/:jobId  → job status
│   │   ├── mapping
│   │   │   └── route.ts      PUT  /api/import/:jobId/mapping → save column mapping
│   │   └── process
│   │       └── route.ts      POST /api/import/:jobId/process → start processing
│   └── upload
│       └── route.ts          POST /api/import/upload  → get presigned upload URL
│
├── workflow
│   ├── route.ts              GET  /api/workflow        → list workflow definitions
│   ├── [workflowId]
│   │   └── trigger
│   │       └── route.ts      POST /api/workflow/:id/trigger → manual trigger
│   └── runs
│       ├── route.ts          GET  /api/workflow/runs   → list runs
│       └── [runId]
│           └── route.ts      GET  /api/workflow/runs/:id → run detail + steps
│
├── i18n
│   ├── route.ts              GET  /api/i18n            → list all locale strings
│   ├── [locale]
│   │   └── route.ts          GET  /api/i18n/:locale    → strings for one locale
│   └── import
│       └── route.ts          POST /api/i18n/import     → bulk import translations
│
├── export
│   ├── route.ts              POST /api/export          → initiate GitHub export
│   └── [jobId]
│       └── route.ts          GET  /api/export/:jobId   → export job status
│
├── users
│   ├── route.ts              GET  /api/users           → list app users
│   └── [userId]
│       └── route.ts          GET  /api/users/:id
│                             PUT  /api/users/:id       → update role
│                             DELETE /api/users/:id     → remove from app
│
└── health
    └── route.ts              GET  /api/health          → liveness check
```

---

## Request / Response Conventions

### Pagination (all list endpoints)

```
GET /api/r/contacts?page=1&limit=20&sort=createdAt&order=desc
```

```json
{
  "data":  [...],
  "total": 142,
  "page":  1,
  "limit": 20,
  "pages": 8
}
```

### Error Shape

```json
{
  "error": {
    "code":    "VALIDATION_ERROR",
    "message": "Validation failed",
    "fields":  { "email": "Invalid email format" }
  }
}
```

### Error Codes

| Code                  | HTTP | Description                          |
|-----------------------|------|--------------------------------------|
| `UNKNOWN_RESOURCE`    | 404  | Resource not defined in config       |
| `UNKNOWN_COMPONENT`   | 200  | Component type not in registry (UI)  |
| `VALIDATION_ERROR`    | 422  | Input did not pass Zod schema        |
| `FORBIDDEN`           | 403  | Role does not have permission        |
| `UNAUTHENTICATED`     | 401  | No valid session                     |
| `SCHEMA_MISMATCH`     | 500  | DB model missing (migration needed)  |
| `CONFIG_INVALID`      | 500  | Config has non-coercible errors      |
| `WORKFLOW_FAILED`     | 500  | Workflow step threw                  |
| `IMPORT_FAILED`       | 500  | CSV processing error                 |

---

## Middleware Stack (per request)

```
Request
  └── rateLimiter          (100 req/min per IP)
       └── sessionLoader   (NextAuth getServerSession)
            └── appLoader  (loads + caches app config)
                 └── permissionCheck   (role vs. resource permissions)
                      └── handler       (the actual route logic)
                           └── auditLogger  (writes AuditLog row)
```

---

## Dynamic Resource Route Detail

`GET /api/r/[resource]` supports these query params:

| Param    | Type   | Description                                         |
|----------|--------|-----------------------------------------------------|
| `page`   | number | Page number, default 1                              |
| `limit`  | number | Page size, default 20, max 100                      |
| `sort`   | string | Field name to sort by                               |
| `order`  | `asc`\|`desc` | Sort direction                              |
| `filter` | JSON   | URL-encoded `{"field":"value"}` — exact match       |
| `search` | string | Full-text search across all text fields             |
| `include`| string | Comma-separated relation names to eager-load        |
