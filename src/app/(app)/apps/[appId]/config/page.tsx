import { loadConfig } from '@/lib/config/loader'
import ConfigEditor from '@/components/app/ConfigEditor'

export default async function ConfigPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params
  const { config, errors, valid } = await loadConfig(appId)
  return <ConfigEditor appId={appId} initialConfig={config} configErrors={errors} valid={valid} />
}
