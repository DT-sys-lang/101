import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { ResourceDetailPage } from '@/components/sections/resource-detail-page'
import { isLocale, type Locale, routing } from '@/i18n/routing'
import { resolveResourceDetailPageViewModel } from '@/lib/domain'
import { preloadRuntimeDomainProducts, runtimeProductViewModelSource } from '@/lib/runtime/domain-products'
import { listRuntimeResourceContent } from '@/lib/runtime/domain-resources'
import { buildResourceDetailMetadata } from '@/lib/seo/resources'

export const revalidate = 3600

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => [
    { locale, slug: ['iot-application-cases'] },
    { locale, slug: ['oem-cases'] },
  ])
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: readonly string[] }> }) {
  const { locale, slug } = await params

  if (!isLocale(locale)) return {}

  await preloadRuntimeDomainProducts()
  const content = await listRuntimeResourceContent(locale, 'cases')
  const data = resolveResourceDetailPageViewModel(locale, 'cases', slug, runtimeProductViewModelSource, content)
  return data ? buildResourceDetailMetadata(locale, 'cases', slug, data) : {}
}

export default async function CaseResourceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: readonly string[] }>
}) {
  const { locale, slug } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  setRequestLocale(locale)

  await preloadRuntimeDomainProducts()

  const typedLocale = locale as Locale
  const content = await listRuntimeResourceContent(typedLocale, 'cases')
  const data = resolveResourceDetailPageViewModel(typedLocale, 'cases', slug, runtimeProductViewModelSource, content)

  if (!data) {
    notFound()
  }

  return <ResourceDetailPage locale={typedLocale} data={data} />
}
