import 'server-only'
import type { AppConfig, WorkflowStep } from '@/lib/config/schema'
import { prisma } from '@/lib/db/prisma'

export interface StepContext {
  record:  Record<string, unknown>
  trigger: unknown
  steps:   Record<string, unknown>
  appId:   string
  config:  AppConfig
}

export interface StepHandler {
  execute(config: Record<string, unknown>, ctx: StepContext): Promise<Record<string, unknown>>
}

function interpolate(template: string, ctx: StepContext): string {
  return template.replace(/\{\{([\w.]+)\}\}/g, (_, path: string) => {
    const parts = path.split('.')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let val: any = ctx
    for (const part of parts) { if (val == null) return ''; val = val[part] }
    return String(val ?? '')
  })
}

const conditionHandler: StepHandler = {
  async execute(config) {
    try {
      const expr = String(config.expression ?? 'false')
      if (/require|import|process|global|__/.test(expr)) return { result: false }
      // eslint-disable-next-line no-new-func
      const fn = new Function('record', 'steps', `return (${expr})`)
      return { result: Boolean(fn(config.record, config.steps)) }
    } catch { return { result: false } }
  },
}

const delayHandler: StepHandler = {
  async execute(config) {
    const ms = Math.min(Number(config.delayMs ?? 0), 30000)
    if (ms > 0) await new Promise(r => setTimeout(r, ms))
    return { delayed: true }
  },
}

const webhookHandler: StepHandler = {
  async execute(config, ctx) {
    const url    = interpolate(String(config.url ?? ''), ctx)
    const method = String(config.method ?? 'POST')
    const body   = config.body ? interpolate(JSON.stringify(config.body), ctx) : undefined
    const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body })
    return { status: res.status, ok: res.ok }
  },
}

const sendEmailHandler: StepHandler = {
  async execute(config, ctx) {
    const to      = interpolate(String(config.to ?? ''), ctx)
    const subject = interpolate(String(config.subject ?? ''), ctx)
    console.log(`[Email stub] To: ${to} | Subject: ${subject}`)
    return { sent: true, to, subject }
  },
}

const updateRecordHandler: StepHandler = {
  async execute(config, ctx) {
    const resource = String(config.resource ?? '')
    const id       = String(config.id ?? '')
    const data     = (config.data ?? {}) as Record<string, unknown>
    if (!resource || !id) return { updated: false }

    const existing = await prisma.dynamicRecord.findFirst({
      where: { id, resourceName: resource, appId: ctx.appId, deletedAt: null },
    })
    if (!existing) return { updated: false }

    const merged = { ...(JSON.parse(existing.data as string) as Record<string, unknown>), ...data }
    await prisma.dynamicRecord.update({
      where: { id },
      data:  { data: JSON.stringify(merged), updatedBy: 'workflow' },
    })
    return { updated: true }
  },
}

const createRecordHandler: StepHandler = {
  async execute(config, ctx) {
    const resource = String(config.resource ?? '')
    const data     = (config.data ?? {}) as Record<string, unknown>
    if (!resource) return { created: false }

    const record = await prisma.dynamicRecord.create({
      data: { appId: ctx.appId, resourceName: resource, data: JSON.stringify(data), createdBy: 'workflow' },
    })
    return { created: true, id: record.id }
  },
}

const stepHandlers: Record<string, StepHandler> = {
  condition:     conditionHandler,
  delay:         delayHandler,
  webhook:       webhookHandler,
  send_email:    sendEmailHandler,
  update_record: updateRecordHandler,
  create_record: createRecordHandler,
  script:        delayHandler,
}

export async function runWorkflow(
  appId:       string,
  workflowId:  string,
  config:      AppConfig,
  triggerData: Record<string, unknown>
): Promise<void> {
  const workflow = config.workflows.find(w => w.id === workflowId)
  if (!workflow || !workflow.enabled) return

  const run = await prisma.workflowRun.create({
    data: {
      appId,
      workflowId,
      status:      'RUNNING',
      triggerData: JSON.stringify(triggerData),
      startedAt:   new Date(),
    },
  })

  const ctx: StepContext = { record: triggerData, trigger: triggerData, steps: {}, appId, config }

  let currentStepId: string | null | undefined = workflow.steps[0]?.id

  while (currentStepId) {
    const stepDef: WorkflowStep | undefined = workflow.steps.find(s => s.id === currentStepId)
    if (!stepDef) break

    const stepRecord = await prisma.workflowStep.create({
      data: {
        runId:     run.id,
        stepId:    stepDef.id,
        stepType:  stepDef.type,
        status:    'RUNNING',
        startedAt: new Date(),
        input:     JSON.stringify(ctx.record),
      },
    })

    let nextStepId: string | null | undefined = stepDef.onSuccess
    let output: Record<string, unknown> = {}

    try {
      const handler = stepHandlers[stepDef.type]
      if (!handler) throw new Error(`Unknown step type: ${stepDef.type}`)

      output = await handler.execute(stepDef.config, ctx)
      ctx.steps[stepDef.id] = output

      if (stepDef.type === 'condition') {
        nextStepId = output.result ? stepDef.onSuccess : stepDef.onFailure
      }

      await prisma.workflowStep.update({
        where: { id: stepRecord.id },
        data:  { status: 'COMPLETED', output: JSON.stringify(output), completedAt: new Date() },
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      nextStepId = stepDef.onFailure

      await prisma.workflowStep.update({
        where: { id: stepRecord.id },
        data:  { status: 'FAILED', error: msg, completedAt: new Date() },
      })

      if (!nextStepId) {
        await prisma.workflowRun.update({
          where: { id: run.id },
          data:  { status: 'FAILED', error: msg, completedAt: new Date() },
        })
        return
      }
    }

    currentStepId = nextStepId
  }

  await prisma.workflowRun.update({
    where: { id: run.id },
    data:  { status: 'COMPLETED', completedAt: new Date() },
  })
}

export function triggerWorkflowsForEvent(
  appId:     string,
  config:    AppConfig,
  eventType: 'record.created' | 'record.updated' | 'record.deleted',
  resource:  string,
  record:    Record<string, unknown>
): void {
  const matching = config.workflows.filter(w => {
    if (!w.enabled) return false
    if (w.trigger.type !== eventType) return false
    if ('resource' in w.trigger && w.trigger.resource !== resource) return false
    return true
  })
  for (const wf of matching) {
    runWorkflow(appId, wf.id, config, { ...record, _event: eventType, _resource: resource })
      .catch(err => console.error(`[Workflow] ${wf.id} failed:`, err))
  }
}
