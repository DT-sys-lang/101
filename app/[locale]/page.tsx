import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { StitchNativePage } from '@/components/stitch/stitch-native-pages'
import { isLocale, type Locale } from '@/i18n/routing'
import { getIndustrialHomepage } from '@/lib/domain'
import { buildHomePageMetadata } from '@/lib/seo/home'
import { HomePageStructuredData } from '@/lib/seo/structured-data'
import {
  getRuntimeDomainCategoryTree,
  getRuntimeDomainProductCatalog,
  listRuntimeDomainHomepageProducts,
  preloadRuntimeDomainProducts,
} from '@/lib/runtime/domain-products'

export const revalidate = 3600

export async function generateMetadata({ params }: { readonly params: Promise<{ readonly locale: string }> }) {
  const { locale } = await params

  if (!isLocale(locale)) {
    return {}
  }

  await preloadRuntimeDomainProducts()
  const typedLocale = locale as Locale
  const productList = listRuntimeDomainHomepageProducts(typedLocale)
  const homepage = getIndustrialHomepage(typedLocale, productList, getRuntimeDomainCategoryTree(), getRuntimeDomainProductCatalog(typedLocale))

  return buildHomePageMetadata(typedLocale, homepage)
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

  await preloadRuntimeDomainProducts()
  const typedLocale = locale as Locale
  const productList = listRuntimeDomainHomepageProducts(typedLocale)
  const homepage = getIndustrialHomepage(typedLocale, productList, getRuntimeDomainCategoryTree(), getRuntimeDomainProductCatalog(typedLocale))

  return (
    <>
      <HomePageStructuredData locale={typedLocale} data={homepage} />
      <StitchNativePage locale={typedLocale} screen="home" />
    </>
  )
}
