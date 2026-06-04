'use client'

import { useState, useTransition } from 'react'
import type { AppConfig } from '@/lib/config/schema'

interface Props {
  appId:         string
  initialConfig: AppConfig
  configErrors:  string[]
  valid:         boolean
}

export default function ConfigEditor({ appId, initialConfig, configErrors, valid }: Props) {
  const [json, setJson]         = useState(JSON.stringify(initialConfig, null, 2))
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState('')
  const [warnings, setWarnings] = useState<string[]>(configErrors)
  const [isPending, startTransition] = useTransition()

  async function handleValidate() {
    setError('')
    try {
      JSON.parse(json) // quick syntax check
    } catch {
      setError('Invalid JSON syntax — fix before saving.')
      return
    }
    const res = await fetch('/api/config/validate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    json,
    })
    const data = await res.json()
    if (data.valid) {
      setWarnings([])
      setError('')
      alert('✅ Config is valid')
    } else {
      setWarnings(data.errors?.map((e: { path: string; message: string }) => `[${e.path}] ${e.message}`) ?? [])
    }
  }

  function handleSave() {
    setError('')
    let parsed: unknown
    try {
      parsed = JSON.parse(json)
    } catch {
      setError('Invalid JSON syntax — fix before saving.')
      return
    }

    startTransition(async () => {
      const res = await fetch('/api/config', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', 'x-app-id': appId },
        body:    JSON.stringify(parsed),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error?.message ?? 'Save failed')
        return
      }
      setSaved(true)
      setWarnings([])
      setTimeout(() => setSaved(false), 3000)
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Config Editor</h1>
          <p className="text-gray-500 text-sm mt-1">
            Edit the JSON config that drives this app.{' '}
            {!valid && <span className="text-amber-600">⚠️ Current config has warnings.</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleValidate}
            className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            Validate
          </button>
          <button
            onClick={handleSave} disabled={isPending}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {saved  && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">✅ Config saved successfully</div>}
      {error  && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm font-semibold text-amber-800 mb-1">Warnings</p>
          <ul className="text-xs text-amber-700 font-mono space-y-0.5">
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
          <span className="text-xs font-mono text-gray-500">app.config.json</span>
          <button
            onClick={() => setJson(JSON.stringify(initialConfig, null, 2))}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Reset
          </button>
        </div>
        <textarea
          value={json}
          onChange={e => setJson(e.target.value)}
          spellCheck={false}
          className="w-full font-mono text-xs p-4 h-[60vh] resize-none focus:outline-none"
        />
      </div>
    </div>
  )
}
