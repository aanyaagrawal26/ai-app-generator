import 'server-only'
import { AppConfigSchema, type AppConfig } from './schema'
import { prisma } from '@/lib/db/prisma'

const cache = new Map<string, { config: AppConfig; at: number }>()
const TTL = 5 * 60 * 1000

export interface ConfigLoadResult {
  config: AppConfig
  errors: string[]
  valid:  boolean
}

export async function loadConfig(appId: string): Promise<ConfigLoadResult> {
  const cached = cache.get(appId)
  if (cached && Date.now() - cached.at < TTL) {
    return { config: cached.config, errors: [], valid: true }
  }

  const app = await prisma.app.findUnique({ where: { id: appId } })
  if (!app) throw new Error(`App not found: ${appId}`)

  // configJson is stored as a JSON string in SQLite
  let raw: unknown
  try { raw = JSON.parse(app.configJson as string) } catch { raw = {} }

  const errors: string[] = []
  const result = AppConfigSchema.safeParse(raw)

  if (result.success) {
    cache.set(appId, { config: result.data, at: Date.now() })
    return { config: result.data, errors: [], valid: true }
  }

  for (const issue of result.error.issues) {
    errors.push(`[${issue.path.join('.')}] ${issue.message}`)
  }

  try {
    const coerced = AppConfigSchema.parse(raw)
    cache.set(appId, { config: coerced, at: Date.now() })
    return { config: coerced, errors, valid: false }
  } catch {
    const fallback = AppConfigSchema.parse({ id: appId, name: 'Untitled App' })
    return { config: fallback, errors, valid: false }
  }
}

export function invalidateConfig(appId: string) { cache.delete(appId) }

export function loadConfigFromJson(raw: unknown): ConfigLoadResult {
  const errors: string[] = []
  const result = AppConfigSchema.safeParse(raw)
  if (result.success) return { config: result.data, errors: [], valid: true }
  for (const issue of result.error.issues) errors.push(`[${issue.path.join('.')}] ${issue.message}`)
  try {
    return { config: AppConfigSchema.parse(raw), errors, valid: false }
  } catch {
    return { config: AppConfigSchema.parse({ id: '00000000-0000-0000-0000-000000000000', name: 'Invalid Config' }), errors, valid: false }
  }
}
