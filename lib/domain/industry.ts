import type {
  ApplicationId,
  IndustryCanonicalPath,
  IndustryId,
  LocaleCode,
  LocalizedText,
  NonEmptyReadonlyArray,
  ProductId,
  SlugSegment,
} from './primitives'
import type { SearchIntent, SeoIndexingPolicy, SeoOpenGraphFields } from './seo'

export type IndustryKey =
  | 'oil-gas'
  | 'water-treatment'
  | 'industrial-automation'
  | 'energy'
  | 'manufacturing'
  | 'chemical-processing'

export interface IndustrySeoContract {
  readonly locale: LocaleCode
  readonly canonicalPath: IndustryCanonicalPath
  readonly title: string
  readonly metaDescription: string
  readonly h1: string
  readonly indexingPolicy: SeoIndexingPolicy
  readonly searchIntent: NonEmptyReadonlyArray<SearchIntent | 'industry-landing'>
  readonly targetKeywords: NonEmptyReadonlyArray<string>
  readonly openGraph: SeoOpenGraphFields
}

export interface IndustryRecord {
  readonly id: IndustryId
  readonly key: IndustryKey
  readonly slug: SlugSegment
  readonly canonicalPath: IndustryCanonicalPath
  readonly name: LocalizedText
  readonly summary: LocalizedText
  readonly painPoints: NonEmptyReadonlyArray<LocalizedText>
  readonly sensorRequirements: NonEmptyReadonlyArray<LocalizedText>
  readonly recommendedProductIds: readonly ProductId[]
  readonly applicationIds: readonly ApplicationId[]
  readonly seo: Record<LocaleCode, IndustrySeoContract>
}

export const targetIndustryKeys = [
  'oil-gas',
  'water-treatment',
  'industrial-automation',
  'energy',
  'manufacturing',
  'chemical-processing',
] as const satisfies readonly IndustryKey[]

export const industrySystemContract = {
  version: 'industry-system-v1',
  routePattern: '/{locale}/industries/{industrySlug}',
  purpose: 'Each industry page is an SEO landing page and an internal-linking hub for products and applications.',
  requiredIndustries: targetIndustryKeys,
  requiredPageBlocks: [
    'industry problem framing',
    'measurement requirements',
    'recommended products',
    'related applications',
    'FAQPage schema',
    'RFQ conversion block',
  ],
} as const
