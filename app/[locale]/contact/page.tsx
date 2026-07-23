import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { StitchNativePage } from '@/components/stitch/stitch-native-pages'
import { isLocale, type Locale } from '@/i18n/routing'
import { getStaticInfoPageViewModel } from '@/lib/domain'
import { buildStaticInfoPageMetadata } from '@/lib/seo/static-info'
import { StaticInfoPageStructuredData } from '@/lib/seo/structured-data'

export const revalidate = 3600

export function generateMetadata({ params }: { readonly params: Promise<{ readonly locale: string }> }) {
  return params.then(({ locale }) => {
    if (!isLocale(locale)) {
      return {}
    }

    const typedLocale = locale as Locale
    const data = getStaticInfoPageViewModel(typedLocale, 'contact')

    return buildStaticInfoPageMetadata(typedLocale, 'contact', data)
  })
}

export default async function ContactPage({
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
  const data = getStaticInfoPageViewModel(typedLocale, 'contact')

  return (
    <>
      <StaticInfoPageStructuredData locale={typedLocale} kind="contact" data={data} />
      <StitchNativePage locale={typedLocale} screen="contact" />
    </>
  )
}
