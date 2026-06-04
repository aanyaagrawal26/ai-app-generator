import { loadConfig } from '@/lib/config/loader'
import { prisma } from '@/lib/db/prisma'
import AnalyticsPanel from '@/components/app/AnalyticsPanel'

export default async function AnalyticsPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params
  const { config } = await loadConfig(appId)

  // Fetch record counts per resource
  const resourceNames = config.resources.map(r => r.name)
  const counts = await Promise.all(
    resourceNames.map(async name => ({
      name,
      label: config.resources.find(r => r.name === name)?.label ?? name,
      count: await prisma.dynamicRecord.count({ where: { appId, resourceName: name, deletedAt: null } }),
    }))
  )

  // Records created in the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentRecords = await prisma.dynamicRecord.findMany({
    where: { appId, deletedAt: null, createdAt: { gte: sevenDaysAgo } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, resourceName: true, createdAt: true },
  })

  const totalRecords = counts.reduce((s, c) => s + c.count, 0)
  const mostActive = counts.sort((a, b) => b.count - a.count)[0]

  return (
    <AnalyticsPanel
      appId={appId}
      appName={config.name}
      resourceCounts={counts}
      recentRecords={recentRecords.map(r => ({ id: r.id, resourceName: r.resourceName, createdAt: r.createdAt.toISOString() }))}
      totalRecords={totalRecords}
      recentCount={recentRecords.length}
      mostActiveResource={mostActive?.name ?? null}
    />
  )
}
