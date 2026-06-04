import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { loadConfig } from '@/lib/config/loader'
import { getSession } from '@/lib/auth/session'
import { hasPermission } from '@/lib/auth/permissions'
import { buildZodSchema } from '@/lib/runtime/schemaBuilder'
import { parseListQuery, buildPrismaQuery } from '@/lib/runtime/queryBuilder'
import { errorResponse, paginatedResponse } from '@/lib/utils/apiError'
import { triggerWorkflowsForEvent } from '@/lib/workflow/engine'

function getAppId(request: NextRequest): string | null {
  return request.headers.get('x-app-id') ?? request.nextUrl.searchParams.get('appId')
}

export async function GET(request: NextRequest, ctx: RouteContext<'/api/r/[resource]'>) {
  try {
    const session = await getSession()
    const appId = getAppId(request)
    if (!appId) return Response.json({ error: { code: 'BAD_REQUEST', message: 'appId required' } }, { status: 400 })

    const { resource } = await ctx.params
    const { config } = await loadConfig(appId)
    const resourceDef = config.resources.find(r => r.name === resource)
    if (!resourceDef) return Response.json({ error: { code: 'UNKNOWN_RESOURCE', message: `Unknown resource: ${resource}` } }, { status: 404 })

    if (!hasPermission(session, resourceDef.permissions.read)) {
      return Response.json({ error: { code: 'FORBIDDEN', message: 'Access denied' } }, { status: 403 })
    }

    const query = parseListQuery(request.nextUrl)
    const prismaQuery = buildPrismaQuery(query, resourceDef.fields)

    const [records, total] = await Promise.all([
      prisma.dynamicRecord.findMany({
        where:   { appId, resourceName: resource, deletedAt: null, ...prismaQuery.where },
        orderBy: prismaQuery.orderBy as Parameters<typeof prisma.dynamicRecord.findMany>[0]['orderBy'],
        skip:    prismaQuery.skip,
        take:    prismaQuery.take,
      }),
      prisma.dynamicRecord.count({
        where: { appId, resourceName: resource, deletedAt: null, ...prismaQuery.where },
      }),
    ])

    const data = records.map(r => ({ id: r.id, ...(r.data as object), createdAt: r.createdAt, updatedAt: r.updatedAt }))
    return paginatedResponse(data, total, query.page, query.limit)
  } catch (err) {
    return errorResponse(err)
  }
}

export async function POST(request: NextRequest, ctx: RouteContext<'/api/r/[resource]'>) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: { code: 'UNAUTHENTICATED', message: 'Not authenticated' } }, { status: 401 })

    const appId = getAppId(request)
    if (!appId) return Response.json({ error: { code: 'BAD_REQUEST', message: 'appId required' } }, { status: 400 })

    const { resource } = await ctx.params
    const { config } = await loadConfig(appId)
    const resourceDef = config.resources.find(r => r.name === resource)
    if (!resourceDef) return Response.json({ error: { code: 'UNKNOWN_RESOURCE', message: `Unknown resource: ${resource}` } }, { status: 404 })

    if (!hasPermission(session, resourceDef.permissions.create)) {
      return Response.json({ error: { code: 'FORBIDDEN', message: 'Access denied' } }, { status: 403 })
    }

    const body = await request.json()
    const zodSchema = buildZodSchema(resourceDef.fields)
    const data = zodSchema.parse(body)

    const record = await prisma.dynamicRecord.create({
      data: { appId, resourceName: resource, data: data as object, createdBy: session.userId },
    })

    const result = { id: record.id, ...(record.data as object), createdAt: record.createdAt, updatedAt: record.updatedAt }

    // Fire workflows asynchronously
    triggerWorkflowsForEvent(appId, config, 'record.created', resource, result)

    return Response.json(result, { status: 201 })
  } catch (err) {
    return errorResponse(err)
  }
}
