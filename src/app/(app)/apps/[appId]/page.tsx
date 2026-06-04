import { loadConfig } from '@/lib/config/loader'
import AppOverview from '@/components/app/AppOverview'

export default async function AppHomePage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params
  const { config, errors } = await loadConfig(appId)

  return <AppOverview appId={appId} config={config} configErrors={errors} />
}
