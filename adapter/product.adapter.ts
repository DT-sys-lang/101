import { industrialSiteConfig } from '@/lib/domain'
import type {
  CategoryId,
  CategoryNode,
  CategoryTree,
  LocaleCode,
  NonEmptyReadonlyArray,
  ProductCanonicalPath,
  ProductId,
  ProductRecord,
  ProductSeoFields,
  SlugSegment,
} from '@/lib/domain'
import { buildCategoryContext, flattenCategoryNodes, type CategoryContext } from './category.adapter'
import { type ProductProjectionSource } from './contracts'
import {
  buildAnswerSummary,
  buildEvidence,
  buildFactTable,
  buildGeoAiProfile,
  buildLocalizedGeoAiProfiles,
  buildSelectionGuidance,
  type AIReadableIndustrialProduct,
  type ProductGeoSource,
} from './geo.adapter'
import {
  buildCategoryOpenGraphMetadata,
  buildCategorySeoFields,
  buildFAQPageSchema,
  buildItemListSchema,
  buildLocalizedProductSeoFields,
  buildProductCanonicalPath,
  buildProductJsonLd,
  buildProductOpenGraphMetadata,
  buildProductSeoFields,
} from './seo.adapter'
import {
  assertCategoryFact,
  assertCmsFactInput,
  assertProductFact,
  CmsFactValidationError,
  categorySystemGeneratedFields,
  cmsFactValidationRules,
  defaultCmsFactLocales,
  isCategoryFact,
  isCmsFactInput,
  isProductFact,
  normalizeAdapterConfig,
  normalizeCmsFactInput,
  normalizeCmsFactInputWithProductTolerance,
  normalizeCmsFactSourceInput,
  normalizeProductFact,
  normalizeSlug,
  productSystemGeneratedFields,
  reject,
  toProductFactValidationIssue,
  toNonEmptyArray,
  validateCategoryFacts,
  validateProductFactsAgainstCategoryTree,
  validateProductIdentityConsistency,
  type CategoryFact,
  type CategoryFactGraph,
  type CmsFactAdapterOptions,
  type CmsFactInput,
  type ProductFactValidationIssue,
  type ProductFact,
} from './validation'

export const CMS_FACT_ADAPTER_VERSION = 'cms-fact-layer-domain-adapter-v1'

export interface CmsDomainBuildResult {
  readonly categoryTree: CategoryTree
  readonly products: readonly ProductRecord[]
}

export interface CmsTolerantDomainBuildResult extends CmsDomainBuildResult {
  readonly inputProductCount: number
  readonly rejectedProductFacts: readonly ProductFactValidationIssue[]
}

export function buildDomainFromCmsFacts(input: unknown, options: CmsFactAdapterOptions = {}): CmsDomainBuildResult {
  const normalizedInput = normalizeCmsFactInput(input, options)
  const categoryContext = buildCategoryContext(normalizedInput.categoryFacts, options)
  const products = buildProductRecordsFromFacts(normalizedInput.productFacts, categoryContext, options)

  return {
    categoryTree: categoryContext.tree,
    products,
  }
}

export function buildDomainFromCmsFactsWithProductTolerance(input: unknown, options: CmsFactAdapterOptions = {}): CmsTolerantDomainBuildResult {
  const normalizedInput = normalizeCmsFactInputWithProductTolerance(input, options)
  const categoryContext = buildCategoryContext(normalizedInput.categoryFacts, options)
  const { products, rejectedProductFacts } = buildProductRecordsFromTolerantFacts(
    normalizedInput.productFacts,
    categoryContext,
    options,
    normalizedInput.rejectedProductFacts,
  )

  return {
    categoryTree: categoryContext.tree,
    products,
    inputProductCount: normalizedInput.productFacts.length + normalizedInput.rejectedProductFacts.length,
    rejectedProductFacts,
  }
}

export function buildProductRecordsFromFacts(
  facts: readonly ProductFact[],
  categorySource: CategoryTree | CategoryContext,
  options: CmsFactAdapterOptions = {},
): readonly ProductRecord[] {
  const config = normalizeAdapterConfig(options)
  const categoryContext = normalizeCategoryContext(categorySource, options)

  validateProductFactsAgainstCategoryTree(facts, categoryContext.tree, options)
  validateProductIdentityConsistency(facts)

  const canonicalPaths = new Set<ProductCanonicalPath>()
  const records = facts.map((fact, index) => {
    const record = buildProductRecordFromFact(fact, categoryContext, options, `productFacts[${index}]`)
    validateGeneratedProductRecord(record, categoryContext, config, `productFacts[${index}]`)

    if (canonicalPaths.has(record.seo.slug.canonicalPath)) {
      reject(`productFacts[${index}].seo.slug.canonicalPath`, `generated canonicalPath '${record.seo.slug.canonicalPath}' is duplicated`)
    }

    canonicalPaths.add(record.seo.slug.canonicalPath)
    return record
  })

  return records
}

function buildProductRecordsFromTolerantFacts(
  entries: readonly { readonly index: number; readonly fact: ProductFact }[],
  categorySource: CategoryTree | CategoryContext,
  options: CmsFactAdapterOptions = {},
  initialRejectedProductFacts: readonly ProductFactValidationIssue[] = [],
) {
  const config = normalizeAdapterConfig(options)
  const categoryContext = normalizeCategoryContext(categorySource, options)
  const acceptedProductIds = new Set<ProductId>()
  const acceptedSkus = new Set<string>()
  const acceptedModelSlugs = new Set<SlugSegment>()
  const canonicalPaths = new Set<ProductCanonicalPath>()
  const products: ProductRecord[] = []
  const rejectedProductFacts: ProductFactValidationIssue[] = [...initialRejectedProductFacts]

  for (const entry of entries) {
    const path = `productFacts[${entry.index}]`
    const fact = entry.fact

    try {
      validateProductFactsAgainstCategoryTree([fact], categoryContext.tree, options)

      if (acceptedProductIds.has(fact.id)) {
        reject(`${path}.id`, `duplicate product id '${fact.id}'`)
      }

      if (acceptedSkus.has(fact.sku)) {
        reject(`${path}.sku`, `duplicate product sku '${fact.sku}'`)
      }

      const modelSlug = normalizeSlug(fact.model)

      if (acceptedModelSlugs.has(modelSlug)) {
        reject(`${path}.model`, `duplicate generated model slug '${modelSlug}'`)
      }

      const record = buildProductRecordFromFact(fact, categoryContext, options, path)
      validateGeneratedProductRecord(record, categoryContext, config, path)

      if (canonicalPaths.has(record.seo.slug.canonicalPath)) {
        reject(`${path}.seo.slug.canonicalPath`, `generated canonicalPath '${record.seo.slug.canonicalPath}' is duplicated`)
      }

      acceptedProductIds.add(fact.id)
      acceptedSkus.add(fact.sku)
      acceptedModelSlugs.add(modelSlug)
      canonicalPaths.add(record.seo.slug.canonicalPath)
      products.push(record)
    } catch (error) {
      rejectedProductFacts.push(toProductFactValidationIssue(entry.index, fact, error))
    }
  }

  return {
    products,
    rejectedProductFacts,
  }
}

export function buildProductRecordFromFact(
  fact: ProductFact,
  categorySource: CategoryTree | CategoryContext,
  options: CmsFactAdapterOptions = {},
  path = 'productFact',
): ProductRecord {
  const config = normalizeAdapterConfig(options)
  const categoryContext = normalizeCategoryContext(categorySource, options)

  fact = normalizeSiteBrand(normalizeProductFact(fact, path, config.locales))

  const primaryCategoryPath = categoryContext.pathById.get(fact.primaryCategoryId)

  if (!primaryCategoryPath) {
    reject(`${path}.primaryCategoryId`, `unknown category '${fact.primaryCategoryId}'`)
  }

  const primaryCategory = primaryCategoryPath[primaryCategoryPath.length - 1]
  const productSlug = resolveProductSlug(fact, path)
  const canonicalPath = buildProductCanonicalPath(primaryCategoryPath, productSlug)
  const additionalCategoryPaths = resolveAdditionalCategoryPaths(fact, categoryContext, path)
  const seoSource: ProductProjectionSource = {
    fact,
    categoryContext,
    primaryCategory,
    primaryCategoryPath,
    additionalCategoryPaths,
    productSlug,
    canonicalPath,
  }
  const baseProduct = buildProductCoreRecord(fact, primaryCategoryPath, path)
  const localizedSeo = buildLocalizedProductSeoFields(seoSource)
  const defaultSeo = localizedSeo[config.defaultLocale] ?? buildProductSeoFields(seoSource, config.defaultLocale)
  const productWithSeo: ProductGeoSource = {
    ...baseProduct,
    seo: defaultSeo,
    localizedSeo,
  }
  const localizedGeoAi = buildLocalizedGeoAiProfiles(productWithSeo, primaryCategoryPath, localizedSeo, config.locales)
  const defaultGeoAi = localizedGeoAi[config.defaultLocale] ?? buildGeoAiProfile(productWithSeo, primaryCategoryPath, defaultSeo, config.defaultLocale)

  return {
    ...productWithSeo,
    geoAi: defaultGeoAi,
    localizedGeoAi,
  }
}

function normalizeSiteBrand(fact: ProductFact): ProductFact {
  const brand = industrialSiteConfig.brandName
  return {
    ...fact,
    core: { ...fact.core, brand },
    brand,
    manufacturer: brand,
  }
}

function buildProductCoreRecord(
  fact: ProductFact,
  categoryPath: NonEmptyReadonlyArray<CategoryNode>,
  path: string,
): Omit<ProductRecord, 'seo' | 'localizedSeo' | 'geoAi' | 'localizedGeoAi'> {
  const categoryPathIds = toNonEmptyArray(categoryPath.map((category) => category.id), `${path}.classification.categoryPath`)
  const measurements = fact.sensorProfile ? [...fact.sensorProfile.measurements] : []
  const outputs = fact.sensorProfile ? [...fact.sensorProfile.outputs] : []
  const connections = fact.sensorProfile?.connections ?? fact.connections
  const sensorEnvironmentalLimits = fact.sensorProfile?.environmentalLimits ?? fact.environmentalLimits
  const environmentalLimits = fact.environmentalLimits ?? sensorEnvironmentalLimits ?? {
    wettedMaterials: fact.valveProfile ? [fact.valveProfile.material] : [],
    compatibleMedia: fact.valveProfile?.compatibleMedia ?? [],
  }
  const sensorProfile = fact.sensorProfile
    ? {
        measurements: fact.sensorProfile.measurements,
        outputs: fact.sensorProfile.outputs,
        connections,
        environmentalLimits: sensorEnvironmentalLimits,
      }
    : undefined
  const core = fact.core

  return {
    id: fact.id,
    core,
    sensorProfile,
    valveProfile: fact.valveProfile,
    identity: {
      id: fact.id,
      sku: fact.sku,
      model: fact.model,
      family: core.family,
      seriesId: fact.seriesId,
      brand: fact.brand,
      manufacturer: fact.manufacturer,
      availability: fact.availability,
      releasedAt: fact.releasedAt,
      revisedAt: fact.revisedAt,
    },
    classification: {
      primaryCategoryId: fact.primaryCategoryId,
      categoryPath: categoryPathIds,
      additionalCategoryIds: fact.additionalCategoryIds?.length ? [...fact.additionalCategoryIds] : undefined,
      industryIds: [...fact.industryIds],
      applicationIds: [...fact.applicationIds],
      measurementKinds: [...fact.measurementKinds],
    },
    content: {
      name: fact.name,
      shortName: fact.shortName,
      summary: fact.summary,
      highlights: [...fact.highlights],
      applications: [...fact.applications],
    },
    measurements,
    outputs,
    connections,
    environmentalLimits,
    specificationGroups: toNonEmptyArray(fact.specificationGroups, `${path}.specificationGroups`),
    variants: fact.variants ? [...fact.variants] : [],
    certifications: fact.certifications ? [...fact.certifications] : undefined,
    documents: fact.documents ? [...fact.documents] : undefined,
    assets: fact.assets ? [...fact.assets] : undefined,
    commercialTerms: fact.commercialTerms,
  }
}

function validateGeneratedProductRecord(
  record: ProductRecord,
  categoryContext: CategoryContext,
  config: ReturnType<typeof normalizeAdapterConfig>,
  path: string,
) {
  const primaryCategoryPath = categoryContext.pathById.get(record.classification.primaryCategoryId)

  if (!primaryCategoryPath) {
    reject(`${path}.classification.primaryCategoryId`, 'generated product references unknown primary category')
  }

  const expectedCategoryPathIds = primaryCategoryPath.map((category) => category.id)
  const expectedCategorySlugPath = primaryCategoryPath.map((category) => category.slug)
  const expectedSlug = normalizeSlug(record.identity.model)

  if (!expectedSlug) {
    reject(`${path}.identity.model`, 'generated product model did not produce a valid slug')
  }

  if (!sameArray(record.classification.categoryPath, expectedCategoryPathIds)) {
    reject(`${path}.classification.categoryPath`, 'generated categoryPath does not match CategoryTree')
  }

  if (!sameArray(record.seo.slug.categoryPath, expectedCategorySlugPath)) {
    reject(`${path}.seo.slug.categoryPath`, 'generated SEO categoryPath does not match CategoryTree')
  }

  if (record.seo.slug.segment !== expectedSlug) {
    reject(`${path}.seo.slug.segment`, 'generated SEO slug does not match product model')
  }

  if (record.seo.slug.canonicalPath !== buildProductCanonicalPath(primaryCategoryPath, expectedSlug)) {
    reject(`${path}.seo.slug.canonicalPath`, 'generated SEO canonicalPath does not match CategoryTree and product slug')
  }

  if (record.geoAi.entity.productId !== record.identity.id) {
    reject(`${path}.geoAi.entity.productId`, 'generated GEO entity does not match product identity')
  }

  if (record.geoAi.entity.model !== record.identity.model) {
    reject(`${path}.geoAi.entity.model`, 'generated GEO entity does not match product model')
  }

  if (record.geoAi.entity.brand !== record.identity.brand) {
    reject(`${path}.geoAi.entity.brand`, 'generated GEO entity does not match product brand')
  }

  if (record.geoAi.entity.canonicalPath !== record.seo.slug.canonicalPath) {
    reject(`${path}.geoAi.entity.canonicalPath`, 'generated GEO entity canonicalPath does not match SEO canonicalPath')
  }

  if (!record.seo.title || !record.seo.metaDescription || !record.seo.h1) {
    reject(`${path}.seo`, 'generated SEO fields are incomplete')
  }

  if (!record.seo.jsonLd || record.seo.jsonLd['@type'] !== 'Product') {
    reject(`${path}.seo.jsonLd`, 'generated Product JSON-LD is missing')
  }

  if (record.seo.jsonLd.sku !== record.identity.sku) {
    reject(`${path}.seo.jsonLd.sku`, 'generated ProductJsonLd sku does not match identity sku')
  }

  if (record.seo.jsonLd.brand.name !== record.identity.brand) {
    reject(`${path}.seo.jsonLd.brand`, 'generated ProductJsonLd brand does not match identity brand')
  }

  for (const locale of config.locales) {
    const localizedSeo = record.localizedSeo?.[locale]
    const localizedGeoAi = record.localizedGeoAi?.[locale]

    if (!localizedSeo) {
      reject(`${path}.localizedSeo.${locale}`, 'missing generated localized SEO fields')
    }

    if (!localizedGeoAi) {
      reject(`${path}.localizedGeoAi.${locale}`, 'missing generated localized GEO profile')
    }

    if (localizedSeo.locale !== locale) {
      reject(`${path}.localizedSeo.${locale}.locale`, 'localized SEO locale mismatch')
    }

    if (localizedSeo.slug.canonicalPath !== record.seo.slug.canonicalPath) {
      reject(`${path}.localizedSeo.${locale}.slug.canonicalPath`, 'localized SEO canonicalPath does not match primary canonicalPath')
    }

    if (localizedSeo.jsonLd.sku !== record.identity.sku) {
      reject(`${path}.localizedSeo.${locale}.jsonLd.sku`, 'localized ProductJsonLd sku does not match identity sku')
    }

    if (localizedSeo.jsonLd.brand.name !== record.identity.brand) {
      reject(`${path}.localizedSeo.${locale}.jsonLd.brand`, 'localized ProductJsonLd brand does not match identity brand')
    }

    if (localizedGeoAi.governance.locale !== locale) {
      reject(`${path}.localizedGeoAi.${locale}.governance.locale`, 'localized GEO locale mismatch')
    }

    if (localizedGeoAi.entity.canonicalPath !== record.seo.slug.canonicalPath) {
      reject(`${path}.localizedGeoAi.${locale}.entity.canonicalPath`, 'localized GEO canonicalPath does not match primary canonicalPath')
    }

    if (localizedGeoAi.entity.productId !== record.identity.id) {
      reject(`${path}.localizedGeoAi.${locale}.entity.productId`, 'localized GEO entity productId mismatch')
    }

    if (localizedGeoAi.entity.model !== record.identity.model) {
      reject(`${path}.localizedGeoAi.${locale}.entity.model`, 'localized GEO entity model mismatch')
    }

    if (localizedGeoAi.entity.brand !== record.identity.brand) {
      reject(`${path}.localizedGeoAi.${locale}.entity.brand`, 'localized GEO entity brand mismatch')
    }

    if (!localizedGeoAi.answerSummary.oneSentence || !localizedGeoAi.answerSummary.shortParagraph || !localizedGeoAi.answerSummary.technicalAbstract) {
      reject(`${path}.localizedGeoAi.${locale}.answerSummary`, 'localized GEO summary is incomplete')
    }

    if (!localizedGeoAi.factTable.length || !localizedGeoAi.faq.length) {
      reject(`${path}.localizedGeoAi.${locale}`, 'localized GEO profile is incomplete')
    }
  }
}

function resolveProductSlug(fact: ProductFact, path: string): SlugSegment {
  const slug = normalizeSlug(fact.model)

  if (!slug) {
    reject(`${path}.model`, 'model did not produce a valid product slug')
  }

  return slug
}

function resolveAdditionalCategoryPaths(
  fact: ProductFact,
  categoryContext: CategoryContext,
  path: string,
): readonly NonEmptyReadonlyArray<CategoryNode>[] {
  const additionalCategoryPaths: NonEmptyReadonlyArray<CategoryNode>[] = []

  for (const [index, categoryId] of (fact.additionalCategoryIds ?? []).entries()) {
    const categoryPath = categoryContext.pathById.get(categoryId)

    if (!categoryPath) {
      reject(`${path}.additionalCategoryIds[${index}]`, `unknown category '${categoryId}'`)
    }

    additionalCategoryPaths.push(categoryPath)
  }

  return additionalCategoryPaths
}

function normalizeCategoryContext(categorySource: CategoryTree | CategoryContext, options: CmsFactAdapterOptions = {}): CategoryContext {
  if (isCategoryContext(categorySource)) {
    return categorySource
  }

  return buildCategoryContextFromTree(categorySource, options)
}

function buildCategoryContextFromTree(tree: CategoryTree, options: CmsFactAdapterOptions = {}): CategoryContext {
  const config = normalizeAdapterConfig(options)
  const nodes = flattenCategoryNodes(tree.root)
  const byId = new Map<CategoryId, CategoryNode>()
  const pathById = new Map<CategoryId, NonEmptyReadonlyArray<CategoryNode>>()
  const factById = new Map<CategoryId, CategoryFact>()
  const childrenByParentId = new Map<CategoryId | null, CategoryFact[]>()
  const depthById = new Map<CategoryId, number>()

  for (const node of nodes) {
    if (byId.has(node.id)) {
      reject(`categoryTree.${node.id}`, `duplicate category id '${node.id}'`)
    }

    byId.set(node.id, node)
    depthById.set(node.id, node.depth)

    const fact: CategoryFact = {
      id: node.id,
      parentId: node.parentId,
      name: node.name,
    }

    factById.set(node.id, fact)

    const siblings = childrenByParentId.get(node.parentId) ?? []
    siblings.push(fact)
    childrenByParentId.set(node.parentId, siblings)

    if (node.parentId === null) {
      pathById.set(node.id, [node])
      continue
    }

    const parentPath = pathById.get(node.parentId)

    if (!parentPath) {
      reject(`categoryTree.${node.id}.parentId`, `unknown parent '${node.parentId}'`)
    }

    pathById.set(node.id, [...parentPath, node])
  }

  const rootFact = factById.get(tree.root.id)

  if (!rootFact) {
    reject('categoryTree.root', 'category tree root is missing')
  }

  return {
    graph: {
      rootFact,
      byId: factById,
      childrenByParentId,
      depthById,
    },
    tree,
    byId,
    pathById,
    locales: config.locales,
    defaultLocale: config.defaultLocale,
    depthById,
  }
}

function isCategoryContext(value: CategoryTree | CategoryContext): value is CategoryContext {
  return 'tree' in value && 'pathById' in value && 'graph' in value
}

function sameArray<T>(left: readonly T[], right: readonly T[]) {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

export {
  buildAnswerSummary,
  buildCategoryOpenGraphMetadata,
  buildCategorySeoFields,
  buildCategoryContext,
  buildFAQPageSchema,
  buildItemListSchema,
  buildLocalizedProductSeoFields,
  buildProductCanonicalPath,
  buildProductJsonLd,
  buildProductOpenGraphMetadata,
  buildProductSeoFields,
  buildSelectionGuidance,
  buildFactTable,
  buildEvidence,
  buildGeoAiProfile,
  buildLocalizedGeoAiProfiles,
  assertCategoryFact,
  assertCmsFactInput,
  assertProductFact,
  CmsFactValidationError,
  categorySystemGeneratedFields,
  cmsFactValidationRules,
  defaultCmsFactLocales,
  isCategoryFact,
  isCmsFactInput,
  isProductFact,
  normalizeCmsFactInput,
  normalizeCmsFactInputWithProductTolerance,
  normalizeCmsFactSourceInput,
  productSystemGeneratedFields,
  normalizeAdapterConfig,
  reject,
  toNonEmptyArray,
  validateCategoryFacts,
  validateProductFactsAgainstCategoryTree,
  validateProductIdentityConsistency,
}

export type {
  AIReadableIndustrialProduct,
  ProductGeoSource,
  ProductProjectionSource,
  CmsFactAdapterOptions,
  CmsFactInput,
  CategoryFact,
  CategoryFactGraph,
  ProductFact,
  ProductFactValidationIssue,
}

export {
  buildCategoryBreadcrumb,
  buildCategoryTreeFromFacts,
  buildCategoryTreeWithBreadcrumbs,
  flattenCategoryNodes,
} from './category.adapter'
