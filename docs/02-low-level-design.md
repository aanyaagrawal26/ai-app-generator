# 02 — Low-Level Design

## 2.1 JSON Config Schema (TypeScript / Zod)

```typescript
// lib/config/schema.ts

import { z } from 'zod'

// ── Field ────────────────────────────────────────────────────────────────────

export const FieldTypeSchema = z.enum([
  'text', 'number', 'boolean', 'date', 'datetime',
  'email', 'url', 'select', 'multiselect', 'relation',
  'richtext', 'json', 'file',
])

export const FieldSchema = z.object({
  name:         z.string().min(1),
  type:         FieldTypeSchema.catch('text'),       // fallback: 'text'
  label:        z.string().optional(),
  required:     z.boolean().default(false),
  unique:       z.boolean().default(false),
  defaultValue: z.unknown().optional(),
  options:      z.array(z.string()).optional(),      // for select/multiselect
  relation: z.object({
    resource: z.string(),
    type:     z.enum(['one-to-one', 'one-to-many', 'many-to-many']),
  }).optional(),
  validation: z.object({
    min:     z.number().optional(),
    max:     z.number().optional(),
    pattern: z.string().optional(),
  }).optional(),
})

export type Field = z.infer<typeof FieldSchema>

// ── Resource ─────────────────────────────────────────────────────────────────

export const ResourceActionSchema = z.object({
  name:    z.string(),
  label:   z.string().optional(),
  method:  z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('POST'),
  handler: z.string(),   // references a named server-side handler function
  permissions: z.array(z.string()).default([]),
})

export const ResourceSchema = z.object({
  name:        z.string().min(1),
  label:       z.string().optional(),
  fields:      z.array(FieldSchema).min(1),
  timestamps:  z.boolean().default(true),
  softDelete:  z.boolean().default(false),
  actions:     z.array(ResourceActionSchema).default([]),
  permissions: z.object({
    create: z.array(z.string()).default(['admin']),
    read:   z.array(z.string()).default(['*']),
    update: z.array(z.string()).default(['admin']),
    delete: z.array(z.string()).default(['admin']),
  }).default({}),
})

export type Resource = z.infer<typeof ResourceSchema>

// ── UI Component ─────────────────────────────────────────────────────────────

export const ComponentTypeSchema = z.enum([
  'table', 'form', 'chart', 'kanban', 'calendar',
  'detail', 'card', 'stat', 'tabs', 'modal',
]).catch('unknown' as any)   // unknown → fallback renderer

export const ComponentSchema = z.object({
  id:       z.string(),
  type:     ComponentTypeSchema,
  resource: z.string().optional(),
  title:    z.string().optional(),
  config:   z.record(z.unknown()).default({}),
  children: z.lazy((): z.ZodArray<typeof ComponentSchema> =>
    z.array(ComponentSchema)).default([]),
})

export type Component = z.infer<typeof ComponentSchema>

// ── Page ─────────────────────────────────────────────────────────────────────

export const PageSchema = z.object({
  path:        z.string().startsWith('/'),
  title:       z.string().optional(),
  layout:      z.enum(['default', 'blank', 'sidebar', 'centered']).default('default'),
  permissions: z.array(z.string()).default(['*']),
  components:  z.array(ComponentSchema).default([]),
})

// ── Auth ─────────────────────────────────────────────────────────────────────

export const RoleSchema = z.object({
  name:        z.string(),
  label:       z.string().optional(),
  permissions: z.array(z.string()).default([]),
})

export const AuthConfigSchema = z.object({
  providers:     z.array(z.enum(['credentials', 'google', 'github'])).default(['credentials']),
  defaultRole:   z.string().default('user'),
  roles:         z.array(RoleSchema).default([]),
  sessionType:   z.enum(['jwt', 'database']).default('jwt'),
  sessionMaxAge: z.number().default(86400),
})

// ── i18n ─────────────────────────────────────────────────────────────────────

export const I18nConfigSchema = z.object({
  defaultLocale:    z.string().default('en'),
  supportedLocales: z.array(z.string()).default(['en']),
  namespaces:       z.array(z.string()).default(['common']),
})

// ── Workflow ──────────────────────────────────────────────────────────────────

export const WorkflowTriggerSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('record.created'), resource: z.string() }),
  z.object({ type: z.literal('record.updated'), resource: z.string(), fields: z.array(z.string()).optional() }),
  z.object({ type: z.literal('record.deleted'), resource: z.string() }),
  z.object({ type: z.literal('schedule'),       cron: z.string() }),
  z.object({ type: z.literal('webhook'),        path: z.string() }),
])

export const WorkflowStepSchema = z.object({
  id:        z.string(),
  type:      z.enum(['send_email', 'webhook', 'update_record', 'create_record', 'condition', 'delay', 'script']),
  config:    z.record(z.unknown()).default({}),
  onSuccess: z.string().optional(),   // next step id
  onFailure: z.string().optional(),   // next step id
})

export const WorkflowSchema = z.object({
  id:          z.string(),
  name:        z.string(),
  enabled:     z.boolean().default(true),
  trigger:     WorkflowTriggerSchema,
  steps:       z.array(WorkflowStepSchema).min(1),
})

// ── Root App Config ───────────────────────────────────────────────────────────

export const AppConfigSchema = z.object({
  id:          z.string().uuid(),
  name:        z.string().min(1),
  version:     z.string().default('1.0.0'),
  description: z.string().optional(),
  resources:   z.array(ResourceSchema).default([]),
  pages:       z.array(PageSchema).default([]),
  auth:        AuthConfigSchema.default({}),
  i18n:        I18nConfigSchema.default({}),
  workflows:   z.array(WorkflowSchema).default([]),
  theme: z.object({
    primaryColor: z.string().default('#6366f1'),
    fontFamily:   z.string().default('Inter'),
    borderRadius: z.enum(['none', 'sm', 'md', 'lg']).default('md'),
    darkMode:     z.boolean().default(false),
  }).default({}),
})

export type AppConfig = z.infer<typeof AppConfigSchema>
```

---

## 2.2 Config Loader

```typescript
// lib/config/loader.ts

import { AppConfigSchema, AppConfig } from './schema'
import { ZodError } from 'zod'
import { LRUCache } from 'lru-cache'

const cache = new LRUCache<string, AppConfig>({ max: 50, ttl: 1000 * 60 * 5 })

export interface ConfigLoadResult {
  config: AppConfig
  errors: string[]         // non-fatal: fields that were defaulted/coerced
  valid:  boolean          // true if zero errors before coercion
}

export async function loadConfig(appId: string): Promise<ConfigLoadResult> {
  const cached = cache.get(appId)
  if (cached) return { config: cached, errors: [], valid: true }

  const raw = await fetchRawConfig(appId)   // from DB or file
  const errors: string[] = []

  const result = AppConfigSchema.safeParse(raw)

  if (result.success) {
    cache.set(appId, result.data)
    return { config: result.data, errors: [], valid: true }
  }

  // Partial parse: coerce what we can, log what we can't
  const coerced = AppConfigSchema.parse(deepApplyDefaults(raw, result.error))
  collectErrors(result.error, errors)
  cache.set(appId, coerced)

  return { config: coerced, errors, valid: false }
}

function collectErrors(error: ZodError, out: string[]): void {
  for (const issue of error.issues) {
    out.push(`[${issue.path.join('.')}] ${issue.message}`)
  }
}
```

---

## 2.3 Frontend Rendering Engine

```typescript
// components/runtime/DynamicRenderer.tsx

import React from 'react'
import { Component } from '@/lib/config/schema'
import { componentRegistry } from './registry'
import { UnknownComponent } from './UnknownComponent'
import { ErrorBoundary } from './ErrorBoundary'

interface Props {
  component: Component
  context:   Record<string, unknown>
}

export function DynamicRenderer({ component, context }: Props) {
  const Resolved = componentRegistry[component.type] ?? UnknownComponent

  return (
    <ErrorBoundary fallback={<UnknownComponent component={component} />}>
      <Resolved
        id={component.id}
        config={component.config}
        resource={component.resource}
        context={context}
      >
        {component.children.map(child => (
          <DynamicRenderer key={child.id} component={child} context={context} />
        ))}
      </Resolved>
    </ErrorBoundary>
  )
}
```

```typescript
// components/runtime/registry.ts

import { ComponentType as CT } from './schema'
import { TableComponent }    from '../components/TableComponent'
import { FormComponent }     from '../components/FormComponent'
import { ChartComponent }    from '../components/ChartComponent'
import { KanbanComponent }   from '../components/KanbanComponent'
import { CalendarComponent } from '../components/CalendarComponent'
import { DetailComponent }   from '../components/DetailComponent'
import { CardComponent }     from '../components/CardComponent'
import { StatComponent }     from '../components/StatComponent'
import { TabsComponent }     from '../components/TabsComponent'
import { ModalComponent }    from '../components/ModalComponent'

export const componentRegistry: Record<string, React.ComponentType<any>> = {
  table:    TableComponent,
  form:     FormComponent,
  chart:    ChartComponent,
  kanban:   KanbanComponent,
  calendar: CalendarComponent,
  detail:   DetailComponent,
  card:     CardComponent,
  stat:     StatComponent,
  tabs:     TabsComponent,
  modal:    ModalComponent,
}
```

---

## 2.4 Dynamic API Handler

```typescript
// lib/runtime/resourceHandler.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { loadConfig } from '@/lib/config/loader'
import { buildZodSchema } from '@/lib/runtime/schemaBuilder'
import { checkPermission } from '@/lib/auth/permissions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'

export async function handleResource(
  req: NextRequest,
  { params }: { params: { resource: string } }
) {
  const session = await getServerSession(authOptions)
  const { config } = await loadConfig(process.env.APP_ID!)
  const resourceDef = config.resources.find(r => r.name === params.resource)

  if (!resourceDef) {
    return NextResponse.json({ error: `Unknown resource: ${params.resource}` }, { status: 404 })
  }

  const action = methodToAction(req.method)
  const allowed = checkPermission(session, resourceDef.permissions[action] ?? [])
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const model = (prisma as any)[resourceDef.name]
  if (!model) {
    return NextResponse.json({ error: `Model not found: ${resourceDef.name}` }, { status: 500 })
  }

  try {
    switch (req.method) {
      case 'GET':    return await handleList(req, model, resourceDef)
      case 'POST':   return await handleCreate(req, model, resourceDef)
      case 'PUT':    return await handleUpdate(req, model, resourceDef)
      case 'DELETE': return await handleDelete(req, model, resourceDef)
      default:
        return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }
}

function methodToAction(method: string): 'create' | 'read' | 'update' | 'delete' {
  const map: Record<string, any> = { GET: 'read', POST: 'create', PUT: 'update', DELETE: 'delete' }
  return map[method] ?? 'read'
}

async function handleCreate(req: NextRequest, model: any, resourceDef: any) {
  const body = await req.json()
  const zodSchema = buildZodSchema(resourceDef.fields)
  const parsed = zodSchema.parse(body)
  const record = await model.create({ data: parsed })
  return NextResponse.json(record, { status: 201 })
}

async function handleList(req: NextRequest, model: any, resourceDef: any) {
  const url = new URL(req.url)
  const page  = Number(url.searchParams.get('page')  ?? 1)
  const limit = Number(url.searchParams.get('limit') ?? 20)
  const [data, total] = await Promise.all([
    model.findMany({ skip: (page - 1) * limit, take: limit }),
    model.count(),
  ])
  return NextResponse.json({ data, total, page, limit })
}

async function handleUpdate(req: NextRequest, model: any, resourceDef: any) {
  const body = await req.json()
  const { id, ...rest } = body
  const zodSchema = buildZodSchema(resourceDef.fields).partial()
  const parsed = zodSchema.parse(rest)
  const record = await model.update({ where: { id }, data: parsed })
  return NextResponse.json(record)
}

async function handleDelete(req: NextRequest, model: any, resourceDef: any) {
  const url  = new URL(req.url)
  const id   = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  if (resourceDef.softDelete) {
    await model.update({ where: { id }, data: { deletedAt: new Date() } })
  } else {
    await model.delete({ where: { id } })
  }
  return NextResponse.json({ success: true })
}
```
