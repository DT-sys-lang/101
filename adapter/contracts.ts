import type { CategoryContext } from './category.adapter'
import type { ProductFact } from './validation'

export interface ProductProjectionSource {
  readonly fact: ProductFact
  readonly categoryContext: CategoryContext
  readonly primaryCategory: import('@/lib/domain').CategoryNode
  readonly primaryCategoryPath: import('@/lib/domain').NonEmptyReadonlyArray<import('@/lib/domain').CategoryNode>
  readonly additionalCategoryPaths: readonly import('@/lib/domain').NonEmptyReadonlyArray<import('@/lib/domain').CategoryNode>[]
  readonly productSlug: import('@/lib/domain').SlugSegment
  readonly canonicalPath: import('@/lib/domain').ProductCanonicalPath
}

export type ProductProjectionLocaleMap<T> = Record<import('@/lib/domain').LocaleCode, T>

export type ProductSeoSource = ProductProjectionSource
export type GeoAiSource = ProductProjectionSource
