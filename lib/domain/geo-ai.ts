import type {
  CategoryId,
  EvidenceId,
  LocaleCode,
  NonEmptyReadonlyArray,
  ProductCanonicalPath,
  ProductId,
  RevisionString,
  SourceRef,
} from './primitives'

export type GeoAiClaimType =
  | 'identity'
  | 'capability'
  | 'measurement-range'
  | 'compatibility'
  | 'installation'
  | 'compliance'
  | 'limitation'
  | 'selection-guidance'

export type GeoAiAudience = 'buyer' | 'engineer' | 'oem' | 'maintenance' | 'ai-assistant'

export interface GeoAiEntityProfile {
  readonly productId: ProductId
  readonly canonicalName: string
  readonly model: string
  readonly brand: string
  readonly canonicalPath: ProductCanonicalPath
  readonly categoryIds: NonEmptyReadonlyArray<CategoryId>
  readonly sameAs?: readonly string[]
}

export interface GeoAiAnswerSummary {
  readonly oneSentence: string
  readonly shortParagraph: string
  readonly technicalAbstract: string
  readonly primaryUseCases: NonEmptyReadonlyArray<string>
  readonly notRecommendedFor?: readonly string[]
}

export interface GeoAiFact {
  readonly id: EvidenceId
  readonly claimType: GeoAiClaimType
  readonly label: string
  readonly value: string
  readonly unit?: string
  readonly sourceRefs: NonEmptyReadonlyArray<SourceRef>
}

export interface GeoAiSelectionGuidance {
  readonly bestFor: NonEmptyReadonlyArray<string>
  readonly decisionCriteria: NonEmptyReadonlyArray<string>
  readonly compatibleMedia?: readonly string[]
  readonly installationNotes?: readonly string[]
  readonly requiredOptions?: readonly string[]
}

export interface GeoAiEvidence {
  readonly id: EvidenceId
  readonly title: string
  readonly sourceType: 'datasheet' | 'manual' | 'certificate' | 'test-report' | 'catalog' | 'engineering-note'
  readonly href?: string
  readonly revision?: RevisionString
  readonly updatedAt?: string
}

export interface GeoAiFaqItem {
  readonly question: string
  readonly answer: string
  readonly audience: GeoAiAudience
  readonly sourceRefs: NonEmptyReadonlyArray<SourceRef>
}

export interface GeoAiGovernance {
  readonly schemaVersion: 'product-geo-ai-profile-v1'
  readonly locale: LocaleCode
  readonly lastReviewedAt: string
  readonly reviewedBy: 'domain-owner' | 'product-engineering' | 'technical-marketing'
  readonly allowedForAiExtraction: boolean
}

export interface ProductGeoAiProfile {
  readonly governance: GeoAiGovernance
  readonly entity: GeoAiEntityProfile
  readonly answerSummary: GeoAiAnswerSummary
  readonly factTable: NonEmptyReadonlyArray<GeoAiFact>
  readonly selectionGuidance: GeoAiSelectionGuidance
  readonly evidence: NonEmptyReadonlyArray<GeoAiEvidence>
  readonly faq: readonly GeoAiFaqItem[]
}
