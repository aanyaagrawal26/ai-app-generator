'use client'

import { useEffect, useState } from 'react'
import type { AppConfig } from '@/lib/config/schema'

interface Props {
  id:        string
  appId:     string
  appConfig: AppConfig
  resource?: string
  title?:    string
  config:    Record<string, unknown>
}

export default function DetailComponent({ appId, appConfig, resource, title, config }: Props) {
  const [record, setRecord] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)

  const recordId = config.recordId as string | undefined
  const resourceDef = appConfig.resources.find(r => r.name === resource)

  useEffect(() => {
    if (!resource || !recordId) return
    setLoading(true)
    fetch(`/api/r/${resource}/${recordId}?appId=${appId}`)
      .then(r => r.json())
      .then(setRecord)
      .catch(() => setRecord(null))
      .finally(() => setLoading(false))
  }, [resource, recordId, appId])

  if (!resource || !resourceDef) return (
    <div className="bg-white rounded-xl border p-6 text-sm text-gray-400">Detail: no resource specified</div>
  )

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h3 className="font-semibold text-gray-900 mb-5">{title ?? resourceDef.label ?? resource}</h3>
      {loading ? (
        <div className="text-gray-400 text-sm">Loading…</div>
      ) : !record ? (
        <div className="text-gray-400 text-sm">{recordId ? 'Record not found' : 'No recordId specified'}</div>
      ) : (
        <dl className="divide-y divide-gray-100">
          {resourceDef.fields.map(field => (
            <div key={field.name} className="py-3 flex gap-4">
              <dt className="text-sm font-medium text-gray-500 w-40 shrink-0">{field.label ?? field.name}</dt>
              <dd className="text-sm text-gray-900">{String(record[field.name] ?? '—')}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
