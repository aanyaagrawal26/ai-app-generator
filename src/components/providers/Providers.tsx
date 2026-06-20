'use client'

import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange={false}
    >
      {children}
      <Toaster
        position="bottom-right"
        theme="system"
        toastOptions={{
          style: {
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--fg)',
            backdropFilter: 'blur(20px)',
          },
        }}
      />
    </ThemeProvider>
  )
}
