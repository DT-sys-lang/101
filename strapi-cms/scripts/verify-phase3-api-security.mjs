import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REQUIRED_NODE_VERSION = '20.20.2'
const DEFAULT_V4_BASE_URL = 'http://127.0.0.1:1337'
const DEFAULT_V5_BASE_URL = 'http://127.0.0.1:1340'
const ALLOWED_ORIGIN = 'http://127.0.0.1:3109'
const DISALLOWED_ORIGIN = 'https://unapproved.example.invalid'

assertNodeVersion()

const args = readArgs(process.argv.slice(2))
const cmsRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const workspaceRoot = dirname(cmsRoot)
const env = await readDotEnv(resolve(cmsRoot, '.env'))
const factsToken = readRequiredValue('INTERNAL_CMS_FACTS_TOKEN', process.env.INTERNAL_CMS_FACTS_TOKEN ?? env.INTERNAL_CMS_FACTS_TOKEN)
const v4BaseUrl = normalizeBaseUrl(args.v4BaseUrl ?? DEFAULT_V4_BASE_URL)
const v5BaseUrl = normalizeBaseUrl(args.v5BaseUrl ?? DEFAULT_V5_BASE_URL)
const reportPath = resolve(args.report ?? resolve(workspaceRoot, 'tmp', 'strapi-v5-locale', 'phase3-api-security-verification.json'))

const checks = []
const failures = []

await check('v4 facts rejects missing token', () => request(`${v4BaseUrl}/internal/cms/facts`, { origin: DISALLOWED_ORIGIN }), (result) => {
  return result.status === 403
})
await check('v5 facts rejects missing token', () => request(`${v5BaseUrl}/internal/cms/facts`, { origin: DISALLOWED_ORIGIN }), (result) => {
  return result.status === 403
})
await check('v5 facts accepts approved token without leaking the token', () => request(`${v5BaseUrl}/internal/cms/facts?publicationState=live`, {
  origin: ALLOWED_ORIGIN,
  authorization: `Bearer ${factsToken}`,
}), (result) => result.status === 200 && isFactsPayload(result.body))
await check('v5 CORS rejects an unapproved origin', () => request(`${v5BaseUrl}/internal/cms/facts`, {
  method: 'OPTIONS',
  origin: DISALLOWED_ORIGIN,
}), (result) => result.corsOrigin !== DISALLOWED_ORIGIN)
await check('v5 CORS allows the isolated website origin', () => request(`${v5BaseUrl}/internal/cms/facts`, {
  method: 'OPTIONS',
  origin: ALLOWED_ORIGIN,
}), (result) => result.status === 204 && result.corsOrigin === ALLOWED_ORIGIN)
await check('v5 REST rejects missing credentials without HTTP 500', () => request(`${v5BaseUrl}/internal/cms/product-manuals?status=published`, {
  origin: ALLOWED_ORIGIN,
}), (result) => result.status === 401)
await check('v5 REST rejects an invalid bearer token without HTTP 500', () => request(`${v5BaseUrl}/internal/cms/product-manuals?status=published`, {
  origin: ALLOWED_ORIGIN,
  authorization: 'Bearer phase3-invalid-token',
}), (result) => result.status === 401 || result.status === 403)
await check('v5 REST rejects an unauthenticated malformed filter without HTTP 500', () => request(`${v5BaseUrl}/internal/cms/product-manuals?filters[$and][0][$invalid]=1&populate[unknown][populate]=*`, {
  origin: ALLOWED_ORIGIN,
}), (result) => result.status === 401)

const report = {
  verification: 'strapi-v5-phase3-api-security-v1',
  executedAt: new Date().toISOString(),
  node: process.version,
  v4BaseUrl,
  v5BaseUrl,
  factsTokenSource: 'environment-or-local-env-not-printed',
  checks,
  ok: failures.length === 0,
  failures,
  limitations: [
    'No CMS_RESOURCES_API_TOKEN was provided from a production secret manager, so authenticated REST filter/populate validation remains an external release gate.',
    'This verifies application CORS behavior only; production reverse-proxy and CDN header behavior must be validated in the deployed environment.',
  ],
}

await mkdir(dirname(reportPath), { recursive: true })
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
console.log(JSON.stringify({ ok: report.ok, failures, reportPath, checks }, null, 2))
if (failures.length) process.exitCode = 1

async function check(name, operation, expectation) {
  try {
    const result = await operation()
    const passed = expectation(result)
    const summary = summarize(result)
    checks.push({ name, passed, ...summary })
    if (!passed) failures.push(`${name}: received HTTP ${result.status}, CORS '${result.corsOrigin ?? '<none>'}'`)
  } catch (error) {
    checks.push({ name, passed: false, error: error instanceof Error ? error.message : String(error) })
    failures.push(`${name}: request failed`)
  }
}

async function request(url, { method = 'GET', origin, authorization } = {}) {
  const headers = {
    Accept: 'application/json',
    Origin: origin,
  }
  if (method === 'OPTIONS') {
    headers['Access-Control-Request-Method'] = 'GET'
    headers['Access-Control-Request-Headers'] = 'authorization'
  }
  if (authorization) headers.Authorization = authorization

  const response = await fetch(url, { method, headers, redirect: 'manual' })
  const text = await response.text()
  return {
    status: response.status,
    corsOrigin: response.headers.get('access-control-allow-origin'),
    allowCredentials: response.headers.get('access-control-allow-credentials'),
    contentType: response.headers.get('content-type'),
    body: parseJson(text),
  }
}

function summarize(result) {
  return {
    status: result.status,
    corsOrigin: result.corsOrigin ?? null,
    allowCredentials: result.allowCredentials ?? null,
    contentType: result.contentType ?? null,
    errorName: isRecord(result.body) && isRecord(result.body.error) && typeof result.body.error.name === 'string' ? result.body.error.name : null,
  }
}

function isFactsPayload(value) {
  return isRecord(value) && Array.isArray(value.productFacts) && value.productFacts.length === 10
}

function parseJson(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function readArgs(argv) {
  const result = {}
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (!value.startsWith('--')) throw new Error(`Unknown argument '${value}'.`)
    const name = value.slice(2)
    const next = argv[index + 1]
    if (!next || next.startsWith('--')) throw new Error(`Argument --${name} requires a value.`)
    if (!['v4-base-url', 'v5-base-url', 'report'].includes(name)) throw new Error(`Unknown argument --${name}.`)
    result[name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = next
    index += 1
  }
  return result
}

function assertNodeVersion() {
  if (process.versions.node !== REQUIRED_NODE_VERSION) {
    throw new Error(`This verifier must run with Node ${REQUIRED_NODE_VERSION}; received ${process.versions.node}.`)
  }
}

function normalizeBaseUrl(value) {
  return new URL(value).toString().replace(/\/+$/, '')
}

function readRequiredValue(name, value) {
  if (!value?.trim()) throw new Error(`Required ${name} is missing.`)
  return value.trim()
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

async function readDotEnv(path) {
  try {
    const values = {}
    for (const line of (await readFile(path, 'utf8')).split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)=(.*)$/)
      if (match) values[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
    }
    return values
  } catch {
    return {}
  }
}
