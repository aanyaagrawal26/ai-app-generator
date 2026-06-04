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

export default function ModalComponent({ title, config, children }: Props) {
  const [open, setOpen] = useState(false)
  const trigger = (config.trigger as string | undefined) ?? 'Open'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {trigger}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 z-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900 text-lg">{title ?? 'Modal'}</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">✕</button>
            </div>
            {children ?? <p className="text-sm text-gray-400">No content</p>}
          </div>
        </div>
      )}
    </>
  )
}
