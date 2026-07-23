import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { StitchNativePage } from '@/components/stitch/stitch-native-pages'
import { isLocale, type Locale, routing } from '@/i18n/routing'
import { resolveProductListViewModel } from '@/lib/domain'
import { buildProductListMetadata, resolveProductListPage } from '@/lib/seo/product-list'
import { ProductListStructuredData } from '@/lib/seo/structured-data'
import { preloadRuntimeDomainProducts, runtimeProductViewModelSource } from '@/lib/runtime/domain-products'

export const revalidate = 3600

interface ProductsIndexPageProps {
  readonly params: Promise<{
    readonly locale: string
  }>
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: ProductsIndexPageProps) {
  const { locale } = await params

  if (!isLocale(locale)) {
    return {}
  }

  await preloadRuntimeDomainProducts()
  const typedLocale = locale as Locale
  const data = resolveProductListPage(typedLocale)

  return data ? buildProductListMetadata(data) : {}
}

export default async function ProductsIndexPage({ params, searchParams }: ProductsIndexPageProps) {
  const { locale } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  setRequestLocale(locale)

  await preloadRuntimeDomainProducts()
  const typedLocale = locale as Locale
  const filters = readProductListOptions(await searchParams)
  const data = resolveProductListViewModel(typedLocale, [], filters, runtimeProductViewModelSource)
  const seoData = resolveProductListPage(typedLocale)

  if (!data || !seoData) {
    notFound()
  }

  return (
    <>
      <ProductListStructuredData data={seoData} />
      <StitchNativePage locale={typedLocale} screen="products" productListData={data} />
    </>
  )
}

function readProductListOptions(params?: Record<string, string | string[] | undefined>) {
  return {
    search: readSingleParam(params?.search),
    categoryIds: readMultiParam(params?.category),
    families: readMultiParam(params?.family),
    measurementKinds: readMultiParam(params?.measurement),
    industrySlugs: readMultiParam(params?.industry),
    applicationSlugs: readMultiParam(params?.application),
    outputKinds: readMultiParam(params?.output),
    accuracyValues: readMultiParam(params?.accuracy),
    certifications: readMultiParam(params?.certification),
    rangeMinBar: readNumberParam(params?.rangeMinBar),
    rangeMaxBar: readNumberParam(params?.rangeMaxBar),
  }
}

function readSingleParam(value?: string | string[]) {
  const firstValue = Array.isArray(value) ? value[0] : value

  return firstValue?.trim() || undefined
}

function readMultiParam(value?: string | string[]) {
  const values = Array.isArray(value) ? value : value ? [value] : []

  return values
    .flatMap((item) => item.split(','))
    .map((item) => item.trim())
    .filter(Boolean)
}

function readNumberParam(value?: string | string[]) {
  const rawValue = readSingleParam(value)
  const parsedValue = rawValue ? Number(rawValue) : undefined

  return typeof parsedValue === 'number' && Number.isFinite(parsedValue) ? parsedValue : undefined
}
