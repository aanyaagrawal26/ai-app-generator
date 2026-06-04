import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { loadConfig } from '@/lib/config/loader'
import { getSession } from '@/lib/auth/session'
import { hasPermission } from '@/lib/auth/permissions'
import { buildZodSchema } from '@/lib/runtime/schemaBuilder'
import { errorResponse } from '@/lib/utils/apiError'
import { triggerWorkflowsForEvent } from '@/lib/workflow/engine'

function getAppId(req: NextRequest) {
  return req.headers.get('x-app-id') ?? req.nextUrl.searchParams.get('appId')
}

export async function GET(req: NextRequest, ctx: RouteContext<'/api/r/[resource]/[id]'>) {
  try {
    const session = await getSession()
    const appId = getAppId(req)
    if (!appId) return Response.json({ error: { code: 'BAD_REQUEST', message: 'appId required' } }, { status: 400 })

    const { resource, id } = await ctx.params
    const { config } = await loadConfig(appId)
    const resourceDef = config.resources.find(r => r.name === resource)
    if (!resourceDef) return Response.json({ error: { code: 'UNKNOWN_RESOURCE', message: `Unknown resource: ${resource}` } }, { status: 404 })
    if (!hasPermission(session, resourceDef.permissions.read)) return Response.json({ error: { code: 'FORBIDDEN', message: 'Access denied' } }, { status: 403 })

    const record = await prisma.dynamicRecord.findFirst({ where: { id, appId, resourceName: resource, deletedAt: null } })
    if (!record) return Response.json({ error: { code: 'NOT_FOUND', message: 'Record not found' } }, { status: 404 })

    const d = typeof record.data === 'string' ? JSON.parse(record.data as string) : record.data
    return Response.json({ id: record.id, ...d, createdAt: record.createdAt, updatedAt: record.updatedAt })
  } catch (err) { return errorResponse(err) }
}

export async function PUT(req: NextRequest, ctx: RouteContext<'/api/r/[resource]/[id]'>) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: { code: 'UNAUTHENTICATED', message: 'Not authenticated' } }, { status: 401 })

    const appId = getAppId(req)
    if (!appId) return Response.json({ error: { code: 'BAD_REQUEST', message: 'appId required' } }, { status: 400 })

    const { resource, id } = await ctx.params
    const { config } = await loadConfig(appId)
    const resourceDef = config.resources.find(r => r.name === resource)
    if (!resourceDef) return Response.json({ error: { code: 'UNKNOWN_RESOURCE', message: `Unknown resource: ${resource}` } }, { status: 404 })
    if (!hasPermission(session, resourceDef.permissions.update)) return Response.json({ error: { code: 'FORBIDDEN', message: 'Access denied' } }, { status: 403 })

    const existing = await prisma.dynamicRecord.findFirst({ where: { id, appId, resourceName: resource, deletedAt: null } })
    if (!existing) return Response.json({ error: { code: 'NOT_FOUND', message: 'Record not found' } }, { status: 404 })

    const body = await req.json()
    const updates = buildZodSchema(resourceDef.fields).partial().parse(body)
    const current = typeof existing.data === 'string' ? JSON.parse(existing.data as string) : existing.data
    const merged = { ...current, ...updates }

    const updated = await prisma.dynamicRecord.update({
      where: { id },
      data:  { data: JSON.stringify(merged), updatedBy: session.userId },
    })

    const result = { id: updated.id, ...merged, createdAt: updated.createdAt, updatedAt: updated.updatedAt }
    triggerWorkflowsForEvent(appId, config, 'record.updated', resource, result)
    return Response.json(result)
  } catch (err) { return errorResponse(err) }
}

export async function DELETE(req: NextRequest, ctx: RouteContext<'/api/r/[resource]/[id]'>) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: { code: 'UNAUTHENTICATED', message: 'Not authenticated' } }, { status: 401 })

    const appId = getAppId(req)
    if (!appId) return Response.json({ error: { code: 'BAD_REQUEST', message: 'appId required' } }, { status: 400 })

    const { resource, id } = await ctx.params
    const { config } = await loadConfig(appId)
    const resourceDef = config.resources.find(r => r.name === resource)
    if (!resourceDef) return Response.json({ error: { code: 'UNKNOWN_RESOURCE', message: `Unknown resource: ${resource}` } }, { status: 404 })
    if (!hasPermission(session, resourceDef.permissions.delete)) return Response.json({ error: { code: 'FORBIDDEN', message: 'Access denied' } }, { status: 403 })

    const existing = await prisma.dynamicRecord.findFirst({ where: { id, appId, resourceName: resource, deletedAt: null } })
    if (!existing) return Response.json({ error: { code: 'NOT_FOUND', message: 'Record not found' } }, { status: 404 })

    if (resourceDef.softDelete) {
      await prisma.dynamicRecord.update({ where: { id }, data: { deletedAt: new Date() } })
    } else {
      await prisma.dynamicRecord.delete({ where: { id } })
    }

    triggerWorkflowsForEvent(appId, config, 'record.deleted', resource, { id })
    return Response.json({ success: true })
  } catch (err) { return errorResponse(err) }
}
