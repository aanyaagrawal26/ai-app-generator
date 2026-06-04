# 01 — High-Level Architecture

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER / CLIENT                         │
│                                                                 │
│   ┌────────────────────────────────────────────────────────┐   │
│   │              Next.js App Router (SSR + CSR)            │   │
│   │                                                        │   │
│   │  ┌──────────────┐   ┌──────────────┐  ┌────────────┐  │   │
│   │  │ Page Shell   │   │ Dynamic UI   │  │  i18n      │  │   │
│   │  │ (layout.tsx) │   │ Renderer     │  │  Provider  │  │   │
│   │  └──────────────┘   └──────┬───────┘  └────────────┘  │   │
│   │                            │                           │   │
│   │              ┌─────────────▼──────────────┐            │   │
│   │              │    Component Registry      │            │   │
│   │              │  (resolves config → React) │            │   │
│   │              └────────────────────────────┘            │   │
│   └────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS / REST + tRPC
┌───────────────────────────▼─────────────────────────────────────┐
│                   NEXT.JS API ROUTES (Node.js)                  │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Auth Layer  │  │ Config API   │  │  Dynamic Resource    │  │
│  │ (NextAuth)   │  │  /api/config │  │  Router              │  │
│  └──────────────┘  └──────────────┘  │  /api/r/[resource]   │  │
│                                      └──────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  CSV Import  │  │  Workflow    │  │  GitHub Export       │  │
│  │  Pipeline    │  │  Engine API  │  │  Service             │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                 │
│              ┌──────────────────────────────┐                  │
│              │     JSON Config Runtime      │                  │
│              │  Loader → Validator → Cache  │                  │
│              └──────────────────────────────┘                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Prisma Client
┌───────────────────────────▼─────────────────────────────────────┐
│                        DATA LAYER                               │
│                                                                 │
│   ┌──────────────────────┐      ┌───────────────────────────┐  │
│   │   PostgreSQL          │      │   Redis (BullMQ queues)   │  │
│   │   (primary store)     │      │   (workflow / CSV jobs)   │  │
│   └──────────────────────┘      └───────────────────────────┘  │
│                                                                 │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │   Object Storage (S3 / R2) — CSV uploads, export zips    │  │
│   └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Subsystem Responsibilities

### 1. JSON Config Runtime

The central nervous system. Every other subsystem reads from it.

- Loads `app.config.json` (from DB, file system, or API)
- Validates with Zod schemas, collecting errors non-fatally
- Applies defaults for missing/invalid fields
- Caches validated config in memory (LRU) and Redis
- Emits config-change events when the config is updated at runtime

### 2. Frontend Rendering Engine

- Reads the `pages` and `components` sections of the config
- Resolves each component type to a registered React component
- Unknown types fall back to a `<UnknownComponent>` placeholder (never crashes)
- Supports nested layouts, tabs, modals, forms, tables, charts

### 3. Backend Dynamic Router

- Reads the `resources` section of the config
- At startup, registers CRUD API handlers for each resource
- Each handler validates input against the resource's field schema
- Supports custom actions (`resource.actions[]`)

### 4. Database Adapter

- Prisma schema is the source of truth for the physical DB
- A `SchemaSync` service diffs the config's `resources` against the current
  Prisma schema and generates migration files
- Migration is never auto-applied in production — requires explicit approval

### 5. Workflow Engine

- Event-driven: triggers on record create/update/delete, schedule, or webhook
- Steps are executed in order: condition → action → next step
- Runs in BullMQ workers (async, retryable)
- State persisted in `WorkflowRun` + `WorkflowStep` tables

### 6. Auth System

- NextAuth.js with JWT strategy
- Roles and permissions defined in config: `auth.roles[]`
- Middleware enforces route-level permissions before handler runs
- Row-level security via Prisma middleware (tenant/owner filters)

### 7. CSV Import Pipeline

- Upload → parse → map columns → validate rows → bulk insert
- BullMQ job per import batch (chunked at 500 rows)
- Progress tracked in `ImportJob` table, polled by frontend

### 8. i18n Engine

- Locale strings stored in `LocaleString` table, keyed by `(appId, key, locale)`
- `next-intl` for React-side rendering
- Config specifies `defaultLocale` and `supportedLocales[]`
- Falls back to `defaultLocale` for any missing key

### 9. GitHub Export

- Generates a real Next.js project from the config
- Uses Handlebars templates for boilerplate files
- Dynamically generates Prisma schema, API routes, page files
- Zips the output, uploads to object storage, creates a GitHub repo via API
