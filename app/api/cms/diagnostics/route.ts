import { NextResponse } from 'next/server'
import {
  readCmsPreviewSecretFromRequest,
  verifyCmsPreviewSecret,
  type CmsPreviewError,
} from '@/lib/api/preview'
import { diagnoseCmsFactsApi } from '@/lib/cms/diagnostics'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    verifyCmsPreviewSecret(readCmsPreviewSecretFromRequest(request))
    const diagnostics = await diagnoseCmsFactsApi()

    return NextResponse.json({
      contract: {
        version: 'api-contract-v1',
        name: 'cms-diagnostics',
        normalizedBy: 'adapter/domain',
        boundary: 'api-route',
      },
      data: diagnostics,
    }, { status: diagnostics.ok ? 200 : 422 })
  } catch (error) {
    const cmsError = error as Partial<CmsPreviewError>

    return NextResponse.json({
      contract: {
        version: 'api-contract-v1',
        name: 'cms-diagnostics',
        normalizedBy: 'adapter/domain',
        boundary: 'api-route',
      },
      error: {
        code: cmsError.code ?? 'cms-diagnostics-failed',
        message: error instanceof Error ? error.message : 'Unknown CMS diagnostics error.',
      },
    }, { status: cmsError.status ?? 500 })
  }
}
