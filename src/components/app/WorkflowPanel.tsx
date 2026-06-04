'use client'

import { useState, useTransition } from 'react'
import type { Workflow } from '@/lib/config/schema'

interface Props {
  appId:     string
  workflows: Workflow[]
}

export default function WorkflowPanel({ appId, workflows }: Props) {
  const [results, setResults] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  function triggerWorkflow(workflowId: string) {
    startTransition(async () => {
      try {
        const res = await fetch('/api/workflow/trigger', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', 'x-app-id': appId },
          body:    JSON.stringify({ workflowId }),
        })
        const data = await res.json()
        setResults(r => ({ ...r, [workflowId]: res.ok ? '✅ Triggered' : `❌ ${data.error?.message ?? 'Failed'}` }))
      } catch {
        setResults(r => ({ ...r, [workflowId]: '❌ Network error' }))
      }
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
        <p className="text-gray-500 text-sm mt-1">View and manually trigger automations defined in your app config.</p>
      </div>

      {workflows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="text-4xl mb-3">⚡</div>
          <h2 className="font-semibold text-gray-700">No workflows defined</h2>
          <p className="text-gray-400 text-sm mt-1">Add workflows to your app config to automate actions.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.map(wf => (
            <div key={wf.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{wf.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      wf.enabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {wf.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 font-mono">
                    Trigger: {wf.trigger.type}
                    {'resource' in wf.trigger ? ` → ${wf.trigger.resource}` : ''}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{wf.steps.length} step{wf.steps.length !== 1 ? 's' : ''}: {wf.steps.map(s => s.type).join(' → ')}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {results[wf.id] && (
                    <span className="text-xs">{results[wf.id]}</span>
                  )}
                  <button
                    onClick={() => triggerWorkflow(wf.id)}
                    disabled={isPending || !wf.enabled}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    Run manually
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
