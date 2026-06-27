import { buildDomainFromCmsFacts } from '../adapter/product.adapter.ts'
import {
  defaultSpecificationRegistry,
  validateSpecificationDefinitionRegistry,
  validateSpecificationValueAgainstRegistry,
} from '../lib/domain/specification.ts'
import { industrialSensorCategoryTree } from '../lib/domain/category.ts'
import { mockProducts } from '../lib/domain/mock-products.ts'
import { createProductCatalogIndex } from '../lib/domain/product-catalog.ts'

const domain = await loadDomainInput()
const errors = validateDomain(domain)

if (errors.length) {
  console.error(JSON.stringify({ ok: false, errors }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  source: process.env.CMS_FACTS_JSON?.trim() ? 'CMS_FACTS_JSON' : 'mock-domain',
  categoryTreeVersion: domain.categoryTree.version,
  maxDepth: domain.categoryTree.maxDepth,
  productRecords: domain.products.length,
  enIndexProducts: createProductCatalogIndex({ locale: 'en', products: domain.products, categoryTree: domain.categoryTree }).productIds.length,
  zhIndexProducts: createProductCatalogIndex({ locale: 'zh', products: domain.products, categoryTree: domain.categoryTree }).productIds.length,
}, null, 2))

async function loadDomainInput() {
  if (process.env.CMS_FACTS_JSON?.trim()) {
    return buildDomainFromCmsFacts(JSON.parse(process.env.CMS_FACTS_JSON))
  }

  return {
    categoryTree: industrialSensorCategoryTree,
    products: mockProducts,
  }
}

function validateDomain(domain) {
  const errors = []
  const categoryIds = new Set(flattenCategories(domain.categoryTree.root).map((category) => category.id))
  const productIds = new Set()
  const skus = new Set()
  const canonicalPaths = new Set()
  const registryErrors = validateSpecificationDefinitionRegistry(defaultSpecificationRegistry)

  for (const error of registryErrors) {
    errors.push(`specificationRegistry: ${error}`)
  }

  if (domain.categoryTree.version !== 'category-tree-v1') {
    errors.push('categoryTree.version must be category-tree-v1')
  }

  if (domain.categoryTree.maxDepth > 4) {
    errors.push(`categoryTree.maxDepth exceeds 4: ${domain.categoryTree.maxDepth}`)
  }

  for (const product of domain.products) {
    const label = product.identity?.id ?? 'unknown-product'

    if (productIds.has(product.identity.id)) {
      errors.push(`${label}: duplicate product id`)
    }

    if (skus.has(product.identity.sku)) {
      errors.push(`${label}: duplicate sku ${product.identity.sku}`)
    }

    productIds.add(product.identity.id)
    skus.add(product.identity.sku)

    if (!product.identity.model || !product.identity.brand) {
      errors.push(`${label}: missing model or brand`)
    }

    if (!categoryIds.has(product.classification.primaryCategoryId)) {
      errors.push(`${label}: unknown primaryCategoryId ${product.classification.primaryCategoryId}`)
    }

    for (const categoryId of product.classification.categoryPath) {
      if (!categoryIds.has(categoryId)) {
        errors.push(`${label}: categoryPath contains unknown category ${categoryId}`)
      }
    }

    if (!product.measurements.length || product.measurements.some((measurement) => !measurement.overloadLimit)) {
      errors.push(`${label}: every product measurement must include overloadLimit`)
    }

    if (!product.environmentalLimits.mediaTemperature && !product.environmentalLimits.ambientTemperature) {
      errors.push(`${label}: missing environmental temperature limits`)
    }

    if (!product.environmentalLimits.compatibleMedia?.length || !product.environmentalLimits.wettedMaterials.length) {
      errors.push(`${label}: missing compatible media or wetted materials`)
    }

    if (!product.specificationGroups.length) {
      errors.push(`${label}: missing specificationGroups`)
    }

    validateProductSpecifications(product, label, errors)

    if (!product.documents.length) {
      errors.push(`${label}: missing evidence documents`)
    }

    validateSeo(product, label, canonicalPaths, errors)
    validateGeo(product, label, errors)
  }

  return errors
}

function validateProductSpecifications(product, label, errors) {
  product.specificationGroups.forEach((group, groupIndex) => {
    group.values.forEach((value, valueIndex) => {
      const specErrors = validateSpecificationValueAgainstRegistry(value, defaultSpecificationRegistry)

      for (const error of specErrors) {
        errors.push(`${label}: specificationGroups[${groupIndex}].values[${valueIndex}]: ${error}`)
      }
    })
  })
}

function validateSeo(product, label, canonicalPaths, errors) {
  const seoRecords = uniqueSeoByCanonicalPath([product.seo, ...Object.values(product.localizedSeo ?? {})])

  for (const seo of seoRecords) {
    if (!seo?.slug?.canonicalPath || !seo.title || !seo.metaDescription || !seo.h1) {
      errors.push(`${label}: incomplete generated SEO`)
      continue
    }

    if (canonicalPaths.has(seo.slug.canonicalPath)) {
      errors.push(`${label}: duplicate canonical path ${seo.slug.canonicalPath}`)
    }

    canonicalPaths.add(seo.slug.canonicalPath)

    if (seo.jsonLd.sku !== product.identity.sku) {
      errors.push(`${label}: ProductJsonLd sku mismatch`)
    }

    if (seo.jsonLd.brand.name !== product.identity.brand) {
      errors.push(`${label}: ProductJsonLd brand mismatch`)
    }
  }
}

function validateGeo(product, label, errors) {
  const geoRecords = [product.geoAi, ...Object.values(product.localizedGeoAi ?? {})]

  for (const geoAi of geoRecords) {
    if (!geoAi?.entity || !geoAi.factTable.length || !geoAi.evidence.length) {
      errors.push(`${label}: incomplete generated GEO profile`)
      continue
    }

    if (geoAi.entity.productId !== product.identity.id || geoAi.entity.model !== product.identity.model || geoAi.entity.brand !== product.identity.brand) {
      errors.push(`${label}: GEO entity identity mismatch`)
    }

    if (!geoAi.answerSummary.oneSentence || !geoAi.selectionGuidance.bestFor.length) {
      errors.push(`${label}: GEO summary or selection guidance is incomplete`)
    }
  }
}

function flattenCategories(root) {
  return [root, ...(root.children ?? []).flatMap((child) => flattenCategories(child))]
}

function uniqueSeoByCanonicalPath(seoRecords) {
  return [...new Map(seoRecords.map((seo) => [seo.slug.canonicalPath, seo])).values()]
}
