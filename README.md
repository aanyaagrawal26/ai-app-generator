# ⚡ AI App Generator — Track A

> **A metadata-driven, full-stack app runtime.**  
> Describe your application once in JSON. The engine renders the UI, registers API routes, manages the database, and runs workflows — all at runtime, with zero code generation or redeployment.

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-38BDF8?style=for-the-badge&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/PostgreSQL-Prisma_7-2D3748?style=for-the-badge&logo=postgresql" />
</p>

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [Project Structure](#project-structure)
6. [Quick Start](#quick-start)
7. [Environment Variables](#environment-variables)
8. [Database Setup](#database-setup)
9. [App Config Schema](#app-config-schema)
10. [API Reference](#api-reference)
11. [Workflow Engine](#workflow-engine)
12. [CSV Import](#csv-import)
13. [Multi-Language Support](#multi-language-support)
14. [GitHub Export](#github-export)
15. [Deployment](#deployment)
16. [Contributing](#contributing)
17. [License](#license)

---

## Overview

AI App Generator converts a single **JSON config file** into a complete working application. No scaffolding, no re-deploys — change the config and the app updates live.

```
{
  "name": "My CRM",
  "resources": [ { "name": "contacts", "fields": [...] } ],
  "pages":     [ { "path": "/contacts", "components": [...] } ],
  "workflows": [ { "trigger": "record.created", "steps": [...] } ]
}
```

That JSON drives:
- A **rendered UI** (table, form, kanban, chart, calendar, and more)
- **REST API routes** at `/api/r/[resource]`
- A **PostgreSQL-backed record store** via Prisma
- An **event-driven workflow engine**

---

## Features

| Category | What's included |
|---|---|
| 🔐 **Auth** | JWT sessions (Jose), bcrypt passwords, Server Actions, role-based access |
| 🗄️ **Database** | PostgreSQL + Prisma 7, dynamic JSONB record store, soft-delete, schema versioning |
| 🎨 **UI Runtime** | 10 component types: Table, Form, Kanban, Chart, Calendar, Stat, Card, Tabs, Modal, Detail |
| 🛡️ **Validation** | Zod v4 config parsing with graceful coercion — bad fields default, app never crashes |
| ⚡ **Workflows** | Trigger on record events, schedule, or webhook. Steps: email, webhook, condition, delay, create/update record |
| 📥 **CSV Import** | Multi-step: upload → column mapping → bulk insert (chunked 500 rows). Row-level error reporting |
| 🌍 **i18n** | 4 built-in locales (en, fr, de, es). Locale API endpoint, per-app config |
| 🐙 **GitHub Export** | Generates a real Next.js repo (Prisma schema, API routes, pages) and pushes via Octokit |
| 🔄 **Config Versioning** | Every config save snapshots the previous version. Full history in `ConfigVersion` table |
| 🧱 **Error Isolation** | React `ErrorBoundary` per component, `UnknownComponent` fallback, structured API error codes |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Server Actions) |
| Language | TypeScript 5 |
| UI | React 19, TailwindCSS 4 |
| Database | PostgreSQL + [Prisma 7](https://prisma.io) ORM |
| Auth | [Jose](https://github.com/panva/jose) JWT, bcryptjs |
| Validation | [Zod v4](https://zod.dev) |
| HTTP Runtime | Next.js API Route Handlers (Web Request/Response) |
| CSV Parsing | [PapaParse](https://papaparse.com) |
| GitHub API | [@octokit/rest](https://github.com/octokit/rest.js) |
| DB Adapter | [@prisma/adapter-pg](https://www.npmjs.com/package/@prisma/adapter-pg) |

---

## Architecture

```
Browser
  └── Next.js App Router (SSR + Client Components)
        ├── (auth)/login, register        ← Server Action forms
        ├── (app)/dashboard               ← App list
        └── (app)/apps/[appId]/
              ├── layout.tsx              ← Loads config → AppProvider
              ├── page.tsx                ← AppOverview
              ├── view/[...slug]          ← DynamicPage → DynamicRenderer → ComponentRegistry
              ├── config/                 ← JSON editor
              ├── import/                 ← CSV pipeline UI
              ├── export/                 ← GitHub / zip export
              └── workflows/              ← Workflow trigger panel

API Routes (/api)
  ├── auth/login|register|logout|me
  ├── apps/                               ← App CRUD
  ├── config/                             ← Load / update / validate config
  ├── r/[resource]/                       ← Dynamic CRUD (driven by config)
  ├── r/[resource]/[id]/
  ├── import/                             ← CSV job management
  ├── workflow/trigger|runs
  ├── export/
  ├── i18n/[locale]
  └── health

Data Layer
  └── PostgreSQL (via Prisma 7 + @prisma/adapter-pg)
        ├── App, User, AppUser
        ├── DynamicRecord (JSONB generic store)
        ├── ImportJob, WorkflowRun, WorkflowStep
        ├── ExportJob, AuditLog, ConfigVersion
```

---

## Project Structure

```
ai-app-generator/
├── prisma/
│   ├── schema.prisma          # Full DB schema
│   └── seed.ts                # Demo data (admin user + CRM app)
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login & register pages
│   │   ├── (app)/             # Authenticated shell
│   │   │   ├── dashboard/
│   │   │   └── apps/[appId]/  # Per-app pages
│   │   └── api/               # All API route handlers
│   ├── components/
│   │   ├── runtime/           # DynamicRenderer, DynamicPage, AppContext, ErrorBoundary
│   │   ├── ui-components/     # 10 registered component types
│   │   ├── app/               # AppOverview, ConfigEditor, CSVImport, ExportPanel, WorkflowPanel
│   │   └── shell/             # Sidebar, TopBar
│   └── lib/
│       ├── auth/              # session.ts (Jose JWT), actions.ts (Server Actions), permissions.ts
│       ├── config/            # schema.ts (Zod), loader.ts (LRU cache)
│       ├── db/                # prisma.ts singleton
│       ├── export/            # generator.ts (file gen + Octokit)
│       ├── import/            # processor.ts (PapaParse + bulk insert)
│       ├── runtime/           # schemaBuilder.ts, queryBuilder.ts
│       ├── utils/             # apiError.ts
│       └── workflow/          # engine.ts (step runner)
├── docs/
│   ├── example-app.config.json
│   └── *.md                   # Design documents
├── .env.example
├── next.config.ts
└── tsconfig.json
```

---

## Quick Start

### Prerequisites

- Node.js ≥ 20
- PostgreSQL database (local or hosted)
- Git

### 1. Clone

```bash
git clone https://github.com/aanyaagrawal26/ai-app-generator.git
cd ai-app-generator
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/ai_app_generator"
SESSION_SECRET="your-random-32-char-secret"
```

Generate a secure session secret:

```bash
openssl rand -base64 32
```

### 4. Set up the database

```bash
# Push schema to your database
npm run db:push

# (Optional) seed demo data
npm run db:seed
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

If you ran the seed, log in with:
- **Email:** `admin@demo.com`
- **Password:** `password123`

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `SESSION_SECRET` | ✅ | Secret key for JWT signing (min 32 chars) |
| `NODE_ENV` | — | `development` or `production` |

> `.env.local` is ignored by git. Never commit secrets.

---

## Database Setup

The schema is in `prisma/schema.prisma`. Key models:

| Model | Purpose |
|---|---|
| `App` | App definition + embedded `configJson` (JSONB) |
| `User` + `AppUser` | Auth users + per-app role membership |
| `DynamicRecord` | Generic JSONB row store for all runtime resources |
| `ImportJob` | CSV import job state + error log |
| `WorkflowRun` + `WorkflowStep` | Workflow execution history |
| `ExportJob` | GitHub/zip export job state |
| `ConfigVersion` | Config change history (full snapshot) |
| `AuditLog` | Action audit trail |

### Available database commands

```bash
npm run db:push       # Apply schema without migration files (dev)
npm run db:migrate    # Create and apply a named migration (production)
npm run db:generate   # Regenerate Prisma client after schema changes
npm run db:seed       # Seed demo user + CRM example app
npm run db:studio     # Open Prisma Studio in browser
```

---

## App Config Schema

A single JSON object drives the entire app. Full TypeScript type: `AppConfig`.

```jsonc
{
  "id":          "uuid-v4",
  "name":        "My CRM",
  "description": "Optional",
  "version":     "1.0.0",

  // Define database resources
  "resources": [
    {
      "name":  "contacts",
      "label": "Contacts",
      "fields": [
        { "name": "firstName", "type": "text",   "required": true },
        { "name": "email",     "type": "email",  "required": true, "unique": true },
        { "name": "status",    "type": "select", "options": ["lead","customer","churned"] },
        { "name": "score",     "type": "number", "validation": { "min": 0, "max": 100 } }
      ],
      "softDelete": true,
      "permissions": {
        "create": ["admin","manager"],
        "read":   ["*"],
        "update": ["admin","manager"],
        "delete": ["admin"]
      }
    }
  ],

  // Define UI pages
  "pages": [
    {
      "path":        "/contacts",
      "title":       "Contacts",
      "permissions": ["*"],
      "components": [
        {
          "id":       "contacts-stat",
          "type":     "stat",
          "resource": "contacts",
          "config":   { "label": "Total Contacts", "aggregation": "count" }
        },
        {
          "id":       "contacts-table",
          "type":     "table",
          "resource": "contacts",
          "config":   { "columns": ["firstName","email","status"], "searchable": true }
        }
      ]
    }
  ],

  // Automations
  "workflows": [
    {
      "id":      "wf-welcome",
      "name":    "Welcome email on signup",
      "enabled": true,
      "trigger": { "type": "record.created", "resource": "contacts" },
      "steps": [
        {
          "id":   "send-email",
          "type": "send_email",
          "config": {
            "to":      "{{record.email}}",
            "subject": "Welcome, {{record.firstName}}!",
            "html":    "<p>Thanks for joining.</p>"
          }
        }
      ]
    }
  ],

  // i18n
  "i18n": {
    "defaultLocale":    "en",
    "supportedLocales": ["en","fr","de","es"]
  },

  // Auth
  "auth": {
    "providers":   ["credentials"],
    "defaultRole": "user",
    "roles": [
      { "name": "admin",   "permissions": ["*"] },
      { "name": "manager", "permissions": ["contacts:*"] }
    ]
  }
}
```

### Supported component types

| Type | Description |
|---|---|
| `table` | Paginated, searchable data table |
| `form` | Create-record form auto-generated from field definitions |
| `stat` | Single aggregate stat card (count, sum) |
| `kanban` | Grouped card view by any select field |
| `chart` | Bar or pie chart grouped by field |
| `calendar` | Monthly calendar view keyed on a date field |
| `detail` | Single-record field display |
| `card` | Generic container with optional children |
| `tabs` | Tabbed layout wrapping child components |
| `modal` | Trigger button + overlay wrapping child components |

### Supported field types

`text` · `number` · `boolean` · `date` · `datetime` · `email` · `url` · `select` · `multiselect` · `relation` · `richtext` · `json` · `file`

---

## API Reference

All routes accept/return JSON. Authenticated routes require a valid session cookie.  
Pass `x-app-id` header (or `?appId=` query param) to scope requests to an app.

### Auth

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Sign in, sets session cookie |
| `GET/POST` | `/api/auth/logout` | Clear session |
| `GET` | `/api/auth/me` | Current user info |

### Apps

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/apps` | List your apps |
| `POST` | `/api/apps` | Create app (optionally pass `config` JSON) |
| `GET` | `/api/apps/:appId` | Get app |
| `DELETE` | `/api/apps/:appId` | Delete app |

### Config

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/config` | Get validated config + warnings |
| `PUT` | `/api/config` | Save new config (snapshots previous) |
| `POST` | `/api/config/validate` | Dry-run validate without saving |

### Dynamic Resources

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/r/:resource` | List records (pagination, sort, filter, search) |
| `POST` | `/api/r/:resource` | Create record |
| `GET` | `/api/r/:resource/:id` | Get one record |
| `PUT` | `/api/r/:resource/:id` | Update record (partial) |
| `DELETE` | `/api/r/:resource/:id` | Delete record (hard or soft) |

**List query params:** `page`, `limit` (max 100), `sort`, `order` (asc/desc), `filter` (JSON), `search`

**Error codes:** `UNKNOWN_RESOURCE` · `VALIDATION_ERROR` · `FORBIDDEN` · `UNAUTHENTICATED` · `NOT_FOUND` · `INTERNAL_ERROR`

### CSV Import

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/import` | List import jobs |
| `POST` | `/api/import` | Create import job (send CSV text + mappings) |
| `GET` | `/api/import/:jobId` | Poll job status + progress |
| `POST` | `/api/import/:jobId` | Start processing (with column mapping) |

### Workflow

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/workflow/trigger` | Manually trigger a workflow by ID |
| `GET` | `/api/workflow/runs` | List recent workflow run history |

### Export

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/export` | Start export (`type: "zip"` or `"github"`) |
| `GET` | `/api/export` | List export jobs |

### i18n

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/i18n/:locale` | Get locale strings for `en`, `fr`, `de`, or `es` |

### Health

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/health` | Liveness check — returns `{ status: "ok" }` |

---

## Workflow Engine

Workflows are defined in the config and executed server-side.

### Trigger types

| Trigger | When it fires |
|---|---|
| `record.created` | After a record is created in a resource |
| `record.updated` | After a record update (optionally filter by changed fields) |
| `record.deleted` | After a record is deleted |
| `schedule` | Cron expression (e.g. `"0 9 * * 1"`) |
| `webhook` | HTTP POST to the workflow trigger API |

### Step types

| Step | What it does |
|---|---|
| `send_email` | Sends email (stub — wire to Resend/SES via `RESEND_API_KEY`) |
| `webhook` | HTTP request to an external URL |
| `condition` | Evaluates a JS expression; routes to `onSuccess` or `onFailure` |
| `update_record` | Updates a DynamicRecord via Prisma |
| `create_record` | Creates a DynamicRecord |
| `delay` | Pauses execution for N ms (max 30s) |
| `script` | Stub for custom JS logic |

### Template interpolation

Step config strings support `{{mustache}}` syntax:

```json
{
  "to":      "{{record.email}}",
  "subject": "Hello, {{record.firstName}}!"
}
```

Available variables: `record`, `trigger`, `steps` (previous step outputs), `config` (app config).

---

## CSV Import

1. **Upload** — send CSV text + target resource name to `POST /api/import`
2. **Map columns** — match CSV headers to resource field names
3. **Process** — `POST /api/import/:jobId` starts async bulk insert
4. **Poll** — `GET /api/import/:jobId` returns `{ status, processedRows, failedRows, errors }`

Rows are validated against the resource's Zod schema. Invalid rows are logged per-row — valid rows still import. The job completes with partial success if some rows fail.

---

## Multi-Language Support

Four locales are built in: **English**, **French**, **German**, **Spanish**.

```
GET /api/i18n/fr
→ { locale: "fr", strings: { "common.save": "Enregistrer", ... } }
```

Per-app locale config:

```json
"i18n": {
  "defaultLocale": "en",
  "supportedLocales": ["en", "fr", "de", "es"]
}
```

Unsupported locales fall back to `defaultLocale` automatically.

---

## GitHub Export

Generates a complete Next.js project from your config and pushes it to a new GitHub repo.

```json
POST /api/export
{
  "type":        "github",
  "githubToken": "ghp_...",
  "repoName":    "my-crm-app"
}
```

Generated files include:
- `package.json` with correct dependencies
- `prisma/schema.prisma` derived from your resources
- `src/app/api/r/[resource]/route.ts` per resource
- `src/app/(app)/[slug]/page.tsx` per page
- Embedded `appConfig.ts`
- `README.md`

For a quick download without GitHub: set `"type": "zip"`.

---

## Deployment

### Vercel + Railway (recommended)

1. **Database** — create a PostgreSQL instance on [Railway](https://railway.app) or [Neon](https://neon.tech). Copy the `DATABASE_URL`.

2. **Deploy** — connect your GitHub repo to [Vercel](https://vercel.com). Set environment variables:

   ```
   DATABASE_URL=...
   SESSION_SECRET=...
   NODE_ENV=production
   ```

3. **Run migrations** — add a build command or run manually:

   ```bash
   npx prisma db push
   ```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Available npm scripts

```bash
npm run dev           # Start dev server (Turbopack)
npm run build         # Production build
npm run start         # Start production server
npm run type-check    # TypeScript check (no emit)
npm run lint          # ESLint
npm run db:push       # Apply Prisma schema
npm run db:migrate    # Create + apply migration
npm run db:generate   # Regenerate Prisma client
npm run db:seed       # Seed demo data
npm run db:studio     # Open Prisma Studio
```

---

## Contributing

Contributions are welcome. To get started:

```bash
# Fork the repo, then:
git clone https://github.com/<your-username>/ai-app-generator.git
cd ai-app-generator
npm install
cp .env.example .env.local
# fill in DATABASE_URL and SESSION_SECRET
npm run db:push
npm run dev
```

Please follow these guidelines:

- Keep PRs focused — one feature or fix per PR
- Match the existing code style (TypeScript strict, no `any` unless necessary)
- Run `npm run type-check` and `npm run lint` before opening a PR
- New component types go in `src/components/ui-components/` and must be registered in `src/components/runtime/registry.ts`
- New workflow step types go in `src/lib/workflow/engine.ts`

---


<p align="center">
  Built with ⚡ by <a href="https://github.com/aanyaagrawal26">Aanya Agrawal</a>
</p>
