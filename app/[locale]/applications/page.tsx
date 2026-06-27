import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { EntryHubPage } from '@/components/sections/entry-hub-page'
import { isLocale, type Locale } from '@/i18n/routing'
import { getApplicationEntryPageViewModel } from '@/lib/domain'
import { buildApplicationHubPageResolution } from '@/lib/domain/entry-pages'
import { buildApplicationPageMetadata } from '@/lib/seo/application'
import { EntryPageStructuredData } from '@/lib/seo/structured-data'

export const revalidate = 3600

export function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return params.then(({ locale }) => {
    if (!isLocale(locale)) {
      return {}
    }

    return buildApplicationPageMetadata(buildApplicationHubPageResolution(locale as Locale).seo)
  })
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

  const typedLocale = locale as Locale
  const data = getApplicationEntryPageViewModel(typedLocale)
  const resolution = buildApplicationHubPageResolution(typedLocale)

  return (
    <>
      <EntryPageStructuredData data={resolution.seo} id="application-jsonld" />
      <EntryHubPage locale={typedLocale} data={data} />
    </>
  )
}
