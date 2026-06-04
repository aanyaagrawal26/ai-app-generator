'use client'

import { createContext, useContext } from 'react'
import type { AppConfig } from '@/lib/config/schema'

interface AppContextValue {
  appId:        string
  config:       AppConfig
  configErrors: string[]
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({
  children,
  appId,
  config,
  configErrors,
}: {
  children:     React.ReactNode
  appId:        string
  config:       AppConfig
  configErrors: string[]
}) {
  return (
    <AppContext.Provider value={{ appId, config, configErrors }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider')
  return ctx
}
