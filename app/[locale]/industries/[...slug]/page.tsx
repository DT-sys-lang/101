import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { EntryHubPage } from '@/components/sections/entry-hub-page'
import { isLocale, type Locale, routing } from '@/i18n/routing'
import { getIndustryEntryStaticParams, resolveIndustryDetailPage } from '@/lib/domain/entry-pages'
import { buildIndustryPageMetadata } from '@/lib/seo/industry'
import { EntryPageStructuredData } from '@/lib/seo/structured-data'

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
  const resolution = resolveIndustryDetailPage(typedLocale, slug)

  if (!resolution) {
    notFound()
  }

  return (
    <>
      <EntryPageStructuredData data={resolution.seo} id="industry-detail-jsonld" />
      <EntryHubPage locale={typedLocale} data={resolution.page} />
    </>
  )
}
