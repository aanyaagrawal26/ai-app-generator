'use client'

import Link from 'next/link'
import type { AppConfig } from '@/lib/config/schema'

interface Props { appId: string; config: AppConfig; configErrors: string[] }

export default function AppOverview({ appId, config, configErrors }: Props) {
  const manage = [
    { href: `/apps/${appId}/config`,    icon: '⚙️', label: 'Edit Config',   desc: 'Resources, pages, workflows', color: '#6366f1' },
    { href: `/apps/${appId}/records`,   icon: '🗄️', label: 'Records',       desc: 'Browse & manage all data',   color: '#8b5cf6' },
    { href: `/apps/${appId}/import`,    icon: '📥', label: 'CSV Import',    desc: 'Bulk-import records',         color: '#06b6d4' },
    { href: `/apps/${appId}/export`,    icon: '🐙', label: 'Export',        desc: 'GitHub repo or zip download', color: '#10b981' },
    { href: `/apps/${appId}/workflows`, icon: '⚡', label: 'Workflows',     desc: 'Event automations',           color: '#f59e0b' },
    { href: `/apps/${appId}/analytics`, icon: '📊', label: 'Analytics',     desc: 'Charts, metrics, trends',     color: '#ec4899' },
    { href: `/apps/${appId}/settings`,  icon: '🎛️', label: 'Settings',      desc: 'Name, theme, danger zone',    color: '#a78bfa' },
  ]

  const stats = [
    { n: config.resources.length,                    l: 'Resources', icon: '🗄️',  color: '#6366f1' },
    { n: config.pages.length,                        l: 'Pages',     icon: '📄',  color: '#ec4899' },
    { n: config.workflows.length,                    l: 'Workflows', icon: '⚡',  color: '#f59e0b' },
    { n: config.i18n.supportedLocales.length,        l: 'Locales',   icon: '🌍',  color: '#10b981' },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-10">

      {/* Hero banner */}
      <div
        className="rounded-3xl p-8 md:p-10 border border-white/8 relative overflow-hidden animate-fade-up"
        style={{animationFillMode:'forwards', background:'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(236,72,153,0.06))'}}
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{backgroundImage:'radial-gradient(circle at 20% 50%, rgba(99,102,241,0.3) 0%, transparent 55%), radial-gradient(circle at 80% 20%, rgba(236,72,153,0.2) 0%, transparent 50%)'}} />

        {/* floating orb */}
        <div className="absolute top-[-30%] right-[-5%] w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl animate-float pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg"
                style={{background:'linear-gradient(135deg, rgba(99,102,241,0.5), rgba(236,72,153,0.3))'}}>
                {config.name.slice(0,1).toUpperCase()}
              </div>
              {config.theme.darkMode && (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium text-slate-300"
                  style={{background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)'}}>
                  Dark mode
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">{config.name}</h1>
            {config.description && (
              <p className="text-slate-300 mt-2 max-w-xl text-sm leading-relaxed">{config.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href={`/apps/${appId}/config`}
              className="px-4 py-2 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90 hover:scale-105"
              style={{background:'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(236,72,153,0.3))', border:'1px solid rgba(99,102,241,0.4)'}}>
              Edit Config
            </Link>
          </div>
        </div>

        {configErrors.length > 0 && (
          <div className="mt-5 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 relative z-10">
            <p className="text-xs font-bold text-amber-300 mb-1.5">⚠ Config warnings</p>
            <ul className="text-xs font-mono text-amber-400 space-y-0.5">
              {configErrors.slice(0, 3).map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div
            key={s.l}
            className="rounded-2xl p-5 text-center opacity-0-init animate-fade-up card-hover relative overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              animationDelay: `${0.05 + i * 0.07}s`,
              animationFillMode: 'forwards',
            }}
          >
            <div className="absolute inset-0 pointer-events-none rounded-2xl opacity-0 hover:opacity-100 transition-opacity"
              style={{background:`radial-gradient(circle at 50% 50%, ${s.color}12, transparent 70%)`}} />
            <div className="text-2xl mb-2">{s.icon}</div>
            <p className="text-3xl font-black text-white tabular-nums">{s.n}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Pages */}
      {config.pages.length > 0 && (
        <div className="opacity-0-init animate-fade-up delay-300" style={{animationFillMode:'forwards'}}>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">App Pages</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {config.pages.map(page => (
              <Link
                key={page.path}
                href={`/apps/${appId}/view${page.path}`}
                className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 hover:border-indigo-500/40 transition-all group card-hover"
                style={{background:'rgba(255,255,255,0.02)'}}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0"
                  style={{background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.2)'}}>
                  📄
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm group-hover:text-indigo-300 transition-colors truncate">
                    {page.title ?? page.path}
                  </p>
                  <p className="text-xs text-slate-500">
                    {page.components.length} component{page.components.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <span className="ml-auto text-slate-600 group-hover:text-indigo-400 transition-colors shrink-0">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Manage grid */}
      <div className="opacity-0-init animate-fade-up delay-400" style={{animationFillMode:'forwards'}}>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Manage</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {manage.map((m, i) => (
            <Link
              key={m.href}
              href={m.href}
              className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 hover:border-opacity-40 transition-all group card-hover opacity-0-init animate-fade-up"
              style={{
                background: 'rgba(255,255,255,0.02)',
                animationDelay: `${0.42 + i * 0.05}s`,
                animationFillMode: 'forwards',
                ['--hover-color' as string]: m.color,
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform"
                style={{background:`${m.color}18`, border:`1px solid ${m.color}28`}}
              >
                {m.icon}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white text-sm group-hover:text-indigo-300 transition-colors">{m.label}</p>
                <p className="text-xs text-slate-500 truncate">{m.desc}</p>
              </div>
              <span className="ml-auto text-slate-600 group-hover:text-indigo-400 transition-all shrink-0 group-hover:translate-x-0.5">→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
