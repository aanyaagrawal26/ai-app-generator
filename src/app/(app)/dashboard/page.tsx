import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'

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
            <h1 className="text-3xl font-black text-white">
              {greeting.text} {greeting.emoji}
            </h1>
            <p className="text-slate-400 text-sm mt-1.5">
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
            <span>+</span> New App
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 animate-fade-up delay-100" style={{animationFillMode:'forwards'}}>
        {[
          { label: 'Total apps',    value: apps.length,    icon: '📦', color: '#6366f1' },
          { label: 'Total records', value: totalRecords,   icon: '🗄️', color: '#ec4899' },
          { label: 'Published',     value: apps.filter(a => a.isPublished).length, icon: '🚀', color: '#10b981' },
        ].map(stat => (
          <div
            key={stat.label}
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)'}}
          >
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20 pointer-events-none"
              style={{background:stat.color, transform:'translate(30%,-30%)'}} />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xl">{stat.icon}</span>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{background:stat.color}} />
            </div>
            <p className="text-3xl font-black text-white tabular-nums">{stat.value}</p>
            <p className="text-slate-500 text-xs mt-1 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* App cards */}
      {apps.length === 0 ? (
        <div
          className="text-center py-28 rounded-2xl border border-white/5 animate-fade-up delay-200"
          style={{ background: 'rgba(255,255,255,0.02)', animationFillMode: 'forwards' }}
        >
          {/* sparkle decoration */}
          <div className="relative inline-block mb-6">
            <div className="text-7xl">⚡</div>
            <div className="absolute -top-2 -right-2 text-2xl animate-sparkle">✦</div>
            <div className="absolute -bottom-1 -left-2 text-xl animate-sparkle delay-300">✦</div>
          </div>
          <h2 className="text-2xl font-black text-white">No apps yet</h2>
          <p className="text-slate-400 text-sm mt-2 mb-10 max-w-xs mx-auto">
            Create your first app from a JSON config and go live in seconds.
          </p>
          <Link
            href="/apps/new"
            className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-bold text-white rounded-xl hover:opacity-90 hover:scale-105 transition-all shadow-lg"
            style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}
          >
            + Create your first app
          </Link>
        </div>
      ) : (
        <>
          <div>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Your apps</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {apps.map((app, i) => (
                <Link
                  key={app.id}
                  href={`/apps/${app.id}`}
                  className="block group rounded-2xl p-6 border border-white/5 transition-all hover:border-indigo-500/30 opacity-0-init animate-fade-up card-hover relative overflow-hidden"
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

                    <h3 className="font-black text-white text-base mb-1 group-hover:text-gradient transition-all line-clamp-1">
                      {app.name}
                    </h3>
                    {app.description && (
                      <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed">{app.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-5">
                      <p className="text-slate-600 text-xs">
                        Updated {new Date(app.updatedAt).toLocaleDateString()}
                      </p>
                      <span
                        className="text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 flex items-center gap-1"
                      >
                        Open →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}

              {/* Add new app card */}
              <Link
                href="/apps/new"
                className="group rounded-2xl p-6 border border-dashed border-white/10 flex flex-col items-center justify-center gap-3 hover:border-indigo-500/40 transition-all min-h-[160px] animate-fade-up opacity-0-init"
                style={{
                  background: 'rgba(255,255,255,0.01)',
                  animationDelay: `${apps.length * 0.08}s`,
                  animationFillMode: 'forwards',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl text-slate-500 group-hover:text-white transition-all duration-300 group-hover:scale-110"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  +
                </div>
                <p className="text-slate-500 group-hover:text-white text-sm font-medium transition-colors">New app</p>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
