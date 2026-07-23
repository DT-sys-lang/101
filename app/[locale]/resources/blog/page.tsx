import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { ResourceCollectionPage } from '@/components/sections/resource-collection-page'
import { isLocale, type Locale } from '@/i18n/routing'
import { getResourceCollectionPageViewModel } from '@/lib/domain'
import { buildResourceCollectionMetadata } from '@/lib/seo/resources'
import { preloadRuntimeDomainProducts, runtimeProductViewModelSource } from '@/lib/runtime/domain-products'
import { listRuntimeResourceContent } from '@/lib/runtime/domain-resources'

export const revalidate = 3600

export async function generateMetadata({ params }: { readonly params: Promise<{ readonly locale: string }> }) {
  const { locale } = await params

  if (!isLocale(locale)) {
    return {}
  }

  const typedLocale = locale as Locale
  const data = getResourceCollectionPageViewModel(typedLocale, 'blog')

  return buildResourceCollectionMetadata(typedLocale, 'blog', data)
}

export default async function BlogResourcesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  setRequestLocale(locale)

  await preloadRuntimeDomainProducts()

  const typedLocale = locale as Locale
  const content = await listRuntimeResourceContent(typedLocale, 'blog')
  const data = getResourceCollectionPageViewModel(typedLocale, 'blog', runtimeProductViewModelSource, content)

  return <ResourceCollectionPage locale={typedLocale} data={data} />
}
