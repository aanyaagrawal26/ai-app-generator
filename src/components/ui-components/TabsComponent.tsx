'use client'

import { useState } from 'react'
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

export default function TabsComponent({ config, children }: Props) {
  const tabs   = (config.tabs as string[] | undefined) ?? ['Tab 1', 'Tab 2']
  const [active, setActive] = useState(0)
  const childArray = Array.isArray(children) ? children : children ? [children] : []

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="flex border-b border-gray-100">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActive(i)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              active === i
                ? 'border-indigo-500 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="p-5">
        {childArray[active] ?? (
          <div className="text-sm text-gray-400">No content for this tab</div>
        )}
      </div>
    </div>
  )
}
