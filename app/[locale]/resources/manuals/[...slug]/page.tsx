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
    { locale, slug: ['company-materials'] },
    { locale, slug: ['company-materials', 'company-brochure'] },
    { locale, slug: ['company-materials', 'quality-certification'] },
  ])
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: readonly string[] }> }) {
  const { locale, slug } = await params

  if (!isLocale(locale)) return {}

  await preloadRuntimeDomainProducts()
  const content = await listRuntimeResourceContent(locale, 'manuals')
  const data = resolveResourceDetailPageViewModel(locale, 'manuals', slug, runtimeProductViewModelSource, content)
  return data ? buildResourceDetailMetadata(locale, 'manuals', slug, data) : {}
}

export default async function ManualResourceDetailPage({
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
  const content = await listRuntimeResourceContent(typedLocale, 'manuals')
  const data = resolveResourceDetailPageViewModel(typedLocale, 'manuals', slug, runtimeProductViewModelSource, content)

  if (!data) {
    notFound()
  }

  return <ResourceDetailPage locale={typedLocale} data={data} />
}
