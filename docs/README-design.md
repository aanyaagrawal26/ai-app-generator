# Track A — AI App Generator

> A metadata-driven app runtime. One JSON config → a working full-stack application.

## Tech Stack

| Layer      | Technology                                         |
|------------|----------------------------------------------------|
| Frontend   | Next.js 14 (App Router), React, TypeScript, Tailwind |
| Backend    | Node.js, TypeScript, Next.js API Routes            |
| Database   | PostgreSQL + Prisma ORM                            |
| Auth       | NextAuth.js                                        |
| Validation | Zod                                                |
| Queue      | BullMQ + Redis                                     |
| Storage    | Cloudflare R2 (S3-compatible)                      |
| Deployment | Vercel + Railway                                   |

## Documentation

| Doc | Description |
|-----|-------------|
| [00 - Overview](docs/00-overview.md) | Vision, stack, subsystem index |
| [01 - High-Level Architecture](docs/01-high-level-architecture.md) | System diagram, subsystem responsibilities |
| [02 - Low-Level Design](docs/02-low-level-design.md) | Zod schemas, config loader, rendering engine, API handler |
| [03 - Prisma Schema](docs/03-prisma-schema.prisma) | Full PostgreSQL schema |
| [04 - API Route Structure](docs/04-api-route-structure.md) | All routes, request/response conventions, error codes |
| [05 - Folder Structure](docs/05-folder-structure.md) | Complete project directory layout |
| [06 - Runtime Flow](docs/06-runtime-flow.md) | Boot, page render, API request, config update, CSV import, GitHub export |
| [07 - Error Handling Strategy](docs/07-error-handling-strategy.md) | All failure modes and graceful degradation patterns |
| [08 - Workflow Engine Design](docs/08-workflow-engine-design.md) | Triggers, steps, BullMQ, template interpolation |
| [09 - Deployment Plan](docs/09-deployment-plan.md) | CI/CD, migrations, environment vars, monitoring, security |
| [Example Config](docs/example-app.config.json) | A full CRM app.config.json sample |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in values
cp .env.example .env.local

# 3. Set up database
npx prisma migrate dev --name init

# 4. Seed development data
npx ts-node prisma/seed.ts

# 5. Run dev server
npm run dev

# 6. Run workers (separate terminal)
npx ts-node workers/workflowWorker.ts
npx ts-node workers/importWorker.ts
```

## Key Design Decisions

**Why runtime rendering instead of code generation?**
Config changes take effect immediately. No redeployment, no rebuild cycle.

**Why Zod with `.catch()` and coercion?**
Unknown/invalid config values are defaulted rather than crashing the app.
Errors are surfaced as warnings in the builder UI, not as 500 responses.

**Why BullMQ for workflows and CSV imports?**
Both are long-running, retryable, and need progress tracking. Serverless
functions have timeout limits (10–30s); BullMQ workers on Railway do not.

**Why DynamicRecord (generic JSONB) vs per-resource tables?**
DynamicRecord is the default for early-stage apps and avoids the need to
run a migration on every config change. The SchemaSync tool can graduate a
resource to a proper typed table when needed.

**Why Handlebars for GitHub export templates?**
Simple, well-understood, zero runtime dependency in the exported project.
