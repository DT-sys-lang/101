import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { industrialSiteConfig } from '@/lib/domain'
import '../globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(industrialSiteConfig.origin),
}

export default function DefaultRootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-background font-sans text-ink-900 antialiased">
        {children}
      </body>
    </html>
  )
}
