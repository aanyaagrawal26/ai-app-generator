'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/auth/actions'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 shrink-0 flex flex-col h-full border-r border-white/5"
      style={{ background: 'linear-gradient(180deg, #0d0f24 0%, #080a1a 100%)' }}>

      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-sm"
            style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}>
            A
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-none">AppGen</p>
            <p className="text-[10px] text-slate-500 mt-0.5">AI App Generator</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              style={active ? { background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(236,72,153,0.1))', border: '1px solid rgba(99,102,241,0.3)' } : {}}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/5">
        <form action={logout}>
          <button type="submit"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all w-full text-left">
            <span className="text-base w-5 text-center">↩</span>
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
