import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { getSession } from '@/lib/auth/session'
import { loadConfig } from '@/lib/config/loader'
import { exportToGitHub, generateProjectFiles } from '@/lib/export/generator'
import { errorResponse } from '@/lib/utils/apiError'

const ExportSchema = z.object({
  type:        z.enum(['github', 'zip']).default('zip'),
  githubToken: z.string().optional(),
  repoName:    z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: { code: 'UNAUTHENTICATED', message: 'Not authenticated' } }, { status: 401 })

    const appId = req.headers.get('x-app-id') ?? req.nextUrl.searchParams.get('appId')
    if (!appId) return Response.json({ error: { code: 'BAD_REQUEST', message: 'appId required' } }, { status: 400 })

    const body = await req.json()
    const { type, githubToken, repoName } = ExportSchema.parse(body)
    const { config } = await loadConfig(appId)

    if (type === 'zip') {
      const files = generateProjectFiles(config)
      const text = files.map(f => `${'='.repeat(60)}\n// ${f.path}\n${'='.repeat(60)}\n${f.content}`).join('\n\n')
      const encoder = new TextEncoder()
      const bytes = encoder.encode(text)
      return new Response(bytes, {
        headers: {
          'Content-Type':        'application/octet-stream',
          'Content-Disposition': `attachment; filename="${config.name.toLowerCase().replace(/\s+/g, '-')}-export.txt"`,
        },
      })
    }

    if (!githubToken || !repoName) {
      return Response.json({ error: { code: 'BAD_REQUEST', message: 'githubToken and repoName required' } }, { status: 400 })
    }

    const job = await prisma.exportJob.create({ data: { appId, requestedBy: session.userId, status: 'PENDING' } })

    exportToGitHub(job.id, appId, config, githubToken, repoName, session.email)
      .catch(err => console.error('[Export] GitHub export failed:', err))

    return Response.json({ jobId: job.id, status: 'GENERATING' }, { status: 202 })
  } catch (err) { return errorResponse(err) }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: { code: 'UNAUTHENTICATED', message: 'Not authenticated' } }, { status: 401 })

    const appId = req.headers.get('x-app-id') ?? req.nextUrl.searchParams.get('appId')
    if (!appId) return Response.json({ error: { code: 'BAD_REQUEST', message: 'appId required' } }, { status: 400 })

    const jobs = await prisma.exportJob.findMany({ where: { appId }, orderBy: { createdAt: 'desc' }, take: 20 })
    return Response.json({ data: jobs })
  } catch (err) { return errorResponse(err) }
}
