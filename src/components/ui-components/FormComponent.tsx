'use client'

import { useState } from 'react'
import type { AppConfig } from '@/lib/config/schema'

interface Props {
  id:        string
  appId:     string
  appConfig: AppConfig
  resource?: string
  title?:    string
  config:    Record<string, unknown>
}

export default function FormComponent({ appId, appConfig, resource, title, config }: Props) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const resourceDef = appConfig.resources.find(r => r.name === resource)
  if (!resource || !resourceDef) return (
    <div className="bg-white rounded-xl border p-6 text-sm text-gray-400">Form: no resource specified</div>
  )

  const fields = (config.fields as string[] | undefined)
    ? resourceDef.fields.filter(f => (config.fields as string[]).includes(f.name))
    : resourceDef.fields

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/r/${resource}?appId=${appId}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(values),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error?.message ?? 'Failed to save')
      }
      setSuccess(true)
      setValues({})
      setTimeout(() => setSuccess(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error saving record')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h3 className="font-semibold text-gray-900 mb-5">{title ?? `New ${resourceDef.label ?? resource}`}</h3>

      {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">Saved successfully!</div>}
      {error   && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(field => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label ?? field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.type === 'select' && field.options ? (
              <select
                value={values[field.name] ?? ''}
                onChange={e => setValues(v => ({ ...v, [field.name]: e.target.value }))}
                required={field.required}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              >
                <option value="">Select…</option>
                {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : field.type === 'boolean' ? (
              <input
                type="checkbox"
                checked={values[field.name] === 'true'}
                onChange={e => setValues(v => ({ ...v, [field.name]: String(e.target.checked) }))}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
            ) : field.type === 'richtext' ? (
              <textarea
                value={values[field.name] ?? ''}
                onChange={e => setValues(v => ({ ...v, [field.name]: e.target.value }))}
                required={field.required} rows={4}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
              />
            ) : (
              <input
                type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : 'text'}
                value={values[field.name] ?? ''}
                onChange={e => setValues(v => ({ ...v, [field.name]: e.target.value }))}
                required={field.required}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            )}
          </div>
        ))}

        <button
          type="submit" disabled={submitting}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium text-sm rounded-lg transition-colors"
        >
          {submitting ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  )
}
