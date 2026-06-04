import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth/session'
import { loadConfig } from '@/lib/config/loader'
import { runWorkflow } from '@/lib/workflow/engine'
import { errorResponse } from '@/lib/utils/apiError'

const TriggerSchema = z.object({
  workflowId:  z.string(),
  triggerData: z.record(z.unknown()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: { code: 'UNAUTHENTICATED', message: 'Not authenticated' } }, { status: 401 })

    const appId = request.headers.get('x-app-id') ?? request.nextUrl.searchParams.get('appId')
    if (!appId) return Response.json({ error: { code: 'BAD_REQUEST', message: 'appId required' } }, { status: 400 })

    const body = await request.json()
    const { workflowId, triggerData } = TriggerSchema.parse(body)

    const { config } = await loadConfig(appId)
    const wf = config.workflows.find(w => w.id === workflowId)
    if (!wf) return Response.json({ error: { code: 'NOT_FOUND', message: `Workflow not found: ${workflowId}` } }, { status: 404 })

    runWorkflow(appId, workflowId, config, triggerData ?? {})
      .catch(err => console.error('[Workflow] manual trigger failed:', err))

    return Response.json({ started: true, workflowId })
  } catch (err) {
    return errorResponse(err)
  }
}
