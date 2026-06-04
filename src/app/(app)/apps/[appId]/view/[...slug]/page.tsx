import { notFound } from 'next/navigation'
import { loadConfig } from '@/lib/config/loader'
import DynamicPage from '@/components/runtime/DynamicPage'
import { getSession } from '@/lib/auth/session'
import { hasPermission } from '@/lib/auth/permissions'

export default async function DynamicAppPage({
  params,
}: {
  params: Promise<{ appId: string; slug: string[] }>
}) {
  const { appId, slug } = await params
  const pagePath = '/' + slug.join('/')
  const session = await getSession()

  const { config } = await loadConfig(appId)
  const pageDef = config.pages.find(p => p.path === pagePath)

  if (!pageDef) notFound()

  if (!hasPermission(session, pageDef.permissions)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="text-xl font-semibold text-gray-700">Access Denied</h2>
        <p className="text-gray-400 mt-2 text-sm">You don&apos;t have permission to view this page.</p>
      </div>
    )
  }

  return <DynamicPage appId={appId} page={pageDef} config={config} />
}
