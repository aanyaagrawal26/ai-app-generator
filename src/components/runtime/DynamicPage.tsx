'use client'

import type { Page, AppConfig } from '@/lib/config/schema'
import DynamicRenderer from './DynamicRenderer'

interface Props {
  appId:  string
  page:   Page
  config: AppConfig
}

export default function DynamicPage({ appId, page, config }: Props) {
  return (
    <div className="space-y-6">
      {page.title && (
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{page.title}</h1>
        </div>
      )}
      {page.components.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl bg-white">
          <p className="text-gray-400">This page has no components yet.</p>
          <p className="text-gray-300 text-sm mt-1">Add components to this page in the config editor.</p>
        </div>
      ) : (
        page.components.map(component => (
          <DynamicRenderer
            key={component.id}
            component={component}
            appId={appId}
            config={config}
          />
        ))
      )}
    </div>
  )
}
