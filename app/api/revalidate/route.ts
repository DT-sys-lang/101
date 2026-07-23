import { jsonContract, jsonContractError, isRuntimeLocale } from '@/lib/api/contracts'
import { calculateRevalidationImpact, type RevalidationInput, type RevalidationScope } from '@/lib/api/revalidation'
import type { CategoryId, ProductId } from '@/lib/domain'

export const dynamic = 'force-dynamic'

const scopes: readonly RevalidationScope[] = ['all', 'product', 'category', 'geo', 'feed', 'static']

export async function GET(request: Request) {
  const input = parseInputFromUrl(request)
  return jsonContract('revalidate', calculateRevalidationImpact(input))
}

export function POST() {
  return jsonContractError(
    'revalidate',
    'revalidate-endpoint-disabled',
    'Use the signed CMS revalidation endpoint instead.',
    405,
  )
}

function parseInputFromUrl(request: Request): RevalidationInput {
  const url = new URL(request.url)

  return normalizeInput({
    scope: url.searchParams.get('scope') ?? undefined,
    locale: url.searchParams.get('locale') ?? undefined,
    productId: url.searchParams.get('productId') ?? undefined,
    categoryId: url.searchParams.get('categoryId') ?? undefined,
  })
}

function normalizeInput(value: unknown): RevalidationInput {
  if (!value || typeof value !== 'object') {
    return {}
  }

  const raw = value as Record<string, unknown>
  const scope = typeof raw.scope === 'string' && scopes.includes(raw.scope as RevalidationScope)
    ? raw.scope as RevalidationScope
    : undefined
  const locale = typeof raw.locale === 'string' && isRuntimeLocale(raw.locale)
    ? raw.locale
    : undefined
  const productId = typeof raw.productId === 'string' && raw.productId.startsWith('prd_')
    ? raw.productId as ProductId
    : undefined
  const categoryId = typeof raw.categoryId === 'string' && raw.categoryId.startsWith('cat_')
    ? raw.categoryId as CategoryId
    : undefined

  return {
    scope,
    locale,
    productId,
    categoryId,
  }
}
