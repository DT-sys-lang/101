import path from 'node:path'
import { buildDomainFromCmsFacts } from '../adapter/product.adapter.ts'
import { routing } from '../i18n/routing.ts'
import {
  createProductCatalogIndex,
  filterProductCatalog,
  resolveProductDetailPage,
  selectProductSeo,
} from '../lib/domain/product-catalog.ts'
import { buildProductFaqItems } from '../lib/seo/faq.ts'
import { buildHomeHrefLangs, buildProductHrefLangs } from '../lib/seo/hreflang.ts'
import { buildProductFaqSchemaJsonLd } from '../lib/seo/jsonld/faq.ts'
import { buildProductListJsonLd } from '../lib/seo/jsonld/item-list.ts'
import { buildProductSchemaJsonLd } from '../lib/seo/jsonld/product.ts'
import { buildSitemapForProducts } from '../lib/seo/sitemap.ts'
import { generateCmsFacts } from './scale-fixtures.mjs'
import { getSitemapEntryBreakdown } from './site-structure.mjs'
import { validateBoundaryRules } from './validate-boundaries.mjs'

const SEO_CONTRACT_SNAPSHOT = {
  version: 'seo-runtime-contract-v1',
  locales: ['zh', 'en'],
  sitemap: {
    staticLocalizedEntryCount: 6,
    industryEntryCount: 5,
    applicationEntryCount: 3,
    homeChangeFrequency: 'weekly',
    staticChangeFrequency: 'weekly',
    productChangeFrequency: 'monthly',
    homePriority: 1,
    staticPriority: 0.7,
    productPriority: 0.8,
    staticEntryKeys: ['alternates', 'changeFrequency', 'lastModified', 'priority', 'url'],
    productEntryKeys: ['alternates', 'changeFrequency', 'images', 'lastModified', 'priority', 'url'],
  },
  hreflang: {
    keys: ['zh-CN', 'en', 'x-default'],
    defaultKey: 'zh-CN',
  },
  jsonLd: {
    context: 'https://schema.org',
    productGraphTypes: ['Organization', 'WebSite', 'WebPage', 'BreadcrumbList', 'Product'],
    productListGraphTypes: ['CollectionPage', 'ItemList'],
    faqType: 'FAQPage',
  },
}

const count = Number(readFlagValue('--count') ?? process.env.SCALE_PRODUCT_COUNT ?? 300)
const source = readFlagValue('--scale') === 'false' ? await loadRuntimeSource() : buildDomainFromCmsFacts(generateCmsFacts(count))
const errors = []
const boundary = await validateSeoBoundary(errors)
const sitemap = buildSitemapForProducts(source.products)
const sitemapBreakdown = getSitemapEntryBreakdown(source.products.length)
const expectedSitemapEntries = sitemapBreakdown.totalEntries

if (sitemap.length !== expectedSitemapEntries) {
  errors.push(`sitemap entry count mismatch: expected ${expectedSitemapEntries}, received ${sitemap.length}`)
}

validateSeoContractSnapshot(source, sitemap, sitemapBreakdown, errors)
validateHreflangMap('home', buildHomeHrefLangs(), errors)
validateSitemapEntries(sitemap, errors)
validateProductSeo(source.products, errors)

if (errors.length) {
  console.error(JSON.stringify({ ok: false, productRecords: source.products.length, errors }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  contract: SEO_CONTRACT_SNAPSHOT,
  productRecords: source.products.length,
  sitemapEntries: sitemap.length,
  expectedSitemapEntries,
  sitemapBreakdown,
  locales: routing.locales,
  boundary: {
    roots: boundary.roots,
    filesChecked: boundary.filesChecked,
    rules: boundary.rules,
  },
}, null, 2))

async function validateSeoBoundary(errors) {
  const boundary = await validateBoundaryRules({
    targetRoots: [{ label: 'lib/seo', dir: path.join(process.cwd(), 'lib', 'seo') }],
  })

  if (!boundary.ok) {
    for (const violation of boundary.violations) {
      errors.push(`SEO boundary violation in ${violation.file}: ${violation.message}`)
    }
  }

  return boundary
}

function validateSeoContractSnapshot(source, sitemap, sitemapBreakdown, errors) {
  assertExactArray('SEO locale contract', routing.locales, SEO_CONTRACT_SNAPSHOT.locales, errors)
  validateSitemapContractSnapshot(sitemap, sitemapBreakdown, errors)
  validateSeoJsonLdContractSnapshot(source, errors)
}

function validateSitemapContractSnapshot(sitemap, sitemapBreakdown, errors) {
  if (sitemapBreakdown.staticLocalizedEntryCount !== SEO_CONTRACT_SNAPSHOT.sitemap.staticLocalizedEntryCount) {
    errors.push(`sitemap static entry contract changed: expected ${SEO_CONTRACT_SNAPSHOT.sitemap.staticLocalizedEntryCount}, received ${sitemapBreakdown.staticLocalizedEntryCount}`)
  }

  if (sitemapBreakdown.industryEntryCount !== SEO_CONTRACT_SNAPSHOT.sitemap.industryEntryCount) {
    errors.push(`sitemap industry entry contract changed: expected ${SEO_CONTRACT_SNAPSHOT.sitemap.industryEntryCount}, received ${sitemapBreakdown.industryEntryCount}`)
  }

  if (sitemapBreakdown.applicationEntryCount !== SEO_CONTRACT_SNAPSHOT.sitemap.applicationEntryCount) {
    errors.push(`sitemap application entry contract changed: expected ${SEO_CONTRACT_SNAPSHOT.sitemap.applicationEntryCount}, received ${sitemapBreakdown.applicationEntryCount}`)
  }

  const defaultLocale = routing.defaultLocale
  const homeEntry = sitemap.find((entry) => entry.url.endsWith(`/${defaultLocale}`))
  const productHubEntry = sitemap.find((entry) => entry.url.endsWith(`/${defaultLocale}/products`))
  const productDetailEntry = sitemap.find((entry) => entry.url.includes(`/${defaultLocale}/products/`))

  if (!homeEntry) {
    errors.push('sitemap contract missing localized home entry')
  } else {
    assertExactKeys('sitemap home entry keys', homeEntry, SEO_CONTRACT_SNAPSHOT.sitemap.staticEntryKeys, errors)
    assertEqual('sitemap home changeFrequency', homeEntry.changeFrequency, SEO_CONTRACT_SNAPSHOT.sitemap.homeChangeFrequency, errors)
    assertEqual('sitemap home priority', homeEntry.priority, SEO_CONTRACT_SNAPSHOT.sitemap.homePriority, errors)
  }

  if (!productHubEntry) {
    errors.push('sitemap contract missing localized product hub entry')
  } else {
    assertExactKeys('sitemap static entry keys', productHubEntry, SEO_CONTRACT_SNAPSHOT.sitemap.staticEntryKeys, errors)
    assertEqual('sitemap static changeFrequency', productHubEntry.changeFrequency, SEO_CONTRACT_SNAPSHOT.sitemap.staticChangeFrequency, errors)
    assertEqual('sitemap static priority', productHubEntry.priority, SEO_CONTRACT_SNAPSHOT.sitemap.staticPriority, errors)
  }

  if (!productDetailEntry) {
    errors.push('sitemap contract missing localized product detail entry')
  } else {
    assertExactKeys('sitemap product detail entry keys', productDetailEntry, SEO_CONTRACT_SNAPSHOT.sitemap.productEntryKeys, errors)
    assertEqual('sitemap product changeFrequency', productDetailEntry.changeFrequency, SEO_CONTRACT_SNAPSHOT.sitemap.productChangeFrequency, errors)
    assertEqual('sitemap product priority', productDetailEntry.priority, SEO_CONTRACT_SNAPSHOT.sitemap.productPriority, errors)

    if (!Array.isArray(productDetailEntry.images)) {
      errors.push('sitemap product detail images contract changed: expected image array')
    }
  }
}

function validateSeoJsonLdContractSnapshot(source, errors) {
  const locale = routing.defaultLocale
  const index = createProductCatalogIndex({ locale, products: source.products, categoryTree: source.categoryTree })
  const product = source.products.find((item) => item.identity.lifecycle === 'active') ?? source.products[0]

  if (!product) {
    errors.push('JSON-LD contract snapshot cannot run without a product')
    return
  }

  const seo = selectProductSeo(product, locale)
  const detailResult = resolveProductDetailPage(index, {
    locale,
    pathname: seo.slug.canonicalPath,
    includeNonPublic: true,
  })

  if (detailResult.status !== 'found') {
    errors.push(`JSON-LD contract snapshot product detail did not resolve: ${detailResult.status}`)
    return
  }

  const productJsonLd = buildProductSchemaJsonLd(detailResult.data)
  assertExactKeys('Product JSON-LD top-level keys', productJsonLd, ['@context', '@graph'], errors)
  assertEqual('Product JSON-LD context', productJsonLd['@context'], SEO_CONTRACT_SNAPSHOT.jsonLd.context, errors)
  assertJsonLdGraphTypes('Product JSON-LD graph types', productJsonLd, SEO_CONTRACT_SNAPSHOT.jsonLd.productGraphTypes, errors)

  const productNode = findJsonLdGraphNode(productJsonLd, 'Product')
  if (!productNode) {
    errors.push('Product JSON-LD contract missing Product node')
  } else {
    assertEqual('Product JSON-LD sku', productNode.sku, product.identity.sku, errors)
    assertEqual('Product JSON-LD model', productNode.model, product.identity.model, errors)
  }

  const faqItems = buildProductFaqItems(detailResult.data)
  const faqJsonLd = buildProductFaqSchemaJsonLd(detailResult.data, faqItems)
  assertExactKeys('FAQPage JSON-LD top-level keys', faqJsonLd, ['@context', '@id', '@type', 'mainEntity'], errors)
  assertEqual('FAQPage JSON-LD context', faqJsonLd['@context'], SEO_CONTRACT_SNAPSHOT.jsonLd.context, errors)
  assertEqual('FAQPage JSON-LD type', faqJsonLd['@type'], SEO_CONTRACT_SNAPSHOT.jsonLd.faqType, errors)

  if (!Array.isArray(faqJsonLd.mainEntity) || faqJsonLd.mainEntity.length === 0) {
    errors.push('FAQPage JSON-LD contract requires non-empty mainEntity')
  }

  const productList = filterProductCatalog(index, {
    categoryId: source.categoryTree.root.id,
    categoryMode: 'with-descendants',
    includeNonPublic: true,
    sort: 'category-sort',
    limit: 48,
  })
  const productListJsonLd = buildProductListJsonLd({
    locale,
    category: source.categoryTree.root,
    categoryPath: [source.categoryTree.root],
    productList,
    canonicalPath: source.categoryTree.root.canonicalPath,
    title: 'SEO contract product list snapshot',
    description: 'SEO contract product list snapshot.',
  })

  assertExactKeys('Product list JSON-LD top-level keys', productListJsonLd, ['@context', '@graph'], errors)
  assertEqual('Product list JSON-LD context', productListJsonLd['@context'], SEO_CONTRACT_SNAPSHOT.jsonLd.context, errors)
  assertJsonLdGraphTypes('Product list JSON-LD graph types', productListJsonLd, SEO_CONTRACT_SNAPSHOT.jsonLd.productListGraphTypes, errors)
}

function validateProductSeo(products, errors) {
  const canonicalUrls = new Set()

  for (const product of products) {
    for (const locale of routing.locales) {
      const label = `${product.identity.id}:${locale}`
      const seo = selectProductSeo(product, locale)

      if (!seo.title || !seo.metaDescription || !seo.h1) {
        errors.push(`${label}: missing title, metaDescription, or h1`)
      }

      if (!seo.slug?.canonicalPath?.startsWith('/products/')) {
        errors.push(`${label}: canonicalPath must start with /products/`)
      }

      if (!seo.jsonLd || seo.jsonLd['@type'] !== 'Product') {
        errors.push(`${label}: missing Product JSON-LD`)
      }

      if (seo.jsonLd?.sku !== product.identity.sku) {
        errors.push(`${label}: JSON-LD sku mismatch`)
      }

      if (!seo.alternates || seo.alternates.length !== routing.locales.length) {
        errors.push(`${label}: localized canonical alternates incomplete`)
      }
    }

    const languages = buildProductHrefLangs(product)
    validateHreflangMap(product.identity.id, languages, errors)

    for (const value of [languages['zh-CN'], languages.en]) {
      if (canonicalUrls.has(value)) {
        errors.push(`${product.identity.id}: duplicate localized product URL ${value}`)
      }
      canonicalUrls.add(value)
    }
  }
}

function validateSitemapEntries(sitemap, errors) {
  const urls = new Set()

  for (const [index, entry] of sitemap.entries()) {
    if (!entry.url?.startsWith('https://')) {
      errors.push(`sitemap[${index}]: URL must be absolute https URL`)
    }

    if (urls.has(entry.url)) {
      errors.push(`sitemap[${index}]: duplicate URL ${entry.url}`)
    }

    urls.add(entry.url)

    if (!entry.alternates?.languages) {
      errors.push(`sitemap[${index}]: missing hreflang alternates`)
      continue
    }

    validateHreflangMap(`sitemap[${index}]`, entry.alternates.languages, errors)
  }
}

function validateHreflangMap(label, languages, errors) {
  const expectedKeys = SEO_CONTRACT_SNAPSHOT.hreflang.keys
  assertExactArray(`${label}: hreflang keys`, Object.keys(languages).sort(), [...expectedKeys].sort(), errors)

  if (languages['x-default'] !== languages[SEO_CONTRACT_SNAPSHOT.hreflang.defaultKey]) {
    errors.push(`${label}: x-default must point to default ${SEO_CONTRACT_SNAPSHOT.hreflang.defaultKey} URL`)
  }

  for (const [key, value] of Object.entries(languages)) {
    if (!value.startsWith('https://')) {
      errors.push(`${label}: hreflang ${key} must be absolute https URL`)
    }
  }
}

function assertJsonLdGraphTypes(label, jsonLd, expectedTypes, errors) {
  const graph = Array.isArray(jsonLd['@graph']) ? jsonLd['@graph'] : []
  const types = graph.map((node) => node?.['@type'])
  assertExactArray(label, types, expectedTypes, errors)
}

function findJsonLdGraphNode(jsonLd, type) {
  const graph = Array.isArray(jsonLd['@graph']) ? jsonLd['@graph'] : []
  return graph.find((node) => node?.['@type'] === type)
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

async function loadRuntimeSource() {
  const { getRuntimeDomainCategoryTree, getRuntimeDomainProductRecords } = await import('../lib/runtime/domain-products.ts')
  return {
    products: getRuntimeDomainProductRecords(),
    categoryTree: getRuntimeDomainCategoryTree(),
  }
}

function readFlagValue(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}
