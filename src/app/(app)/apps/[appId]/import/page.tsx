import { loadConfig } from '@/lib/config/loader'
import CSVImport from '@/components/app/CSVImport'

export default async function ImportPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params
  const { config } = await loadConfig(appId)
  return <CSVImport appId={appId} resources={config.resources} />
}
