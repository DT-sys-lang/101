import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { StitchNativePage } from '@/components/stitch/stitch-native-pages'
import { isLocale, type Locale } from '@/i18n/routing'
import { resolveProductListViewModel } from '@/lib/domain'
import { resolveProductListPage } from '@/lib/seo/product-list'
import { ProductListStructuredData } from '@/lib/seo/structured-data'
import { preloadRuntimeDomainProducts, runtimeProductViewModelSource } from '@/lib/runtime/domain-products'

export const revalidate = 3600

export const metadata = {
  title: 'Search Products | Industrial Sensor Database',
  description: 'Search industrial sensor and valve products by model, family, application, and technical parameters.',
}

interface SearchPageProps {
  readonly params: Promise<{ readonly locale: string }>
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
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
      <StitchNativePage locale={typedLocale} screen="search" productListData={data} />
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
