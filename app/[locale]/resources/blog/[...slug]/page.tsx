import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { ResourceDetailPage } from '@/components/sections/resource-detail-page'
import { isLocale, type Locale, routing } from '@/i18n/routing'
import { resolveResourceDetailPageViewModel } from '@/lib/domain'
import { preloadRuntimeDomainProducts, runtimeProductViewModelSource } from '@/lib/runtime/domain-products'
import { listRuntimeResourceContent } from '@/lib/runtime/domain-resources'

export const revalidate = 3600

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => [
    { locale, slug: ['technical-knowledge'] },
    { locale, slug: ['engineering-blog'] },
  ])
}

export default async function BlogResourceDetailPage({
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
  const content = await listRuntimeResourceContent(typedLocale, 'blog')
  const data = resolveResourceDetailPageViewModel(typedLocale, 'blog', slug, runtimeProductViewModelSource, content)

  if (!data) {
    notFound()
  }

  return <ResourceDetailPage locale={typedLocale} data={data} />
}
