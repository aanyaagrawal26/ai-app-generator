'use client'

import type { AppConfig } from '@/lib/config/schema'

interface Props {
  id:        string
  appId:     string
  appConfig: AppConfig
  resource?: string
  title?:    string
  config:    Record<string, unknown>
  children?: React.ReactNode
}

export default function CardComponent({ title, config, children }: Props) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      {title && <h3 className="font-semibold text-white mb-4">{title}</h3>}
      {config.description && <p className="text-slate-400 text-sm mb-4">{String(config.description)}</p>}
      {children}
    </div>
  )
}
