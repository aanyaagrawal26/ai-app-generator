'use client'

import { useState, useTransition } from 'react'
import type { AppConfig } from '@/lib/config/schema'

interface Props { appId: string; initialConfig: AppConfig; configErrors: string[]; valid: boolean }

export default function ConfigEditor({ appId, initialConfig, configErrors, valid }: Props) {
  const [json, setJson]   = useState(JSON.stringify(initialConfig, null, 2))
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [warns, setWarns] = useState<string[]>(configErrors)
  const [isPending, startTransition] = useTransition()

  async function validate() {
    setError('')
    try { JSON.parse(json) } catch { setError('Invalid JSON syntax'); return }
    const res = await fetch('/api/config/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: json })
    const d = await res.json()
    if (d.valid) { setWarns([]); alert('✅ Config is valid') }
    else setWarns((d.errors ?? []).map((e: {path:string;message:string}) => `[${e.path}] ${e.message}`))
  }

  function save() {
    setError('')
    let parsed: unknown
    try { parsed = JSON.parse(json) } catch { setError('Invalid JSON syntax'); return }
    startTransition(async () => {
      const res = await fetch('/api/config', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-app-id': appId }, body: JSON.stringify(parsed) })
      const d = await res.json()
      if (!res.ok) { setError(d.error?.message ?? 'Save failed'); return }
      setSaved(true); setWarns([])
      setTimeout(() => setSaved(false), 3000)
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between animate-fade-up" style={{animationFillMode:'forwards'}}>
        <div>
          <h1 className="text-2xl font-black text-white">Config Editor</h1>
          <p className="text-slate-400 text-sm mt-1">{!valid && <span className="text-amber-400">⚠ Has warnings · </span>}Edit the JSON that drives this app</p>
        </div>
        <div className="flex gap-2">
          <button onClick={validate} className="px-4 py-2 text-sm font-medium text-slate-300 rounded-xl border border-white/10 hover:bg-white/5 transition-all">Validate</button>
          <button onClick={save} disabled={isPending}
            className="px-4 py-2 text-sm font-semibold text-white rounded-xl disabled:opacity-50 transition-all hover:opacity-90"
            style={{background:'linear-gradient(135deg,#6366f1,#ec4899)'}}>
            {isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {saved && <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl p-3 text-sm animate-scale-in">✅ Config saved</div>}
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-3 text-sm animate-scale-in">{error}</div>}
      {warns.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
          <p className="text-xs font-semibold text-amber-300 mb-1">Warnings</p>
          <ul className="text-xs font-mono text-amber-400 space-y-0.5">{warns.map((w,i)=><li key={i}>{w}</li>)}</ul>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 overflow-hidden animate-fade-up" style={{animationDelay:'0.1s',animationFillMode:'forwards',background:'rgba(255,255,255,0.02)'}}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5" style={{background:'rgba(0,0,0,0.3)'}}>
          <span className="text-xs font-mono text-slate-400">app.config.json</span>
          <button onClick={() => setJson(JSON.stringify(initialConfig, null, 2))} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Reset</button>
        </div>
        <textarea value={json} onChange={e => setJson(e.target.value)} spellCheck={false}
          className="w-full font-mono text-xs p-5 h-[62vh] resize-none focus:outline-none bg-transparent text-slate-300 leading-6" />
      </div>
    </div>
  )
}
