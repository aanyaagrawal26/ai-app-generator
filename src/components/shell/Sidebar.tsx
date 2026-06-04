'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/auth/actions'

interface NavItem {
  href: string
  label: string
  icon: string
}

function useAppId(): string | null {
  const pathname = usePathname()
  const match = pathname.match(/^\/apps\/([^/]+)/)
  return match ? match[1] : null
}

function SidebarLink({ href, label, icon, exact = false }: NavItem & { exact?: boolean }) {
  const pathname = usePathname()
  const active = exact ? pathname === href : (pathname === href || pathname.startsWith(href + '/'))

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
        active ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
      style={active ? {
        background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(236,72,153,0.08))',
        border: '1px solid rgba(99,102,241,0.25)',
      } : {}}
    >
      <span className={`text-base w-5 text-center shrink-0 transition-transform duration-200 ${active ? '' : 'group-hover:scale-110'}`}>
        {icon}
      </span>
      <span className="truncate">{label}</span>
      {active && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
      )}
    </Link>
  )
}

export default function Sidebar() {
  const appId = useAppId()
  const pathname = usePathname()

  const isInsideApp = !!appId && pathname.startsWith(`/apps/${appId}`)

  const globalNav: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  ]

  const appNav: NavItem[] = appId ? [
    { href: `/apps/${appId}`,           label: 'Overview',   icon: '◈' },
    { href: `/apps/${appId}/records`,   label: 'Records',    icon: '🗄️' },
    { href: `/apps/${appId}/config`,    label: 'Config',     icon: '⚙️' },
    { href: `/apps/${appId}/import`,    label: 'Import',     icon: '📥' },
    { href: `/apps/${appId}/export`,    label: 'Export',     icon: '🐙' },
    { href: `/apps/${appId}/workflows`, label: 'Workflows',  icon: '⚡' },
    { href: `/apps/${appId}/analytics`, label: 'Analytics',  icon: '📊' },
    { href: `/apps/${appId}/settings`,  label: 'Settings',   icon: '🎛️' },
  ] : []

  return (
    <aside
      className="w-60 shrink-0 flex flex-col h-full border-r border-white/5"
      style={{ background: 'linear-gradient(180deg, #0d0f24 0%, #080a1a 100%)' }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-md group-hover:scale-105 transition-transform"
            style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}
          >
            A
          </div>
          <div>
            <p className="font-black text-white text-sm leading-none">AppGen</p>
            <p className="text-[10px] text-slate-500 mt-0.5">AI App Generator</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">

        {/* Dashboard link always visible */}
        <SidebarLink {...globalNav[0]} exact />

        {/* App-specific nav */}
        {isInsideApp && appId && (
          <>
            <div className="pt-3 pb-1">
              <div className="px-3 mb-2">
                <div className="h-px bg-white/5" />
              </div>
              <p className="px-3 text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-1">
                App context
              </p>
            </div>

            {appNav.map(item => (
              <SidebarLink key={item.href} {...item} exact={item.href === `/apps/${appId}`} />
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/5 shrink-0">
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all w-full text-left group"
          >
            <span className="text-base w-5 text-center shrink-0 group-hover:scale-110 transition-transform">↩</span>
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
