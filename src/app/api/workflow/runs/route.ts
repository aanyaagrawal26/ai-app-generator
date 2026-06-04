import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getSession } from '@/lib/auth/session'
import { errorResponse } from '@/lib/utils/apiError'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: { code: 'UNAUTHENTICATED', message: 'Not authenticated' } }, { status: 401 })

    const appId = request.headers.get('x-app-id') ?? request.nextUrl.searchParams.get('appId')
    if (!appId) return Response.json({ error: { code: 'BAD_REQUEST', message: 'appId required' } }, { status: 400 })

    const runs = await prisma.workflowRun.findMany({
      where:   { appId },
      orderBy: { createdAt: 'desc' },
      take:    50,
      include: { steps: true },
    })

    return Response.json({ data: runs })
  } catch (err) {
    return errorResponse(err)
  }
}
