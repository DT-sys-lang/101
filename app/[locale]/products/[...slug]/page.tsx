import { setRequestLocale } from 'next-intl/server'
import { notFound, redirect } from 'next/navigation'
import { ProductDetailPageView } from '@/components/products/product-detail-page'
import { ProductListPageView } from '@/components/products/product-list-page'
import { isLocale, type Locale, routing } from '@/i18n/routing'
import {
  getProductListStaticParams,
  resolveProductDetailViewModel,
  resolveProductListViewModel,
  shouldRedirectProductViewModel,
} from '@/lib/domain'
import { buildProductMetadata } from '@/lib/seo/metadata'
import { resolveDomainProductDetail } from '@/lib/seo/product-detail'
import { buildProductListMetadata, resolveProductListPage } from '@/lib/seo/product-list'
import { ProductDetailStructuredData, ProductListStructuredData } from '@/lib/seo/structured-data'

export const revalidate = 3600

interface ProductDetailRouteProps {
  readonly params: Promise<{
    readonly locale: string
    readonly slug: readonly string[]
  }>
}

export function generateStaticParams() {
  return getProductListStaticParams(routing.locales)
}

export function generateMetadata({ params }: ProductDetailRouteProps) {
  return params.then(({ locale, slug }) => {
    if (!isLocale(locale)) {
      return {}
    }

    const typedLocale = locale as Locale
    const detailResult = resolveDomainProductDetail(typedLocale, slug)

    if (detailResult.status === 'found') {
      return buildProductMetadata(detailResult.data)
    }

    const listData = resolveProductListPage(typedLocale, slug)

    return listData ? buildProductListMetadata(listData) : {}
  })
}

export default async function ProductDetailPage({ params }: ProductDetailRouteProps) {
  const { locale, slug } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  setRequestLocale(locale)

  const typedLocale = locale as Locale
  const viewModelResult = resolveProductDetailViewModel(typedLocale, slug)

  if (viewModelResult.status !== 'found') {
    const viewListData = resolveProductListViewModel(typedLocale, slug)
    const seoListData = resolveProductListPage(typedLocale, slug)

    if (!viewListData || !seoListData) {
      notFound()
    }

    return (
      <>
        <ProductListStructuredData data={seoListData} />
        <ProductListPageView locale={typedLocale} data={viewListData} />
      </>
    )
  }

  if (shouldRedirectProductViewModel(viewModelResult.data, slug)) {
    redirect(`/${typedLocale}${viewModelResult.data.route.path}`)
  }

  const detailResult = resolveDomainProductDetail(typedLocale, slug)

  if (detailResult.status !== 'found') {
    notFound()
  }

  return (
    <>
      <ProductDetailStructuredData data={detailResult.data} />
      <ProductDetailPageView locale={typedLocale} data={viewModelResult.data} />
    </>
  )
}
