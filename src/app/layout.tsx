import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Providers from '@/components/providers/Providers'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: 'AI App Generator',
  description: 'Metadata-driven full-stack app runtime — build apps from JSON config',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-bg text-fg antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
