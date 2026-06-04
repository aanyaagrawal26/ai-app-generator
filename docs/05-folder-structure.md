# 05 — Folder Structure

```
ai-app-generator/
│
├── src/
│   ├── app/                              ← Next.js App Router
│   │   ├── layout.tsx                    ← Root layout (fonts, providers)
│   │   ├── page.tsx                      ← Landing / redirect
│   │   │
│   │   ├── (auth)/                       ← Auth route group
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx                ← Blank layout for auth pages
│   │   │
│   │   ├── (app)/                        ← Authenticated app shell
│   │   │   ├── layout.tsx                ← Sidebar + topbar shell
│   │   │   ├── dashboard/page.tsx
│   │   │   └── [appId]/                  ← Per-app context
│   │   │       ├── layout.tsx            ← Loads config, sets AppContext
│   │   │       ├── page.tsx              ← App home page (from config)
│   │   │       └── [...slug]/page.tsx    ← Catch-all: renders config pages
│   │   │
│   │   ├── builder/                      ← Config builder UI
│   │   │   ├── [appId]/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx              ← Builder home
│   │   │   │   ├── resources/page.tsx
│   │   │   │   ├── pages/page.tsx
│   │   │   │   ├── workflows/page.tsx
│   │   │   │   └── settings/page.tsx
│   │   │   └── new/page.tsx              ← Create new app
│   │   │
│   │   └── api/                          ← API routes (see doc 04)
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── config/route.ts
│   │       ├── config/validate/route.ts
│   │       ├── config/versions/route.ts
│   │       ├── r/[resource]/route.ts
│   │       ├── r/[resource]/[id]/route.ts
│   │       ├── r/[resource]/actions/[action]/route.ts
│   │       ├── import/route.ts
│   │       ├── import/upload/route.ts
│   │       ├── import/[jobId]/route.ts
│   │       ├── import/[jobId]/mapping/route.ts
│   │       ├── import/[jobId]/process/route.ts
│   │       ├── workflow/route.ts
│   │       ├── workflow/[workflowId]/trigger/route.ts
│   │       ├── workflow/runs/route.ts
│   │       ├── workflow/runs/[runId]/route.ts
│   │       ├── i18n/route.ts
│   │       ├── i18n/[locale]/route.ts
│   │       ├── i18n/import/route.ts
│   │       ├── export/route.ts
│   │       ├── export/[jobId]/route.ts
│   │       ├── users/route.ts
│   │       ├── users/[userId]/route.ts
│   │       └── health/route.ts
│   │
│   ├── components/
│   │   ├── runtime/                      ← The rendering engine
│   │   │   ├── DynamicRenderer.tsx
│   │   │   ├── DynamicPage.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── UnknownComponent.tsx
│   │   │   └── registry.ts
│   │   │
│   │   ├── components/                   ← Registered component implementations
│   │   │   ├── TableComponent.tsx
│   │   │   ├── FormComponent.tsx
│   │   │   ├── ChartComponent.tsx
│   │   │   ├── KanbanComponent.tsx
│   │   │   ├── CalendarComponent.tsx
│   │   │   ├── DetailComponent.tsx
│   │   │   ├── CardComponent.tsx
│   │   │   ├── StatComponent.tsx
│   │   │   ├── TabsComponent.tsx
│   │   │   └── ModalComponent.tsx
│   │   │
│   │   ├── ui/                           ← Base design-system components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Pagination.tsx
│   │   │   └── ...
│   │   │
│   │   ├── builder/                      ← Config builder UI components
│   │   │   ├── ResourceEditor.tsx
│   │   │   ├── FieldEditor.tsx
│   │   │   ├── PageEditor.tsx
│   │   │   ├── WorkflowEditor.tsx
│   │   │   ├── ComponentPalette.tsx
│   │   │   └── JsonPreview.tsx
│   │   │
│   │   └── shared/                       ← App-wide shared components
│   │       ├── Sidebar.tsx
│   │       ├── TopBar.tsx
│   │       ├── UserMenu.tsx
│   │       └── AppSwitcher.tsx
│   │
│   ├── lib/
│   │   ├── config/
│   │   │   ├── schema.ts                 ← Zod schemas (see doc 02)
│   │   │   ├── loader.ts                 ← Config load + cache
│   │   │   ├── defaults.ts               ← Default-value helpers
│   │   │   └── diff.ts                   ← Config version diff
│   │   │
│   │   ├── runtime/
│   │   │   ├── resourceHandler.ts        ← Dynamic CRUD handler
│   │   │   ├── schemaBuilder.ts          ← Field[] → Zod schema
│   │   │   ├── queryBuilder.ts           ← Filters/sort → Prisma query
│   │   │   └── actionRunner.ts           ← Custom action executor
│   │   │
│   │   ├── auth/
│   │   │   ├── options.ts                ← NextAuth config
│   │   │   ├── permissions.ts            ← Role/permission checker
│   │   │   └── middleware.ts             ← Route-level auth middleware
│   │   │
│   │   ├── db/
│   │   │   ├── prisma.ts                 ← Prisma singleton
│   │   │   └── schemaSync.ts             ← Config → Prisma migration helper
│   │   │
│   │   ├── workflow/
│   │   │   ├── engine.ts                 ← Workflow runner
│   │   │   ├── steps/                    ← Step handlers
│   │   │   │   ├── sendEmail.ts
│   │   │   │   ├── webhook.ts
│   │   │   │   ├── updateRecord.ts
│   │   │   │   ├── createRecord.ts
│   │   │   │   ├── condition.ts
│   │   │   │   ├── delay.ts
│   │   │   │   └── script.ts
│   │   │   ├── triggers/
│   │   │   │   ├── recordTrigger.ts
│   │   │   │   ├── scheduleTrigger.ts
│   │   │   │   └── webhookTrigger.ts
│   │   │   └── queue.ts                  ← BullMQ setup
│   │   │
│   │   ├── import/
│   │   │   ├── parser.ts                 ← CSV → row array
│   │   │   ├── mapper.ts                 ← Column mapping
│   │   │   ├── validator.ts              ← Per-row Zod validation
│   │   │   ├── inserter.ts               ← Bulk insert w/ chunking
│   │   │   └── worker.ts                 ← BullMQ worker
│   │   │
│   │   ├── i18n/
│   │   │   ├── config.ts                 ← next-intl config
│   │   │   ├── loader.ts                 ← Locale string DB loader
│   │   │   └── middleware.ts             ← Locale detection middleware
│   │   │
│   │   ├── export/
│   │   │   ├── generator.ts              ← Project file generator
│   │   │   ├── templates/                ← Handlebars templates
│   │   │   │   ├── page.hbs
│   │   │   │   ├── apiRoute.hbs
│   │   │   │   ├── prismaSchema.hbs
│   │   │   │   ├── packageJson.hbs
│   │   │   │   └── README.hbs
│   │   │   ├── zipper.ts                 ← Zip + S3 upload
│   │   │   └── github.ts                 ← GitHub API client
│   │   │
│   │   ├── storage/
│   │   │   ├── client.ts                 ← S3/R2 client
│   │   │   └── presign.ts                ← Presigned URL generator
│   │   │
│   │   └── utils/
│   │       ├── logger.ts
│   │       ├── slugify.ts
│   │       └── pagination.ts
│   │
│   ├── hooks/                            ← React custom hooks
│   │   ├── useAppConfig.ts
│   │   ├── useResource.ts
│   │   ├── useWorkflow.ts
│   │   └── useLocale.ts
│   │
│   ├── context/                          ← React contexts
│   │   ├── AppContext.tsx
│   │   ├── ConfigContext.tsx
│   │   └── LocaleContext.tsx
│   │
│   ├── types/
│   │   ├── next-auth.d.ts                ← Session type augmentation
│   │   └── index.ts                      ← Shared TS types
│   │
│   └── middleware.ts                     ← Next.js edge middleware (auth + i18n)
│
├── prisma/
│   ├── schema.prisma                     ← (see doc 03)
│   ├── migrations/                       ← Auto-generated migration files
│   └── seed.ts                           ← Dev seed data
│
├── public/
│   └── locales/                          ← Static fallback locale files
│       ├── en/common.json
│       └── ...
│
├── workers/                              ← Long-running Node.js processes
│   ├── workflowWorker.ts                 ← BullMQ workflow job processor
│   └── importWorker.ts                   ← BullMQ CSV import job processor
│
├── scripts/
│   ├── schemaSync.ts                     ← CLI: sync config → Prisma schema
│   └── seedLocales.ts                    ← CLI: seed locale strings from CSV
│
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```
