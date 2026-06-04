'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import exampleConfig from '@/../docs/example-app.config.json'

export default function NewAppPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [jsonConfig, setJsonConfig] = useState('')
  const [useExample, setUseExample] = useState(false)
  const [error, setError] = useState('')

  function handleUseExample() {
    setUseExample(true)
    setName(exampleConfig.name)
    setDescription(exampleConfig.description ?? '')
    setJsonConfig(JSON.stringify(exampleConfig, null, 2))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    let config: unknown = undefined
    if (jsonConfig.trim()) {
      try {
        config = JSON.parse(jsonConfig)
      } catch {
        setError('Invalid JSON — please fix the syntax and try again.')
        return
      }
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/apps', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ name, description, config }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error?.message ?? 'Failed to create app')
          return
        }
        router.push(`/apps/${data.id}`)
      } catch {
        setError('Network error — please try again.')
      }
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New App</h1>
        <p className="text-gray-500 text-sm mt-1">Define your app with a JSON config, or start from an example.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">App Name *</label>
            <input
              value={name} onChange={e => setName(e.target.value)} required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              placeholder="My CRM"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              value={description} onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              placeholder="Optional description"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">JSON Config</label>
              <button
                type="button" onClick={handleUseExample}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Load CRM example
              </button>
            </div>
            <textarea
              value={jsonConfig} onChange={e => setJsonConfig(e.target.value)} rows={16}
              className="w-full px-4 py-3 font-mono text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              placeholder={'{\n  "id": "...",\n  "name": "My App",\n  "resources": [],\n  "pages": []\n}'}
            />
            <p className="text-xs text-gray-400 mt-1">Leave empty to start with a blank app. Paste a full AppConfig JSON to import.</p>
          </div>

          <button
            type="submit" disabled={isPending || !name.trim()}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            {isPending ? 'Creating…' : 'Create App'}
          </button>
        </form>
      </div>
    </div>
  )
}
