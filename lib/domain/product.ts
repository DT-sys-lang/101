import type {
  ApplicationId,
  AssetId,
  CategoryId,
  DocumentId,
  IndustryId,
  IngressProtectionCode,
  IsoDateString,
  LocaleCode,
  LocalizedText,
  NonEmptyReadonlyArray,
  ProductId,
  ProductVariantId,
  QuantityRange,
  QuantityValue,
  SeriesId,
  SourceRef,
  UnitCode,
} from './primitives'
import type { ProductGeoAiProfile } from './geo-ai'
import type { SpecificationKey } from './specification'
import type { ProductSeoFields } from './seo'

export type ProductLifecycleStatus = 'draft' | 'active' | 'phase-out' | 'discontinued' | 'hidden'
export type ProductFamily = 'sensor' | 'valve'

export type ProductAvailabilityStatus =
  | 'stock-model'
  | 'standard-lead-time'
  | 'configurable'
  | 'made-to-order'
  | 'quote-required'
  | 'not-available'

export type MeasurementKind =
  | 'pressure'
  | 'differential-pressure'
  | 'level'
  | 'temperature'
  | 'flow'
  | 'humidity'
  | 'conductivity'
  | 'ph'
  | 'position'
  | 'vibration'
  | 'speed'
  | 'switch-state'

export type SignalOutputKind = 'analog-current' | 'analog-voltage' | 'relay' | 'switch' | 'pulse' | 'fieldbus' | 'wireless'

export type ProcessConnectionKind = 'thread' | 'flange' | 'clamp' | 'submersible-cable' | 'probe' | 'remote' | 'none'

export type ElectricalConnectionKind = 'cable' | 'm12' | 'din43650' | 'terminal-head' | 'connector' | 'wireless' | 'custom'

export type CertificationCode =
  | 'ce'
  | 'rohs'
  | 'atex'
  | 'iecex'
  | 'sil'
  | 'iso9001'
  | 'food-grade'
  | 'marine'
  | 'custom'

export interface ProductCore {
  readonly family: ProductFamily
  readonly sku: string
  readonly model: string
  readonly brand: string
  readonly primaryCategory: CategoryId
  readonly name: LocalizedText
  readonly shortName: LocalizedText
  readonly summary: LocalizedText
}

export interface ProductIdentity {
  readonly id: ProductId
  readonly sku: string
  readonly model: string
  readonly family: ProductFamily
  readonly seriesId?: SeriesId
  readonly brand: string
  readonly manufacturer?: string
  readonly availability: ProductAvailabilityStatus
  readonly releasedAt?: IsoDateString
  readonly revisedAt: IsoDateString
}

export interface ProductClassification {
  readonly primaryCategoryId: CategoryId
  readonly categoryPath: NonEmptyReadonlyArray<CategoryId>
  readonly additionalCategoryIds?: readonly CategoryId[]
  readonly industryIds: readonly IndustryId[]
  readonly applicationIds: readonly ApplicationId[]
  readonly measurementKinds: readonly MeasurementKind[]
}

export interface ProductMeasurement {
  readonly kind: MeasurementKind
  readonly range: QuantityRange
  readonly accuracy?: string
  readonly overloadLimit?: QuantityValue
}

export interface ProductSignalOutput {
  readonly kind: SignalOutputKind
  readonly value: string
  readonly protocol?: string
  readonly wiring?: string
}

export interface ProductConnectionSet {
  readonly process: {
    readonly kind: ProcessConnectionKind
    readonly value: string
    readonly material?: string
  }
  readonly electrical: {
    readonly kind: ElectricalConnectionKind
    readonly value: string
  }
}

export interface ProductEnvironmentalLimits {
  readonly ingressProtection?: IngressProtectionCode
  readonly mediaTemperature?: QuantityRange
  readonly ambientTemperature?: QuantityRange
  readonly wettedMaterials: readonly string[]
  readonly compatibleMedia?: readonly string[]
}

export interface SensorProfile {
  readonly measurements: NonEmptyReadonlyArray<ProductMeasurement>
  readonly outputs: NonEmptyReadonlyArray<ProductSignalOutput>
  readonly connections?: ProductConnectionSet
  readonly environmentalLimits?: ProductEnvironmentalLimits
}

export interface ValveProfile {
  readonly pressureRating: string
  readonly connection: string
  readonly material: string
  readonly mode: string
  readonly compatibleMedia: NonEmptyReadonlyArray<string>
  readonly size: string
}

export interface ProductSpecificationValue {
  readonly key: SpecificationKey | (string & {})
  readonly label: string
  readonly value: string | number | boolean
  readonly unit?: UnitCode
  readonly display: string
  readonly sourceRefs?: readonly SourceRef[]
}

export interface ProductSpecificationGroup {
  readonly key: string
  readonly label: string
  readonly values: NonEmptyReadonlyArray<ProductSpecificationValue>
}

export interface ProductOptionValue {
  readonly optionKey: string
  readonly label: string
  readonly value: string
  readonly code?: string
}

export interface ProductVariant {
  readonly id: ProductVariantId
  readonly orderCode: string
  readonly optionValues: readonly ProductOptionValue[]
  readonly measurements?: readonly ProductMeasurement[]
  readonly outputs?: readonly ProductSignalOutput[]
  readonly connections?: ProductConnectionSet
  readonly availability: ProductAvailabilityStatus
}

export interface ProductDocument {
  readonly id: DocumentId
  readonly title: string
  readonly kind: 'datasheet' | 'manual' | 'certificate' | 'drawing' | 'catalog' | 'software'
  readonly href: string
  readonly contentLocale?: string
  readonly revision?: string
}

export interface ProductAsset {
  readonly id: AssetId
  readonly kind: 'primary-image' | 'gallery-image' | 'diagram' | 'dimension-drawing' | 'installation-photo'
  readonly href: string
  readonly alt: string
}

export interface ProductCommercialTerms {
  readonly minimumOrderQuantity?: number
  readonly standardLeadTime?: string
  readonly warranty?: string
  readonly oemCustomizable: boolean
  readonly privateLabelAvailable: boolean
}

export interface ProductContent {
  readonly name: LocalizedText
  readonly shortName: LocalizedText
  readonly summary: LocalizedText
  readonly highlights: readonly LocalizedText[]
  readonly applications: readonly LocalizedText[]
}

export interface ProductRecord {
  readonly id: ProductId
  readonly core: ProductCore
  readonly sensorProfile?: SensorProfile
  readonly valveProfile?: ValveProfile

  /** Compatibility projection during migration to core/profile product records. */
  readonly identity: ProductIdentity
  /** Compatibility projection during migration to core/profile product records. */
  readonly classification: ProductClassification
  /** Compatibility projection during migration to core/profile product records. */
  readonly content: ProductContent
  /** Compatibility projection from `sensorProfile.measurements`; empty for non-sensor products. */
  readonly measurements: readonly ProductMeasurement[]
  /** Compatibility projection from `sensorProfile.outputs`; empty for non-sensor products. */
  readonly outputs: readonly ProductSignalOutput[]
  /** Compatibility projection from `sensorProfile.connections`; undefined for valve-only products. */
  readonly connections?: ProductConnectionSet
  readonly environmentalLimits: ProductEnvironmentalLimits

  readonly specificationGroups: NonEmptyReadonlyArray<ProductSpecificationGroup>
  readonly variants: readonly ProductVariant[]
  readonly certifications?: readonly CertificationCode[]
  readonly documents?: readonly ProductDocument[]
  readonly assets?: readonly ProductAsset[]
  readonly commercialTerms?: ProductCommercialTerms
  readonly seo: ProductSeoFields
  readonly localizedSeo?: Partial<Record<LocaleCode, ProductSeoFields>>
  readonly geoAi: ProductGeoAiProfile
  readonly localizedGeoAi?: Partial<Record<LocaleCode, ProductGeoAiProfile>>
}

export type ProductListingProjection = Pick<ProductRecord, 'id' | 'core' | 'identity' | 'classification' | 'content' | 'sensorProfile' | 'valveProfile' | 'seo'>

export type ProductDetailProjection = ProductRecord
