const defaultPages = [
  '/',
  '/products',
  '/products?family=sensor',
  '/products?family=valve',
  '/industries',
  '/applications',
  '/oem',
  '/company',
  '/company/manufacturing',
  '/manufacturing',
  '/resources',
  '/resources/blog',
  '/resources/cases',
  '/resources/manuals',
  '/contact',
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
      /\bFeatured System\b/i,
      /\bModel:/i,
      /\bDescription\b/i,
      /\bDownloads\b/i,
      /\bKey Features\b/i,
      /\bValue\s*\/\s*Description\b/i,
    ],
  },
  en: {
    blocked: [/[一-鿿]/],
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
const productDetailLimit = Number.parseInt(process.env.LOCALIZATION_AUDIT_PRODUCT_DETAIL_LIMIT ?? '1000', 10)

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
    ...(await discoverResourceDetailPaths(locale)),
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
    const text = `${htmlToVisibleText(html)} ${htmlToImageAltText(html)}`.trim()
    const htmlLang = readHtmlLang(html)
    const expectedHtmlLang = locale === 'zh' ? 'zh-CN' : 'en'

    if (htmlLang !== expectedHtmlLang) {
      failures.push({ locale, path, issue: 'html-lang-mismatch', expected: expectedHtmlLang, actual: htmlLang })
    }

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

  const discovered = []

  for (let page = 1; page <= 100; page += 1) {
    const response = await fetch(new URL(`/${locale}/products?page=${page}`, baseUrl))
    if (!response.ok) break

    const html = await response.text()
    const matches = [...html.matchAll(new RegExp(`href=["']/${locale}(/products/[^"'?#]+)["']`, 'g'))]
      .map((match) => match[1])
      .filter((path) => path !== '/products')
      .filter((path) => !path.includes('/geo/'))
    const before = discovered.length
    discovered.push(...matches.filter((path) => !discovered.includes(path)))

    if (!matches.length || discovered.length === before || discovered.length >= productDetailLimit) break
  }

  return discovered.slice(0, productDetailLimit)
}

async function discoverResourceDetailPaths(locale) {
  const collectionPaths = ['/resources/blog', '/resources/cases', '/resources/manuals']
  const discovered = []

  for (const collectionPath of collectionPaths) {
    const response = await fetch(new URL(`/${locale}${collectionPath}`, baseUrl))
    if (!response.ok) continue

    const html = await response.text()
    const pattern = new RegExp(`href=["']/${locale}(${collectionPath}/[^"'?#]+)["']`, 'g')
    discovered.push(...[...html.matchAll(pattern)].map((match) => match[1]))
  }

  return uniqueStrings(discovered)
}

function readHtmlLang(html) {
  return html.match(/<html[^>]*\blang=["']([^"']+)["']/i)?.[1]
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

function htmlToImageAltText(html) {
  return [...html.matchAll(/<img\b[^>]*\balt=["']([^"']*)["'][^>]*>/gi)]
    .map((match) => decodeHtmlText(match[1]))
    .join(' ')
}

function decodeHtmlText(value) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function readContext(text, index) {
  const start = Math.max(0, index - 80)
  const end = Math.min(text.length, index + 120)
  return text.slice(start, end)
}

function uniqueStrings(values) {
  return [...new Set(values)]
}
