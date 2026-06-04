import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { getSession } from '@/lib/auth/session'
import { loadConfig } from '@/lib/config/loader'
import { errorResponse } from '@/lib/utils/apiError'

const CreateImportSchema = z.object({
  resourceName:   z.string(),
  fileName:       z.string(),
  csvData:        z.string().min(1),
  columnMappings: z.record(z.string()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: { code: 'UNAUTHENTICATED', message: 'Not authenticated' } }, { status: 401 })

    const appId = request.headers.get('x-app-id') ?? request.nextUrl.searchParams.get('appId')
    if (!appId) return Response.json({ error: { code: 'BAD_REQUEST', message: 'appId required' } }, { status: 400 })

    const jobs = await prisma.importJob.findMany({
      where:   { appId },
      orderBy: { createdAt: 'desc' },
      select:  { id: true, fileName: true, resourceName: true, status: true, totalRows: true, processedRows: true, failedRows: true, createdAt: true },
    })
    return Response.json({ data: jobs })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: { code: 'UNAUTHENTICATED', message: 'Not authenticated' } }, { status: 401 })

    const appId = request.headers.get('x-app-id') ?? request.nextUrl.searchParams.get('appId')
    if (!appId) return Response.json({ error: { code: 'BAD_REQUEST', message: 'appId required' } }, { status: 400 })

    const { config } = await loadConfig(appId)
    const body = await request.json()
    const { resourceName, fileName, csvData, columnMappings } = CreateImportSchema.parse(body)

    const resourceDef = config.resources.find(r => r.name === resourceName)
    if (!resourceDef) return Response.json({ error: { code: 'UNKNOWN_RESOURCE', message: `Unknown resource: ${resourceName}` } }, { status: 404 })

    const job = await prisma.importJob.create({
      data: {
        appId,
        resourceName,
        fileName,
        csvData,
        createdBy:      session.userId,
        columnMappings: columnMappings ?? null,
        status:         columnMappings ? 'PROCESSING' : 'MAPPING',
      },
    })

    return Response.json(job, { status: 201 })
  } catch (err) {
    return errorResponse(err)
  }
}
