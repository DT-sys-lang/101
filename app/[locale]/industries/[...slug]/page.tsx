import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { StitchIndustryDetailPage } from '@/components/stitch/stitch-native-pages'
import { isLocale, type Locale, routing } from '@/i18n/routing'
import { getIndustryEntryStaticParams, resolveIndustryDetailPage } from '@/lib/domain/entry-pages'
import { buildIndustryPageMetadata } from '@/lib/seo/industry'
import { EntryPageStructuredData } from '@/lib/seo/structured-data'
import { listRuntimeIndustryEcosystemContent } from '@/lib/runtime/domain-ecosystem'
import { preloadRuntimeDomainProducts, runtimeProductViewModelSource } from '@/lib/runtime/domain-products'

export const revalidate = 3600

interface IndustryDetailPageProps {
  readonly params: Promise<{
    readonly locale: string
    readonly slug: readonly string[]
  }>
}

export function generateStaticParams() {
  return getIndustryEntryStaticParams(routing.locales)
}

export function generateMetadata({ params }: IndustryDetailPageProps) {
  return params.then(({ locale, slug }) => {
    if (!isLocale(locale)) {
      return {}
    }

    const resolution = resolveIndustryDetailPage(locale as Locale, slug)

    return resolution ? buildIndustryPageMetadata(resolution.seo) : {}
  })
}

export default async function IndustryDetailPage({ params }: IndustryDetailPageProps) {
  const { locale, slug } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  setRequestLocale(locale)

  const typedLocale = locale as Locale
  await preloadRuntimeDomainProducts()
  const ecosystemContent = await listRuntimeIndustryEcosystemContent(typedLocale)
  const resolution = resolveIndustryDetailPage(typedLocale, slug, runtimeProductViewModelSource, ecosystemContent)

  if (!resolution) {
    notFound()
  }

  return (
    <>
      <EntryPageStructuredData data={resolution.seo} id="industry-detail-jsonld" />
      <StitchIndustryDetailPage locale={typedLocale} resolution={resolution} />
    </>
  )
}
