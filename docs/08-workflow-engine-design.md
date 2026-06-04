# 08 — Workflow Engine Design

## Overview

The workflow engine is an event-driven, step-based automation system. Workflows
are defined in the app config and executed asynchronously via BullMQ workers.

---

## 8.1 Concepts

| Concept          | Description                                                          |
|------------------|----------------------------------------------------------------------|
| **Workflow**     | A named automation with one trigger and an ordered set of steps      |
| **Trigger**      | The event that starts a workflow run                                 |
| **Step**         | A single action in the workflow (email, webhook, DB write, etc.)     |
| **WorkflowRun**  | A persisted execution instance of a workflow                         |
| **WorkflowStep** | A persisted execution record for each step in a run                  |

---

## 8.2 Trigger Types

| Type               | How it fires                                                 |
|--------------------|--------------------------------------------------------------|
| `record.created`   | After `prisma[resource].create()` succeeds                   |
| `record.updated`   | After `prisma[resource].update()` — optional field filter    |
| `record.deleted`   | After `prisma[resource].delete/softDelete`                   |
| `schedule`         | Cron expression, evaluated server-side (node-cron)           |
| `webhook`          | HTTP POST to `/api/r/[resource]/actions/[workflowId]`        |

---

## 8.3 Step Types

| Type            | What it does                                                         |
|-----------------|----------------------------------------------------------------------|
| `send_email`    | Sends an email via configured SMTP/SES/Resend                       |
| `webhook`       | HTTP request to an external URL                                      |
| `update_record` | Updates a DB record via Prisma                                       |
| `create_record` | Creates a new DB record                                              |
| `condition`     | Evaluates a boolean expression; routes to onSuccess or onFailure     |
| `delay`         | Pauses execution for N seconds (BullMQ delay)                        |
| `script`        | Runs a sandboxed JS expression (vm2)                                 |

---

## 8.4 Engine Architecture

```
Event fires (record.created, cron, webhook)
  │
  ├─ workflowQueue.add('run', { workflowId, triggerData, appId })
  │
  └─ Worker (workers/workflowWorker.ts)
        │
        ├─ 1. Load config → find workflow definition
        ├─ 2. Create WorkflowRun { status: RUNNING, triggerData }
        ├─ 3. Build execution context:
        │        { record, trigger, steps: {}, env: process.env }
        │
        ├─ 4. Start at first step (steps[0])
        │
        └─ Step Execution Loop:
              while (currentStepId !== null):
                ├─ Create WorkflowStep { status: RUNNING, input: context }
                ├─ Resolve step handler: stepHandlers[step.type]
                ├─ Execute: output = await handler(step.config, context)
                ├─ WorkflowStep { status: COMPLETED, output }
                ├─ Merge output into context
                └─ currentStepId = step.onSuccess  (or onFailure on throw)

              WorkflowRun { status: COMPLETED }
```

---

## 8.5 Step Handler Interface

```typescript
// lib/workflow/engine.ts

export interface StepContext {
  record:    Record<string, unknown>
  trigger:   unknown
  steps:     Record<string, unknown>   // outputs of previous steps
  appId:     string
  config:    AppConfig
}

export interface StepHandler {
  execute(config: Record<string, unknown>, ctx: StepContext): Promise<Record<string, unknown>>
}
```

---

## 8.6 Step Implementations (examples)

```typescript
// lib/workflow/steps/sendEmail.ts

import { Resend } from 'resend'
import { interpolate } from '@/lib/utils/interpolate'

export const sendEmailHandler: StepHandler = {
  async execute(config, ctx) {
    const client = new Resend(process.env.RESEND_API_KEY)
    const to      = interpolate(config.to as string, ctx)
    const subject = interpolate(config.subject as string, ctx)
    const html    = interpolate(config.html as string, ctx)

    const result = await client.emails.send({
      from:    config.from as string ?? 'noreply@app.io',
      to,
      subject,
      html,
    })

    return { messageId: result.id }
  }
}
```

```typescript
// lib/workflow/steps/condition.ts

export const conditionHandler: StepHandler = {
  async execute(config, ctx) {
    // config.expression is a safe JS expression string
    // e.g. "record.status === 'active' && record.score > 50"
    const fn = new Function('record', 'steps', 'trigger',
      `return (${config.expression})`)
    const result = fn(ctx.record, ctx.steps, ctx.trigger)
    // The engine reads this output to decide next step
    return { result: Boolean(result) }
  }
}
// Note: onSuccess taken if result=true, onFailure if result=false
```

---

## 8.7 Template Interpolation

Step config values support `{{mustache}}` syntax referencing the context:

```json
{
  "to":      "{{record.email}}",
  "subject": "Welcome to {{config.name}}, {{record.name}}!",
  "html":    "<p>Your order #{{record.id}} has been confirmed.</p>"
}
```

```typescript
// lib/utils/interpolate.ts
import Handlebars from 'handlebars'

const cache = new Map<string, HandlebarsTemplateDelegate>()

export function interpolate(template: string, ctx: object): string {
  if (!cache.has(template)) {
    cache.set(template, Handlebars.compile(template))
  }
  return cache.get(template)!(ctx)
}
```

---

## 8.8 BullMQ Queue Configuration

```typescript
// lib/workflow/queue.ts

import { Queue, Worker, QueueEvents } from 'bullmq'
import { redis } from '@/lib/db/redis'

export const workflowQueue = new Queue('workflow', {
  connection: redis,
  defaultJobOptions: {
    attempts:  3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 1000 },
    removeOnFail:     { count: 500  },
  },
})

// In workers/workflowWorker.ts (separate Node.js process)
export const workflowWorker = new Worker('workflow', processJob, {
  connection: redis,
  concurrency: 10,
})

async function processJob(job: Job) {
  const { workflowId, triggerData, appId } = job.data
  await runWorkflow(appId, workflowId, triggerData)
}
```

---

## 8.9 Workflow Config Example

```json
{
  "id": "wf-welcome-email",
  "name": "Send welcome email on user registration",
  "enabled": true,
  "trigger": {
    "type": "record.created",
    "resource": "users"
  },
  "steps": [
    {
      "id": "check-email-verified",
      "type": "condition",
      "config": { "expression": "record.emailVerified === true" },
      "onSuccess": "send-welcome",
      "onFailure": "send-verification"
    },
    {
      "id": "send-welcome",
      "type": "send_email",
      "config": {
        "to":      "{{record.email}}",
        "subject": "Welcome to {{config.name}}!",
        "html":    "<h1>Hi {{record.name}}, welcome aboard!</h1>"
      },
      "onSuccess": null
    },
    {
      "id": "send-verification",
      "type": "send_email",
      "config": {
        "to":      "{{record.email}}",
        "subject": "Please verify your email",
        "html":    "<p>Click <a href='{{record.verifyUrl}}'>here</a> to verify.</p>"
      },
      "onSuccess": null
    }
  ]
}
```
