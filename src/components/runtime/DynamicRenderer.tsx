'use client'

import React from 'react'
import type { Component, AppConfig } from '@/lib/config/schema'
import ErrorBoundary from './ErrorBoundary'
import UnknownComponent from './UnknownComponent'
import { componentRegistry } from './registry'

interface Props {
  component: Component
  appId:     string
  config:    AppConfig
}

export default function DynamicRenderer({ component, appId, config }: Props) {
  const Resolved = componentRegistry[component.type]

  if (!Resolved) {
    return <UnknownComponent component={component} />
  }

  return (
    <ErrorBoundary>
      <Resolved
        id={component.id}
        config={component.config}
        resource={component.resource}
        title={component.title}
        appId={appId}
        appConfig={config}
      >
        {component.children.map(child => (
          <DynamicRenderer key={child.id} component={child} appId={appId} config={config} />
        ))}
      </Resolved>
    </ErrorBoundary>
  )
}
