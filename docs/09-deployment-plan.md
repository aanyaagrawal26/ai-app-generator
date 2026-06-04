# 09 — Deployment Plan

## Environment Overview

| Environment | Purpose                          | Trigger              |
|-------------|----------------------------------|----------------------|
| `local`     | Developer machines               | Manual               |
| `preview`   | PR-based feature previews        | Push to feature branch |
| `staging`   | Pre-prod integration testing     | Merge to `develop`   |
| `production`| Live users                       | Merge to `main`      |

---

## 9.1 Infrastructure

### Frontend + API (Next.js)
- **Platform:** Vercel
- Automatic preview deployments per PR
- Environment variables managed in Vercel dashboard
- Edge middleware runs on Vercel Edge Network

### PostgreSQL
- **Platform:** Railway (or Supabase for managed PgBouncer + connection pooling)
- `staging` and `production` are isolated instances
- Automated daily backups with 30-day retention
- Connection pooling via PgBouncer (max 20 connections per dyno)

### Redis
- **Platform:** Railway Redis or Upstash (serverless Redis for Vercel compatibility)
- Used for: BullMQ job queues, config cache, session store (optional)

### BullMQ Workers
- **Platform:** Railway (always-on Node.js service)
- Runs `workers/workflowWorker.ts` and `workers/importWorker.ts`
- Separate from Next.js — no serverless function timeout constraints
- Auto-restarts on crash (Railway's restart policy)

### Object Storage
- **Platform:** Cloudflare R2 (S3-compatible, no egress fees)
- Buckets: `csv-imports`, `export-zips`
- Presigned URLs for direct browser uploads (no server bandwidth)

---

## 9.2 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [main, develop, 'feature/**']
  pull_request:

jobs:
  lint-and-type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
        options: --health-cmd pg_isready --health-interval 10s
      redis:
        image: redis:7
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/testdb
      - run: npm test

  deploy-staging:
    needs: [lint-and-type-check, test]
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-production:
    needs: [lint-and-type-check, test]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production        # requires manual approval in GitHub
    steps:
      - uses: actions/checkout@v4
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 9.3 Database Migration Strategy

```
Developer changes config → SchemaSync generates migration file
  │
  ├─ DEV:     npx prisma migrate dev --name <description>
  │            → applies migration + regenerates Prisma Client
  │
  ├─ STAGING: prisma migrate deploy  (in CI, no interactive prompts)
  │
  └─ PROD:    prisma migrate deploy  (gated behind GitHub environment approval)
               NEVER use --force or reset in production
```

**Golden rules:**
- Migrations are always **additive** first (add columns, never drop without a deprecation cycle)
- Rename = add new column + backfill + deprecate old column over two releases
- Dropping a column requires a prior release that stops writing to it

---

## 9.4 Environment Variables

```bash
# .env.example

# Database
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# Auth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://your-app.vercel.app"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Redis
REDIS_URL="redis://default:pass@host:6379"

# Object Storage (Cloudflare R2 / S3-compatible)
STORAGE_ENDPOINT="https://<account>.r2.cloudflarestorage.com"
STORAGE_ACCESS_KEY=""
STORAGE_SECRET_KEY=""
STORAGE_BUCKET_IMPORTS="csv-imports"
STORAGE_BUCKET_EXPORTS="export-zips"

# Email (Resend)
RESEND_API_KEY=""

# GitHub Export
GITHUB_TOKEN=""          # PAT for creating repos on behalf of users

# App
APP_ID="default-app-uuid"       # single-tenant default; multi-tenant uses header
NODE_ENV="production"
```

---

## 9.5 Monitoring & Observability

| Concern           | Tool                              |
|-------------------|-----------------------------------|
| Error tracking    | Sentry (Next.js SDK)              |
| Structured logs   | Axiom or Logtail                  |
| Uptime monitoring | Better Uptime or Checkly          |
| DB performance    | pg_stat_statements + Railway metrics |
| Queue monitoring  | BullMQ Board (admin UI)           |
| Real-user metrics | Vercel Analytics                  |

---

## 9.6 Scaling Considerations

| Bottleneck           | Strategy                                          |
|----------------------|---------------------------------------------------|
| DB connections       | PgBouncer connection pooling (max 20/instance)    |
| Config cache         | LRU in-process + Redis L2 cache (5-min TTL)       |
| CSV imports          | BullMQ workers scale horizontally on Railway      |
| Large workflows      | Increase worker concurrency; shard by appId       |
| Read-heavy resources | Add PostgreSQL read replica; route GETs there     |
| Cold starts (Vercel) | Use `export const runtime = 'nodejs'` for warm routes |

---

## 9.7 Security Checklist

- [ ] All DB connections use SSL (`?sslmode=require`)
- [ ] Secrets never committed — `.env` in `.gitignore`
- [ ] NEXTAUTH_SECRET rotated per environment
- [ ] Presigned URLs expire in 15 minutes
- [ ] Rate limiting on all public API routes (100 req/min/IP)
- [ ] Row-level security: all queries scoped to `appId`
- [ ] CSRF protection via NextAuth's built-in CSRF token
- [ ] CSP headers configured in `next.config.ts`
- [ ] Dependency audits in CI (`npm audit --audit-level=high`)
- [ ] `script` workflow step runs in `vm2` sandbox (no `require`, no filesystem)
- [ ] GitHub export token scoped to `repo` only (minimum permissions)
