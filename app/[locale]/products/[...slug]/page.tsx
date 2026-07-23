import { setRequestLocale } from 'next-intl/server'
import { notFound, redirect } from 'next/navigation'
import { StitchNativePage } from '@/components/stitch/stitch-native-pages'
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
import { preloadRuntimeDomainProducts, runtimeProductViewModelSource } from '@/lib/runtime/domain-products'

export const revalidate = 3600

interface ProductDetailRouteProps {
  readonly params: Promise<{
    readonly locale: string
    readonly slug: readonly string[]
  }>
}

export async function generateStaticParams() {
  await preloadRuntimeDomainProducts()
  return getProductListStaticParams(routing.locales, runtimeProductViewModelSource)
}

export async function generateMetadata({ params }: ProductDetailRouteProps) {
  const { locale, slug } = await params

  if (!isLocale(locale)) {
    return {}
  }

  await preloadRuntimeDomainProducts()
  const typedLocale = locale as Locale
  const detailResult = resolveDomainProductDetail(typedLocale, slug)

  if (detailResult.status === 'found') {
    return buildProductMetadata(detailResult.data)
  }

  const listData = resolveProductListPage(typedLocale, slug)

  return listData ? buildProductListMetadata(listData) : {}
}

export default async function ProductDetailPage({ params }: ProductDetailRouteProps) {
  const { locale, slug } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  setRequestLocale(locale)

  await preloadRuntimeDomainProducts()
  const typedLocale = locale as Locale
  const viewModelResult = resolveProductDetailViewModel(typedLocale, slug, runtimeProductViewModelSource)
  const canonicalDetailResult = resolveDomainProductDetail(typedLocale, slug)

  if (canonicalDetailResult.status === 'found') {
    return (
      <>
        <ProductDetailStructuredData data={canonicalDetailResult.data} />
        <StitchNativePage locale={typedLocale} screen="productDetail" productDetailData={viewModelResult.status === 'found' ? viewModelResult.data : undefined} />
      </>
    )
  }

  if (viewModelResult.status !== 'found') {
    const viewListData = resolveProductListViewModel(typedLocale, slug, {}, runtimeProductViewModelSource)
    const seoListData = resolveProductListPage(typedLocale, slug)

    if (!viewListData || !seoListData) {
      notFound()
    }

    return (
      <>
        <ProductListStructuredData data={seoListData} />
        <StitchNativePage locale={typedLocale} screen="products" productListData={viewListData} />
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
      <StitchNativePage locale={typedLocale} screen="productDetail" productDetailData={viewModelResult.data} />
    </>
  )
}
