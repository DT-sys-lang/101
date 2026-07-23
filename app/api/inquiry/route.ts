import { jsonContract, jsonContractError } from '@/lib/api/contracts'
import { getInquiryApiContract } from '@/lib/api/inquiry'
import { submitInquiry } from '@/lib/server/inquiry'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const result = await submitInquiry(await request.json())
    return jsonContract('inquiry', result)
  } catch (error) {
    const message = getErrorMessage(error)
    const isInvalidPayload = message.startsWith('Inquiry ')
    return jsonContractError(
      'inquiry',
      isInvalidPayload ? 'invalid-inquiry-payload' : 'inquiry-submit-failed',
      message,
      isInvalidPayload ? 400 : 502,
    )
  }
}

export function GET() {
  return jsonContract('inquiry', getInquiryApiContract())
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown inquiry error.'
}
