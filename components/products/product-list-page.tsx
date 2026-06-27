import Link from 'next/link'
import { Boxes, Filter, Gauge, SlidersHorizontal } from 'lucide-react'
import { ProductGrid } from '@/components/products/product-grid'
import { Badge } from '@/components/ui/badge'
import type { Locale } from '@/i18n/routing'
import type { ProductListPageViewModel } from '@/lib/domain'

export function ProductListPageView({
  locale,
  data,
}: {
  locale: Locale
  data: ProductListPageViewModel
}) {
  const text = data.labels

  return (
    <article className="bg-background">
      <section className="border-b border-border bg-panel">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs font-medium text-ink-500">
            {data.breadcrumb.map((item, index) => (
              <span key={item.href} className="flex items-center gap-2">
                {index > 0 ? <span aria-hidden="true">/</span> : null}
                <Link href={item.href} className="hover:text-steel-900">
                  {item.label}
                </Link>
              </span>
            ))}
          </nav>
        </div>
      </section>

      <section className="border-b border-border bg-panel">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-4 h-0.5 w-12 bg-silver" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-steel-700">{text.eyebrow}</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-ink-950 sm:text-4xl">
              {data.category.name}
            </h1>
            <p className="mt-4 text-base leading-7 text-ink-600">{data.category.description}</p>
          </div>
          <div className="flex items-start lg:justify-end">
            <Badge variant="signal" className="h-9 px-3">
              <Boxes className="mr-2 size-4" aria-hidden="true" />
              {data.countLabel}
            </Badge>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-ink-50">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
          <aside className="space-y-4">
            <div className="rounded-lg border border-border bg-panel p-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-950">
                <SlidersHorizontal className="size-4 text-steel-900" aria-hidden="true" />
                {text.filters}
              </h2>
              <FacetGroup title={text.categories} items={data.productList.facets.categories.map((facet) => `${facet.label} (${facet.count})`)} />
              <FacetGroup title={text.measurement} items={data.productList.facets.measurementKinds.map((facet) => `${facet.label} (${facet.count})`)} />
              <FacetGroup title={text.availability} items={data.productList.facets.availability.map((facet) => `${facet.label} (${facet.count})`)} />
            </div>
          </aside>

          <div>
            {data.productList.items.length > 0 ? (
              <ProductGrid
                products={data.productList.items}
                getHref={(product) => `/${locale}${product.href}`}
                ctaLabel={text.details}
              />
            ) : (
              <div className="rounded-lg border border-border bg-panel p-8 text-sm text-ink-600">
                <Filter className="mb-3 size-5 text-steel-900" aria-hidden="true" />
                {text.empty}
              </div>
            )}
          </div>
        </div>
      </section>
    </article>
  )
}

function FacetGroup({
  title,
  items,
}: {
  title: string
  items: readonly string[]
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className="mt-5 border-t border-border pt-4">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-500">
        <Gauge className="size-3.5" aria-hidden="true" />
        {title}
      </h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.slice(0, 8).map((item) => (
          <Badge key={item} variant="outline" className="text-[11px]">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  )
}
