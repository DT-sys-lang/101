import type { ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { isLocale, routing, type Locale } from '@/i18n/routing'
import { getIndustrialSiteLayout } from '@/lib/domain'
import { getRuntimeDomainCategoryTree, preloadRuntimeDomainProducts } from '@/lib/runtime/domain-products'

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
  const siteLayout = getIndustrialSiteLayout(typedLocale, getRuntimeDomainCategoryTree())

  return (
    <NextIntlClientProvider messages={messages}>
      <div lang={typedLocale === 'zh' ? 'zh-CN' : 'en'} className="min-h-screen bg-background">
        <SiteHeader locale={typedLocale} site={siteLayout} />
        <main id="main-content">{children}</main>
        <SiteFooter locale={typedLocale} site={siteLayout} />
      </div>
    </NextIntlClientProvider>
  )
}
