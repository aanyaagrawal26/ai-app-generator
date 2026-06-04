import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getSession } from '@/lib/auth/session'
import { loadConfig, invalidateConfig } from '@/lib/config/loader'
import { AppConfigSchema } from '@/lib/config/schema'
import { errorResponse } from '@/lib/utils/apiError'

function getAppId(req: NextRequest) {
  return req.headers.get('x-app-id') ?? req.nextUrl.searchParams.get('appId')
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: { code: 'UNAUTHENTICATED', message: 'Not authenticated' } }, { status: 401 })

    const appId = getAppId(req)
    if (!appId) return Response.json({ error: { code: 'BAD_REQUEST', message: 'appId required' } }, { status: 400 })

    const result = await loadConfig(appId)
    return Response.json(result)
  } catch (err) { return errorResponse(err) }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: { code: 'UNAUTHENTICATED', message: 'Not authenticated' } }, { status: 401 })

    const appId = getAppId(req)
    if (!appId) return Response.json({ error: { code: 'BAD_REQUEST', message: 'appId required' } }, { status: 400 })

    const app = await prisma.app.findUnique({ where: { id: appId } })
    if (!app) return Response.json({ error: { code: 'NOT_FOUND', message: 'App not found' } }, { status: 404 })
    if (app.ownerId !== session.userId) return Response.json({ error: { code: 'FORBIDDEN', message: 'Access denied' } }, { status: 403 })

    const body = await req.json()
    const parsed = AppConfigSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid config', issues: parsed.error.issues } }, { status: 422 })
    }

    // snapshot
    await prisma.configVersion.create({
      data: { appId, version: app.version, configJson: app.configJson as string, changedBy: session.userId },
    })

    await prisma.app.update({
      where: { id: appId },
      data:  { configJson: JSON.stringify(parsed.data), version: parsed.data.version },
    })

    invalidateConfig(appId)
    return Response.json({ success: true, config: parsed.data })
  } catch (err) { return errorResponse(err) }
}
