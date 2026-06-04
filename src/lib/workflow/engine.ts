import 'server-only'
import type { AppConfig, WorkflowStep } from '@/lib/config/schema'
import { prisma } from '@/lib/db/prisma'

export interface StepContext {
  record:   Record<string, unknown>
  trigger:  unknown
  steps:    Record<string, unknown>
  appId:    string
  config:   AppConfig
}

export interface StepHandler {
  execute(config: Record<string, unknown>, ctx: StepContext): Promise<Record<string, unknown>>
}

// Simple Handlebars-like interpolation
function interpolate(template: string, ctx: StepContext): string {
  return template.replace(/\{\{([\w.]+)\}\}/g, (_, path) => {
    const parts = path.split('.')
    let val: unknown = ctx as unknown as Record<string, unknown>
    for (const part of parts) {
      if (val == null) return ''
      val = (val as Record<string, unknown>)[part]
    }
    return String(val ?? '')
  })
}

// Step: condition
const conditionHandler: StepHandler = {
  async execute(config) {
    try {
      // Safe evaluation: only allow simple comparisons via Function constructor
      // In production, replace with a proper expression evaluator
      const expr = String(config.expression ?? 'false')
      // Basic safety: no function calls, no require/import
      if (/require|import|process|global|__/.test(expr)) {
        return { result: false }
      }
      const fn = new Function('record', 'steps', `return (${expr})`)
      const result = fn((config as Record<string,unknown>).record, (config as Record<string,unknown>).steps)
      return { result: Boolean(result) }
    } catch {
      return { result: false }
    }
  }
}

// Step: delay
const delayHandler: StepHandler = {
  async execute(config) {
    const ms = Number(config.delayMs ?? 0)
    if (ms > 0 && ms <= 30000) {
      await new Promise(r => setTimeout(r, ms))
    }
    return { delayed: true }
  }
}

// Step: webhook
const webhookHandler: StepHandler = {
  async execute(config, ctx) {
    const url    = interpolate(String(config.url ?? ''), ctx)
    const method = String(config.method ?? 'POST')
    const body   = config.body
      ? interpolate(JSON.stringify(config.body), ctx)
      : undefined

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body,
    })

    return { status: res.status, ok: res.ok }
  }
}

// Step: send_email (stub — in production wire to Resend/SES)
const sendEmailHandler: StepHandler = {
  async execute(config, ctx) {
    const to      = interpolate(String(config.to ?? ''), ctx)
    const subject = interpolate(String(config.subject ?? ''), ctx)
    // In production: send via email provider
    console.log(`[Email stub] To: ${to} | Subject: ${subject}`)
    return { sent: true, to, subject }
  }
}

// Step: update_record
const updateRecordHandler: StepHandler = {
  async execute(config, ctx) {
    const { resource, id, data } = config as { resource: string; id: string; data: Record<string, unknown> }
    if (!resource || !id) return { updated: false }

    const record = await prisma.dynamicRecord.findFirst({
      where: { id, resourceName: resource, appId: ctx.appId, deletedAt: null },
    })
    if (!record) return { updated: false }

    await prisma.dynamicRecord.update({
      where: { id },
      data:  { data: { ...(record.data as object), ...data }, updatedBy: 'workflow' },
    })

    return { updated: true }
  }
}

// Step: create_record
const createRecordHandler: StepHandler = {
  async execute(config, ctx) {
    const { resource, data } = config as { resource: string; data: Record<string, unknown> }
    if (!resource) return { created: false }

    const record = await prisma.dynamicRecord.create({
      data: {
        appId:        ctx.appId,
        resourceName: resource,
        data:         data ?? {},
        createdBy:    'workflow',
      },
    })

    return { created: true, id: record.id }
  }
}

const stepHandlers: Record<string, StepHandler> = {
  condition:     conditionHandler,
  delay:         delayHandler,
  webhook:       webhookHandler,
  send_email:    sendEmailHandler,
  update_record: updateRecordHandler,
  create_record: createRecordHandler,
  script:        delayHandler, // stub
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
      triggerData,
      startedAt:   new Date(),
    },
  })

  const ctx: StepContext = {
    record:  triggerData,
    trigger: triggerData,
    steps:   {},
    appId,
    config,
  }

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
        input:     ctx.record as object,
      },
    })

    let nextStepId: string | null | undefined = stepDef.onSuccess
    let output: Record<string, unknown> = {}
    let stepError: string | undefined

    try {
      const handler = stepHandlers[stepDef.type]
      if (!handler) throw new Error(`Unknown step type: ${stepDef.type}`)

      output = await handler.execute(stepDef.config, ctx)
      ctx.steps[stepDef.id] = output

      // Condition step: use result to decide branch
      if (stepDef.type === 'condition') {
        nextStepId = output.result ? stepDef.onSuccess : stepDef.onFailure
      }

      await prisma.workflowStep.update({
        where: { id: stepRecord.id },
        data:  { status: 'COMPLETED', output: output as object, completedAt: new Date() },
      })
    } catch (err: unknown) {
      stepError = err instanceof Error ? err.message : String(err)
      nextStepId = stepDef.onFailure

      await prisma.workflowStep.update({
        where: { id: stepRecord.id },
        data:  { status: 'FAILED', error: stepError, completedAt: new Date() },
      })

      if (!nextStepId) {
        await prisma.workflowRun.update({
          where: { id: run.id },
          data:  { status: 'FAILED', error: stepError, completedAt: new Date() },
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

export async function triggerWorkflowsForEvent(
  appId:     string,
  config:    AppConfig,
  eventType: 'record.created' | 'record.updated' | 'record.deleted',
  resource:  string,
  record:    Record<string, unknown>
): Promise<void> {
  const matching = config.workflows.filter(w => {
    if (!w.enabled) return false
    if (w.trigger.type !== eventType) return false
    if ('resource' in w.trigger && w.trigger.resource !== resource) return false
    return true
  })

  // Fire-and-forget (don't await, so the API response isn't blocked)
  for (const wf of matching) {
    runWorkflow(appId, wf.id, config, { ...record, _event: eventType, _resource: resource })
      .catch(err => console.error(`[Workflow] ${wf.id} failed:`, err))
  }
}
