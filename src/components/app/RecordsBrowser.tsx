'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface FieldInfo {
  name: string
  type: string
  label?: string
}

interface ResourceSummary {
  name: string
  label: string
  count: number
  fieldCount: number
  fields: FieldInfo[]
  lastUpdated: string | null
}

interface Props {
  appId: string
  appName: string
  resourceSummaries: ResourceSummary[]
}

interface RecordRow {
  id: string
  [key: string]: unknown
}

const FIELD_TYPE_BADGE: Record<string, { label: string; color: string }> = {
  text:        { label: 'text',     color: '#6366f1' },
  number:      { label: 'num',      color: '#06b6d4' },
  email:       { label: 'email',    color: '#8b5cf6' },
  boolean:     { label: 'bool',     color: '#f59e0b' },
  date:        { label: 'date',     color: '#10b981' },
  datetime:    { label: 'datetime', color: '#10b981' },
  select:      { label: 'select',   color: '#ec4899' },
  multiselect: { label: 'multi',    color: '#f43f5e' },
  relation:    { label: 'rel',      color: '#a78bfa' },
  url:         { label: 'url',      color: '#06b6d4' },
  richtext:    { label: 'rich',     color: '#6366f1' },
  json:        { label: 'json',     color: '#f59e0b' },
  file:        { label: 'file',     color: '#64748b' },
}

const COLORS = ['#6366f1','#ec4899','#8b5cf6','#06b6d4','#f59e0b','#10b981','#f43f5e','#a78bfa']

function ResourceCard({ resource, index, onOpen }: {
  resource: ResourceSummary
  index: number
  onOpen: (r: ResourceSummary) => void
}) {
  const color = COLORS[index % COLORS.length]
  const rel = resource.lastUpdated
    ? new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
        Math.round((new Date(resource.lastUpdated).getTime() - Date.now()) / 1000 / 60),
        'minutes'
      )
    : null

  return (
    <div
      className="rounded-2xl p-5 border border-white/7 card-hover group cursor-pointer opacity-0-init animate-fade-up relative overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        animationDelay: `${index * 0.07}s`,
        animationFillMode: 'forwards',
      }}
      onClick={() => onOpen(resource)}
    >
      {/* hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{background:`radial-gradient(circle at 50% 0%, ${color}12, transparent 70%)`}} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black text-white shrink-0"
            style={{background:`${color}25`, border:`1px solid ${color}35`}}
          >
            🗄️
          </div>
          <span
            className="text-xs font-black tabular-nums px-2.5 py-1 rounded-full"
            style={{background:`${color}18`, color, border:`1px solid ${color}25`}}
          >
            {resource.count}
          </span>
        </div>

        <h3 className="font-black text-white text-base mb-1 group-hover:text-gradient transition-all">
          {resource.label}
        </h3>
        <p className="text-slate-500 text-xs mb-4">
          {resource.fieldCount} field{resource.fieldCount !== 1 ? 's' : ''}
          {rel && ` · updated ${rel}`}
        </p>

        {/* Field type pills */}
        <div className="flex flex-wrap gap-1.5">
          {resource.fields.slice(0, 5).map(f => {
            const badge = FIELD_TYPE_BADGE[f.type] ?? { label: f.type, color: '#64748b' }
            return (
              <span
                key={f.name}
                className="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium"
                style={{background:`${badge.color}15`, color:badge.color, border:`1px solid ${badge.color}25`}}
              >
                {f.label ?? f.name}
              </span>
            )
          })}
          {resource.fields.length > 5 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-slate-600"
              style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)'}}>
              +{resource.fields.length - 5} more
            </span>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
          <span className="text-xs text-slate-500">Click to browse</span>
          <span className="text-indigo-400 text-xs opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
            Open →
          </span>
        </div>
      </div>
    </div>
  )
}

function RecordTable({ appId, resource, onClose }: {
  appId: string
  resource: ResourceSummary
  onClose: () => void
}) {
  const [records, setRecords] = useState<RecordRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const limit = 10

  const load = useCallback(async () => {
    setLoading(true)
    const url = `/api/r/${resource.name}?appId=${appId}&page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''}`
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      setRecords(data.data ?? [])
      setTotal(data.total ?? 0)
    }
    setLoading(false)
  }, [appId, resource.name, page, search])

  useEffect(() => { load() }, [load])

  const columns = resource.fields.slice(0, 6)
  const pages = Math.ceil(total / limit)
  const color = COLORS[0]

  return (
    <div className="rounded-2xl overflow-hidden animate-fade-up" style={{animationFillMode:'forwards', border:'1px solid rgba(255,255,255,0.08)'}}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5"
        style={{background:'rgba(255,255,255,0.03)'}}>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors text-sm flex items-center gap-1"
          >
            ← Back
          </button>
          <div className="w-px h-4 bg-white/10" />
          <h2 className="font-black text-white text-sm">{resource.label}</h2>
          <span className="text-xs px-2 py-0.5 rounded-full font-mono"
            style={{background:`${color}15`, color, border:`1px solid ${color}25`}}>
            {total} records
          </span>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search records…"
            className="pl-8 pr-4 py-2 text-xs text-white placeholder-slate-600 rounded-lg w-48"
            style={{background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)'}}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <span className="text-slate-500 text-sm">Loading…</span>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-600">
            <span className="text-5xl mb-3 opacity-50">📭</span>
            <p className="text-sm">{search ? 'No matching records' : 'No records yet'}</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold uppercase tracking-wider w-10">#</th>
                {columns.map(f => (
                  <th key={f.name} className="px-4 py-3 text-left text-slate-500 font-semibold uppercase tracking-wider">
                    {f.label ?? f.name}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-slate-500 font-semibold uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody>
              {records.map((row, i) => (
                <tr
                  key={row.id}
                  className="border-t border-white/4 hover:bg-white/3 transition-colors"
                  style={{animationDelay:`${i*0.03}s`}}
                >
                  <td className="px-4 py-3 text-slate-600 font-mono">{(page - 1) * limit + i + 1}</td>
                  {columns.map(f => (
                    <td key={f.name} className="px-4 py-3 text-slate-300 max-w-[200px] truncate">
                      {row[f.name] != null
                        ? typeof row[f.name] === 'boolean'
                          ? row[f.name] ? '✓' : '✗'
                          : String(row[f.name]).slice(0, 60)
                        : <span className="text-slate-700 italic">—</span>
                      }
                    </td>
                  ))}
                  <td className="px-4 py-3 text-slate-600 font-mono whitespace-nowrap">
                    {row.createdAt ? new Date(row.createdAt as string).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/5"
          style={{background:'rgba(255,255,255,0.02)'}}>
          <span className="text-xs text-slate-600">
            Page {page} of {pages} · {total} total
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
              style={{background:'rgba(255,255,255,0.05)'}}
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
              style={{background:'rgba(255,255,255,0.05)'}}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Main ────────────────────────────────────────────────────────── */
export default function RecordsBrowser({ appId, appName, resourceSummaries }: Props) {
  const [activeResource, setActiveResource] = useState<ResourceSummary | null>(null)

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between animate-fade-up" style={{animationFillMode:'forwards'}}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/apps/${appId}`} className="text-slate-500 hover:text-white text-sm transition-colors">
              ← {appName}
            </Link>
          </div>
          <h1 className="text-2xl font-black text-white">Records Browser</h1>
          <p className="text-slate-400 text-sm mt-1">
            Browse, search and paginate records across all your resources.
          </p>
        </div>
        <div className="text-3xl opacity-60">🗄️</div>
      </div>

      {resourceSummaries.length === 0 ? (
        <div className="text-center py-24 rounded-2xl border border-white/5"
          style={{background:'rgba(255,255,255,0.02)'}}>
          <div className="text-6xl mb-4 opacity-50">🗄️</div>
          <h2 className="text-lg font-bold text-white">No resources defined</h2>
          <p className="text-slate-400 text-sm mt-2 mb-8">Add resources to your app config to start storing data.</p>
          <Link href={`/apps/${appId}/config`}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white rounded-xl hover:opacity-90 transition-all"
            style={{background:'linear-gradient(135deg, #6366f1, #ec4899)'}}>
            Open Config →
          </Link>
        </div>
      ) : activeResource ? (
        <RecordTable appId={appId} resource={activeResource} onClose={() => setActiveResource(null)} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {resourceSummaries.map((r, i) => (
            <ResourceCard key={r.name} resource={r} index={i} onOpen={setActiveResource} />
          ))}
        </div>
      )}
    </div>
  )
}
