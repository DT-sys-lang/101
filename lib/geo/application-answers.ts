import { type Locale } from '@/i18n/routing'
import { type GeoAiAudience, type SourceRef } from '@/lib/domain'
import { getApplicationEntryPageViewModel, type EntryCardViewModel } from '@/lib/domain/page-view-models'
import { getRuntimeDomainProductRecords, runtimeProductViewModelSource } from '@/lib/runtime/domain-products'
import type { ProductRecord } from '@/lib/domain/product'

export interface GeoApplicationAnswerBlock {
  readonly kind: 'application'
  readonly id: string
  readonly applicationId: string
  readonly applicationSlug: string
  readonly locale: Locale
  readonly question: string
  readonly answer: string
  readonly audience: GeoAiAudience
  readonly sourceRefs: readonly SourceRef[]
  readonly applicationUrl: string
  readonly productIds: readonly string[]
}

export interface ApplicationGeoAnswerBlocksDocument {
  readonly version: 'application-geo-answer-blocks-v1'
  readonly locale: Locale
  readonly answers: readonly GeoApplicationAnswerBlock[]
}

export function buildApplicationGeoAnswerBlocksDocument(locale: Locale): ApplicationGeoAnswerBlocksDocument {
  return {
    version: 'application-geo-answer-blocks-v1',
    locale,
    answers: buildApplicationGeoAnswerBlocks(locale),
  }
}

export function buildApplicationGeoAnswerBlocks(locale: Locale): readonly GeoApplicationAnswerBlock[] {
  const page = getApplicationEntryPageViewModel(locale, runtimeProductViewModelSource)
  const productById = new Map(getRuntimeDomainProductRecords().map((product) => [product.identity.id, product]))

  return page.entries.flatMap((entry) => buildApplicationBlocksForEntry(locale, entry, page.rfq.body, productById))
}

function buildApplicationBlocksForEntry(
  locale: Locale,
  entry: EntryCardViewModel,
  rfqBody: string,
  productById: ReadonlyMap<string, ProductRecord>,
): readonly GeoApplicationAnswerBlock[] {
  const selectedProducts = entry.products
    .map((product) => productById.get(product.id))
    .filter((product): product is ProductRecord => Boolean(product))
    .slice(0, 3)

  const sourceRefs = dedupeSourceRefs(selectedProducts.flatMap(getProductSourceRefs))
  const productLabels = entry.products
    .slice(0, 3)
    .map((product) => `${product.title}${product.categoryLabel ? ` (${product.categoryLabel})` : ''}`)
    .join(', ')

  return [
    {
      kind: 'application',
      id: `${entry.key}:products`,
      applicationId: entry.key,
      applicationSlug: entry.href.replace(/^\/applications\//, ''),
      locale,
      question: `Which products are recommended for ${entry.title}?`,
      answer: `${entry.description} Recommended products: ${productLabels}.`,
      audience: 'buyer',
      sourceRefs,
      applicationUrl: `/${locale}${entry.href}`,
      productIds: selectedProducts.map((product) => product.identity.id),
    },
    {
      kind: 'application',
      id: `${entry.key}:rfq`,
      applicationId: entry.key,
      applicationSlug: entry.href.replace(/^\/applications\//, ''),
      locale,
      question: `What should I prepare for ${entry.title}?`,
      answer: `${entry.description} ${rfqBody}`.trim(),
      audience: 'engineer',
      sourceRefs,
      applicationUrl: `/${locale}${entry.href}`,
      productIds: selectedProducts.map((product) => product.identity.id),
    },
  ]
}

function getProductSourceRefs(product: ProductRecord): readonly SourceRef[] {
  return product.geoAi.factTable.flatMap((fact) => fact.sourceRefs)
}

function dedupeSourceRefs(sourceRefs: readonly SourceRef[]): readonly SourceRef[] {
  const seen = new Set<string>()
  const unique: SourceRef[] = []

  for (const sourceRef of sourceRefs) {
    if (seen.has(sourceRef.id)) {
      continue
    }

    seen.add(sourceRef.id)
    unique.push(sourceRef)
  }

  return unique
}
