'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const exampleConfig = require('@/../docs/example-app.config.json')

export default function NewAppPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name,       setName]       = useState('')
  const [desc,       setDesc]       = useState('')
  const [json,       setJson]       = useState('')
  const [error,      setError]      = useState('')

  function loadExample() {
    setName(exampleConfig.name)
    setDesc(exampleConfig.description ?? '')
    setJson(JSON.stringify(exampleConfig, null, 2))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('')
    let config: unknown
    if (json.trim()) {
      try { config = JSON.parse(json) } catch { setError('Invalid JSON syntax'); return }
    }
    startTransition(async () => {
      const res = await fetch('/api/apps', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: desc, config }),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error?.message ?? 'Failed'); return }
      router.push(`/apps/${d.id}`)
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="animate-fade-up" style={{animationFillMode:'forwards'}}>
        <h1 className="text-2xl font-black text-white">Create App</h1>
        <p className="text-slate-400 text-sm mt-1">Define your app with a JSON config or start blank.</p>
      </div>

      <div className="rounded-2xl border border-white/5 p-6 space-y-5 animate-fade-up" style={{animationDelay:'0.1s',animationFillMode:'forwards',background:'rgba(255,255,255,0.02)'}}>
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-3 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">App Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="My CRM"
              className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional description"
              className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-all" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">JSON Config</label>
              <button type="button" onClick={loadExample} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium">Load CRM example</button>
            </div>
            <textarea value={json} onChange={e => setJson(e.target.value)} rows={14} spellCheck={false}
              className="w-full bg-white/5 border border-white/10 text-slate-300 placeholder-slate-600 rounded-xl px-4 py-3 font-mono text-xs focus:outline-none focus:border-indigo-500 transition-all resize-none leading-6"
              placeholder={'{\n  "id": "...",\n  "name": "My App",\n  "resources": [],\n  "pages": []\n}'} />
            <p className="text-xs text-slate-600 mt-1">Leave empty to start blank.</p>
          </div>
          <button type="submit" disabled={isPending || !name.trim()}
            className="w-full py-3 text-sm font-bold text-white rounded-xl disabled:opacity-40 transition-all hover:opacity-90"
            style={{background:'linear-gradient(135deg,#6366f1,#ec4899)'}}>
            {isPending ? 'Creating…' : 'Create App →'}
          </button>
        </form>
      </div>
    </div>
  )
}
