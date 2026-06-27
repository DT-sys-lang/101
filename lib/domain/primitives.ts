export type ArchitectureFreezeVersion = 'architecture-freeze-v1'

export type LocaleCode = 'en' | 'zh'

export type LocalizedText = Readonly<
  Record<LocaleCode, string> & Partial<Record<string, string>>
>

export type NonEmptyReadonlyArray<T> = readonly [T, ...T[]]

export type DomainId<TPrefix extends string> = `${TPrefix}_${string}`

export type ProductId = DomainId<'prd'>
export type ProductVariantId = DomainId<'var'>
export type CategoryId = DomainId<'cat'>
export type SeriesId = DomainId<'ser'>
export type IndustryId = DomainId<'ind'>
export type ApplicationId = DomainId<'app'>
export type DocumentId = DomainId<'doc'>
export type AssetId = DomainId<'asset'>
export type EvidenceId = DomainId<'evidence'>
export type InquiryId = DomainId<'inq'>

export type IsoDateString = `${number}-${number}-${number}`
export type RevisionString = `v${number}` | `v${number}.${number}` | `v${number}.${number}.${number}`

export type SlugSegment = Lowercase<string>
export type SeoSlugPath =
  | SlugSegment
  | `${SlugSegment}/${SlugSegment}`
  | `${SlugSegment}/${SlugSegment}/${SlugSegment}`
  | `${SlugSegment}/${SlugSegment}/${SlugSegment}/${SlugSegment}`
  | `${SlugSegment}/${SlugSegment}/${SlugSegment}/${SlugSegment}/${SlugSegment}`

export type CategoryCanonicalPath = `/products/${SeoSlugPath}`
export type ProductCanonicalPath = `/products/${SeoSlugPath}/${SlugSegment}`
export type IndustryCanonicalPath = `/industries/${SlugSegment}`
export type ApplicationCanonicalPath =
  | `/applications/${SlugSegment}`
  | `/applications/${SlugSegment}/${SlugSegment}`

export type UnitCode =
  | 'pa'
  | 'kpa'
  | 'mpa'
  | 'bar'
  | 'mbar'
  | 'psi'
  | 'mh2o'
  | 'mm'
  | 'm'
  | 'c'
  | 'f'
  | 'k'
  | 'ma'
  | 'v'
  | 'mv'
  | 'hz'
  | 'percent'
  | 'ph'
  | 'us_cm'
  | 'cycle'
  | 'custom'

export type IngressProtectionCode = `IP${number}${number}`

export type ConfidenceLevel = 'source-backed' | 'derived' | 'editorial' | 'unverified'

export interface QuantityValue {
  readonly value: number
  readonly unit: UnitCode
  readonly display: string
}

export interface QuantityRange {
  readonly min: number
  readonly max: number
  readonly unit: UnitCode
  readonly display: string
}

export interface SourceRef {
  readonly id: DocumentId | EvidenceId
  readonly label: string
  readonly href?: string
  readonly page?: number
  readonly confidence: ConfidenceLevel
}
