import { notFound } from 'next/navigation'
import { loadConfig } from '@/lib/config/loader'
import { AppProvider } from '@/components/runtime/AppContext'

export default async function AppShellLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ appId: string }>
}) {
  const { appId } = await params

  let configResult
  try {
    configResult = await loadConfig(appId)
  } catch {
    notFound()
  }

  return (
    <AppProvider appId={appId} config={configResult.config} configErrors={configResult.errors}>
      {children}
    </AppProvider>
  )
}
