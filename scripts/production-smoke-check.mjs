const DEFAULT_TIMEOUT_MS = 10000

const siteOrigin = readOrigin('SMOKE_SITE_URL') || readOrigin('NEXT_PUBLIC_SITE_ORIGIN')
const cmsOrigin = readOrigin('SMOKE_CMS_URL') || readOrigin('CMS_RESOURCES_API_URL')
const cmsFactsApiUrl = readUrl('CMS_FACTS_API_URL')
const cmsFactsApiToken = process.env.CMS_FACTS_API_TOKEN?.trim()
const timeoutMs = readPositiveInt(process.env.SMOKE_CHECK_TIMEOUT_MS, DEFAULT_TIMEOUT_MS)

const checks = [
  ...siteChecks(siteOrigin),
  ...cmsChecks(cmsOrigin),
  ...cmsFactsChecks(cmsFactsApiUrl, cmsFactsApiToken),
]

if (!checks.length) {
  console.error('No smoke checks configured. Set SMOKE_SITE_URL or NEXT_PUBLIC_SITE_ORIGIN.')
  process.exit(1)
}

const results = []

for (const check of checks) {
  results.push(await runCheck(check))
}

const failed = results.filter((result) => !result.ok)

for (const result of results) {
  const status = result.ok ? 'PASS' : 'FAIL'
  const detail = result.error || `HTTP ${result.status} in ${result.durationMs}ms`
  console.log(`${status} ${result.name} ${result.url} - ${detail}`)
}

if (failed.length) {
  console.error(`${failed.length} production smoke check(s) failed.`)
  process.exit(1)
}

console.log(`All ${results.length} production smoke checks passed.`)

function siteChecks(origin) {
  if (!origin) {
    return []
  }

  return [
    { name: 'site-home', url: new URL('/', origin).toString(), expectedStatuses: [200] },
    { name: 'cms-status-api', url: new URL('/api/cms/status', origin).toString(), expectedStatuses: [200] },
    { name: 'inquiry-contract-api', url: new URL('/api/inquiry', origin).toString(), expectedStatuses: [200] },
    { name: 'robots', url: new URL('/robots.txt', origin).toString(), expectedStatuses: [200] },
    { name: 'sitemap', url: new URL('/sitemap.xml', origin).toString(), expectedStatuses: [200] },
  ]
}

function cmsChecks(origin) {
  if (!origin) {
    return []
  }

  return [
    { name: 'strapi-admin', url: new URL('/admin', origin).toString(), expectedStatuses: [200] },
  ]
}

function cmsFactsChecks(url, token) {
  if (!url || !token) {
    return []
  }

  return [
    {
      name: 'internal-cms-facts',
      url,
      expectedStatuses: [200],
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  ]
}

async function runCheck(check) {
  const started = Date.now()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(check.url, {
      headers: check.headers,
      signal: controller.signal,
    })
    const durationMs = Date.now() - started
    const ok = check.expectedStatuses.includes(response.status)

    return {
      name: check.name,
      url: check.url,
      ok,
      status: response.status,
      durationMs,
      error: ok ? undefined : `unexpected HTTP ${response.status}`,
    }
  } catch (error) {
    return {
      name: check.name,
      url: check.url,
      ok: false,
      status: 0,
      durationMs: Date.now() - started,
      error: error instanceof Error ? error.message : 'unknown error',
    }
  } finally {
    clearTimeout(timeout)
  }
}

function readOrigin(name) {
  const value = process.env[name]?.trim()

  if (!value) {
    return undefined
  }

  try {
    return new URL(value).origin
  } catch {
    return undefined
  }
}

function readUrl(name) {
  const value = process.env[name]?.trim()

  if (!value) {
    return undefined
  }

  try {
    return new URL(value).toString()
  } catch {
    return undefined
  }
}

function readPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}
