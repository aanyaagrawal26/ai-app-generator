'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'
import {
  Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { Activity, TrendingUp, PieChart as PieIcon, BarChart3, Clock } from 'lucide-react'

export interface AnalyticsData {
  trend: { label: string; count: number }[]
  status: { name: string; value: number }[]
  topApps: { name: string; records: number }[]
  activity: { action: string; app: string; when: string }[]
}

const PALETTE = ['#6366f1', '#ec4899', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b']

export default function DashboardAnalytics({ data }: { data: AnalyticsData }) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // theme-aware chart chrome (avoid hydration mismatch by waiting for mount)
  const isDark = !mounted || resolvedTheme === 'dark'
  const grid = isDark ? 'rgba(255,255,255,.08)' : 'rgba(15,23,42,.10)'
  const axis = isDark ? '#64748b' : '#94a3b8'
  const tooltipStyle = {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-strong)',
    borderRadius: 12,
    fontSize: 12,
    color: 'var(--fg)',
    boxShadow: '0 12px 40px rgba(0,0,0,.4)',
  }

  const hasTrend = data.trend.some(d => d.count > 0)
  const totalApps = data.status.reduce((s, d) => s + d.value, 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Records trend — spans 2 cols */}
      <Panel className="lg:col-span-2" title="Records created" sub="Last 14 days" icon={TrendingUp} delay={0}>
        {hasTrend ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="recTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fill: axis, fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
              <YAxis tick={{ fill: axis, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: grid }} />
              <Area type="monotone" dataKey="count" name="Records" stroke="#818cf8" strokeWidth={2} fill="url(#recTrend)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : <EmptyChart label="No records created yet" />}
      </Panel>

      {/* App status donut */}
      <Panel title="App status" sub={`${totalApps} total`} icon={PieIcon} delay={0.06}>
        {totalApps > 0 ? (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={160}>
              <PieChart>
                <Pie data={data.status} dataKey="value" nameKey="name" innerRadius={42} outerRadius={62} paddingAngle={3} stroke="none">
                  {data.status.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {data.status.map((s, i) => (
                <div key={s.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: PALETTE[i % PALETTE.length] }} />
                  <span className="text-fg-muted">{s.name}</span>
                  <span className="text-fg font-semibold tabular-nums ml-auto">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : <EmptyChart label="No apps yet" />}
      </Panel>

      {/* Top apps by records */}
      <Panel className="lg:col-span-2" title="Top apps by records" sub="Most active" icon={BarChart3} delay={0.12}>
        {data.topApps.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(160, data.topApps.length * 42)}>
            <BarChart data={data.topApps} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: axis, fontSize: 11 }} axisLine={false} tickLine={false} width={96} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: grid }} />
              <Bar dataKey="records" radius={[0, 6, 6, 0]} barSize={18}>
                {data.topApps.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyChart label="No record activity yet" />}
      </Panel>

      {/* Activity timeline */}
      <Panel title="Recent activity" sub="Latest events" icon={Activity} delay={0.18}>
        {data.activity.length > 0 ? (
          <ul className="space-y-3">
            {data.activity.map((a, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1 w-2 h-2 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
                <div className="min-w-0">
                  <p className="text-sm text-fg truncate"><span className="font-medium">{a.action}</span> <span className="text-fg-muted">in {a.app}</span></p>
                  <p className="text-[11px] text-fg-faint flex items-center gap-1"><Clock size={10} /> {a.when}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : <EmptyChart label="No activity recorded" />}
      </Panel>
    </div>
  )
}

function Panel({ title, sub, icon: Icon, delay, className = '', children }: {
  title: string; sub: string; icon: typeof Activity; delay: number; className?: string; children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}
      className={`rounded-2xl surface-card p-5 ${className}`}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <span className="w-8 h-8 rounded-lg grid place-items-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <Icon size={15} className="text-indigo-400" />
        </span>
        <div>
          <h3 className="text-sm font-bold text-fg leading-none">{title}</h3>
          <p className="text-[11px] text-fg-faint mt-1">{sub}</p>
        </div>
      </div>
      {children}
    </motion.div>
  )
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-[160px] grid place-items-center text-center">
      <div>
        <div className="w-10 h-10 rounded-xl mx-auto mb-2 grid place-items-center" style={{ background: 'var(--surface)', border: '1px dashed var(--border-strong)' }}>
          <BarChart3 size={16} className="text-fg-faint" />
        </div>
        <p className="text-xs text-fg-faint">{label}</p>
      </div>
    </div>
  )
}
