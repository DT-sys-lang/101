import { jsonContract, jsonContractError } from '@/lib/api/contracts'
import {
  CmsPreviewError,
  parseCmsPreviewRequest,
  readCmsPreviewSecretFromRequest,
  resolveCmsPreviewRoute,
  verifyCmsPreviewSecret,
} from '@/lib/api/preview'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export function GET(request: Request) {
  try {
    verifyCmsPreviewSecret(readCmsPreviewSecretFromRequest(request))
    const previewRequest = parseCmsPreviewRequest(request)
    return jsonContract('cms-preview', resolveCmsPreviewRoute(previewRequest))
  } catch (error) {
    if (error instanceof CmsPreviewError) {
      return jsonContractError('cms-preview', error.code, error.message, error.status)
    }

    const message = error instanceof Error ? error.message : 'Unknown preview error.'
    return jsonContractError('cms-preview', 'cms-preview-unhandled-error', message, 400)
  }
}
