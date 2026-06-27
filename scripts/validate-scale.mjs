import { performance } from 'node:perf_hooks'
import { buildDomainFromCmsFacts } from '../adapter/product.adapter.ts'
import { routing } from '../i18n/routing.ts'
import { createProductCatalogIndex } from '../lib/domain/product-catalog.ts'
import { buildApplicationGeoAnswerBlocksDocument, buildGeoAnswerBlocksDocument, buildGeoIndex, buildGeoProductFeed } from '../lib/geo/index.ts'
import { buildSitemapForProducts } from '../lib/seo/sitemap.ts'
import { generateCmsFacts } from './scale-fixtures.mjs'
import { getGeoAnswerBlockBreakdown, getSitemapEntryBreakdown } from './site-structure.mjs'
import { summarizeScaleRisks } from './scale-risk-summary.mjs'

const requestedCount = Number(readFlagValue('--count') ?? 300)
const errors = []
const timings = {}

const facts = time('generateCmsFactsMs', () => generateCmsFacts(requestedCount))
process.env.CMS_SOURCE_MODE = 'env-facts-json'
process.env.CMS_FACTS_JSON = JSON.stringify(facts)
const domain = time('buildDomainMs', () => buildDomainFromCmsFacts(facts))
const productCount = domain.products.length
const sitemap = time('buildSitemapMs', () => buildSitemapForProducts(domain.products))
const sitemapBreakdown = getSitemapEntryBreakdown(productCount)
const geoBreakdown = getGeoAnswerBlockBreakdown(domain.products)
const indexes = time('buildCatalogIndexesMs', () => Object.fromEntries(
  routing.locales.map((locale) => [locale, createProductCatalogIndex({ locale, products: domain.products, categoryTree: domain.categoryTree })]),
))
const geoDocuments = time('buildGeoDocumentsMs', () => Object.fromEntries(
  routing.locales.map((locale) => [locale, {
    feed: buildGeoProductFeed(locale),
    index: buildGeoIndex(locale),
    answers: buildGeoAnswerBlocksDocument(locale),
    applicationAnswers: buildApplicationGeoAnswerBlocksDocument(locale),
  }]),
))

validateCounts({ facts, domain, requestedCount, productCount, sitemap, sitemapBreakdown, geoBreakdown, indexes, geoDocuments, errors })
validateBudgets({ requestedCount, productCount, sitemap, geoBreakdown, geoDocuments, errors })
validateDuplicateRisks({ facts, domain, errors })

if (errors.length) {
  console.error(JSON.stringify({ ok: false, requestedCount, productCount, timings, errors }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  requestedCount,
  productCount,
  categoryFacts: facts.categoryFacts.length,
  sitemapEntries: sitemap.length,
  sitemapBreakdown,
  geoBreakdown,
  duplicateRisks: summarizeScaleRisks(facts, domain),
  timings,
  budgets: {
    maxSitemapEntriesPerFile: 50000,
    maxSitemapBytes: 10 * 1024 * 1024,
    maxGeoFeedBytesPerProduct: 1600,
    maxGeoIndexBytesPerProduct: 1700,
    maxGeoAnswersBytesPerProduct: 1700,
    maxApplicationGeoAnswersBytesPerBlock: 1700,
    maxCatalogIndexBuildMs: requestedCount >= 1000 ? 5000 : 2000,
  },
}, null, 2))

function validateCounts({ facts, domain, requestedCount, productCount, sitemap, sitemapBreakdown, geoBreakdown, indexes, geoDocuments, errors }) {
  if (facts.productFacts.length !== requestedCount) {
    errors.push(`product fact count mismatch for scale test ${requestedCount}: received ${facts.productFacts.length}`)
  }

  if (productCount !== requestedCount) {
    errors.push(`domain product count mismatch for scale test ${requestedCount}: received ${productCount}`)
  }

  if (productCount !== facts.productFacts.length) {
    errors.push(`adapter/domain product count mismatch: facts=${facts.productFacts.length}, domain=${productCount}`)
  }

  if (sitemap.length !== sitemapBreakdown.totalEntries) {
    errors.push(`expected ${sitemapBreakdown.totalEntries} sitemap entries, received ${sitemap.length}`)
  }

  for (const locale of routing.locales) {
    if (indexes[locale].productIds.length !== requestedCount) {
      errors.push(`${locale}: catalog index expected ${requestedCount} products`)
    }

    if (geoDocuments[locale].feed.products.length !== requestedCount) {
      errors.push(`${locale}: GEO product feed expected ${requestedCount} products`)
    }

    if (geoDocuments[locale].index.products.length !== requestedCount || geoDocuments[locale].index.source.productCount !== requestedCount) {
      errors.push(`${locale}: GEO index expected ${requestedCount} products`)
    }

    if (geoDocuments[locale].answers.answers.length !== geoBreakdown.totalAnswerBlocks) {
      errors.push(`${locale}: GEO answers expected ${geoBreakdown.totalAnswerBlocks} answer blocks`)
    }

    if (geoDocuments[locale].applicationAnswers.answers.length !== geoBreakdown.applicationAnswerBlocks) {
      errors.push(`${locale}: application GEO answers expected ${geoBreakdown.applicationAnswerBlocks} answer blocks`)
    }
  }
}

function validateBudgets({ requestedCount, productCount, sitemap, geoBreakdown, geoDocuments, errors }) {
  const maxSitemapEntriesPerFile = 50000
  const maxSitemapBytes = 10 * 1024 * 1024

  if (sitemap.length > maxSitemapEntriesPerFile) {
    errors.push(`sitemap has ${sitemap.length} entries, exceeds ${maxSitemapEntriesPerFile} single-file budget`)
  }

  const sitemapBytes = byteLength(sitemap)

  if (sitemapBytes > maxSitemapBytes) {
    errors.push(`sitemap payload ${sitemapBytes} bytes exceeds ${maxSitemapBytes} bytes`)
  }

  for (const locale of routing.locales) {
    assertPayloadBudget(`${locale}:GEO feed`, geoDocuments[locale].feed, productCount * 1600, errors)
    assertPayloadBudget(`${locale}:GEO index`, geoDocuments[locale].index, productCount * 1700, errors)
    assertPayloadBudget(`${locale}:GEO answers`, geoDocuments[locale].answers, geoBreakdown.totalAnswerBlocks * 1700, errors)
    assertPayloadBudget(`${locale}:application GEO answers`, geoDocuments[locale].applicationAnswers, geoBreakdown.applicationAnswerBlocks * 1700, errors)
  }

  const maxCatalogIndexBuildMs = requestedCount >= 1000 ? 5000 : 2000

  if (timings.buildCatalogIndexesMs > maxCatalogIndexBuildMs) {
    errors.push(`catalog indexes built in ${timings.buildCatalogIndexesMs}ms, exceeds ${maxCatalogIndexBuildMs}ms budget`)
  }
}

function validateDuplicateRisks({ facts, domain, errors }) {
  const risks = summarizeScaleRisks(facts, domain)

  if (risks.categoryIdDuplicates.length) {
    errors.push(`duplicate category ids: ${risks.categoryIdDuplicates.join(', ')}`)
  }

  if (risks.productIdDuplicates.length) {
    errors.push(`duplicate product ids: ${risks.productIdDuplicates.join(', ')}`)
  }

  if (risks.skuDuplicates.length) {
    errors.push(`duplicate skus: ${risks.skuDuplicates.join(', ')}`)
  }

  if (risks.modelDuplicates.length) {
    errors.push(`duplicate models: ${risks.modelDuplicates.join(', ')}`)
  }

  if (risks.documentDuplicates.length) {
    errors.push(`duplicate documents: ${risks.documentDuplicates.join(', ')}`)
  }

  if (risks.missingCategories.length) {
    errors.push(`missing categories: ${risks.missingCategories.join(', ')}`)
  }

  if (risks.productsMissingOverloadLimit > 0) {
    errors.push(`products missing overloadLimit: ${risks.productsMissingOverloadLimit}`)
  }
}

function assertPayloadBudget(label, value, maxBytes, errors) {
  const bytes = byteLength(value)

  if (bytes > maxBytes) {
    errors.push(`${label} payload ${bytes} bytes exceeds ${maxBytes} bytes`)
  }
}

function time(label, callback) {
  const startedAt = performance.now()
  const value = callback()
  timings[label] = Math.round(performance.now() - startedAt)
  return value
}

function byteLength(value) {
  return Buffer.byteLength(JSON.stringify(value), 'utf8')
}

function readFlagValue(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}
