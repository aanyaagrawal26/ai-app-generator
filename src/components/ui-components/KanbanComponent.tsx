'use client'

import { useEffect, useState, useCallback } from 'react'
import type { AppConfig } from '@/lib/config/schema'

interface Props {
  id:        string
  appId:     string
  appConfig: AppConfig
  resource?: string
  title?:    string
  config:    Record<string, unknown>
}

interface KanbanRecord { id: string; [key: string]: unknown }

export default function KanbanComponent({ appId, appConfig, resource, title, config }: Props) {
  const [records, setRecords] = useState<KanbanRecord[]>([])
  const [loading, setLoading] = useState(false)

  const resourceDef = appConfig.resources.find(r => r.name === resource)
  const groupBy  = (config.groupBy  as string | undefined) ?? 'status'
  const cardFields = (config.cardFields as string[] | undefined) ?? resourceDef?.fields.slice(0, 3).map(f => f.name) ?? []

  const fetchData = useCallback(async () => {
    if (!resource) return
    setLoading(true)
    try {
      const res = await fetch(`/api/r/${resource}?appId=${appId}&limit=100`)
      const json = await res.json()
      setRecords(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [resource, appId])

  useEffect(() => { fetchData() }, [fetchData])

  if (!resource || !resourceDef) return (
    <div className="bg-white rounded-xl border p-6 text-sm text-gray-400">Kanban: no resource specified</div>
  )

  // Derive columns from the groupBy field options or unique values
  const groupField = resourceDef.fields.find(f => f.name === groupBy)
  const columns: string[] = groupField?.options ?? [...new Set(records.map(r => String(r[groupBy] ?? 'Other')))]

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">{title ?? resourceDef.label ?? resource}</h3>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-4 p-4 min-w-max">
            {columns.map(col => {
              const colRecords = records.filter(r => String(r[groupBy] ?? '') === col)
              return (
                <div key={col} className="w-64 shrink-0">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{col}</span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{colRecords.length}</span>
                  </div>
                  <div className="space-y-2">
                    {colRecords.map(record => (
                      <div key={record.id} className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm hover:shadow-sm transition-shadow">
                        {cardFields.map(field => (
                          <div key={field} className="text-gray-700 truncate">
                            <span className="text-gray-400 text-xs">{field}: </span>
                            {String(record[field] ?? '—')}
                          </div>
                        ))}
                      </div>
                    ))}
                    {colRecords.length === 0 && (
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center text-xs text-gray-300">
                        No items
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
