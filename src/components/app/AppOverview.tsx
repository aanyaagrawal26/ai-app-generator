'use client'

import Link from 'next/link'
import type { AppConfig } from '@/lib/config/schema'

interface Props {
  appId:        string
  config:       AppConfig
  configErrors: string[]
}

export default function AppOverview({ appId, config, configErrors }: Props) {
  const navItems = [
    { href: `/apps/${appId}/config`,    label: 'Edit Config',  icon: '⚙️',  desc: 'Modify resources, pages, workflows' },
    { href: `/apps/${appId}/import`,    label: 'Import CSV',   icon: '📥',  desc: 'Bulk-import records from a CSV file' },
    { href: `/apps/${appId}/export`,    label: 'Export',       icon: '📤',  desc: 'Export to GitHub or download as zip' },
    { href: `/apps/${appId}/workflows`, label: 'Workflows',    icon: '⚡',  desc: 'View and trigger automations' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{config.name}</h1>
        {config.description && <p className="text-gray-500 text-sm mt-1">{config.description}</p>}
      </div>

      {/* Config warnings */}
      {configErrors.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-800 mb-2">⚠️ Config warnings (app is still running with defaults)</p>
          <ul className="text-xs text-amber-700 space-y-0.5 font-mono">
            {configErrors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Resources', value: config.resources.length },
          { label: 'Pages',     value: config.pages.length },
          { label: 'Workflows', value: config.workflows.length },
          { label: 'Locales',   value: config.i18n.supportedLocales.length },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pages */}
      {config.pages.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">App Pages</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {config.pages.map(page => (
              <Link
                key={page.path}
                href={`/apps/${appId}/view${page.path}`}
                className="flex items-center gap-3 bg-white border border-gray-100 hover:border-indigo-200 rounded-xl p-4 transition-all group"
              >
                <span className="text-xl">📄</span>
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {page.title ?? page.path}
                  </p>
                  <p className="text-xs text-gray-400">{page.components.length} component{page.components.length !== 1 ? 's' : ''}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Management nav */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Manage</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 bg-white border border-gray-100 hover:border-indigo-200 rounded-xl p-4 transition-all group"
            >
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{item.label}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
