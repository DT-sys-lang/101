import { notFound } from 'next/navigation'
import { isLocale, type Locale } from '@/i18n/routing'
import { jsonContract } from '@/lib/api/contracts'
import { buildAiReadableIndustrialProduct } from '@/lib/geo'
import { buildProductFaqItems, resolveDomainProductDetail } from '@/lib/seo/product-detail'
import { preloadRuntimeDomainProducts } from '@/lib/runtime/domain-products'

export const revalidate = 3600

interface GeoProductRouteProps {
  readonly params: Promise<{
    readonly locale: string
    readonly slug: readonly string[]
  }>
}

export async function GET(_request: Request, { params }: GeoProductRouteProps) {
  const { locale, slug } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  await preloadRuntimeDomainProducts()
  const result = resolveDomainProductDetail(locale as Locale, slug)

  if (result.status !== 'found') {
    notFound()
  }

  const faqItems = buildProductFaqItems(result.data)

  return jsonContract('geo-products', buildAiReadableIndustrialProduct(result.data.product, locale as Locale, faqItems, {
    domainObject: 'ProductDetailPageData',
    cacheKey: result.data.cacheKey,
  }))
}
