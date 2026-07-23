import { createWriteStream } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import net from 'node:net'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'

const REQUIRED_NODE_VERSION = '20.20.2'
const TARGET_DATABASE_PATTERN = /^industrial_cms_v5_locale_phase3_[a-z0-9_]+$/
const DEFAULT_STRAPI_BASE_URL = 'http://127.0.0.1:1340'
const DEFAULT_WEBSITE_PORT = 3110

assertNodeVersion()

const args = readArgs(process.argv.slice(2))
assertTargetDatabase(args.targetDatabase)
const strapiBaseUrl = normalizeLocalUrl(args.strapiBaseUrl ?? DEFAULT_STRAPI_BASE_URL, 'Strapi base URL')
const websitePort = parsePort(args.websitePort ?? String(DEFAULT_WEBSITE_PORT))
const cmsRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const workspaceRoot = dirname(cmsRoot)
const localEnv = await readDotEnv(resolve(cmsRoot, '.env'))
const reportPath = resolve(args.report ?? resolve(workspaceRoot, 'tmp', 'strapi-v5-locale', `${args.targetDatabase}-phase3-v5-website.json`))
const logDirectory = dirname(reportPath)
const nextLogPath = resolve(logDirectory, `${args.targetDatabase}-next-${websitePort}.out.log`)
const nextErrorLogPath = resolve(logDirectory, `${args.targetDatabase}-next-${websitePort}.err.log`)

await assertPortAvailable(websitePort)
await mkdir(logDirectory, { recursive: true })

const factsToken = requiredSecret('INTERNAL_CMS_FACTS_TOKEN', process.env.INTERNAL_CMS_FACTS_TOKEN ?? localEnv.INTERNAL_CMS_FACTS_TOKEN)
const databasePassword = requiredSecret('DATABASE_PASSWORD', process.env.DATABASE_PASSWORD ?? localEnv.DATABASE_PASSWORD)
const encryptionKey = requiredSecret('ENCRYPTION_KEY', process.env.ENCRYPTION_KEY ?? localEnv.ENCRYPTION_KEY)
const targetHost = args.targetHost ?? '127.0.0.1'
const targetPort = parsePort(args.targetPort ?? '55432')
const databaseUsername = args.username ?? localEnv.DATABASE_USERNAME ?? 'strapi'
const report = {
  verification: 'strapi-v5-phase3-website-v1',
  executedAt: new Date().toISOString(),
  node: process.version,
  database: {
    name: args.targetDatabase,
    host: targetHost,
    port: targetPort,
  },
  strapiBaseUrl,
  websiteBaseUrl: `http://127.0.0.1:${websitePort}`,
  tokenLifecycle: {
    scope: 'isolated content-api read-only token',
    created: false,
    revoked: false,
    postRevokeStatus: null,
  },
  checks: [],
  failures: [],
  ok: false,
  limitations: [
    'This verifies only the disposable phase-3 database and local HTTP origins.',
    'Production token rotation, reverse-proxy behavior, CDN behavior, and external storage must be verified in the deployed production-equivalent environment.',
  ],
}

let app
let temporaryToken
let nextProcess

try {
  configureIsolatedStrapiEnvironment({
    targetHost,
    targetPort,
    targetDatabase: args.targetDatabase,
    databaseUsername,
    databasePassword,
    encryptionKey,
  })

  process.chdir(cmsRoot)
  // Match Strapi's own production CLI path; its CJS entry resolves bundled dependencies on this Windows host.
  const require = createRequire(resolve(cmsRoot, 'package.json'))
  const { createStrapi } = require('@strapi/core')
  app = await createStrapi({ appDir: cmsRoot, distDir: resolve(cmsRoot, 'dist') }).load()
  if (app.config.get('admin.secrets.encryptionKey') !== encryptionKey) {
    throw new Error('Strapi admin.secrets.encryptionKey is not configured for the isolated token lifecycle rehearsal.')
  }

  const tokenService = app.service('admin::api-token-content-api')
  temporaryToken = await tokenService.create({
    name: `phase3-website-rehearsal-${Date.now()}`,
    description: 'Temporary isolated token for the phase-3 v5 website rehearsal. It must be revoked by the verifier.',
    type: 'read-only',
    lifespan: 7 * 24 * 60 * 60 * 1000,
  })
  report.tokenLifecycle.created = true

  const token = temporaryToken.accessKey
  if (!token || typeof token !== 'string') throw new Error('Strapi did not return a temporary access key.')

  const restChecks = await verifyRestApi(strapiBaseUrl, token)
  report.checks.push(...restChecks)

  nextProcess = startWebsite({
    workspaceRoot,
    websitePort,
    strapiBaseUrl,
    factsToken,
    resourcesToken: token,
    outputPath: nextLogPath,
    errorPath: nextErrorLogPath,
  })

  await waitForHttp200(`http://127.0.0.1:${websitePort}/api/cms/status`, 'isolated Next.js status endpoint')
  const websiteChecks = await verifyWebsite(`http://127.0.0.1:${websitePort}`)
  report.checks.push(...websiteChecks)
} catch (error) {
  report.failures.push(error instanceof Error ? error.message : String(error))
} finally {
  await stopProcess(nextProcess)

  if (temporaryToken && app) {
    try {
      await app.service('admin::api-token-content-api').revoke(temporaryToken.id)
      report.tokenLifecycle.revoked = true
      const postRevoke = await request(`${strapiBaseUrl}/internal/cms/product-manuals?status=published`, {
        authorization: `Bearer ${temporaryToken.accessKey}`,
      })
      report.tokenLifecycle.postRevokeStatus = postRevoke.status
      addCheck(report, 'revoked temporary token is rejected', postRevoke.status === 401, {
        status: postRevoke.status,
      })
    } catch (error) {
      report.failures.push(`Temporary-token revoke verification failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  if (app) {
    try {
      await app.destroy()
    } catch (error) {
      report.failures.push(`Strapi cleanup failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

if (report.checks.some((check) => !check.passed)) {
  report.failures.push(...report.checks.filter((check) => !check.passed).map((check) => check.name))
}
report.ok = report.failures.length === 0
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
console.log(JSON.stringify({
  ok: report.ok,
  reportPath,
  database: report.database,
  tokenLifecycle: report.tokenLifecycle,
  checks: report.checks.map(({ name, passed, ...details }) => ({ name, passed, ...details })),
  failures: report.failures,
}, null, 2))
if (!report.ok) process.exitCode = 1

function configureIsolatedStrapiEnvironment({ targetHost, targetPort, targetDatabase, databaseUsername, databasePassword, encryptionKey }) {
  process.env.NODE_ENV = 'production'
  process.env.DATABASE_URL = ''
  process.env.DATABASE_SSL = 'false'
  process.env.DATABASE_HOST = targetHost
  process.env.DATABASE_PORT = String(targetPort)
  process.env.DATABASE_NAME = targetDatabase
  process.env.DATABASE_USERNAME = databaseUsername
  process.env.DATABASE_PASSWORD = databasePassword
  process.env.ENCRYPTION_KEY = encryptionKey
  process.env.STRAPI_CORS_ORIGINS = `http://127.0.0.1:${DEFAULT_WEBSITE_PORT}`
}

function startWebsite({ workspaceRoot, websitePort, strapiBaseUrl, factsToken, resourcesToken, outputPath, errorPath }) {
  const nextBin = resolve(workspaceRoot, 'node_modules', 'next', 'dist', 'bin', 'next')
  const environment = {
    ...process.env,
    NODE_ENV: 'development',
    CMS_SOURCE_MODE: 'cms-facts-api',
    CMS_FACTS_API_URL: `${strapiBaseUrl}/internal/cms/facts`,
    CMS_FACTS_API_ALLOW_FETCH: 'true',
    CMS_FACTS_API_TOKEN: factsToken,
    CMS_RESOURCES_API_URL: strapiBaseUrl,
    CMS_RESOURCES_API_TOKEN: resourcesToken,
    CMS_STRAPI_API_VERSION: '5',
    NEXT_DIST_DIR: `tmp/strapi-v5-locale/next-phase3-v5-website-${websitePort}`,
    PORT: String(websitePort),
    HOSTNAME: '127.0.0.1',
  }
  const output = createWriteStream(outputPath, { flags: 'w' })
  const error = createWriteStream(errorPath, { flags: 'w' })
  const processHandle = spawn(process.execPath, [nextBin, 'dev', '--hostname', '127.0.0.1', '--port', String(websitePort)], {
    cwd: workspaceRoot,
    env: environment,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })
  processHandle.stdout.pipe(output)
  processHandle.stderr.pipe(error)
  processHandle.once('exit', () => {
    output.end()
    error.end()
  })
  return processHandle
}

async function verifyRestApi(baseUrl, token) {
  const checks = []
  const headers = { authorization: `Bearer ${token}` }
  const resources = [
    ['published blog REST data', 'blog-posts', 2],
    ['published case REST data', 'case-studies', 1],
    ['published manual REST data', 'product-manuals', 5],
  ]

  for (const [name, collection, expectedCount] of resources) {
    const result = await request(`${baseUrl}/internal/cms/${collection}?status=published&pagination[pageSize]=100`, headers)
    const data = result.body?.data
    checks.push({
      name,
      passed: result.status === 200 && Array.isArray(data) && data.length === expectedCount,
      status: result.status,
      count: Array.isArray(data) ? data.length : null,
      expectedCount,
    })
  }

  const manuals = await request(`${baseUrl}/internal/cms/product-manuals?status=published&pagination[pageSize]=100`, headers)
  const manualRows = Array.isArray(manuals.body?.data) ? manuals.body.data : []
  checks.push({
    name: 'manual REST output carries contentLocale and v5 documentId only',
    passed: manuals.status === 200
      && manualRows.length === 5
      && manualRows.every((row) => row?.contentLocale === 'multi' && typeof row?.documentId === 'string' && !Object.hasOwn(row, 'locale')),
    status: manuals.status,
    manualCount: manualRows.length,
  })

  const malformed = await request(`${baseUrl}/internal/cms/product-manuals?filters[$and][0][$invalid]=1&populate[unknown][populate]=*`, headers)
  checks.push({
    name: 'authenticated malformed REST filter/populate never returns HTTP 500',
    passed: [400, 401, 403].includes(malformed.status),
    status: malformed.status,
  })

  return checks
}

async function verifyWebsite(baseUrl) {
  const checks = []
  const status = await request(`${baseUrl}/api/cms/status`)
  const source = status.body?.data?.source ?? status.body?.source
  checks.push({
    name: 'website CMS boundary uses v5 cms-facts-api through adapter/domain',
    passed: status.status === 200
      && source?.sourceKind === 'domain-normalized-products'
      && source?.upstreamMode === 'cms-facts-api'
      && source?.productCount === 10,
    status: status.status,
    sourceKind: source?.sourceKind ?? null,
    upstreamMode: source?.upstreamMode ?? null,
    productCount: source?.productCount ?? null,
  })

  for (const path of ['/en', '/en/products', '/en/resources', '/en/resources/blog']) {
    const result = await request(`${baseUrl}${path}`)
    const body = typeof result.text === 'string' ? result.text : ''
    checks.push({
      name: `website route ${path}`,
      passed: result.status === 200 && hasExpectedHtml(path, body),
      status: result.status,
      imageCount: (body.match(/<img\b/gi) ?? []).length,
      hasTitle: /<title>[^<]+<\/title>/i.test(body),
      hasDescription: /<meta[^>]+name=["']description["'][^>]*>/i.test(body),
      hasErrorPage: /<title>\s*(?:404|500|application error)/i.test(body),
    })
  }

  const sitemap = await request(`${baseUrl}/sitemap.xml`)
  checks.push({
    name: 'website sitemap.xml',
    passed: sitemap.status === 200 && /<urlset\b/i.test(sitemap.text) && (sitemap.text.match(/<loc>/gi) ?? []).length > 0,
    status: sitemap.status,
    urlCount: (sitemap.text.match(/<loc>/gi) ?? []).length,
  })

  const disabledRevalidate = await request(`${baseUrl}/api/revalidate`, { method: 'POST' })
  checks.push({
    name: 'generic revalidate POST is disabled in favor of signed CMS webhook revalidation',
    passed: disabledRevalidate.status === 405 && disabledRevalidate.body?.error?.code === 'revalidate-endpoint-disabled',
    status: disabledRevalidate.status,
    errorCode: disabledRevalidate.body?.error?.code ?? null,
  })

  return checks
}

function hasExpectedHtml(path, body) {
  if (!/<html/i.test(body) || !/<body/i.test(body) || !/<title>[^<]+<\/title>/i.test(body)) return false
  if (/<title>\s*(?:404|500|application error)/i.test(body)) return false
  if (path === '/en/products') return /product/i.test(body)
  if (path === '/en/resources/blog') return /blog|resource/i.test(body)
  if (path === '/en/resources') return /resource|manual|blog/i.test(body)
  return /industrial|sensor|valve|yufavor/i.test(body)
}

function addCheck(report, name, passed, details) {
  report.checks.push({ name, passed, ...details })
}

async function waitForHttp200(url, label) {
  const deadline = Date.now() + 180000
  let lastError = 'no response'
  while (Date.now() < deadline) {
    try {
      const result = await request(url)
      if (result.status === 200) return
      lastError = `HTTP ${result.status}`
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }
    await sleep(1500)
  }
  throw `${label} did not become healthy: ${lastError}`
}

async function stopProcess(processHandle) {
  if (!processHandle || processHandle.exitCode !== null) return
  processHandle.kill('SIGTERM')
  await Promise.race([
    new Promise((resolveExit) => processHandle.once('exit', resolveExit)),
    sleep(10000),
  ])
  if (processHandle.exitCode === null) processHandle.kill('SIGKILL')
}

async function assertPortAvailable(port) {
  await new Promise((resolvePromise, rejectPromise) => {
    const server = net.createServer()
    server.once('error', (error) => rejectPromise(new Error(`Website verification port ${port} is unavailable: ${error.message}`)))
    server.listen(port, '127.0.0.1', () => server.close(resolvePromise))
  })
}

async function request(url, { method = 'GET', authorization } = {}) {
  const response = await fetch(url, {
    method,
    headers: authorization ? { authorization } : undefined,
    redirect: 'manual',
  })
  const text = await response.text()
  return {
    status: response.status,
    text,
    body: parseJson(text),
  }
}

function readArgs(argv) {
  const result = {}
  const allowed = new Set(['target-database', 'target-host', 'target-port', 'username', 'strapi-base-url', 'website-port', 'report'])
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === '--help' || value === '-h') {
      console.log('Usage: node scripts/verify-phase3-v5-website.mjs --target-database industrial_cms_v5_locale_phase3_<new_name> [--target-port 55432] [--strapi-base-url http://127.0.0.1:1340] [--website-port 3110]')
      process.exit(0)
    }
    if (!value.startsWith('--')) throw new Error(`Unknown argument '${value}'.`)
    const name = value.slice(2)
    if (!allowed.has(name)) throw new Error(`Unknown argument --${name}.`)
    const next = argv[index + 1]
    if (!next || next.startsWith('--')) throw new Error(`Argument --${name} requires a value.`)
    result[name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = next
    index += 1
  }
  if (!result.targetDatabase) throw new Error('Pass --target-database industrial_cms_v5_locale_phase3_<new_name>.')
  return result
}

function assertNodeVersion() {
  if (process.versions.node !== REQUIRED_NODE_VERSION) {
    throw new Error(`This verifier must run with Node ${REQUIRED_NODE_VERSION}; received ${process.versions.node}.`)
  }
}

function assertTargetDatabase(value) {
  if (!TARGET_DATABASE_PATTERN.test(value) || value === 'industrial_cms' || value === 'industrial_cms_v5_trial') {
    throw new Error(`Refusing target database '${value}'. Use a disposable industrial_cms_v5_locale_phase3_* database only.`)
  }
}

function normalizeLocalUrl(value, label) {
  const url = new URL(value)
  if (!['127.0.0.1', 'localhost'].includes(url.hostname)) throw new Error(`${label} must be a local isolated endpoint.`)
  return url.toString().replace(/\/+$/, '')
}

function parsePort(value) {
  const port = Number.parseInt(String(value), 10)
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`Invalid port '${value}'.`)
  return port
}

function requiredSecret(name, value) {
  if (!value?.trim()) throw new Error(`Required ${name} is not available in the local protected environment.`)
  return value.trim()
}

function parseJson(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function sleep(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds))
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
