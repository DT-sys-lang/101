import { jsonContract, jsonContractError } from '@/lib/api/contracts'
import { getInquiryApiContract } from '@/lib/api/inquiry'
import { submitInquiry } from '@/lib/server/inquiry'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_BODY_BYTES = 32 * 1024
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 5
const inquiryRateLimit = new Map<string, { count: number; resetAt: number }>()

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? 0)

  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return jsonContractError('inquiry', 'inquiry-payload-too-large', 'Inquiry payload is too large.', 413)
  }

  if (!isAllowedOrigin(request)) {
    return jsonContractError('inquiry', 'inquiry-origin-rejected', 'Inquiry request origin is not allowed.', 403)
  }

  const clientKey = getClientKey(request)
  const rateLimit = consumeRateLimit(clientKey)

  if (!rateLimit.allowed) {
    return Response.json(
      { ok: false, contract: 'inquiry', error: { code: 'inquiry-rate-limited', message: 'Too many inquiry attempts. Please retry later.' } },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
    )
  }

  try {
    const payload = await request.json() as unknown

    if (isHoneypotFilled(payload)) {
      return new Response(null, { status: 204 })
    }

    const result = await submitInquiry(payload)
    return jsonContract('inquiry', result)
  } catch (error) {
    const message = getErrorMessage(error)
    const isInvalidPayload = error instanceof SyntaxError || message.startsWith('Inquiry ')
    return jsonContractError(
      'inquiry',
      isInvalidPayload ? 'invalid-inquiry-payload' : 'inquiry-submit-failed',
      message,
      isInvalidPayload ? 400 : 502,
    )
  }
}

function isAllowedOrigin(request: Request) {
  const origin = request.headers.get('origin')

  if (!origin) {
    return true
  }

  try {
    const allowedHosts = new Set([new URL(request.url).host])
    const configuredSiteOrigin = process.env.NEXT_PUBLIC_SITE_ORIGIN?.trim()
    const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()

    if (configuredSiteOrigin) {
      allowedHosts.add(new URL(configuredSiteOrigin).host)
    }

    if (forwardedHost) {
      allowedHosts.add(forwardedHost)
    }

    return allowedHosts.has(new URL(origin).host)
  } catch {
    return false
  }
}

function getClientKey(request: Request) {
  return request.headers.get('cf-connecting-ip')
    ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? 'unknown'
}

function consumeRateLimit(key: string) {
  const now = Date.now()
  const current = inquiryRateLimit.get(key)

  if (!current || current.resetAt <= now) {
    inquiryRateLimit.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    pruneExpiredRateLimits(now)
    return { allowed: true, retryAfterSeconds: 0 }
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) }
  }

  current.count += 1
  return { allowed: true, retryAfterSeconds: 0 }
}

function pruneExpiredRateLimits(now: number) {
  if (inquiryRateLimit.size < 1000) {
    return
  }

  for (const [key, entry] of inquiryRateLimit) {
    if (entry.resetAt <= now) {
      inquiryRateLimit.delete(key)
    }
  }
}

function isHoneypotFilled(value: unknown) {
  return Boolean(value && typeof value === 'object' && 'website' in value && typeof value.website === 'string' && value.website.trim())
}

export function GET() {
  return jsonContract('inquiry', getInquiryApiContract())
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown inquiry error.'
}
