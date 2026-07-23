import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { EntryHubPage } from '@/components/sections/entry-hub-page'
import { isLocale, type Locale, routing } from '@/i18n/routing'
import { getApplicationEntryStaticParams, resolveApplicationDetailPage } from '@/lib/domain/entry-pages'
import { buildApplicationPageMetadata } from '@/lib/seo/application'
import { EntryPageStructuredData } from '@/lib/seo/structured-data'
import { preloadRuntimeDomainProducts, runtimeProductViewModelSource } from '@/lib/runtime/domain-products'

export const revalidate = 3600

interface ApplicationDetailPageProps {
  readonly params: Promise<{
    readonly locale: string
    readonly slug: readonly string[]
  }>
}

export async function generateStaticParams() {
  await preloadRuntimeDomainProducts()
  return getApplicationEntryStaticParams(routing.locales, runtimeProductViewModelSource)
}

export async function generateMetadata({ params }: ApplicationDetailPageProps) {
  const { locale, slug } = await params

  if (!isLocale(locale)) {
    return {}
  }

  await preloadRuntimeDomainProducts()

  const resolution = resolveApplicationDetailPage(locale as Locale, slug, runtimeProductViewModelSource)

  return resolution ? buildApplicationPageMetadata(resolution.seo) : {}
}

export default async function ApplicationDetailPage({ params }: ApplicationDetailPageProps) {
  const { locale, slug } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  setRequestLocale(locale)

  await preloadRuntimeDomainProducts()

  const typedLocale = locale as Locale
  const resolution = resolveApplicationDetailPage(typedLocale, slug, runtimeProductViewModelSource)

  if (!resolution) {
    notFound()
  }

  return (
    <>
      <EntryPageStructuredData data={resolution.seo} id="application-detail-jsonld" />
      <EntryHubPage locale={typedLocale} data={resolution.page} />
    </>
  )
}
