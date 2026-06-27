import type { ReactNode } from 'react'
import { routing } from '@/i18n/routing'
import './globals.css'

const defaultHtmlLang = routing.defaultLocale === 'zh' ? 'zh-CN' : 'en'

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang={defaultHtmlLang}>
      <body className="min-h-screen bg-background font-sans text-ink-900 antialiased">
        {children}
      </body>
    </html>
  )
}
