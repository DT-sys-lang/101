import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REQUIRED_NODE_VERSION = '20.20.2'
const DEFAULT_V4_BASE_URL = 'http://127.0.0.1:1337'
const DEFAULT_V5_BASE_URL = 'http://127.0.0.1:1339'

assertNodeVersion()

const args = readArgs(process.argv.slice(2))
const cmsRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const workspaceRoot = dirname(cmsRoot)
const reportPath = resolve(args.report ?? resolve(workspaceRoot, 'tmp', 'strapi-v5-locale', 'business-locale-api-verification.json'))
const factsToken = readRequiredEnv(args.factsTokenEnv ?? 'INTERNAL_CMS_FACTS_TOKEN')
const restToken = readRequiredEnv(args.restTokenEnv ?? 'CMS_RESOURCES_API_TOKEN')
const v4BaseUrl = normalizeBaseUrl(args.v4BaseUrl ?? DEFAULT_V4_BASE_URL)
const v5BaseUrl = normalizeBaseUrl(args.v5BaseUrl ?? DEFAULT_V5_BASE_URL)

const [v4Facts, v5Facts, v5Manuals] = await Promise.all([
  getJson(`${v4BaseUrl}/internal/cms/facts?publicationState=live`, factsToken),
  getJson(`${v5BaseUrl}/internal/cms/facts?publicationState=live`, factsToken),
  getJson(`${v5BaseUrl}/internal/cms/product-manuals?status=published&pagination[pageSize]=100&populate=document`, restToken),
])

const failures = []
const v4DocumentMap = readFactDocumentMap(v4Facts, 'v4', failures)
const v5DocumentMap = readFactDocumentMap(v5Facts, 'v5', failures)
assertSameKeys(v4DocumentMap, v5DocumentMap, 'facts document stable IDs', failures)
assertBusinessLocaleMapping(v4DocumentMap, v5DocumentMap, failures)
const manuals = readV5Manuals(v5Manuals, failures)

const report = {
  verification: 'business-locale-v5-api-v1',
  executedAt: new Date().toISOString(),
  node: process.version,
  v4BaseUrl,
  v5BaseUrl,
  ok: failures.length === 0,
  failures,
  facts: {
    v4ProductCount: readProductCount(v4Facts),
    v5ProductCount: readProductCount(v5Facts),
    v4DocumentCount: v4DocumentMap.size,
    v5DocumentCount: v5DocumentMap.size,
    v4MultiDocumentIds: [...v4DocumentMap.values()].filter((document) => document.contentLocale === 'multi').map((document) => document.id),
    v5MultiDocumentIds: [...v5DocumentMap.values()].filter((document) => document.contentLocale === 'multi').map((document) => document.id),
  },
  productManuals: manuals,
  intentPhrases: {
    apiSurface: 'not-publicly-routed',
    verification: 'database verifier checks stable IDs, contentLocale, documentId, publication semantics, and relations',
  },
}

await mkdir(dirname(reportPath), { recursive: true })
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
console.log(JSON.stringify({ ok: report.ok, failures, reportPath, facts: report.facts, productManuals: report.productManuals }, null, 2))

if (failures.length) {
  process.exitCode = 1
}

function assertNodeVersion() {
  if (process.versions.node !== REQUIRED_NODE_VERSION) {
    throw new Error(`This verification must run with Node ${REQUIRED_NODE_VERSION}; received ${process.versions.node}.`)
  }
}

function readArgs(argv) {
  const result = {}

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === '--help' || value === '-h') {
      printHelp()
      process.exit(0)
    }

    if (!value.startsWith('--')) {
      throw new Error(`Unknown argument '${value}'.`)
    }

    const name = value.slice(2)
    const next = argv[index + 1]
    if (!next || next.startsWith('--')) {
      throw new Error(`Argument --${name} requires a value.`)
    }

    if (!['v4-base-url', 'v5-base-url', 'facts-token-env', 'rest-token-env', 'report'].includes(name)) {
      throw new Error(`Unknown argument --${name}.`)
    }

    result[name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = next
    index += 1
  }

  return result
}

function printHelp() {
  console.log(`Usage:
  INTERNAL_CMS_FACTS_TOKEN=<facts-token> CMS_RESOURCES_API_TOKEN=<rest-token> node scripts/verify-business-locale-api.mjs \\
    --v4-base-url http://127.0.0.1:1337 \\
    --v5-base-url http://127.0.0.1:1339 \\
    --report ../../tmp/strapi-v5-locale/business-locale-api-verification.json

Safety rules:
  - Requires Node ${REQUIRED_NODE_VERSION}.
  - Performs GET requests only.
  - Compares v4 legacy document locale with v5 contentLocale.
  - Audits published v5 product-manual REST output.
  - Intent phrases intentionally have no public REST router; use verify-business-locale-trial.mjs for their database and relation audit.`)
}

function readRequiredEnv(name) {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Required environment variable ${name} is missing.`)
  }

  return value
}

function normalizeBaseUrl(value) {
  const url = new URL(value)
  return url.toString().replace(/\/+$/, '')
}

async function getJson(url, token) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`GET ${url} failed with HTTP ${response.status}.`)
  }

  return response.json()
}

function readFactDocumentMap(value, version, failures) {
  if (!isRecord(value) || !Array.isArray(value.productFacts)) {
    failures.push(`${version} facts API did not return direct productFacts`)
    return new Map()
  }

  const documents = new Map()
  for (const [productIndex, product] of value.productFacts.entries()) {
    if (!isRecord(product) || !Array.isArray(product.documents)) {
      continue
    }

    for (const [documentIndex, document] of product.documents.entries()) {
      const path = `${version}.productFacts[${productIndex}].documents[${documentIndex}]`
      if (!isRecord(document) || typeof document.id !== 'string' || !document.id.trim()) {
        failures.push(`${path}: document must expose a stable business id`)
        continue
      }

      const contentLocale = readBusinessContentLocale(document, version, path, failures)
      if (documents.has(document.id)) {
        failures.push(`${path}: duplicate document stable id '${document.id}' in facts API`)
        continue
      }

      documents.set(document.id, { id: document.id, contentLocale })
    }
  }

  return documents
}

function readBusinessContentLocale(document, version, path, failures) {
  const hasContentLocale = Object.prototype.hasOwnProperty.call(document, 'contentLocale')
  const hasLocale = Object.prototype.hasOwnProperty.call(document, 'locale')
  const contentLocale = readOptionalString(document.contentLocale)
  const locale = readOptionalString(document.locale)

  if (hasContentLocale && hasLocale) {
    failures.push(`${path}: facts API must not expose both business contentLocale and locale`)
  }

  if (version === 'v4') {
    return contentLocale ?? locale ?? null
  }

  if (hasLocale) {
    failures.push(`${path}: v5 facts API leaked locale into the domain response`)
  }

  return contentLocale ?? null
}

function assertSameKeys(left, right, label, failures) {
  const leftKeys = [...left.keys()].sort()
  const rightKeys = [...right.keys()].sort()
  if (JSON.stringify(leftKeys) !== JSON.stringify(rightKeys)) {
    failures.push(`${label} differ between v4 and v5`)
  }
}

function assertBusinessLocaleMapping(v4Documents, v5Documents, failures) {
  for (const [id, v4Document] of v4Documents) {
    const v5Document = v5Documents.get(id)
    if (!v5Document) {
      continue
    }

    if (v4Document.contentLocale !== v5Document.contentLocale) {
      failures.push(`${id}: v4 locale to v5 contentLocale mapping differs`)
    }
  }

  const v4HasMulti = [...v4Documents.values()].some((document) => document.contentLocale === 'multi')
  const v5HasMulti = [...v5Documents.values()].some((document) => document.contentLocale === 'multi')
  if (!v4HasMulti || !v5HasMulti) {
    failures.push('facts API must retain at least one business contentLocale value multi across v4 and v5')
  }
}

function readV5Manuals(value, failures) {
  if (!isRecord(value) || !Array.isArray(value.data)) {
    failures.push('v5 product-manual REST API did not return a collection response')
    return { publishedCount: 0, contentLocales: [], multiSystemLocaleLeakCount: 0 }
  }

  const contentLocales = []
  let multiSystemLocaleLeakCount = 0
  for (const [index, manual] of value.data.entries()) {
    const path = `v5.product-manuals.data[${index}]`
    if (!isRecord(manual)) {
      failures.push(`${path}: manual record must be an object`)
      continue
    }

    const contentLocale = readOptionalString(manual.contentLocale)
    if (contentLocale !== 'multi') {
      failures.push(`${path}: expected business contentLocale multi`)
    }
    contentLocales.push(contentLocale)

    if (Object.prototype.hasOwnProperty.call(manual, 'locale')) {
      multiSystemLocaleLeakCount += 1
      failures.push(`${path}: non-localized manual REST response must not expose locale`)
    }

    if (isRecord(manual.document)) {
      if (Object.prototype.hasOwnProperty.call(manual.document, 'locale')) {
        multiSystemLocaleLeakCount += 1
        failures.push(`${path}.document: non-localized document REST response must not expose locale`)
      }

      if (readOptionalString(manual.document.contentLocale) !== 'multi') {
        failures.push(`${path}.document: expected business contentLocale multi`)
      }
    }
  }

  return {
    publishedCount: value.data.length,
    contentLocales,
    multiSystemLocaleLeakCount,
  }
}

function readProductCount(value) {
  return isRecord(value) && Array.isArray(value.productFacts) ? value.productFacts.length : 0
}

function readOptionalString(value) {
  return typeof value === 'string' && value.trim() ? value : null
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
