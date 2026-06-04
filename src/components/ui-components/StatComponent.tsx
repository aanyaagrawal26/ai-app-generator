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

export default function StatComponent({ appId, appConfig, resource, config }: Props) {
  const [value, setValue]   = useState<string | number>('—')
  const [loading, setLoading] = useState(false)

  const label = (config.label as string | undefined) ?? resource ?? 'Stat'
  const agg   = (config.aggregation as string | undefined) ?? 'count'
  const resourceDef = appConfig.resources.find(r => r.name === resource)

  useEffect(() => {
    if (!resource) return
    setLoading(true)
    fetch(`/api/r/${resource}?appId=${appId}&limit=1`)
      .then(r => r.json())
      .then(d => {
        if (agg === 'count') setValue(d.total ?? 0)
      })
      .catch(() => setValue('—'))
      .finally(() => setLoading(false))
  }, [resource, appId, agg])

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">
        {loading ? <span className="text-gray-300">…</span> : value}
      </p>
      {resourceDef && (
        <p className="text-xs text-gray-400 mt-1">{resourceDef.label ?? resource}</p>
      )}
    </div>
  )
}
