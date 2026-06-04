import ExportPanel from '@/components/app/ExportPanel'

export default async function ExportPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params
  return <ExportPanel appId={appId} />
}
