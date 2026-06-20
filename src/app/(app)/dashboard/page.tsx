import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { Package, Database, Rocket, Plus, ArrowRight, Sparkles } from 'lucide-react'
import DashboardAnalytics, { type AnalyticsData } from '@/components/app/DashboardAnalytics'

function relativeTime(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

async function buildAnalytics(appIds: string[], appNames: Map<string, string>): Promise<AnalyticsData> {
  if (appIds.length === 0) return { trend: emptyTrend(), status: [], topApps: [], activity: [] }

  const since = new Date(Date.now() - 14 * 86400 * 1000)
  const [recent, grouped, logs] = await Promise.all([
    prisma.dynamicRecord.findMany({ where: { appId: { in: appIds }, deletedAt: null, createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.dynamicRecord.groupBy({ by: ['appId'], where: { appId: { in: appIds }, deletedAt: null }, _count: { _all: true } }),
    prisma.auditLog.findMany({ where: { appId: { in: appIds } }, orderBy: { createdAt: 'desc' }, take: 6, select: { action: true, appId: true, createdAt: true } }),
  ])

  // 14-day record trend
  const buckets = new Map<string, number>()
  const trend = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400 * 1000)
    const key = d.toISOString().slice(0, 10)
    buckets.set(key, 0)
    return { key, label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), count: 0 }
  })
  for (const r of recent) {
    const key = r.createdAt.toISOString().slice(0, 10)
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }
  for (const t of trend) t.count = buckets.get(t.key) ?? 0

  const topApps = grouped
    .map(g => ({ name: appNames.get(g.appId) ?? 'App', records: g._count._all }))
    .sort((a, b) => b.records - a.records)
    .slice(0, 5)

  const activity = logs.map(l => ({
    action: l.action,
    app: appNames.get(l.appId) ?? 'App',
    when: relativeTime(l.createdAt),
  }))

  return { trend: trend.map(({ label, count }) => ({ label, count })), status: [], topApps, activity }
}

function emptyTrend() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400 * 1000)
    return { label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), count: 0 }
  })
}

function getGreeting(name?: string | null) {
  const hour = new Date().getHours()
  const timeGreet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const emoji = hour < 12 ? '☀️' : hour < 18 ? '👋' : '🌙'
  const displayName = name ? name.split(' ')[0] : 'there'
  return { text: `${timeGreet}, ${displayName}`, emoji }
}

export default async function DashboardPage() {
  const session = await getSession()
  const apps = session
    ? await prisma.app.findMany({
        where:   { ownerId: session.userId },
        orderBy: { updatedAt: 'desc' },
        select:  { id: true, name: true, description: true, isPublished: true, updatedAt: true, createdAt: true },
      })
    : []

  const greeting = getGreeting(session?.name)

  // Get total record count across all apps
  const totalRecords = session
    ? await prisma.dynamicRecord.count({
        where: { appId: { in: apps.map(a => a.id) }, deletedAt: null },
      })
    : 0

  const appNames = new Map(apps.map(a => [a.id, a.name]))
  const analytics = await buildAnalytics(apps.map(a => a.id), appNames)
  analytics.status = [
    { name: 'Published', value: apps.filter(a => a.isPublished).length },
    { name: 'Draft',     value: apps.filter(a => !a.isPublished).length },
  ].filter(s => s.value > 0)

  const gradients = [
    'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15))',
    'linear-gradient(135deg, rgba(236,72,153,0.25), rgba(99,102,241,0.15))',
    'linear-gradient(135deg, rgba(6,182,212,0.25), rgba(99,102,241,0.15))',
    'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(6,182,212,0.15))',
    'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(236,72,153,0.15))',
    'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(236,72,153,0.15))',
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-10">

      {/* Header */}
      <div className="animate-fade-up" style={{animationFillMode:'forwards'}}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black text-fg">
              {greeting.text} {greeting.emoji}
            </h1>
            <p className="text-fg-muted text-sm mt-1.5">
              {apps.length === 0
                ? 'Create your first app from a JSON config.'
                : `You have ${apps.length} app${apps.length !== 1 ? 's' : ''}.`}
            </p>
          </div>
          <Link
            href="/apps/new"
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90 hover:scale-105 shadow-lg shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}
          >
            <Plus size={16} /> New App
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 animate-fade-up delay-100" style={{animationFillMode:'forwards'}}>
        {[
          { label: 'Total apps',    value: apps.length,    Icon: Package,  color: '#6366f1' },
          { label: 'Total records', value: totalRecords,   Icon: Database, color: '#ec4899' },
          { label: 'Published',     value: apps.filter(a => a.isPublished).length, Icon: Rocket, color: '#10b981' },
        ].map(stat => (
          <div
            key={stat.label}
            className="rounded-2xl p-5 relative overflow-hidden surface-card"
          >
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20 pointer-events-none"
              style={{background:stat.color, transform:'translate(30%,-30%)'}} />
            <div className="flex items-center justify-between mb-3">
              <stat.Icon size={20} style={{ color: stat.color }} />
              <div className="w-2 h-2 rounded-full animate-pulse" style={{background:stat.color}} />
            </div>
            <p className="text-3xl font-black text-fg tabular-nums">{stat.value}</p>
            <p className="text-fg-faint text-xs mt-1 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Analytics */}
      {apps.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-fg-faint uppercase tracking-widest mb-4">Analytics</h2>
          <DashboardAnalytics data={analytics} />
        </div>
      )}

      {/* App cards */}
      {apps.length === 0 ? (
        <div
          className="text-center py-28 rounded-2xl surface-card animate-fade-up delay-200"
          style={{ animationFillMode: 'forwards' }}
        >
          {/* sparkle decoration */}
          <div className="relative inline-block mb-6">
            <div className="w-20 h-20 grid place-items-center rounded-2xl mx-auto" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,.2), rgba(236,72,153,.12))', border: '1px solid rgba(99,102,241,.25)' }}>
              <Sparkles size={36} className="text-indigo-400" />
            </div>
            <div className="absolute -top-2 -right-2 text-2xl animate-sparkle">✦</div>
            <div className="absolute -bottom-1 -left-2 text-xl animate-sparkle delay-300">✦</div>
          </div>
          <h2 className="text-2xl font-black text-fg">No apps yet</h2>
          <p className="text-fg-muted text-sm mt-2 mb-10 max-w-xs mx-auto">
            Create your first app from a JSON config and go live in seconds.
          </p>
          <Link
            href="/apps/new"
            className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-bold text-white rounded-xl hover:opacity-90 hover:scale-105 transition-all shadow-lg"
            style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}
          >
            <Plus size={16} /> Create your first app
          </Link>
        </div>
      ) : (
        <>
          <div>
            <h2 className="text-xs font-semibold text-fg-faint uppercase tracking-widest mb-4">Your apps</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {apps.map((app, i) => (
                <Link
                  key={app.id}
                  href={`/apps/${app.id}`}
                  className="block group rounded-2xl p-6 border border-edge transition-all hover:border-indigo-500/30 opacity-0-init animate-fade-up card-hover relative overflow-hidden"
                  style={{
                    background: gradients[i % gradients.length],
                    animationDelay: `${i * 0.08}s`,
                    animationFillMode: 'forwards',
                  }}
                >
                  {/* Glow on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{background:'radial-gradient(circle at 50% 0%, rgba(99,102,241,0.12), transparent 70%)'}} />

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-black text-white shadow-lg"
                        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.5), rgba(236,72,153,0.3))' }}
                      >
                        {app.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex items-center gap-2">
                        {app.isPublished && (
                          <span
                            className="text-xs px-2.5 py-1 rounded-full font-semibold text-emerald-300"
                            style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}
                          >
                            ● Live
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="font-black text-fg text-base mb-1 group-hover:text-gradient transition-all line-clamp-1">
                      {app.name}
                    </h3>
                    {app.description && (
                      <p className="text-fg-muted text-sm line-clamp-2 leading-relaxed">{app.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-5">
                      <p className="text-fg-faint text-xs">
                        Updated {new Date(app.updatedAt).toLocaleDateString()}
                      </p>
                      <span
                        className="text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 flex items-center gap-1"
                      >
                        Open <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}

              {/* Add new app card */}
              <Link
                href="/apps/new"
                className="group rounded-2xl p-6 border border-dashed border-edge-strong flex flex-col items-center justify-center gap-3 hover:border-indigo-500/40 transition-all min-h-[160px] animate-fade-up opacity-0-init"
                style={{
                  animationDelay: `${apps.length * 0.08}s`,
                  animationFillMode: 'forwards',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-fg-faint group-hover:text-fg transition-all duration-300 group-hover:scale-110 surface-card"
                >
                  <Plus size={18} />
                </div>
                <p className="text-fg-faint group-hover:text-fg text-sm font-medium transition-colors">New app</p>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
