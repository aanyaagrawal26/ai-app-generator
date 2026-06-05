import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getSession } from '@/lib/auth/session'
import { loadConfig } from '@/lib/config/loader'
import { processCSV } from '@/lib/import/processor'
import { errorResponse } from '@/lib/utils/apiError'

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/import/[jobId]'>) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: { code: 'UNAUTHENTICATED', message: 'Not authenticated' } }, { status: 401 })

    const { jobId } = await ctx.params
    const job = await prisma.importJob.findUnique({ where: { id: jobId } })
    if (!job) return Response.json({ error: { code: 'NOT_FOUND', message: 'Job not found' } }, { status: 404 })

    return Response.json(job)
  } catch (err) {
    return errorResponse(err)
  }
}

export async function POST(request: NextRequest, ctx: RouteContext<'/api/import/[jobId]'>) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: { code: 'UNAUTHENTICATED', message: 'Not authenticated' } }, { status: 401 })

    const { jobId } = await ctx.params
    const job = await prisma.importJob.findUnique({ where: { id: jobId } })
    if (!job) return Response.json({ error: { code: 'NOT_FOUND', message: 'Job not found' } }, { status: 404 })

    const body = await request.json().catch(() => ({}))
    const rawMappings = body.columnMappings ?? job.columnMappings
    const columnMappings: Record<string, string> = (typeof rawMappings === 'string'
      ? JSON.parse(rawMappings)
      : rawMappings) ?? {}

    const { config } = await loadConfig(job.appId)
    const resourceDef = config.resources.find(r => r.name === job.resourceName)
    if (!resourceDef) return Response.json({ error: { code: 'UNKNOWN_RESOURCE', message: 'Resource not in config' } }, { status: 404 })

    // Run in the background so the response returns immediately
    processCSV(job.id, job.appId, job.resourceName, job.csvData, columnMappings, resourceDef.fields)
      .catch(err => console.error('[Import] processing failed:', err))

    return Response.json({ status: 'PROCESSING', jobId: job.id })
  } catch (err) {
    return errorResponse(err)
  }
}
