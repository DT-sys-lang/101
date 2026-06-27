import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { HomePage } from '@/components/sections/homepage'
import { isLocale, type Locale } from '@/i18n/routing'
import { getIndustrialHomepage, listHomepageProducts } from '@/lib/domain'
import { buildHomePageMetadata } from '@/lib/seo/home'
import { HomePageStructuredData } from '@/lib/seo/structured-data'

export const revalidate = 3600

export function generateMetadata({ params }: { readonly params: Promise<{ readonly locale: string }> }) {
  return params.then(({ locale }) => {
    if (!isLocale(locale)) {
      return {}
    }

    const typedLocale = locale as Locale
    const productList = listHomepageProducts(typedLocale)
    const homepage = getIndustrialHomepage(typedLocale, productList)

    return buildHomePageMetadata(typedLocale, homepage)
  })
}

export default async function Page({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  setRequestLocale(locale)

  const typedLocale = locale as Locale
  const productList = listHomepageProducts(typedLocale)
  const homepage = getIndustrialHomepage(typedLocale, productList)

  return (
    <>
      <HomePageStructuredData locale={typedLocale} data={homepage} />
      <HomePage locale={typedLocale} data={homepage} />
    </>
  )
}
