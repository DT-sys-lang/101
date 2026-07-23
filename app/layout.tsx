import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { GoogleAnalytics } from '@next/third-parties/google'
import { routing } from '@/i18n/routing'
import { industrialSiteConfig } from '@/lib/domain'
import './globals.css'

const defaultHtmlLang = routing.defaultLocale === 'zh' ? 'zh-CN' : 'en'
const googleAnalyticsId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim()
const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim()

export const metadata: Metadata = {
  metadataBase: new URL(industrialSiteConfig.origin),
  verification: googleSiteVerification
    ? {
        google: googleSiteVerification,
      }
    : undefined,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang={defaultHtmlLang} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-ink-900 antialiased">
        {children}
      </body>
      {googleAnalyticsId ? <GoogleAnalytics gaId={googleAnalyticsId} /> : null}
    </html>
  )
}
