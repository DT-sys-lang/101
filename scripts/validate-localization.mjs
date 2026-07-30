const defaultPages = [
  '/',
  '/products',
  '/products?family=sensor',
  '/products?family=valve',
  '/industries',
  '/resources/blog',
  '/resources/cases',
  '/resources/manuals',
]

const localeRules = {
  zh: {
    blocked: [
      /\bConnected Industry\b/i,
      /\bPrecision Measurement\b/i,
      /\bIndustry Solutions\b/i,
      /\bPrecise Control\b/i,
      /\bproduct catalog and selection hub\b/i,
      /\bFluid Control\b/,
      /\bCustomizable\b/,
      /\bCustom material\b/,
      /\bNatural gas\b/,
      /\bInert gas\b/,
      /\bAir\s*\/\s*Oil\s*\/\s*Water\b/,
      /\bWater\s*\/\s*Air\s*\/\s*Oil\b/,
      /\bRecommended products\b/i,
      /\bWaiting for\b/i,
      /\bOpen manual\b/i,
      /\bRead article\b/i,
      /\bView case\b/i,
    ],
  },
  en: {
    blocked: [/[\u4e00-\u9fff]/],
  },
}

const baseUrl = process.env.LOCALIZATION_AUDIT_BASE_URL ?? 'http://localhost:3000'
const locales = (process.env.LOCALIZATION_AUDIT_LOCALES ?? 'zh,en')
  .split(',')
  .map((locale) => locale.trim())
  .filter(Boolean)
const pages = (process.env.LOCALIZATION_AUDIT_PATHS ?? defaultPages.join(','))
  .split(',')
  .map((path) => path.trim())
  .filter(Boolean)
const productDetailLimit = Number.parseInt(process.env.LOCALIZATION_AUDIT_PRODUCT_DETAIL_LIMIT ?? '5', 10)

const failures = []
const auditedPagesByLocale = {}

for (const locale of locales) {
  const rules = localeRules[locale]

  if (!rules) {
    failures.push({ locale, path: '*', issue: 'missing-locale-rule' })
    continue
  }

  const localePages = uniqueStrings([
    ...pages,
    ...(await discoverProductDetailPaths(locale)),
  ])
  auditedPagesByLocale[locale] = localePages

  for (const path of localePages) {
    const url = new URL(`/${locale}${path}`, baseUrl)
    const response = await fetch(url)

    if (!response.ok) {
      failures.push({ locale, path, issue: 'http-error', status: response.status })
      continue
    }

    const html = await response.text()
    const text = htmlToVisibleText(html)

    for (const pattern of rules.blocked) {
      const match = text.match(pattern)

      if (match) {
        failures.push({
          locale,
          path,
          issue: 'blocked-language-fragment',
          pattern: pattern.toString(),
          match: match[0],
          context: readContext(text, match.index ?? 0),
        })
      }
    }
  }
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, baseUrl, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({ ok: true, baseUrl, locales, pages: auditedPagesByLocale }, null, 2))

async function discoverProductDetailPaths(locale) {
  if (!Number.isFinite(productDetailLimit) || productDetailLimit < 1) {
    return []
  }

  const response = await fetch(new URL(`/${locale}/products`, baseUrl))

  if (!response.ok) {
    return []
  }

  const html = await response.text()
  const matches = [...html.matchAll(new RegExp(`href=["']/${locale}(/products/[^"'?#]+)["']`, 'g'))]

  return uniqueStrings(matches
    .map((match) => match[1])
    .filter((path) => path !== '/products')
    .filter((path) => !path.includes('/geo/')))
    .slice(0, productDetailLimit)
}

function htmlToVisibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/中文/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function readContext(text, index) {
  const start = Math.max(0, index - 80)
  const end = Math.min(text.length, index + 120)
  return text.slice(start, end)
}

function uniqueStrings(values) {
  return [...new Set(values)]
}
