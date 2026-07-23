import { getLocaleFromRequest, jsonContract } from '@/lib/api/contracts'
import { buildGeoIndex } from '@/lib/geo'
import { preloadRuntimeDomainProducts } from '@/lib/runtime/domain-products'

export const revalidate = 3600

export async function GET(request: Request) {
  await preloadRuntimeDomainProducts()
  const locale = getLocaleFromRequest(request)
  return jsonContract('geo-index', buildGeoIndex(locale))
}
