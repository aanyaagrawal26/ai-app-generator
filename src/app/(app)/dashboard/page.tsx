import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await getSession()
  const apps = session
    ? await prisma.app.findMany({
        where:   { ownerId: session.userId },
        orderBy: { updatedAt: 'desc' },
        select:  { id: true, name: true, description: true, isPublished: true, updatedAt: true },
      })
    : []

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-up" style={{animationFillMode:'forwards'}}>
        <div>
          <h1 className="text-2xl font-black text-white">Your Apps</h1>
          <p className="text-slate-400 text-sm mt-1">Manage and launch your metadata-driven apps</p>
        </div>
        <Link href="/apps/new"
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90 hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}>
          + New App
        </Link>
      </div>

      {apps.length === 0 ? (
        <div className="text-center py-24 rounded-2xl border border-white/5 animate-fade-up"
          style={{ background: 'rgba(255,255,255,0.02)', animationFillMode:'forwards', animationDelay:'0.1s' }}>
          <div className="text-6xl mb-4">⚡</div>
          <h2 className="text-lg font-semibold text-white">No apps yet</h2>
          <p className="text-slate-400 text-sm mt-1 mb-8">Create your first app from a JSON config</p>
          <Link href="/apps/new"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}>
            + Create App
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {apps.map((app, i) => (
            <Link key={app.id} href={`/apps/${app.id}`}
              className="block group rounded-2xl p-5 border border-white/5 transition-all hover:border-indigo-500/40 hover:scale-[1.02] opacity-0-init animate-fade-up card-hover"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', animationDelay:`${i*0.08}s`, animationFillMode:'forwards' }}>

              {/* top row */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(236,72,153,0.2))' }}>
                  📦
                </div>
                {app.isPublished && (
                  <span className="text-xs px-2 py-1 rounded-full font-medium text-emerald-300"
                    style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                    Live
                  </span>
                )}
              </div>

              <h3 className="font-bold text-white text-base group-hover:text-indigo-300 transition-colors">{app.name}</h3>
              {app.description && <p className="text-slate-400 text-sm mt-1 line-clamp-2">{app.description}</p>}
              <p className="text-slate-600 text-xs mt-4">
                Updated {new Date(app.updatedAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
