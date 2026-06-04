import { loadConfig } from '@/lib/config/loader'
import WorkflowPanel from '@/components/app/WorkflowPanel'

export default async function WorkflowsPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params
  const { config } = await loadConfig(appId)
  return <WorkflowPanel appId={appId} workflows={config.workflows} />
}
