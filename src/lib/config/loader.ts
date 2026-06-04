import 'server-only'
import { AppConfigSchema, type AppConfig } from './schema'
import { prisma } from '@/lib/db/prisma'

// Simple in-process LRU cache
const configCache = new Map<string, { config: AppConfig; at: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export interface ConfigLoadResult {
  config: AppConfig
  errors: string[]
  valid:  boolean
}

export async function loadConfig(appId: string): Promise<ConfigLoadResult> {
  const cached = configCache.get(appId)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return { config: cached.config, errors: [], valid: true }
  }

  const app = await prisma.app.findUnique({ where: { id: appId } })
  if (!app) {
    throw new Error(`App not found: ${appId}`)
  }

  const raw = app.configJson as unknown
  const errors: string[] = []

  const result = AppConfigSchema.safeParse(raw)

  if (result.success) {
    configCache.set(appId, { config: result.data, at: Date.now() })
    return { config: result.data, errors: [], valid: true }
  }

  // Collect parse errors, then do a coerced parse
  for (const issue of result.error.issues) {
    errors.push(`[${issue.path.join('.')}] ${issue.message}`)
  }

  // Force-parse with defaults applied
  try {
    const coerced = AppConfigSchema.parse(raw)
    configCache.set(appId, { config: coerced, at: Date.now() })
    return { config: coerced, errors, valid: false }
  } catch {
    // If even that fails, return minimal valid config
    const fallback = AppConfigSchema.parse({
      id: appId,
      name: 'Untitled App',
      resources: [],
      pages: [],
    })
    return { config: fallback, errors, valid: false }
  }
}

export function invalidateConfig(appId: string): void {
  configCache.delete(appId)
}

export function loadConfigFromJson(raw: unknown): ConfigLoadResult {
  const errors: string[] = []
  const result = AppConfigSchema.safeParse(raw)

  if (result.success) return { config: result.data, errors: [], valid: true }

  for (const issue of result.error.issues) {
    errors.push(`[${issue.path.join('.')}] ${issue.message}`)
  }

  try {
    const coerced = AppConfigSchema.parse(raw)
    return { config: coerced, errors, valid: false }
  } catch {
    return {
      config: AppConfigSchema.parse({ id: '00000000-0000-0000-0000-000000000000', name: 'Invalid Config' }),
      errors,
      valid: false,
    }
  }
}
