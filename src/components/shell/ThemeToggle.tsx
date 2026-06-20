'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`relative h-9 w-9 grid place-items-center rounded-xl border border-edge text-fg-muted hover:text-fg hover:bg-[var(--surface-hover)] transition-colors ${className}`}
    >
      {/* avoid hydration mismatch: render nothing theme-specific until mounted */}
      {mounted && (
        <span className="relative block h-[18px] w-[18px]">
          <Sun
            size={18}
            className={`absolute inset-0 transition-all duration-300 ${isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}
          />
          <Moon
            size={18}
            className={`absolute inset-0 transition-all duration-300 ${isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`}
          />
        </span>
      )}
    </button>
  )
}
