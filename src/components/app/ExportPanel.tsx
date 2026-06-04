'use client'

import { useState, useTransition } from 'react'

interface Props { appId: string }

export default function ExportPanel({ appId }: Props) {
  const [type,         setType]         = useState<'zip' | 'github'>('zip')
  const [githubToken,  setGithubToken]  = useState('')
  const [repoName,     setRepoName]     = useState('')
  const [status,       setStatus]       = useState('')
  const [repoUrl,      setRepoUrl]      = useState('')
  const [error,        setError]        = useState('')
  const [isPending, startTransition] = useTransition()

  async function handleExport() {
    setError('')
    setStatus('')
    setRepoUrl('')

    startTransition(async () => {
      try {
        const body: Record<string, string> = { type }
        if (type === 'github') { body.githubToken = githubToken; body.repoName = repoName }

        const res = await fetch(`/api/export?appId=${appId}`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', 'x-app-id': appId },
          body:    JSON.stringify(body),
        })

        if (type === 'zip') {
          if (!res.ok) { setError('Export failed'); return }
          const blob = await res.blob()
          const url  = URL.createObjectURL(blob)
          const a    = document.createElement('a')
          a.href     = url
          a.download = 'app-export.txt'
          a.click()
          URL.revokeObjectURL(url)
          setStatus('✅ Download started')
          return
        }

        const data = await res.json()
        if (!res.ok) { setError(data.error?.message ?? 'Export failed'); return }

        setStatus('⏳ Pushing to GitHub…')
        pollExport(data.jobId)
      } catch {
        setError('Network error')
      }
    })
  }

  function pollExport(jobId: string) {
    const interval = setInterval(async () => {
      const res  = await fetch(`/api/export?appId=${appId}`)
      const data = await res.json()
      const job  = (data.data ?? []).find((j: { id: string }) => j.id === jobId)
      if (!job) return
      if (job.status === 'COMPLETED') {
        clearInterval(interval)
        setStatus('✅ Repository created!')
        setRepoUrl(job.repoUrl ?? '')
      } else if (job.status === 'FAILED') {
        clearInterval(interval)
        setError(`Export failed: ${job.error ?? 'unknown error'}`)
        setStatus('')
      }
    }, 2000)
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Export App</h1>
        <p className="text-gray-500 text-sm mt-1">Download your app as a Next.js project or push to GitHub.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {error  && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}
        {status && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">{status}</div>}
        {repoUrl && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm">
            <p className="text-indigo-700 font-medium">Repository:</p>
            <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline break-all">{repoUrl}</a>
          </div>
        )}

        {/* Type selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Export type</label>
          <div className="flex gap-3">
            {(['zip', 'github'] as const).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  type === t ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t === 'zip' ? '📦 Download Zip' : '🐙 Push to GitHub'}
              </button>
            ))}
          </div>
        </div>

        {type === 'github' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GitHub Personal Access Token</label>
              <input
                type="password"
                value={githubToken} onChange={e => setGithubToken(e.target.value)}
                placeholder="ghp_..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">Needs <code>repo</code> scope. Never stored on our servers.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Repository Name</label>
              <input
                value={repoName} onChange={e => setRepoName(e.target.value)}
                placeholder="my-generated-app"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>
          </>
        )}

        <button
          onClick={handleExport}
          disabled={isPending || (type === 'github' && (!githubToken || !repoName))}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm rounded-lg transition-colors"
        >
          {isPending ? 'Exporting…' : type === 'zip' ? 'Download' : 'Push to GitHub'}
        </button>
      </div>
    </div>
  )
}
