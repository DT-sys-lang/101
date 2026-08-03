import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { GoogleAnalytics } from '@next/third-parties/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { isLocale, routing, type Locale } from '@/i18n/routing'
import { getIndustrialSiteLayout } from '@/lib/domain'
import { industrialSiteConfig } from '@/lib/domain'
import { getRuntimeDomainCategoryTree, getRuntimeDomainProductCatalog, preloadRuntimeDomainProducts } from '@/lib/runtime/domain-products'
import '../globals.css'

const googleAnalyticsId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim()
const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim()

export const metadata: Metadata = {
  metadataBase: new URL(industrialSiteConfig.origin),
  verification: googleSiteVerification ? { google: googleSiteVerification } : undefined,
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  setRequestLocale(locale)
  const messages = await getMessages()
  const typedLocale = locale as Locale
  await preloadRuntimeDomainProducts()
  const siteLayout = getIndustrialSiteLayout(typedLocale, getRuntimeDomainCategoryTree(), getRuntimeDomainProductCatalog(typedLocale))

  return (
    <html lang={typedLocale === 'zh' ? 'zh-CN' : 'en'} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-ink-900 antialiased">
        <NextIntlClientProvider messages={messages}>
          <div className="min-h-screen bg-background">
            <SiteHeader locale={typedLocale} site={siteLayout} />
            <main id="main-content">{children}</main>
            <SiteFooter locale={typedLocale} site={siteLayout} />
          </div>
        </NextIntlClientProvider>
        {googleAnalyticsId ? <GoogleAnalytics gaId={googleAnalyticsId} /> : null}
      </body>
    </html>
  )
}
