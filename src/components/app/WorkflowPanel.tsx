'use client'

import { useState, useTransition } from 'react'
import type { Workflow } from '@/lib/config/schema'

interface Props { appId: string; workflows: Workflow[] }

export default function WorkflowPanel({ appId, workflows }: Props) {
  const [results, setResults] = useState<Record<string,string>>({})
  const [isPending, startTransition] = useTransition()

  function trigger(workflowId: string) {
    startTransition(async () => {
      const res = await fetch('/api/workflow/trigger', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-app-id': appId },
        body: JSON.stringify({ workflowId }),
      })
      const d = await res.json()
      setResults(r => ({ ...r, [workflowId]: res.ok ? '✅ Triggered' : `❌ ${d.error?.message ?? 'Failed'}` }))
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="animate-fade-up" style={{animationFillMode:'forwards'}}>
        <h1 className="text-2xl font-black text-white">Workflows</h1>
        <p className="text-slate-400 text-sm mt-1">View and manually trigger automations</p>
      </div>

      {workflows.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-white/5" style={{background:'rgba(255,255,255,0.02)'}}>
          <div className="text-5xl mb-4">⚡</div>
          <h2 className="font-semibold text-white">No workflows defined</h2>
          <p className="text-slate-400 text-sm mt-1">Add workflows to your config to automate actions.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.map((wf,i) => (
            <div key={wf.id} className="rounded-2xl border border-white/5 p-5 opacity-0-init animate-fade-up"
              style={{background:'rgba(255,255,255,0.02)',animationDelay:`${i*0.07}s`,animationFillMode:'forwards'}}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-white">{wf.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${wf.enabled ? 'text-emerald-300 bg-emerald-500/15 border border-emerald-500/30' : 'text-slate-400 bg-white/5'}`}>
                      {wf.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    Trigger: {wf.trigger.type}{'resource' in wf.trigger ? ` → ${wf.trigger.resource}` : ''}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{wf.steps.length} step{wf.steps.length!==1?'s':''}: {wf.steps.map(s=>s.type).join(' → ')}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {results[wf.id] && <span className="text-xs">{results[wf.id]}</span>}
                  <button onClick={() => trigger(wf.id)} disabled={isPending || !wf.enabled}
                    className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg disabled:opacity-40 transition-all hover:opacity-90"
                    style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)'}}>
                    Run
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
