# Track A: AI App Generator — Technical Design Overview

## Vision

A metadata-driven app runtime that accepts a JSON configuration and produces a
working full-stack application — complete with UI, APIs, database schema, and
workflows — at runtime, without code generation or redeployment.

## Core Principle

> "Describe once, run everywhere."

A single `app.config.json` drives the entire system. The runtime interprets it,
validates it, fills in sensible defaults for missing or invalid values, and
renders a fully functional application.

---

## Stack

| Layer       | Technology                                 |
|-------------|--------------------------------------------|
| Frontend    | Next.js 14 (App Router), React, TypeScript, TailwindCSS |
| Backend     | Node.js, TypeScript, Next.js API Routes    |
| Database    | PostgreSQL + Prisma ORM                    |
| Auth        | NextAuth.js (JWT + OAuth providers)        |
| Validation  | Zod                                        |
| Queue       | BullMQ + Redis                             |
| Storage     | AWS S3 / Cloudflare R2 (CSV imports, exports) |
| Deployment  | Vercel (frontend/API) + Railway (PostgreSQL + Redis) |

---

## Key Subsystems

1. **JSON Config Loader & Validator** — parses, validates, and normalises the app config
2. **Frontend Rendering Engine** — converts config → React component tree at runtime
3. **Backend Runtime** — dynamically registers API routes from config
4. **Database Adapter** — Prisma schema + migration driven by config
5. **Workflow Engine** — event-driven, step-based automation
6. **Auth System** — role/permission mapping from config
7. **CSV Import Pipeline** — multi-step ingestion with schema mapping
8. **i18n Engine** — multi-language support driven by locale config
9. **GitHub Export** — packages the generated app as a real Next.js repo

---

## Document Index

| # | Document |
|---|----------|
| 00 | This overview |
| 01 | High-level architecture |
| 02 | Low-level design |
| 03 | Prisma schema |
| 04 | API route structure |
| 05 | Folder structure |
| 06 | Runtime flow |
| 07 | Error handling strategy |
| 08 | Workflow engine design |
| 09 | Deployment plan |
