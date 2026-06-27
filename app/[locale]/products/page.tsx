import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { ProductListPageView } from '@/components/products/product-list-page'
import { isLocale, type Locale, routing } from '@/i18n/routing'
import { resolveProductListViewModel } from '@/lib/domain'
import { buildProductListMetadata, resolveProductListPage } from '@/lib/seo/product-list'
import { ProductListStructuredData } from '@/lib/seo/structured-data'

export const revalidate = 3600

interface ProductsIndexPageProps {
  readonly params: Promise<{
    readonly locale: string
  }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export function generateMetadata({ params }: ProductsIndexPageProps) {
  return params.then(({ locale }) => {
    if (!isLocale(locale)) {
      return {}
    }

    const typedLocale = locale as Locale
    const data = resolveProductListPage(typedLocale)

    return data ? buildProductListMetadata(data) : {}
  })
}

export default async function ProductsIndexPage({ params }: ProductsIndexPageProps) {
  const { locale } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  setRequestLocale(locale)

  const typedLocale = locale as Locale
  const data = resolveProductListViewModel(typedLocale)
  const seoData = resolveProductListPage(typedLocale)

  if (!data || !seoData) {
    notFound()
  }

  return (
    <>
      <ProductListStructuredData data={seoData} />
      <ProductListPageView locale={typedLocale} data={data} />
    </>
  )
}
