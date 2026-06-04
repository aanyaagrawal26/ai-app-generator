'use client'

import React from 'react'

interface State { hasError: boolean; error: Error | null }

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  State
> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4 text-sm text-red-700">
          <p className="font-semibold">Component error</p>
          <p className="text-xs mt-1 font-mono">{this.state.error?.message}</p>
        </div>
      )
    }
    return this.props.children
  }
}
