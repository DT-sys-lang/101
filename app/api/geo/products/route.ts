import { getLocaleFromRequest, jsonContract } from '@/lib/api/contracts'
import { buildAiReadableIndustrialProduct } from '@/lib/geo'
import { getRuntimeDomainProductRecords, preloadRuntimeDomainProducts } from '@/lib/runtime/domain-products'

export const revalidate = 3600

export async function GET(request: Request) {
  await preloadRuntimeDomainProducts()
  const locale = getLocaleFromRequest(request)

  return jsonContract('geo-products', {
    version: 'geo-products-v1',
    locale,
    products: getRuntimeDomainProductRecords().map((product) => buildAiReadableIndustrialProduct(product, locale)),
  })
}
