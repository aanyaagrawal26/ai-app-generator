import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import Sidebar from '@/components/shell/Sidebar'
import TopBar from '@/components/shell/TopBar'
import CommandPalette from '@/components/shell/CommandPalette'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar user={{ name: session.name, email: session.email, role: session.role }} />
        <main className="flex-1 overflow-y-auto p-6 bg-app">{children}</main>
      </div>
      <CommandPalette />
    </div>
  )
}
