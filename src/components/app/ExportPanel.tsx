'use client'

import { useState, useTransition } from 'react'

export default function ExportPanel({ appId }: { appId: string }) {
  const [type,        setType]        = useState<'zip'|'github'>('zip')
  const [token,       setToken]       = useState('')
  const [repoName,    setRepoName]    = useState('')
  const [status,      setStatus]      = useState('')
  const [repoUrl,     setRepoUrl]     = useState('')
  const [error,       setError]       = useState('')
  const [isPending, startTransition] = useTransition()

  function run() {
    setError(''); setStatus(''); setRepoUrl('')
    startTransition(async () => {
      const body: Record<string,string> = { type }
      if (type === 'github') { body.githubToken = token; body.repoName = repoName }
      const res = await fetch(`/api/export?appId=${appId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-app-id': appId }, body: JSON.stringify(body),
      })
      if (type === 'zip') {
        if (!res.ok) { setError('Export failed'); return }
        const blob = await res.blob()
        const url  = URL.createObjectURL(blob)
        const a    = Object.assign(document.createElement('a'), { href: url, download: 'app-export.txt' })
        a.click(); URL.revokeObjectURL(url)
        setStatus('✅ Download started')
        return
      }
      const d = await res.json()
      if (!res.ok) { setError(d.error?.message ?? 'Failed'); return }
      setStatus('⏳ Pushing to GitHub…')
      const poll = setInterval(async () => {
        const r2 = await fetch(`/api/export?appId=${appId}`)
        const d2 = await r2.json()
        const job = (d2.data ?? []).find((j: {id:string}) => j.id === d.jobId)
        if (!job) return
        if (job.status === 'COMPLETED') { clearInterval(poll); setStatus('✅ Done!'); setRepoUrl(job.repoUrl ?? '') }
        if (job.status === 'FAILED')    { clearInterval(poll); setError(`Failed: ${job.error}`); setStatus('') }
      }, 2000)
    })
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="animate-fade-up" style={{animationFillMode:'forwards'}}>
        <h1 className="text-2xl font-black text-white">Export App</h1>
        <p className="text-slate-400 text-sm mt-1">Download or push to GitHub</p>
      </div>

      <div className="rounded-2xl border border-white/5 p-6 space-y-5 animate-fade-up" style={{animationDelay:'0.1s',animationFillMode:'forwards',background:'rgba(255,255,255,0.02)'}}>
        {error  && <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-3 text-sm">{error}</div>}
        {status && <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl p-3 text-sm">{status}</div>}
        {repoUrl && <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="block bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-xl p-3 text-sm underline break-all">{repoUrl}</a>}

        <div className="flex gap-3">
          {(['zip','github'] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${type===t ? 'text-white border-indigo-500/50' : 'text-slate-400 border-white/10 hover:bg-white/5'}`}
              style={type===t ? {background:'linear-gradient(135deg,rgba(99,102,241,0.3),rgba(139,92,246,0.2))'} : {}}>
              {t === 'zip' ? '📦 Zip Download' : '🐙 GitHub'}
            </button>
          ))}
        </div>

        {type === 'github' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">GitHub Token</label>
              <input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="ghp_..."
                className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-indigo-500 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Repository Name</label>
              <input value={repoName} onChange={e => setRepoName(e.target.value)} placeholder="my-app"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-all" />
            </div>
          </>
        )}

        <button onClick={run} disabled={isPending || (type==='github' && (!token||!repoName))}
          className="w-full py-3 text-sm font-bold text-white rounded-xl disabled:opacity-40 transition-all hover:opacity-90"
          style={{background:'linear-gradient(135deg,#6366f1,#ec4899)'}}>
          {isPending ? 'Exporting…' : type==='zip' ? 'Download' : 'Push to GitHub'}
        </button>
      </div>
    </div>
  )
}
