import { jsonContract } from '@/lib/api/contracts'
import { getCmsProductStatus, preloadCmsProductSnapshotAsync } from '@/lib/cms/products'

export async function GET() {
  await preloadCmsProductSnapshotAsync()
  return jsonContract('cms-status', getCmsProductStatus())
}
