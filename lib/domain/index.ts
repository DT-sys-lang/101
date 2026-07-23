import { architectureFreezeV1 } from './architecture-freeze-v1'
import { applicationSystemContract } from './application'
import { industrialSensorCategoryTree } from './category'
import { finalGrowthSystemTarget } from './system-target'
import { defaultSpecificationRegistry, validateSpecificationDefinitionRegistry } from './specification'
import { industrySystemContract } from './industry'
import { inquirySystemContract } from './inquiry'
import productGeoAiSchema from './geo-ai.schema.json'
import type { ProductCatalogIndex } from './product-catalog'
import {
  getDomainProductRecords,
  getDomainProductSource,
  getProductCatalog,
  listHomepageProducts,
  listProducts,
  productCatalogs,
} from './product-source'
import { productDetailDataFlow } from './product-detail-flow'
import type { LocaleCode } from './primitives'
import { seoSlugStrategy } from './seo'
import { searchIntentMappingContract } from './intent-mapping'

const productRecords = getDomainProductRecords()
const productSource = getDomainProductSource()

export interface IndustrialSensorDomain {
  readonly architecture: typeof architectureFreezeV1
  readonly singleSourceOfTruth: {
    readonly productSource: typeof productSource
    readonly categoryTree: typeof industrialSensorCategoryTree
    readonly seoSlugStrategy: typeof seoSlugStrategy
    readonly geoAiSchema: typeof productGeoAiSchema
    readonly productDetailFlow: typeof productDetailDataFlow
    readonly specificationRegistry: typeof defaultSpecificationRegistry
    readonly searchIntentMapping: typeof searchIntentMappingContract
  }
  readonly product: {
    readonly records: typeof productRecords
    readonly count: number
    readonly intendedScale: '1000-plus-products'
  }
  readonly category: {
    readonly tree: typeof industrialSensorCategoryTree
  }
  readonly specification: {
    readonly registry: typeof defaultSpecificationRegistry
    readonly validationErrors: readonly string[]
  }
  readonly seo: {
    readonly slugStrategy: typeof seoSlugStrategy
    readonly intentMapping: typeof searchIntentMappingContract
  }
  readonly geo: {
    readonly schema: typeof productGeoAiSchema
    readonly profileVersion: 'product-geo-ai-profile-v1'
  }
  readonly industry: {
    readonly contract: typeof industrySystemContract
  }
  readonly application: {
    readonly contract: typeof applicationSystemContract
  }
  readonly inquiry: {
    readonly contract: typeof inquirySystemContract
  }
  readonly target: typeof finalGrowthSystemTarget
  readonly catalogs: Readonly<Record<LocaleCode, ProductCatalogIndex>>
}


export const domain = {
  architecture: architectureFreezeV1,
  singleSourceOfTruth: {
    productSource,
    categoryTree: industrialSensorCategoryTree,
    seoSlugStrategy,
    geoAiSchema: productGeoAiSchema,
    productDetailFlow: productDetailDataFlow,
    specificationRegistry: defaultSpecificationRegistry,
    searchIntentMapping: searchIntentMappingContract,
  },
  product: {
    records: productRecords,
    count: productRecords.length,
    intendedScale: productSource.intendedScale,
  },
  category: {
    tree: industrialSensorCategoryTree,
  },
  specification: {
    registry: defaultSpecificationRegistry,
    validationErrors: validateSpecificationDefinitionRegistry(defaultSpecificationRegistry),
  },
  seo: {
    slugStrategy: seoSlugStrategy,
    intentMapping: searchIntentMappingContract,
  },
  geo: {
    schema: productGeoAiSchema,
    profileVersion: 'product-geo-ai-profile-v1',
  },
  industry: {
    contract: industrySystemContract,
  },
  application: {
    contract: applicationSystemContract,
  },
  inquiry: {
    contract: inquirySystemContract,
  },
  target: finalGrowthSystemTarget,
  catalogs: productCatalogs,
} as const satisfies IndustrialSensorDomain

export * from './architecture-freeze-v1'
export * from './application'
export * from './category'
export * from './geo-ai'
export * from './industry'
export * from './intent-mapping'
export * from './inquiry'
export * from './primitives'
export * from './product'
export * from './product-catalog'
export * from './product-source'
export * from './page-view-models'
export * from './product-detail-flow'
export * from './product-navigation'
export * from './seo'
export * from './specification'
export * from './site'
export * from './system-target'
