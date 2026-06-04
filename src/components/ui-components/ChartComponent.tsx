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

interface ChartRecord { [key: string]: unknown }

export default function ChartComponent({ appId, appConfig, resource, title, config }: Props) {
  const [records, setRecords] = useState<ChartRecord[]>([])
  const [loading, setLoading] = useState(false)

  const resourceDef = appConfig.resources.find(r => r.name === resource)
  const groupBy  = (config.groupBy  as string | undefined) ?? 'status'
  const chartType = (config.chartType as string | undefined) ?? 'bar'

  const fetchData = useCallback(async () => {
    if (!resource) return
    setLoading(true)
    try {
      const res = await fetch(`/api/r/${resource}?appId=${appId}&limit=500`)
      const json = await res.json()
      setRecords(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [resource, appId])

  useEffect(() => { fetchData() }, [fetchData])

  if (!resource) return (
    <div className="bg-white rounded-xl border p-6 text-sm text-gray-400">Chart: no resource specified</div>
  )

  // Aggregate by groupBy field
  const counts: Record<string, number> = {}
  for (const r of records) {
    const key = String(r[groupBy] ?? 'Unknown')
    counts[key] = (counts[key] ?? 0) + 1
  }
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const max = Math.max(...entries.map(([, v]) => v), 1)

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h3 className="font-semibold text-gray-900 mb-5">
        {title ?? `${resourceDef?.label ?? resource} by ${groupBy}`}
      </h3>

      {loading ? (
        <div className="text-center text-gray-400 text-sm py-8">Loading…</div>
      ) : entries.length === 0 ? (
        <div className="text-center text-gray-300 text-sm py-8">No data</div>
      ) : chartType === 'bar' ? (
        <div className="space-y-3">
          {entries.map(([label, count]) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-28 truncate shrink-0">{label}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-700 w-6 text-right">{count}</span>
            </div>
          ))}
        </div>
      ) : (
        /* Pie-style donut using inline SVG */
        <div className="flex items-center gap-6">
          <SimplePie data={entries} />
          <div className="space-y-2">
            {entries.map(([label, count], i) => (
              <div key={label} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-gray-600">{label}</span>
                <span className="font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6']

function SimplePie({ data }: { data: [string, number][] }) {
  const total = data.reduce((s, [, v]) => s + v, 0)
  let cumulative = 0
  const r = 60, cx = 70, cy = 70
  const segments = data.map(([label, value], i) => {
    const pct = value / total
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2
    cumulative += pct
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2
    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle)
    const y2 = cy + r * Math.sin(endAngle)
    const large = pct > 0.5 ? 1 : 0
    return { label, path: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`, color: COLORS[i % COLORS.length] }
  })
  return (
    <svg width="140" height="140" className="shrink-0">
      {segments.map(s => (
        <path key={s.label} d={s.path} fill={s.color} opacity="0.85" />
      ))}
    </svg>
  )
}
