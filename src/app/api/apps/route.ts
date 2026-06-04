import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { getSession } from '@/lib/auth/session'
import { errorResponse } from '@/lib/utils/apiError'
import { AppConfigSchema } from '@/lib/config/schema'

const CreateAppSchema = z.object({
  name:        z.string().min(1),
  description: z.string().optional(),
  config:      z.unknown().optional(),
})

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: { code: 'UNAUTHENTICATED', message: 'Not authenticated' } }, { status: 401 })

    const apps = await prisma.app.findMany({
      where:   { ownerId: session.userId },
      orderBy: { createdAt: 'desc' },
      select:  { id: true, name: true, description: true, version: true, isPublished: true, createdAt: true, updatedAt: true },
    })
    return Response.json({ data: apps })
  } catch (err) { return errorResponse(err) }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: { code: 'UNAUTHENTICATED', message: 'Not authenticated' } }, { status: 401 })

    const body = await request.json()
    const { name, description, config } = CreateAppSchema.parse(body)

    const configJson = AppConfigSchema.parse(config ?? { id: crypto.randomUUID(), name, description })

    const app = await prisma.app.create({
      data: {
        name, description,
        configJson: JSON.stringify(configJson),
        ownerId: session.userId,
      },
    })

    await prisma.appUser.create({ data: { appId: app.id, userId: session.userId, role: 'admin' } })
    return Response.json(app, { status: 201 })
  } catch (err) { return errorResponse(err) }
}
