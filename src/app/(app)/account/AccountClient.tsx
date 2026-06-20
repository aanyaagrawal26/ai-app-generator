'use client'

import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  User as UserIcon, Mail, Shield, CalendarDays, Package, Database,
  Monitor, Moon, Sun, Zap, LogOut,
} from 'lucide-react'
import { logout } from '@/lib/auth/actions'

interface Props {
  user: { name: string | null; email: string; role: string; memberSince: string | null }
  stats: { apps: number; records: number }
}

const CREDIT_LIMIT = 1000

export default function AccountClient({ user, stats }: Props) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const initials = (user.name ?? user.email).slice(0, 2).toUpperCase()
  const used = Math.min(stats.records, CREDIT_LIMIT)
  const pct = Math.round((used / CREDIT_LIMIT) * 100)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl surface-card p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: 'linear-gradient(135deg,#6366f1,#ec4899)', transform: 'translate(30%,-40%)' }} />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl grid place-items-center text-xl font-black text-white shadow-lg shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}>
            {initials}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-fg truncate">{user.name ?? 'Your account'}</h1>
            <p className="text-fg-muted text-sm truncate">{user.email}</p>
          </div>
        </div>
      </motion.div>

      {/* Profile details */}
      <Section title="Profile" delay={0.05}>
        <div className="grid sm:grid-cols-2 gap-3">
          <InfoRow icon={UserIcon} label="Name" value={user.name ?? '—'} />
          <InfoRow icon={Mail} label="Email" value={user.email} />
          <InfoRow icon={Shield} label="Role" value={user.role} capitalize />
          <InfoRow icon={CalendarDays} label="Member since"
            value={user.memberSince ? new Date(user.memberSince).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'} />
        </div>
      </Section>

      {/* Usage / credits */}
      <Section title="Usage" delay={0.1}>
        <div className="grid sm:grid-cols-2 gap-3 mb-5">
          <StatTile icon={Package} label="Apps" value={stats.apps} color="#6366f1" />
          <StatTile icon={Database} label="Records" value={stats.records} color="#ec4899" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-2 text-sm font-medium text-fg">
              <Zap size={15} className="text-amber-400" /> AI credits
            </span>
            <span className="text-xs text-fg-muted tabular-nums">{used} / {CREDIT_LIMIT}</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--surface)' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#6366f1,#ec4899)' }} />
          </div>
          <p className="text-xs text-fg-faint mt-2">{CREDIT_LIMIT - used} credits remaining this cycle.</p>
        </div>
      </Section>

      {/* Appearance */}
      <Section title="Appearance" delay={0.15}>
        <p className="text-sm text-fg-muted mb-3">Theme preference</p>
        <div className="grid grid-cols-3 gap-3">
          {([
            { key: 'light', label: 'Light', Icon: Sun },
            { key: 'dark', label: 'Dark', Icon: Moon },
            { key: 'system', label: 'System', Icon: Monitor },
          ] as const).map(opt => {
            const active = mounted && theme === opt.key
            return (
              <button key={opt.key} onClick={() => setTheme(opt.key)}
                className={`flex flex-col items-center gap-2 py-4 rounded-xl border transition-all ${active ? 'text-fg' : 'text-fg-muted hover:text-fg border-edge hover:bg-[var(--surface-hover)]'}`}
                style={active ? { borderColor: 'rgba(99,102,241,.5)', background: 'linear-gradient(135deg, rgba(99,102,241,.18), rgba(236,72,153,.08))' } : {}}>
                <opt.Icon size={20} className={active ? 'text-indigo-400' : ''} />
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            )
          })}
        </div>
      </Section>

      {/* Danger zone */}
      <Section title="Session" delay={0.2}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-fg">Sign out</p>
            <p className="text-xs text-fg-faint mt-0.5">End your session on this device.</p>
          </div>
          <form action={logout}>
            <button type="submit" className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-rose-400 rounded-xl border border-rose-500/30 hover:bg-rose-500/10 transition-colors">
              <LogOut size={15} /> Sign out
            </button>
          </form>
        </div>
      </Section>
    </div>
  )
}

function Section({ title, delay, children }: { title: string; delay: number; children: React.ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="rounded-2xl surface-card p-6">
      <h2 className="text-xs font-semibold text-fg-faint uppercase tracking-widest mb-4">{title}</h2>
      {children}
    </motion.section>
  )
}

function InfoRow({ icon: Icon, label, value, capitalize }: { icon: typeof UserIcon; label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--surface)' }}>
      <Icon size={16} className="text-fg-faint shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] text-fg-faint">{label}</p>
        <p className={`text-sm text-fg truncate ${capitalize ? 'capitalize' : ''}`}>{value}</p>
      </div>
    </div>
  )
}

function StatTile({ icon: Icon, label, value, color }: { icon: typeof UserIcon; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'var(--surface)' }}>
      <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: `${color}1f`, color }}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xl font-black text-fg tabular-nums">{value}</p>
        <p className="text-xs text-fg-faint">{label}</p>
      </div>
    </div>
  )
}
