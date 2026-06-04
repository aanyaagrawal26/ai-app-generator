'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

interface ResourceCount {
  name: string
  label: string
  count: number
}

interface RecentRecord {
  id: string
  resourceName: string
  createdAt: string
}

interface Props {
  appId: string
  appName: string
  resourceCounts: ResourceCount[]
  recentRecords: RecentRecord[]
  totalRecords: number
  recentCount: number
  mostActiveResource: string | null
}

/* ── Animated bar ────────────────────────────────────────────────── */
function AnimatedBar({ count, max, color, label }: { count: number; max: number; color: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [animated, setAnimated] = useState(false)
  const pct = max > 0 ? Math.max((count / max) * 100, count > 0 ? 4 : 0) : 0

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setAnimated(true); obs.disconnect() }
    }, { threshold: 0.2 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className="group">
      <div className="flex items-end justify-between mb-1.5">
        <span className="text-xs font-medium text-slate-400 truncate max-w-[60%]">{label}</span>
        <span className="text-xs font-black text-white tabular-nums">{count}</span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.05)'}}>
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: animated ? `${pct}%` : '0%',
            background: `linear-gradient(90deg, ${color}, ${color}bb)`,
            boxShadow: `0 0 8px ${color}60`,
          }}
        />
      </div>
    </div>
  )
}

/* ── SVG bar chart ───────────────────────────────────────────────── */
function BarChart({ data }: { data: ResourceCount[] }) {
  const ref = useRef<SVGSVGElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.2 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  if (data.length === 0) return (
    <div className="flex items-center justify-center h-40 text-slate-600 text-sm">No resources defined</div>
  )

  const max = Math.max(...data.map(d => d.count), 1)
  const chartH = 140
  const barW = Math.min(48, Math.floor(400 / data.length) - 10)
  const gap  = Math.min(16, Math.floor(300 / data.length))
  const totalW = data.length * (barW + gap) - gap
  const colors = ['#6366f1','#ec4899','#8b5cf6','#06b6d4','#f59e0b','#10b981','#f43f5e','#a78bfa']

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${totalW + 20} ${chartH + 40}`}
      className="w-full overflow-visible"
      style={{maxHeight: '200px'}}
    >
      {data.map((d, i) => {
        const barH = Math.max((d.count / max) * chartH, d.count > 0 ? 6 : 0)
        const x = i * (barW + gap) + 10
        const y = chartH - barH
        const color = colors[i % colors.length]
        return (
          <g key={d.name}>
            {/* bar background */}
            <rect x={x} y={0} width={barW} height={chartH} rx={4} fill="rgba(255,255,255,0.03)" />
            {/* actual bar */}
            <rect
              x={x} y={visible ? y : chartH}
              width={barW}
              height={visible ? barH : 0}
              rx={4}
              fill={color}
              fillOpacity={0.85}
              style={{transition:`y 0.9s cubic-bezier(0.22,1,0.36,1) ${i * 0.08}s, height 0.9s cubic-bezier(0.22,1,0.36,1) ${i * 0.08}s`}}
            />
            {/* glow */}
            <rect
              x={x} y={visible ? y : chartH}
              width={barW} height={visible ? barH : 0}
              rx={4}
              fill={color}
              fillOpacity={0.3}
              filter="blur(4px)"
              style={{transition:`y 0.9s cubic-bezier(0.22,1,0.36,1) ${i * 0.08}s, height 0.9s cubic-bezier(0.22,1,0.36,1) ${i * 0.08}s`}}
            />
            {/* count label */}
            <text
              x={x + barW / 2} y={visible ? y - 5 : chartH - 5}
              textAnchor="middle" fontSize={10} fill="white" fontWeight="700"
              style={{transition:`y 0.9s cubic-bezier(0.22,1,0.36,1) ${i * 0.08}s`, fontFamily:'monospace'}}
            >
              {d.count}
            </text>
            {/* resource label */}
            <text
              x={x + barW / 2} y={chartH + 16}
              textAnchor="middle" fontSize={9} fill="#64748b"
            >
              {(d.label || d.name).slice(0, 8)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* ── Timeline entry ──────────────────────────────────────────────── */
function TimelineItem({ record, index }: { record: RecentRecord; index: number }) {
  const date = new Date(record.createdAt)
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  const colors = ['#6366f1','#ec4899','#8b5cf6','#06b6d4','#f59e0b','#10b981']
  const color = colors[index % colors.length]

  return (
    <div className="flex items-start gap-3 group opacity-0-init animate-fade-up"
      style={{animationDelay:`${index * 0.04}s`, animationFillMode:'forwards'}}>
      <div className="relative flex flex-col items-center">
        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{background:color}} />
        {index < 9 && <div className="w-px flex-1 mt-1" style={{background:'rgba(255,255,255,0.06)', minHeight:'20px'}} />}
      </div>
      <div className="pb-4 min-w-0">
        <p className="text-xs font-semibold text-slate-300 truncate">
          Record in{' '}
          <span style={{color}}>{record.resourceName}</span>
        </p>
        <p className="text-[10px] text-slate-600 mt-0.5">{dateStr} · {timeStr}</p>
      </div>
    </div>
  )
}

/* ── Main ────────────────────────────────────────────────────────── */
export default function AnalyticsPanel({
  appId, appName, resourceCounts, recentRecords,
  totalRecords, recentCount, mostActiveResource,
}: Props) {
  const max = Math.max(...resourceCounts.map(r => r.count), 1)
  const colors = ['#6366f1','#ec4899','#8b5cf6','#06b6d4','#f59e0b','#10b981','#f43f5e','#a78bfa']

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between animate-fade-up" style={{animationFillMode:'forwards'}}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/apps/${appId}`} className="text-slate-500 hover:text-white text-sm transition-colors">← {appName}</Link>
          </div>
          <h1 className="text-2xl font-black text-white">Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">Record counts, recent activity, and insights.</p>
        </div>
        <div className="text-3xl opacity-60">📊</div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 animate-fade-up delay-100" style={{animationFillMode:'forwards'}}>
        {[
          { label: 'Total records',        value: totalRecords,             icon: '🗄️',  color: '#6366f1', sub: 'across all resources' },
          { label: 'Records this week',     value: recentCount,             icon: '📈',  color: '#10b981', sub: 'last 7 days' },
          { label: 'Most active resource',  value: mostActiveResource ?? '—', icon: '🏆', color: '#f59e0b', sub: 'by record count', isText: true },
        ].map(card => (
          <div key={card.label} className="rounded-2xl p-5 relative overflow-hidden"
            style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)'}}>
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20 pointer-events-none"
              style={{background:card.color, transform:'translate(30%,-30%)'}} />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xl">{card.icon}</span>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{background:card.color}} />
            </div>
            <p className={`font-black text-white tabular-nums ${card.isText ? 'text-lg' : 'text-3xl'}`}>
              {card.value}
            </p>
            <p className="text-slate-500 text-xs mt-1">{card.label}</p>
            <p className="text-slate-700 text-[10px] mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Bar chart */}
        <div
          className="rounded-2xl p-6 animate-fade-up delay-200"
          style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', animationFillMode:'forwards'}}
        >
          <h2 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
            <span>📊</span> Records per resource
          </h2>
          {resourceCounts.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-slate-600 text-sm">No resources defined</div>
          ) : (
            <BarChart data={resourceCounts} />
          )}
        </div>

        {/* Horizontal bar breakdown */}
        <div
          className="rounded-2xl p-6 animate-fade-up delay-300"
          style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', animationFillMode:'forwards'}}
        >
          <h2 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
            <span>📉</span> Distribution
          </h2>
          {resourceCounts.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-slate-600 text-sm">No resources defined</div>
          ) : (
            <div className="space-y-4">
              {resourceCounts.map((rc, i) => (
                <AnimatedBar
                  key={rc.name}
                  count={rc.count}
                  max={max}
                  color={colors[i % colors.length]}
                  label={rc.label || rc.name}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent activity timeline */}
      <div
        className="rounded-2xl p-6 animate-fade-up delay-400"
        style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', animationFillMode:'forwards'}}
      >
        <h2 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
          <span>🕐</span> Recent activity
          <span className="ml-auto text-xs text-slate-500 font-normal">Last 7 days</span>
        </h2>
        {recentRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-600">
            <span className="text-4xl mb-3 opacity-50">📭</span>
            <p className="text-sm">No records created in the last 7 days</p>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto pr-1">
            {recentRecords.slice(0, 20).map((r, i) => (
              <TimelineItem key={r.id} record={r} index={i} />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
