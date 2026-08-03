import { revalidatePath, revalidateTag } from 'next/cache'
import { jsonContract, jsonContractError } from '@/lib/api/contracts'
import {
  CmsWebhookError,
  getCmsWebhookRevalidationContract,
  parseCmsWebhookRevalidationRequest,
} from '@/lib/api/cms-webhook'
import { calculateRevalidationImpact } from '@/lib/api/revalidation'
import { refreshRuntimeDomainProducts } from '@/lib/runtime/domain-products'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export function GET() {
  return jsonContract('cms-revalidate', getCmsWebhookRevalidationContract())
}

export async function POST(request: Request) {
  try {
    const webhook = parseCmsWebhookRevalidationRequest(request.headers, await request.text())
    await refreshRuntimeDomainProducts()
    const impact = calculateRevalidationImpact(webhook.revalidationInput)

    for (const path of impact.paths) {
      revalidatePath(path)
    }

    for (const tag of impact.tags) {
      revalidateTag(tag, 'default')
    }

    return jsonContract('cms-revalidate', {
      version: webhook.version,
      verified: true,
      webhook: {
        event: webhook.metadata.event,
        contentType: webhook.metadata.contentType,
        entity: webhook.metadata.entity,
        entryId: webhook.metadata.entryId,
        locale: webhook.metadata.locale,
        productId: webhook.metadata.productId,
        categoryId: webhook.metadata.categoryId,
        campaign: webhook.metadata.campaign,
        scope: webhook.revalidationInput.scope,
        publishedAt: webhook.metadata.publishedAt,
        updatedAt: webhook.metadata.updatedAt,
        occurredAt: webhook.metadata.occurredAt,
        sourcePath: webhook.metadata.sourcePath,
        industryId: webhook.metadata.industryId,
        applicationId: webhook.metadata.applicationId,
      },
      impact,
      revalidated: true,
    })
  } catch (error) {
    if (error instanceof CmsWebhookError) {
      return jsonContractError('cms-revalidate', error.code, error.message, error.status)
    }

    const message = error instanceof Error ? error.message : 'Unknown CMS revalidation error.'
    return jsonContractError('cms-revalidate', 'cms-webhook-unhandled-error', message, 400)
  }
}
