import type {
  ApplicationCanonicalPath,
  ApplicationId,
  IndustryId,
  LocaleCode,
  LocalizedText,
  NonEmptyReadonlyArray,
  ProductId,
  SlugSegment,
  SourceRef,
} from './primitives'
import type { GeoAiAudience } from './geo-ai'
import type { SearchIntent, SeoIndexingPolicy, SeoOpenGraphFields } from './seo'

export type ApplicationIntent =
  | 'high-pressure-measurement'
  | 'industrial-pipeline-monitoring'
  | 'oem-sensor-integration'
  | 'tank-level-monitoring'
  | 'pump-protection'
  | 'process-temperature-control'

export interface ApplicationSeoContract {
  readonly locale: LocaleCode
  readonly canonicalPath: ApplicationCanonicalPath
  readonly title: string
  readonly metaDescription: string
  readonly h1: string
  readonly indexingPolicy: SeoIndexingPolicy
  readonly searchIntent: NonEmptyReadonlyArray<SearchIntent | 'use-case-long-tail'>
  readonly targetKeywords: NonEmptyReadonlyArray<string>
  readonly openGraph: SeoOpenGraphFields
}

export interface ApplicationAnswerBlock {
  readonly id: string
  readonly audience: GeoAiAudience
  readonly question: LocalizedText
  readonly answer: LocalizedText
  readonly sourceRefs: readonly SourceRef[]
}

export interface ApplicationRecord {
  readonly id: ApplicationId
  readonly intent: ApplicationIntent
  readonly slug: SlugSegment
  readonly industryIds: NonEmptyReadonlyArray<IndustryId>
  readonly canonicalPath: ApplicationCanonicalPath
  readonly name: LocalizedText
  readonly problemStatement: LocalizedText
  readonly solutionSummary: LocalizedText
  readonly selectionCriteria: NonEmptyReadonlyArray<LocalizedText>
  readonly recommendedProductIds: readonly ProductId[]
  readonly answerBlocks: NonEmptyReadonlyArray<ApplicationAnswerBlock>
  readonly seo: Record<LocaleCode, ApplicationSeoContract>
}

export const applicationSystemContract = {
  version: 'application-system-v1',
  routePattern: '/{locale}/applications/{applicationSlug}',
  purpose: 'Application pages are GEO entry points and long-tail SEO landing pages.',
  requiredSeedIntents: [
    'high-pressure-measurement',
    'industrial-pipeline-monitoring',
    'oem-sensor-integration',
  ],
  requiredPageBlocks: [
    'problem statement',
    'sensor selection guidance',
    'recommended products',
    'AI answer blocks',
    'evidence refs',
    'RFQ conversion block',
  ],
} as const
