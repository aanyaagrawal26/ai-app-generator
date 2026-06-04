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
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      {title && <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>}
      {config.description && <p className="text-gray-500 text-sm mb-4">{String(config.description)}</p>}
      {children}
    </div>
  )
}
