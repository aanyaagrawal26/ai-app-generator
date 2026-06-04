'use client'

import Link from 'next/link'
import type { AppConfig } from '@/lib/config/schema'

interface Props { appId: string; config: AppConfig; configErrors: string[] }

export default function AppOverview({ appId, config, configErrors }: Props) {
  const manage = [
    { href: `/apps/${appId}/config`,    icon: '⚙️', label: 'Edit Config',   desc: 'Resources, pages, workflows' },
    { href: `/apps/${appId}/import`,    icon: '📥', label: 'CSV Import',    desc: 'Bulk-import records' },
    { href: `/apps/${appId}/export`,    icon: '🐙', label: 'Export',        desc: 'GitHub repo or zip download' },
    { href: `/apps/${appId}/workflows`, icon: '⚡', label: 'Workflows',     desc: 'Event automations' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero */}
      <div className="rounded-2xl p-8 border border-white/5 relative overflow-hidden animate-fade-up" style={{animationFillMode:'forwards',background:'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(236,72,153,0.08))'}}>
        <div className="absolute inset-0 opacity-30" style={{backgroundImage:'radial-gradient(circle at 20% 50%,rgba(99,102,241,0.4) 0%,transparent 60%)',pointerEvents:'none'}}/>
        <h1 className="text-3xl font-black text-white relative z-10">{config.name}</h1>
        {config.description && <p className="text-slate-300 mt-2 relative z-10">{config.description}</p>}

        {configErrors.length > 0 && (
          <div className="mt-4 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 relative z-10">
            <p className="text-xs font-semibold text-amber-300 mb-1">⚠ Config warnings (app runs with defaults)</p>
            <ul className="text-xs font-mono text-amber-400 space-y-0.5">{configErrors.slice(0,3).map((e,i)=><li key={i}>{e}</li>)}</ul>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { n: config.resources.length, l: 'Resources' },
          { n: config.pages.length,     l: 'Pages' },
          { n: config.workflows.length, l: 'Workflows' },
          { n: config.i18n.supportedLocales.length, l: 'Locales' },
        ].map((s,i) => (
          <div key={s.l} className="rounded-xl p-5 border border-white/5 text-center opacity-0-init animate-fade-up"
            style={{background:'rgba(255,255,255,0.03)',animationDelay:`${0.1+i*0.07}s`,animationFillMode:'forwards'}}>
            <p className="text-2xl font-black text-gradient">{s.n}</p>
            <p className="text-xs text-slate-400 mt-1">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Pages */}
      {config.pages.length > 0 && (
        <div className="animate-fade-up" style={{animationDelay:'0.3s',animationFillMode:'forwards'}}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">App Pages</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {config.pages.map(page => (
              <Link key={page.path} href={`/apps/${appId}/view${page.path}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-white/5 hover:border-indigo-500/40 transition-all group card-hover"
                style={{background:'rgba(255,255,255,0.02)'}}>
                <span className="text-xl">📄</span>
                <div>
                  <p className="font-semibold text-white text-sm group-hover:text-indigo-300 transition-colors">{page.title ?? page.path}</p>
                  <p className="text-xs text-slate-500">{page.components.length} component{page.components.length!==1?'s':''}</p>
                </div>
                <span className="ml-auto text-slate-600 group-hover:text-indigo-400 transition-colors">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Manage */}
      <div className="animate-fade-up" style={{animationDelay:'0.4s',animationFillMode:'forwards'}}>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Manage</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {manage.map((m,i) => (
            <Link key={m.href} href={m.href}
              className="flex items-center gap-4 p-4 rounded-xl border border-white/5 hover:border-indigo-500/40 transition-all group card-hover opacity-0-init animate-fade-up"
              style={{background:'rgba(255,255,255,0.02)',animationDelay:`${0.45+i*0.06}s`,animationFillMode:'forwards'}}>
              <span className="text-2xl">{m.icon}</span>
              <div>
                <p className="font-semibold text-white text-sm group-hover:text-indigo-300 transition-colors">{m.label}</p>
                <p className="text-xs text-slate-500">{m.desc}</p>
              </div>
              <span className="ml-auto text-slate-600 group-hover:text-indigo-400 transition-colors">→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
