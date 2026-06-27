import path from 'node:path'
import { generateCmsFacts } from './scale-fixtures.mjs'
import { validateBoundaryRules } from './validate-boundaries.mjs'

const GEO_CONTRACT_SNAPSHOT = {
  version: 'geo-runtime-contract-v1',
  feedVersion: 'geo-product-feed-v1',
  indexVersion: 'geo-index-v2',
  answersVersion: 'geo-answer-blocks-v2',
  applicationAnswersVersion: 'application-geo-answer-blocks-v1',
  aiReadable: {
    contextSuffix: '/geo-context/product-detail/v1',
    type: 'AIReadableIndustrialProduct',
    sourceKind: 'domain-normalized-products',
    sourceDomainObject: 'ProductRecord',
    topLevelKeys: [
      '@context',
      '@type',
      'evidence',
      'facts',
      'faq',
      'governance',
      'hreflang',
      'product',
      'selectionGuidance',
      'source',
      'sourceUrl',
      'specifications',
      'summary',
    ],
    productKeys: ['applicationIds', 'availability', 'brand', 'canonicalPath', 'categoryIds', 'id', 'industryIds', 'lifecycle', 'manufacturer', 'model', 'name', 'sku'],
  },
  feedItemKeys: ['brand', 'canonicalUrl', 'categoryPath', 'datasheets', 'geoEndpoint', 'id', 'keySpecs', 'locale', 'model', 'sku', 'summary', 'title'],
  indexEndpointKeys: ['allProducts', 'applications', 'industries', 'llmsTxt', 'perProductPattern', 'productAnswers', 'productFeed'],
  answerKinds: ['application', 'product'],
  productAnswerKeys: ['answer', 'audience', 'id', 'kind', 'locale', 'model', 'productId', 'productUrl', 'question', 'sourceRefs'],
  applicationAnswerKeys: ['answer', 'applicationId', 'applicationSlug', 'applicationUrl', 'audience', 'id', 'kind', 'locale', 'productIds', 'question', 'sourceRefs'],
  llmsRequiredSections: ['## Source Policy', '## Machine-readable endpoints and pages'],
  llmsRequiredLinks: ['/api/geo/index', '/api/product-feed', '/api/geo/products', '/api/geo/answers'],
}

const count = Number(readFlagValue('--count') ?? process.env.SCALE_PRODUCT_COUNT ?? 300)
const useScale = readFlagValue('--scale') !== 'false'

if (useScale) {
  process.env.CMS_SOURCE_MODE = 'env-facts-json'
  process.env.CMS_FACTS_JSON = JSON.stringify(generateCmsFacts(count))
}

const { routing } = await import('../i18n/routing.ts')
const {
  buildApplicationGeoAnswerBlocksDocument,
  buildGeoAnswerBlocksDocument,
  buildGeoIndex,
  buildGeoProductFeed,
  buildAiReadableIndustrialProduct,
  buildLlmsTxt,
} = await import('../lib/geo/index.ts')
const { getRuntimeDomainProductRecords, getRuntimeDomainProductSource } = await import('../lib/runtime/domain-products.ts')
const { getGeoAnswerBlockBreakdown } = await import('./site-structure.mjs')

const source = getRuntimeDomainProductRecords()
const runtimeSource = getRuntimeDomainProductSource()
const errors = []
const boundary = await validateGeoBoundary(errors)

if (useScale && source.length !== count) {
  errors.push(`scale CMS facts did not reach runtime facade: expected ${count} products, received ${source.length}`)
}

const budgets = {
  productFeedBytesPerProduct: 1600,
  geoIndexBytesPerProduct: 1700,
  geoIndexMinimumBudgetUnits: 3,
  geoAnswersBytesPerBlock: 1700,
  applicationGeoAnswersBytesPerBlock: 1700,
}
const geoBreakdown = getGeoAnswerBlockBreakdown(source)

for (const locale of routing.locales) {
  const feed = buildGeoProductFeed(locale)
  const index = buildGeoIndex(locale)
  const answers = buildGeoAnswerBlocksDocument(locale)
  const applicationAnswers = buildApplicationGeoAnswerBlocksDocument(locale)
  const llmsTxt = buildLlmsTxt(locale)
  const allProducts = {
    version: 'geo-products-v1',
    locale,
    products: source.map((product) => buildAiReadableIndustrialProduct(product, locale)),
  }

  validateGeoContractSnapshot(locale, { feed, index, answers, applicationAnswers, allProducts, llmsTxt }, errors)
  validateFeed(locale, source, feed, errors)
  validateIndex(locale, source, index, errors)
  validateAnswers(locale, source, answers, applicationAnswers, geoBreakdown, errors)
  validateAllProducts(locale, source, allProducts, errors)
  validatePayloadBudget(`${locale}:product-feed`, feed, source.length * budgets.productFeedBytesPerProduct, errors)
  validatePayloadBudget(`${locale}:geo-index`, index, Math.max(source.length, budgets.geoIndexMinimumBudgetUnits) * budgets.geoIndexBytesPerProduct, errors)
  validatePayloadBudget(`${locale}:geo-answers`, answers, geoBreakdown.totalAnswerBlocks * budgets.geoAnswersBytesPerBlock, errors)
  validatePayloadBudget(`${locale}:application-geo-answers`, applicationAnswers, geoBreakdown.applicationAnswerBlocks * budgets.applicationGeoAnswersBytesPerBlock, errors)
}

if (errors.length) {
  console.error(JSON.stringify({ ok: false, productRecords: source.length, errors }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  contract: GEO_CONTRACT_SNAPSHOT,
  source: useScale ? 'scale-cms-facts' : 'runtime',
  runtimeSource,
  productRecords: source.length,
  locales: routing.locales,
  expectedAnswersPerLocale: geoBreakdown.totalAnswerBlocks,
  expectedApplicationAnswersPerLocale: geoBreakdown.applicationAnswerBlocks,
  payloadBudgets: budgets,
  boundary: {
    roots: boundary.roots,
    filesChecked: boundary.filesChecked,
    rules: boundary.rules,
  },
}, null, 2))

async function validateGeoBoundary(errors) {
  const boundary = await validateBoundaryRules({
    targetRoots: [{ label: 'lib/geo', dir: path.join(process.cwd(), 'lib', 'geo') }],
  })

  if (!boundary.ok) {
    for (const violation of boundary.violations) {
      errors.push(`GEO boundary violation in ${violation.file}: ${violation.message}`)
    }
  }

  return boundary
}

function validateGeoContractSnapshot(locale, documents, errors) {
  validateRuntimeSourceContract(errors)
  validateLlmsTxtContract(locale, documents.llmsTxt, errors)
  validateFeedContractSnapshot(locale, documents.feed, errors)
  validateIndexContractSnapshot(locale, documents.index, errors)
  validateAnswersContractSnapshot(locale, documents.answers, documents.applicationAnswers, errors)
  validateAllProductsContractSnapshot(locale, documents.allProducts, errors)
}

function validateRuntimeSourceContract(errors) {
  assertEqual('runtime source kind', runtimeSource.sourceKind, GEO_CONTRACT_SNAPSHOT.aiReadable.sourceKind, errors)
  assertEqual('runtime product count', runtimeSource.productCount, source.length, errors)
}

function validateLlmsTxtContract(locale, llmsTxt, errors) {
  for (const section of GEO_CONTRACT_SNAPSHOT.llmsRequiredSections) {
    if (!llmsTxt.includes(section)) {
      errors.push(`${locale}: llms.txt missing required section ${section}`)
    }
  }

  for (const link of GEO_CONTRACT_SNAPSHOT.llmsRequiredLinks) {
    if (!llmsTxt.includes(link)) {
      errors.push(`${locale}: llms.txt missing required endpoint ${link}`)
    }
  }

  if (!llmsTxt.includes(`- Source kind: ${GEO_CONTRACT_SNAPSHOT.aiReadable.sourceKind}`)) {
    errors.push(`${locale}: llms.txt source policy no longer declares domain-normalized source kind`)
  }
}

function validateFeedContractSnapshot(locale, feed, errors) {
  assertEqual(`${locale}: feed version`, feed.version, GEO_CONTRACT_SNAPSHOT.feedVersion, errors)
  const item = feed.products[0]

  if (!item) {
    errors.push(`${locale}: feed contract requires at least one product`)
    return
  }

  assertExactKeys(`${locale}: feed item keys`, item, GEO_CONTRACT_SNAPSHOT.feedItemKeys, errors)
}

function validateIndexContractSnapshot(locale, index, errors) {
  assertEqual(`${locale}: index version`, index.version, GEO_CONTRACT_SNAPSHOT.indexVersion, errors)
  assertEqual(`${locale}: index source kind`, index.source.sourceKind, GEO_CONTRACT_SNAPSHOT.aiReadable.sourceKind, errors)
  assertEqual(`${locale}: index source product count`, index.source.productCount, source.length, errors)
  assertExactKeys(`${locale}: index endpoint keys`, index.endpoints, GEO_CONTRACT_SNAPSHOT.indexEndpointKeys, errors)

  if (!index.products.length || !index.industries.length || !index.applications.length) {
    errors.push(`${locale}: index contract requires products, industries, and applications`)
  }
}

function validateAnswersContractSnapshot(locale, answers, applicationAnswers, errors) {
  assertEqual(`${locale}: answers version`, answers.version, GEO_CONTRACT_SNAPSHOT.answersVersion, errors)
  assertEqual(`${locale}: application answers version`, applicationAnswers.version, GEO_CONTRACT_SNAPSHOT.applicationAnswersVersion, errors)

  const kinds = [...new Set(answers.answers.map((answer) => answer.kind))].sort()
  assertExactArray(`${locale}: answer kinds`, kinds, GEO_CONTRACT_SNAPSHOT.answerKinds, errors)

  const productAnswer = answers.answers.find((answer) => answer.kind === 'product')
  const applicationAnswer = answers.answers.find((answer) => answer.kind === 'application')

  if (!productAnswer) {
    errors.push(`${locale}: answers contract requires product answer block`)
  } else {
    assertExactKeys(`${locale}: product answer keys`, productAnswer, GEO_CONTRACT_SNAPSHOT.productAnswerKeys, errors)
  }

  if (!applicationAnswer) {
    errors.push(`${locale}: answers contract requires application answer block`)
  } else {
    assertExactKeys(`${locale}: application answer keys`, applicationAnswer, GEO_CONTRACT_SNAPSHOT.applicationAnswerKeys, errors)
  }
}

function validateAllProductsContractSnapshot(locale, document, errors) {
  assertEqual(`${locale}: all-products pseudo version`, document.version, 'geo-products-v1', errors)
  const product = document.products[0]

  if (!product) {
    errors.push(`${locale}: all-products contract requires at least one AI-readable product`)
    return
  }

  assertExactKeys(`${locale}: AI-readable product keys`, product, GEO_CONTRACT_SNAPSHOT.aiReadable.topLevelKeys, errors)
  assertExactKeys(`${locale}: AI-readable product.product keys`, product.product, GEO_CONTRACT_SNAPSHOT.aiReadable.productKeys, errors)
  assertEqual(`${locale}: AI-readable @type`, product['@type'], GEO_CONTRACT_SNAPSHOT.aiReadable.type, errors)
  assertEqual(`${locale}: AI-readable source domain object`, product.source.domainObject, GEO_CONTRACT_SNAPSHOT.aiReadable.sourceDomainObject, errors)

  if (!product['@context']?.endsWith(GEO_CONTRACT_SNAPSHOT.aiReadable.contextSuffix)) {
    errors.push(`${locale}: AI-readable @context changed: expected suffix ${GEO_CONTRACT_SNAPSHOT.aiReadable.contextSuffix}, received ${product['@context']}`)
  }
}

function validateFeed(locale, source, feed, errors) {
  if (feed.version !== GEO_CONTRACT_SNAPSHOT.feedVersion || feed.locale !== locale) {
    errors.push(`${locale}: product feed contract mismatch`)
  }

  if (feed.products.length !== source.length) {
    errors.push(`${locale}: product feed count mismatch`)
  }

  for (const item of feed.products) {
    if (!item.id || !item.model || !item.canonicalUrl || !item.geoEndpoint) {
      errors.push(`${locale}:${item.id}: incomplete feed item`)
    }

    if (!item.geoEndpoint.includes(`/${locale}/geo/products/`)) {
      errors.push(`${locale}:${item.id}: geoEndpoint missing localized product route`)
    }
  }
}

function validateIndex(locale, source, index, errors) {
  if (index.version !== GEO_CONTRACT_SNAPSHOT.indexVersion) {
    errors.push(`${locale}: GEO index version mismatch`)
  }

  if (index.source.productCount !== source.length || index.products.length !== source.length) {
    errors.push(`${locale}: GEO index product count mismatch`)
  }

  if (!index.endpoints.allProducts || !index.endpoints.perProductPattern || !index.endpoints.llmsTxt) {
    errors.push(`${locale}: GEO index endpoints incomplete`)
  }

  if (!index.endpoints.industries || !index.endpoints.applications || !index.industries.length || !index.applications.length) {
    errors.push(`${locale}: GEO index entry endpoints incomplete`)
  }
}

function validateAnswers(locale, source, document, applicationDocument, geoBreakdown, errors) {
  if (document.version !== GEO_CONTRACT_SNAPSHOT.answersVersion || document.locale !== locale) {
    errors.push(`${locale}: answer blocks contract mismatch`)
  }

  if (document.answers.length !== geoBreakdown.totalAnswerBlocks) {
    errors.push(`${locale}: expected ${geoBreakdown.totalAnswerBlocks} answer blocks, received ${document.answers.length}`)
  }

  if (applicationDocument.version !== GEO_CONTRACT_SNAPSHOT.applicationAnswersVersion || applicationDocument.locale !== locale) {
    errors.push(`${locale}: application answer blocks contract mismatch`)
  }

  if (applicationDocument.answers.length !== geoBreakdown.applicationAnswerBlocks) {
    errors.push(`${locale}: expected ${geoBreakdown.applicationAnswerBlocks} application answer blocks, received ${applicationDocument.answers.length}`)
  }

  for (const answer of document.answers) {
    validateAnswerBlock(locale, answer, errors)
  }

  for (const answer of applicationDocument.answers) {
    validateApplicationAnswerBlock(locale, answer, errors)
  }
}

function validateAnswerBlock(locale, answer, errors) {
  if (answer.kind === 'product') {
    validateProductAnswerBlock(locale, answer, errors)
    return
  }

  if (answer.kind === 'application') {
    validateApplicationAnswerBlock(locale, answer, errors)
    return
  }

  errors.push(`${locale}:${answer.id}: unknown answer block kind`)
}

function validateProductAnswerBlock(locale, answer, errors) {
  if (!answer.question || !answer.answer || !answer.productId || !answer.productUrl || !answer.sourceRefs.length) {
    errors.push(`${locale}:${answer.id}: incomplete product answer block`)
  }
}

function validateApplicationAnswerBlock(locale, answer, errors) {
  if (!answer.question || !answer.answer || !answer.applicationId || !answer.applicationSlug || !answer.applicationUrl) {
    errors.push(`${locale}:${answer.id}: incomplete application answer block`)
  }
}

function validateAllProducts(locale, source, document, errors) {
  if (document.products.length !== source.length) {
    errors.push(`${locale}: all-products endpoint count mismatch`)
  }

  for (const product of document.products) {
    if (product['@type'] !== GEO_CONTRACT_SNAPSHOT.aiReadable.type) {
      errors.push(`${locale}: AI-readable product type mismatch`)
    }

    if (!product.hreflang['zh-CN'] || !product.hreflang.en || !product.hreflang['x-default']) {
      errors.push(`${locale}:${product.product.id}: missing AI product hreflang`)
    }

    if (!product.facts.length || !product.evidence.length || !product.faq.length) {
      errors.push(`${locale}:${product.product.id}: missing facts, evidence, or faq`)
    }
  }
}

function validatePayloadBudget(label, value, maxBytes, errors) {
  const bytes = Buffer.byteLength(JSON.stringify(value), 'utf8')

  if (bytes > maxBytes) {
    errors.push(`${label}: payload ${bytes} bytes exceeds budget ${maxBytes} bytes`)
  }
}

function assertExactKeys(label, value, expectedKeys, errors) {
  assertExactArray(label, Object.keys(value).sort(), [...expectedKeys].sort(), errors)
}

function assertExactArray(label, received, expected, errors) {
  const actual = [...received]
  const target = [...expected]

  if (actual.length !== target.length || actual.some((value, index) => value !== target[index])) {
    errors.push(`${label} contract changed: expected [${target.join(', ')}], received [${actual.join(', ')}]`)
  }
}

function assertEqual(label, received, expected, errors) {
  if (received !== expected) {
    errors.push(`${label} contract changed: expected ${expected}, received ${received}`)
  }
}

function readFlagValue(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}
