'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Command, LogOut, Settings, User as UserIcon } from 'lucide-react'
import { logout } from '@/lib/auth/actions'
import ThemeToggle from './ThemeToggle'

interface Props {
  user: { name?: string | null; email: string; role: string }
}

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard', apps: 'Apps', new: 'New app', account: 'Account',
  records: 'Records', config: 'Config', import: 'Import', export: 'Export',
  workflows: 'Workflows', analytics: 'Analytics', settings: 'Settings', view: 'View',
}

function useCrumbs() {
  const pathname = usePathname()
  const parts = pathname.split('/').filter(Boolean)
  const crumbs: { label: string; href: string }[] = []
  let href = ''
  for (const part of parts) {
    href += `/${part}`
    // Skip opaque ids (the segment right after "apps" that isn't "new")
    const label = SEGMENT_LABELS[part] ?? (part.length > 12 ? `${part.slice(0, 6)}…` : part)
    crumbs.push({ label, href })
  }
  return crumbs
}

export default function TopBar({ user }: Props) {
  const initials = (user.name ?? user.email).slice(0, 2).toUpperCase()
  const crumbs = useCrumbs()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <header
      className="h-14 flex items-center justify-between px-4 sm:px-6 shrink-0 border-b border-edge"
      style={{ background: 'color-mix(in srgb, var(--bg-app) 80%, transparent)', backdropFilter: 'blur(20px)' }}
    >
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm min-w-0 overflow-hidden">
        {crumbs.map((c, i) => (
          <div key={c.href} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <ChevronRight size={14} className="text-fg-faint shrink-0" />}
            {i === crumbs.length - 1 ? (
              <span className="font-semibold text-fg truncate">{c.label}</span>
            ) : (
              <Link href={c.href} className="text-fg-muted hover:text-fg transition-colors truncate">{c.label}</Link>
            )}
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Command palette trigger */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event('command-palette:open'))}
          className="hidden sm:flex items-center gap-2 h-9 pl-3 pr-2 rounded-xl border border-edge text-fg-muted hover:text-fg hover:bg-[var(--surface-hover)] transition-colors"
        >
          <span className="text-xs">Search…</span>
          <kbd className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md border border-edge bg-[var(--surface)]">
            <Command size={11} />K
          </kbd>
        </button>

        <ThemeToggle />

        {/* User dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center gap-2.5 h-9 pl-1 pr-2.5 rounded-xl hover:bg-[var(--surface-hover)] transition-colors"
          >
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow"
              style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}
            >
              {initials}
            </span>
            <span className="text-sm text-fg hidden md:block max-w-[140px] truncate">{user.name ?? user.email}</span>
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 mt-2 w-60 rounded-2xl p-1.5 z-50 animate-slide-down"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', boxShadow: '0 24px 60px rgba(0,0,0,.5)' }}
            >
              <div className="px-3 py-2.5 mb-1 border-b border-edge">
                <p className="text-sm font-semibold text-fg truncate">{user.name ?? 'Account'}</p>
                <p className="text-xs text-fg-faint truncate">{user.email}</p>
                <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full text-indigo-300"
                  style={{ background: 'rgba(99,102,241,.15)', border: '1px solid rgba(99,102,241,.3)' }}>
                  {user.role}
                </span>
              </div>
              <Link href="/account" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-fg-muted hover:text-fg hover:bg-[var(--surface-hover)] transition-colors">
                <UserIcon size={15} /> Profile
              </Link>
              <Link href="/account" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-fg-muted hover:text-fg hover:bg-[var(--surface-hover)] transition-colors">
                <Settings size={15} /> Settings
              </Link>
              <form action={logout}>
                <button type="submit" className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10 transition-colors">
                  <LogOut size={15} /> Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
