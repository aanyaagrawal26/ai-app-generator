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

interface Record { id: string; [key: string]: unknown }

export default function TableComponent({ appId, appConfig, resource, title, config }: Props) {
  const [rows, setRows]   = useState<Record[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage]   = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const resourceDef = appConfig.resources.find(r => r.name === resource)
  const columns = (config.columns as string[] | undefined) ?? resourceDef?.fields.map(f => f.name) ?? []
  const limit = 20

  const fetchData = useCallback(async () => {
    if (!resource) return
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ appId, page: String(page), limit: String(limit) })
      if (search) params.set('search', search)
      const res = await fetch(`/api/r/${resource}?${params}`)
      if (!res.ok) throw new Error('Failed to load data')
      const json = await res.json()
      setRows(json.data ?? [])
      setTotal(json.total ?? 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading data')
    } finally {
      setLoading(false)
    }
  }, [resource, appId, page, search])

  useEffect(() => { fetchData() }, [fetchData])

  const pages = Math.ceil(total / limit)

  if (!resource) return (
    <div className="bg-white rounded-xl border p-6 text-sm text-gray-400">Table: no resource specified</div>
  )

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">{title ?? resourceDef?.label ?? resource}</h3>
        <div className="flex items-center gap-3">
          {config.searchable && (
            <input
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search…"
              className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-48"
            />
          )}
          <span className="text-xs text-gray-400">{total} records</span>
        </div>
      </div>

      {error && <div className="px-5 py-3 text-sm text-red-600 bg-red-50">{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {columns.map(col => (
                <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {resourceDef?.fields.find(f => f.name === col)?.label ?? col}
                </th>
              ))}
              {config.actions && (
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={columns.length + 1} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={columns.length + 1} className="px-4 py-8 text-center text-gray-400">No records found</td></tr>
            ) : (
              rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  {columns.map(col => (
                    <td key={col} className="px-4 py-3 text-gray-700 max-w-xs truncate">
                      {formatCell(row[col])}
                    </td>
                  ))}
                  {config.actions && (
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm">
          <span className="text-gray-400">Page {page} of {pages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 text-xs"
            >← Prev</button>
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 text-xs"
            >Next →</button>
          </div>
        </div>
      )}
    </div>
  )

  async function handleDelete(id: string) {
    if (!confirm('Delete this record?')) return
    await fetch(`/api/r/${resource}/${id}?appId=${appId}`, { method: 'DELETE' })
    fetchData()
  }
}

function formatCell(val: unknown): string {
  if (val == null) return '—'
  if (typeof val === 'boolean') return val ? '✓' : '✗'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}
