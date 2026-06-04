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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Your apps</p>
        </div>
        <Link
          href="/apps/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <span>+</span> New App
        </Link>
      </div>

      {apps.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl bg-white">
          <div className="text-5xl mb-4">⚡</div>
          <h2 className="text-lg font-semibold text-gray-700">No apps yet</h2>
          <p className="text-gray-400 text-sm mt-1 mb-6">Create your first app from a JSON config</p>
          <Link
            href="/apps/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Create App
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {apps.map(app => (
            <Link
              key={app.id}
              href={`/apps/${app.id}`}
              className="block bg-white border border-gray-100 hover:border-indigo-200 hover:shadow-md rounded-xl p-5 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-2xl">📦</div>
                {app.isPublished && (
                  <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-medium">Live</span>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{app.name}</h3>
              {app.description && <p className="text-gray-400 text-sm mt-1 line-clamp-2">{app.description}</p>}
              <p className="text-gray-300 text-xs mt-3">
                Updated {new Date(app.updatedAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
