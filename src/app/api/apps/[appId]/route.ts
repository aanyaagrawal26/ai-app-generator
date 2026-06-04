import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { getSession } from '@/lib/auth/session'
import { errorResponse } from '@/lib/utils/apiError'

const PatchSchema = z.object({
  name:        z.string().min(1).optional(),
  description: z.string().optional(),
})

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/apps/[appId]'>) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: { code: 'UNAUTHENTICATED', message: 'Not authenticated' } }, { status: 401 })

    const { appId } = await ctx.params
    const app = await prisma.app.findUnique({ where: { id: appId } })
    if (!app) return Response.json({ error: { code: 'NOT_FOUND', message: 'App not found' } }, { status: 404 })

    return Response.json(app)
  } catch (err) {
    return errorResponse(err)
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext<'/api/apps/[appId]'>) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: { code: 'UNAUTHENTICATED', message: 'Not authenticated' } }, { status: 401 })

    const { appId } = await ctx.params
    const app = await prisma.app.findUnique({ where: { id: appId } })
    if (!app) return Response.json({ error: { code: 'NOT_FOUND', message: 'App not found' } }, { status: 404 })
    if (app.ownerId !== session.userId) return Response.json({ error: { code: 'FORBIDDEN', message: 'Access denied' } }, { status: 403 })

    const body = await req.json()
    const { name, description } = PatchSchema.parse(body)
    const updated = await prisma.app.update({
      where: { id: appId },
      data: { ...(name !== undefined && { name }), ...(description !== undefined && { description }) },
    })
    return Response.json(updated)
  } catch (err) {
    return errorResponse(err)
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/apps/[appId]'>) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: { code: 'UNAUTHENTICATED', message: 'Not authenticated' } }, { status: 401 })

    const { appId } = await ctx.params
    const app = await prisma.app.findUnique({ where: { id: appId } })
    if (!app) return Response.json({ error: { code: 'NOT_FOUND', message: 'App not found' } }, { status: 404 })
    if (app.ownerId !== session.userId) return Response.json({ error: { code: 'FORBIDDEN', message: 'Access denied' } }, { status: 403 })

    await prisma.app.delete({ where: { id: appId } })
    return Response.json({ success: true })
  } catch (err) {
    return errorResponse(err)
  }
}
