import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { loadConfig } from '@/lib/config/loader'
import { getSession } from '@/lib/auth/session'
import { hasPermission } from '@/lib/auth/permissions'
import { buildZodSchema } from '@/lib/runtime/schemaBuilder'
import { parseListQuery } from '@/lib/runtime/queryBuilder'
import { errorResponse, paginatedResponse } from '@/lib/utils/apiError'
import { triggerWorkflowsForEvent } from '@/lib/workflow/engine'

function getAppId(req: NextRequest) {
  return req.headers.get('x-app-id') ?? req.nextUrl.searchParams.get('appId')
}

export async function GET(req: NextRequest, ctx: RouteContext<'/api/r/[resource]'>) {
  try {
    const session = await getSession()
    const appId = getAppId(req)
    if (!appId) return Response.json({ error: { code: 'BAD_REQUEST', message: 'appId required' } }, { status: 400 })

    const { resource } = await ctx.params
    const { config } = await loadConfig(appId)
    const resourceDef = config.resources.find(r => r.name === resource)
    if (!resourceDef) return Response.json({ error: { code: 'UNKNOWN_RESOURCE', message: `Unknown resource: ${resource}` } }, { status: 404 })
    if (!hasPermission(session, resourceDef.permissions.read)) return Response.json({ error: { code: 'FORBIDDEN', message: 'Access denied' } }, { status: 403 })

    const { page, limit, search } = parseListQuery(req.nextUrl)

    // Build where clause
    const conditions: string[] = [`appId = '${appId}'`, `resourceName = '${resource}'`, `deletedAt IS NULL`]
    if (search) {
      // SQLite JSON search via LIKE on the data column
      conditions.push(`data LIKE '%${search.replace(/'/g, "''")}%'`)
    }

    const allRecords = await prisma.dynamicRecord.findMany({
      where: { appId, resourceName: resource, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    })

    // Filter by search in JS (SQLite JSON support is limited)
    const filtered = search
      ? allRecords.filter(r => JSON.stringify(r.data).toLowerCase().includes(search.toLowerCase()))
      : allRecords

    const total = filtered.length
    const paginated = filtered.slice((page - 1) * limit, page * limit)

    const data = paginated.map(r => {
      const d = typeof r.data === 'string' ? JSON.parse(r.data as string) : r.data
      return { id: r.id, ...d, createdAt: r.createdAt, updatedAt: r.updatedAt }
    })

    return paginatedResponse(data, total, page, limit)
  } catch (err) { return errorResponse(err) }
}

export async function POST(req: NextRequest, ctx: RouteContext<'/api/r/[resource]'>) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: { code: 'UNAUTHENTICATED', message: 'Not authenticated' } }, { status: 401 })

    const appId = getAppId(req)
    if (!appId) return Response.json({ error: { code: 'BAD_REQUEST', message: 'appId required' } }, { status: 400 })

    const { resource } = await ctx.params
    const { config } = await loadConfig(appId)
    const resourceDef = config.resources.find(r => r.name === resource)
    if (!resourceDef) return Response.json({ error: { code: 'UNKNOWN_RESOURCE', message: `Unknown resource: ${resource}` } }, { status: 404 })
    if (!hasPermission(session, resourceDef.permissions.create)) return Response.json({ error: { code: 'FORBIDDEN', message: 'Access denied' } }, { status: 403 })

    const body = await req.json()
    const zodSchema = buildZodSchema(resourceDef.fields)
    const parsed = zodSchema.parse(body)

    const record = await prisma.dynamicRecord.create({
      data: { appId, resourceName: resource, data: JSON.stringify(parsed), createdBy: session.userId },
    })

    const result = { id: record.id, ...parsed, createdAt: record.createdAt, updatedAt: record.updatedAt }
    triggerWorkflowsForEvent(appId, config, 'record.created', resource, result)
    return Response.json(result, { status: 201 })
  } catch (err) { return errorResponse(err) }
}
