import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { EntryHubPage } from '@/components/sections/entry-hub-page'
import { isLocale, type Locale } from '@/i18n/routing'
import { getIndustryEntryPageViewModel } from '@/lib/domain'
import { buildIndustryHubPageResolution } from '@/lib/domain/entry-pages'
import { buildIndustryPageMetadata } from '@/lib/seo/industry'
import { EntryPageStructuredData } from '@/lib/seo/structured-data'

export const revalidate = 3600

export function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return params.then(({ locale }) => {
    if (!isLocale(locale)) {
      return {}
    }

    return buildIndustryPageMetadata(buildIndustryHubPageResolution(locale as Locale).seo)
  })
}

export default async function IndustriesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  setRequestLocale(locale)

  const typedLocale = locale as Locale
  const data = getIndustryEntryPageViewModel(typedLocale)
  const resolution = buildIndustryHubPageResolution(typedLocale)

  return (
    <>
      <EntryPageStructuredData data={resolution.seo} id="industry-jsonld" />
      <EntryHubPage locale={typedLocale} data={data} />
    </>
  )
}
