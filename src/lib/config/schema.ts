import { z } from 'zod'

// Zod v4: .catch() TS types require 2 args but runtime accepts 1.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const zCatch = <T extends z.ZodType>(schema: T, val: unknown) => (schema as any).catch(() => val) as T

// ── Field ────────────────────────────────────────────────────────────────────

export const FieldTypeSchema = zCatch(z.enum([
  'text','number','boolean','date','datetime',
  'email','url','select','multiselect','relation',
  'richtext','json','file',
]), 'text')

export const FieldSchema = z.object({
  name:         z.string().min(1),
  type:         FieldTypeSchema,
  label:        z.string().optional(),
  required:     z.boolean().default(false),
  unique:       z.boolean().default(false),
  defaultValue: z.unknown().optional(),
  options:      z.array(z.string()).optional(),
  relation: z.object({
    resource: z.string(),
    type:     z.enum(['one-to-one','one-to-many','many-to-many']),
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
  name:        z.string(),
  label:       z.string().optional(),
  method:      z.enum(['GET','POST','PUT','PATCH','DELETE']).default('POST'),
  handler:     z.string(),
  permissions: z.array(z.string()).default([]),
})

export const ResourcePermissionsSchema = z.object({
  create: z.array(z.string()).default(['admin']),
  read:   z.array(z.string()).default(['*']),
  update: z.array(z.string()).default(['admin']),
  delete: z.array(z.string()).default(['admin']),
})

export const ResourceSchema = z.object({
  name:        z.string().min(1),
  label:       z.string().optional(),
  fields:      z.array(FieldSchema).min(1),
  timestamps:  z.boolean().default(false),
  softDelete:  z.boolean().default(false),
  actions:     z.array(ResourceActionSchema).default([]),
  permissions: ResourcePermissionsSchema.default({ create:['admin'], read:['*'], update:['admin'], delete:['admin'] }),
})

export type Resource = z.infer<typeof ResourceSchema>

// ── UI Component ─────────────────────────────────────────────────────────────

export type Component = {
  id:        string
  type:      string
  resource?: string
  title?:    string
  config:    Record<string, unknown>
  children:  Component[]
}

export const ComponentSchema: z.ZodType<Component> = z.lazy(() =>
  z.object({
    id:       z.string(),
    type:     zCatch(z.string(), 'unknown'),
    resource: z.string().optional(),
    title:    z.string().optional(),
    config:   z.record(z.string(), z.unknown()).default(() => ({})),
    children: z.array(ComponentSchema).default(() => []),
  })
)

// ── Page ─────────────────────────────────────────────────────────────────────

export const PageSchema = z.object({
  path:        z.string().startsWith('/'),
  title:       z.string().optional(),
  layout:      z.enum(['default','blank','sidebar','centered']).default('default'),
  permissions: z.array(z.string()).default(['*']),
  components:  z.array(ComponentSchema).default(() => []),
})

export type Page = z.infer<typeof PageSchema>

// ── Auth ─────────────────────────────────────────────────────────────────────

export const RoleSchema = z.object({
  name:        z.string(),
  label:       z.string().optional(),
  permissions: z.array(z.string()).default([]),
})

export const AuthConfigSchema = z.object({
  providers:     z.array(z.enum(['credentials','google','github'])).default(['credentials']),
  defaultRole:   z.string().default('user'),
  roles:         z.array(RoleSchema).default([]),
  sessionType:   z.enum(['jwt','database']).default('jwt'),
  sessionMaxAge: z.number().default(86400),
}).default({ providers:['credentials'], defaultRole:'user', roles:[], sessionType:'jwt', sessionMaxAge:86400 })

// ── i18n ─────────────────────────────────────────────────────────────────────

export const I18nConfigSchema = z.object({
  defaultLocale:    z.string().default('en'),
  supportedLocales: z.array(z.string()).default(['en']),
  namespaces:       z.array(z.string()).default(['common']),
}).default({ defaultLocale:'en', supportedLocales:['en'], namespaces:['common'] })

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
  type:      z.enum(['send_email','webhook','update_record','create_record','condition','delay','script']),
  config:    z.record(z.string(), z.unknown()).default(() => ({})),
  onSuccess: z.string().nullable().optional(),
  onFailure: z.string().nullable().optional(),
})

export type WorkflowStep = z.infer<typeof WorkflowStepSchema>

export const WorkflowSchema = z.object({
  id:      z.string(),
  name:    z.string(),
  enabled: z.boolean().default(true),
  trigger: WorkflowTriggerSchema,
  steps:   z.array(WorkflowStepSchema).min(1),
})

export type Workflow = z.infer<typeof WorkflowSchema>

// ── Root App Config ───────────────────────────────────────────────────────────

export const ThemeSchema = z.object({
  primaryColor: z.string().default('#6366f1'),
  fontFamily:   z.string().default('Inter'),
  borderRadius: z.enum(['none','sm','md','lg']).default('md'),
  darkMode:     z.boolean().default(false),
}).default({ primaryColor:'#6366f1', fontFamily:'Inter', borderRadius:'md', darkMode:false })

export const AppConfigSchema = z.object({
  id:          z.string().uuid(),
  name:        z.string().min(1),
  version:     z.string().default('1.0.0'),
  description: z.string().optional(),
  resources:   z.array(ResourceSchema).default([]),
  pages:       z.array(PageSchema).default([]),
  auth:        AuthConfigSchema,
  i18n:        I18nConfigSchema,
  workflows:   z.array(WorkflowSchema).default([]),
  theme:       ThemeSchema,
})

export type AppConfig = z.infer<typeof AppConfigSchema>
