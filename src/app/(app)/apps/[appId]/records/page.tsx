import { loadConfig } from '@/lib/config/loader'
import { prisma } from '@/lib/db/prisma'
import RecordsBrowser from '@/components/app/RecordsBrowser'

export default async function RecordsPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params
  const { config } = await loadConfig(appId)

  const resourceSummaries = await Promise.all(
    config.resources.map(async resource => {
      const count = await prisma.dynamicRecord.count({
        where: { appId, resourceName: resource.name, deletedAt: null },
      })
      const latest = await prisma.dynamicRecord.findFirst({
        where: { appId, resourceName: resource.name, deletedAt: null },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      })
      return {
        name: resource.name,
        label: resource.label ?? resource.name,
        count,
        fieldCount: resource.fields.length,
        fields: resource.fields.map(f => ({ name: f.name, type: f.type, label: f.label })),
        lastUpdated: latest?.updatedAt?.toISOString() ?? null,
      }
    })
  )

  return (
    <RecordsBrowser
      appId={appId}
      appName={config.name}
      resourceSummaries={resourceSummaries}
    />
  )
}
