'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Command } from 'cmdk'
import {
  LayoutDashboard, Plus, Search, Settings, LogOut, Moon, Sun,
  Boxes, CornerDownLeft,
} from 'lucide-react'
import { logout } from '@/lib/auth/actions'

interface AppLite { id: string; name: string }

/** Global ⌘K command palette. Open via ⌘K / Ctrl+K, or by dispatching
 *  `window.dispatchEvent(new Event('command-palette:open'))`. */
export default function CommandPalette() {
  const router = useRouter()
  const { setTheme, resolvedTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [apps, setApps] = useState<AppLite[]>([])

  // keyboard + event triggers
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    const onOpen = () => setOpen(true)
    document.addEventListener('keydown', onKey)
    window.addEventListener('command-palette:open', onOpen)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('command-palette:open', onOpen)
    }
  }, [])

  // lazily load apps for quick-jump the first time it opens
  useEffect(() => {
    if (!open || apps.length) return
    fetch('/api/apps')
      .then(r => (r.ok ? r.json() : { data: [] }))
      .then(d => setApps((d.data ?? []).map((a: AppLite) => ({ id: a.id, name: a.name }))))
      .catch(() => {})
  }, [open, apps.length])

  const run = useCallback((fn: () => void) => { setOpen(false); fn() }, [])

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command menu"
      className="cmdk-root"
      shouldFilter
    >
      <div className="cmdk-search">
        <Search size={16} className="text-fg-faint shrink-0" />
        <Command.Input autoFocus placeholder="Search apps, pages and actions…" />
        <kbd className="cmdk-kbd">ESC</kbd>
      </div>

      <Command.List>
        <Command.Empty className="cmdk-empty">No results found.</Command.Empty>

        <Command.Group heading="Navigation">
          <Command.Item onSelect={() => run(() => router.push('/dashboard'))}>
            <LayoutDashboard size={16} /> Dashboard <Hint />
          </Command.Item>
          <Command.Item onSelect={() => run(() => router.push('/apps/new'))}>
            <Plus size={16} /> Create new app <Hint />
          </Command.Item>
          <Command.Item onSelect={() => run(() => router.push('/account'))}>
            <Settings size={16} /> Account settings <Hint />
          </Command.Item>
        </Command.Group>

        {apps.length > 0 && (
          <Command.Group heading="Your apps">
            {apps.map(app => (
              <Command.Item key={app.id} value={`app ${app.name}`} onSelect={() => run(() => router.push(`/apps/${app.id}`))}>
                <Boxes size={16} /> {app.name} <Hint />
              </Command.Item>
            ))}
          </Command.Group>
        )}

        <Command.Group heading="Actions">
          <Command.Item value="toggle theme dark light" onSelect={() => run(() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'))}>
            {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            Toggle theme
          </Command.Item>
          <Command.Item value="sign out logout" onSelect={() => run(() => { void logout() })}>
            <LogOut size={16} /> Sign out
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  )
}

function Hint() {
  return <CornerDownLeft size={13} className="ml-auto text-fg-faint opacity-0 [[data-selected=true]_&]:opacity-100 transition-opacity" />
}
