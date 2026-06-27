import { getLocaleFromRequest, jsonContract } from '@/lib/api/contracts'
import { buildGeoIndex } from '@/lib/geo'

export const revalidate = 3600

export function GET(request: Request) {
  const locale = getLocaleFromRequest(request)
  return jsonContract('geo-index', buildGeoIndex(locale))
}
