import { routing, type Locale } from '@/i18n/routing'
import { buildLlmsTxt } from '@/lib/geo'
import { preloadRuntimeDomainProducts } from '@/lib/runtime/domain-products'

export const revalidate = 3600

export async function GET(request: Request) {
  await preloadRuntimeDomainProducts()
  const locale = getLocaleFromRequest(request)

  return new Response(buildLlmsTxt(locale), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}

function getLocaleFromRequest(request: Request): Locale {
  const url = new URL(request.url)
  const locale = url.searchParams.get('locale')

  return routing.locales.includes(locale as Locale) ? locale as Locale : routing.defaultLocale
}
