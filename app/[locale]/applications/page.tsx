import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { EntryHubPage } from '@/components/sections/entry-hub-page'
import { isLocale, type Locale } from '@/i18n/routing'
import { getApplicationEntryPageViewModel } from '@/lib/domain'
import { buildApplicationHubPageResolution } from '@/lib/domain/entry-pages'
import { buildApplicationPageMetadata } from '@/lib/seo/application'
import { EntryPageStructuredData } from '@/lib/seo/structured-data'
import { preloadRuntimeDomainProducts, runtimeProductViewModelSource } from '@/lib/runtime/domain-products'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  if (!isLocale(locale)) {
    return {}
  }

  await preloadRuntimeDomainProducts()

  return buildApplicationPageMetadata(
    buildApplicationHubPageResolution(locale as Locale, runtimeProductViewModelSource).seo,
  )
}

export default async function ApplicationsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  setRequestLocale(locale)

  await preloadRuntimeDomainProducts()

  const typedLocale = locale as Locale
  const data = getApplicationEntryPageViewModel(typedLocale, runtimeProductViewModelSource)
  const resolution = buildApplicationHubPageResolution(typedLocale, runtimeProductViewModelSource)

  return (
    <>
      <EntryPageStructuredData data={resolution.seo} id="application-jsonld" />
      <EntryHubPage locale={typedLocale} data={data} />
    </>
  )
}
