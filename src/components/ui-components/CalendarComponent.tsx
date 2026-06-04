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

interface CalRecord { id: string; [key: string]: unknown }

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function CalendarComponent({ appId, resource, title, config, appConfig }: Props) {
  const [records, setRecords] = useState<CalRecord[]>([])
  const [current, setCurrent] = useState(new Date())

  const dateField  = (config.dateField  as string | undefined) ?? 'createdAt'
  const labelField = (config.labelField as string | undefined) ?? 'title'
  const resourceDef = appConfig.resources.find(r => r.name === resource)

  const fetchData = useCallback(async () => {
    if (!resource) return
    const res = await fetch(`/api/r/${resource}?appId=${appId}&limit=200`)
    const json = await res.json()
    setRecords(json.data ?? [])
  }, [resource, appId])

  useEffect(() => { fetchData() }, [fetchData])

  const year  = current.getFullYear()
  const month = current.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Group records by date string (yyyy-mm-dd)
  const byDate: Record<string, CalRecord[]> = {}
  for (const r of records) {
    const raw = r[dateField]
    if (!raw) continue
    const d = new Date(String(raw))
    if (isNaN(d.getTime())) continue
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = String(d.getDate())
      ;(byDate[key] = byDate[key] ?? []).push(r)
    }
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">{title ?? resourceDef?.label ?? resource}</h3>
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrent(new Date(year, month - 1))} className="text-gray-400 hover:text-gray-700 p-1">‹</button>
          <span className="text-sm font-medium text-gray-700">{MONTHS[month]} {year}</span>
          <button onClick={() => setCurrent(new Date(year, month + 1))} className="text-gray-400 hover:text-gray-700 p-1">›</button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => (
            <div
              key={i}
              className={`min-h-[60px] rounded-lg p-1 text-xs ${
                day ? 'border border-gray-100 hover:bg-gray-50' : ''
              }`}
            >
              {day && (
                <>
                  <span className={`font-medium ${
                    byDate[String(day)]?.length ? 'text-indigo-600' : 'text-gray-500'
                  }`}>{day}</span>
                  <div className="mt-0.5 space-y-0.5">
                    {(byDate[String(day)] ?? []).slice(0, 2).map(r => (
                      <div key={r.id} className="bg-indigo-100 text-indigo-700 rounded px-1 truncate text-xs">
                        {String(r[labelField] ?? r.id).slice(0, 12)}
                      </div>
                    ))}
                    {(byDate[String(day)] ?? []).length > 2 && (
                      <div className="text-gray-400 text-xs">+{(byDate[String(day)] ?? []).length - 2} more</div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
