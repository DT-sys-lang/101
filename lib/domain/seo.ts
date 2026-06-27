import type {
  CategoryCanonicalPath,
  CategoryId,
  LocaleCode,
  NonEmptyReadonlyArray,
  ProductCanonicalPath,
  SlugSegment,
} from './primitives'

export type SeoIndexingPolicy = 'index-follow' | 'noindex-follow' | 'noindex-nofollow'

export type SearchIntent =
  | 'category-discovery'
  | 'model-lookup'
  | 'technical-comparison'
  | 'application-selection'
  | 'oem-customization'
  | 'datasheet-download'
  | 'quote-request'

export interface SeoBreadcrumbItem {
  readonly label: string
  readonly canonicalPath: CategoryCanonicalPath | ProductCanonicalPath
  readonly categoryId?: CategoryId
}

export interface LocalizedCanonicalPath {
  readonly locale: LocaleCode
  readonly canonicalPath: ProductCanonicalPath | CategoryCanonicalPath
}

export interface SeoOpenGraphFields {
  readonly title: string
  readonly description: string
  readonly imageUrl?: string
  readonly imageAlt?: string
  readonly type: 'website' | 'product'
}

export interface ProductOfferJsonLd {
  readonly '@type': 'Offer'
  readonly availability?: string
  readonly priceCurrency?: string
  readonly price?: string
  readonly url?: string
}

export interface ProductPropertyValueJsonLd {
  readonly '@type': 'PropertyValue'
  readonly name: string
  readonly value: string
  readonly unitText?: string
}

export interface ProductJsonLd {
  readonly '@context': 'https://schema.org'
  readonly '@type': 'Product'
  readonly name: string
  readonly sku: string
  readonly mpn?: string
  readonly brand: {
    readonly '@type': 'Brand'
    readonly name: string
  }
  readonly category: string
  readonly description: string
  readonly url: ProductCanonicalPath
  readonly image?: readonly string[]
  readonly additionalProperty?: readonly ProductPropertyValueJsonLd[]
  readonly offers?: ProductOfferJsonLd
}

export interface ProductSlugFields {
  readonly segment: SlugSegment
  readonly categoryPath: NonEmptyReadonlyArray<SlugSegment>
  readonly canonicalPath: ProductCanonicalPath
  readonly aliases?: readonly ProductCanonicalPath[]
  readonly redirectFrom?: readonly ProductCanonicalPath[]
}

export interface ProductSeoFields {
  readonly locale: LocaleCode
  readonly slug: ProductSlugFields
  readonly title: string
  readonly metaDescription: string
  readonly h1: string
  readonly indexingPolicy: SeoIndexingPolicy
  readonly searchIntent: NonEmptyReadonlyArray<SearchIntent>
  readonly breadcrumb: NonEmptyReadonlyArray<SeoBreadcrumbItem>
  readonly alternates: readonly LocalizedCanonicalPath[]
  readonly openGraph: SeoOpenGraphFields
  readonly jsonLd: ProductJsonLd
}

export interface CategorySeoFields {
  readonly locale: LocaleCode
  readonly canonicalPath: CategoryCanonicalPath
  readonly title: string
  readonly metaDescription: string
  readonly h1: string
  readonly indexingPolicy: SeoIndexingPolicy
  readonly searchIntent: NonEmptyReadonlyArray<SearchIntent>
  readonly breadcrumb: NonEmptyReadonlyArray<SeoBreadcrumbItem>
  readonly alternates: readonly LocalizedCanonicalPath[]
  readonly openGraph: SeoOpenGraphFields
}

export interface SeoSlugStrategy {
  readonly version: 'seo-slug-v1'
  readonly productPathPattern: '/products/{root-category}/{family}/{function}/{product-slug}'
  readonly categoryPathPattern: '/products/{root-category}/{family}/{function?}'
  readonly localePolicy: 'locale-prefix-outside-domain'
  readonly stableKeys: readonly ['categoryPath', 'model', 'series']
  readonly redirectPolicy: 'keep-legacy-aliases-per-product'
}

export const seoSlugStrategy = {
  version: 'seo-slug-v1',
  productPathPattern: '/products/{root-category}/{family}/{function}/{product-slug}',
  categoryPathPattern: '/products/{root-category}/{family}/{function?}',
  localePolicy: 'locale-prefix-outside-domain',
  stableKeys: ['categoryPath', 'model', 'series'],
  redirectPolicy: 'keep-legacy-aliases-per-product',
} as const satisfies SeoSlugStrategy
