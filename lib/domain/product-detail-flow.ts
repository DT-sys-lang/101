import type { CategoryId, LocaleCode, ProductCanonicalPath, ProductId, SeoSlugPath, SlugSegment } from './primitives'

export type ProductDetailFlowStage =
  | 'route-resolution'
  | 'category-resolution'
  | 'product-lookup'
  | 'variant-resolution'
  | 'domain-enrichment'
  | 'seo-projection'
  | 'geo-ai-projection'
  | 'delivery-contract'

export interface ProductDetailDataFlowStep {
  readonly order: number
  readonly stage: ProductDetailFlowStage
  readonly input: string
  readonly domainOwner: 'lib/domain/category' | 'lib/domain/product' | 'lib/domain/seo' | 'lib/domain/geo-ai'
  readonly output: string
  readonly cacheKey?: string
}

export interface ProductRouteKey {
  readonly locale: LocaleCode
  readonly categorySlugPath: SeoSlugPath
  readonly productSlug: SlugSegment
  readonly canonicalPath: ProductCanonicalPath
}

export interface ProductDetailLookupResult {
  readonly routeKey: ProductRouteKey
  readonly productId: ProductId
  readonly primaryCategoryId: CategoryId
  readonly resolvedFrom: 'canonical-slug' | 'legacy-alias' | 'model-redirect'
}

export const productDetailDataFlow = [
  {
    order: 1,
    stage: 'route-resolution',
    input: 'locale + /products/{categorySlugPath}/{productSlug}',
    domainOwner: 'lib/domain/seo',
    output: 'ProductRouteKey with canonical path and slug aliases checked',
    cacheKey: 'product-route:{locale}:{categorySlugPath}:{productSlug}',
  },
  {
    order: 2,
    stage: 'category-resolution',
    input: 'ProductRouteKey.categorySlugPath',
    domainOwner: 'lib/domain/category',
    output: 'CategoryPath and primary CategoryNode with facet policy',
    cacheKey: 'category-tree:v1',
  },
  {
    order: 3,
    stage: 'product-lookup',
    input: 'canonical ProductRouteKey + CategoryPath',
    domainOwner: 'lib/domain/product',
    output: 'ProductRecord selected by canonical slug, model redirect, or legacy alias',
    cacheKey: 'product-detail:{locale}:{productId}',
  },
  {
    order: 4,
    stage: 'variant-resolution',
    input: 'ProductRecord.variants + request option filters',
    domainOwner: 'lib/domain/product',
    output: 'Resolved variant set, available option matrix, and commercial terms',
  },
  {
    order: 5,
    stage: 'domain-enrichment',
    input: 'ProductRecord + CategoryNode + documents + evidence refs',
    domainOwner: 'lib/domain/product',
    output: 'ProductDetailProjection with specifications, documents, certifications, and related keys',
  },
  {
    order: 6,
    stage: 'seo-projection',
    input: 'ProductDetailProjection + seoSlugStrategy',
    domainOwner: 'lib/domain/seo',
    output: 'ProductSeoFields including canonical, alternates, breadcrumbs, and Product JSON-LD',
  },
  {
    order: 7,
    stage: 'geo-ai-projection',
    input: 'ProductDetailProjection + source-backed facts',
    domainOwner: 'lib/domain/geo-ai',
    output: 'ProductGeoAiProfile that conforms to product-geo-ai-profile-v1 JSON Schema',
  },
  {
    order: 8,
    stage: 'delivery-contract',
    input: 'ProductDetailProjection + ProductSeoFields + ProductGeoAiProfile',
    domainOwner: 'lib/domain/product',
    output: 'Serializable product detail payload for API, static generation, or CMS sync',
    cacheKey: 'product-detail-payload:{locale}:{productId}:v1',
  },
] as const satisfies readonly ProductDetailDataFlowStep[]
