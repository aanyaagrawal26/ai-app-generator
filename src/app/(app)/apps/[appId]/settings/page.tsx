import { loadConfig } from '@/lib/config/loader'
import { prisma } from '@/lib/db/prisma'
import SettingsPanel from '@/components/app/SettingsPanel'

export default async function SettingsPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params
  const { config } = await loadConfig(appId)

  const app = await prisma.app.findUnique({
    where: { id: appId },
    select: { id: true, name: true, description: true, isPublished: true, configJson: true },
  })

  if (!app) return <div className="text-slate-400">App not found</div>

  return (
    <SettingsPanel
      appId={appId}
      appName={app.name}
      appDescription={app.description ?? ''}
      isPublished={app.isPublished}
      config={config}
      configJson={app.configJson}
    />
  )
}
