import type { Locale } from '@/i18n/routing'
import type { EntryPageSeoData } from '@/lib/domain/entry-pages'
import type { HomepageProjection, ProductDetailPageData, StaticInfoPageKind, StaticInfoPageViewModel } from '@/lib/domain'
import type { ProductListPageData } from './product-list'
import { buildProductFaqItems } from './faq'
import { buildHomePageJsonLd } from './home'
import { buildEntryPageJsonLd } from './entry-page'
import { buildProductFaqSchemaJsonLd } from './jsonld/faq'
import { buildProductListJsonLd } from './jsonld/item-list'
import { buildProductSchemaJsonLd } from './jsonld/product'
import { buildStaticInfoPageJsonLd } from './static-info'

export function JsonLdScript({
  data,
  id,
}: {
  readonly data: unknown
  readonly id?: string
}) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}

export function HomePageStructuredData({ locale, data }: { readonly locale: Locale; readonly data: HomepageProjection }) {
  return <JsonLdScript id="home-jsonld" data={buildHomePageJsonLd(locale, data)} />
}

export function StaticInfoPageStructuredData({
  locale,
  kind,
  data,
}: {
  readonly locale: Locale
  readonly kind: StaticInfoPageKind
  readonly data: StaticInfoPageViewModel
}) {
  return <JsonLdScript id={`${kind}-jsonld`} data={buildStaticInfoPageJsonLd(locale, kind, data)} />
}

export function EntryPageStructuredData({ id, data }: { readonly id: string; readonly data: EntryPageSeoData }) {
  return <JsonLdScript id={id} data={buildEntryPageJsonLd(data)} />
}

export function ProductListStructuredData({ data }: { readonly data: ProductListPageData }) {
  return <JsonLdScript id="product-list-jsonld" data={buildProductListJsonLd(data)} />
}

export function ProductDetailStructuredData({ data }: { readonly data: ProductDetailPageData }) {
  const faqItems = buildProductFaqItems(data)

  return (
    <>
      <JsonLdScript id="product-jsonld" data={buildProductSchemaJsonLd(data)} />
      <JsonLdScript id="product-faq-jsonld" data={buildProductFaqSchemaJsonLd(data, faqItems)} />
    </>
  )
}
