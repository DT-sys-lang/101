import Link from 'next/link'
import { ArrowRight, Gauge, PackageCheck, Send } from 'lucide-react'
import { ProductGrid } from '@/components/products/product-grid'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/i18n/routing'
import type { EntryPageViewModel } from '@/lib/domain'

function localizedHref(locale: Locale, href: string) {
  return `/${locale}${href}`
}

export function EntryHubPage({
  locale,
  data,
}: {
  locale: Locale
  data: EntryPageViewModel
}) {
  return (
    <article className="bg-background">
      <section className="border-b border-border bg-panel">
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-5 h-0.5 w-12 bg-silver" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-steel-700">{data.eyebrow}</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-ink-950 sm:text-5xl">{data.title}</h1>
            <p className="mt-5 text-base leading-8 text-ink-600 sm:text-lg">{data.body}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href={localizedHref(locale, data.primaryAction.href)}>
                  {data.primaryAction.label}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href={localizedHref(locale, data.secondaryAction.href)}>
                  {data.secondaryAction.label}
                  <Send aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-3 border-y border-border bg-ink-50 p-4 sm:grid-cols-3">
            {data.proof.map((item) => (
              <div key={item.label} className="rounded-md border border-border bg-panel p-4">
                <div className="font-mono text-2xl font-semibold text-ink-950">{item.value}</div>
                <div className="mt-2 text-xs text-ink-500">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-ink-50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {data.entries.map((entry) => (
              <section key={entry.key} className="rounded-lg border border-border bg-panel p-5 shadow-industrial">
                <div className="flex items-start justify-between gap-4">
                  <span className="grid size-10 place-items-center rounded-md border border-border bg-ink-50 text-steel-900">
                    <Gauge className="size-5" aria-hidden="true" />
                  </span>
                  <Badge variant="outline">{entry.meta}</Badge>
                </div>
                <h2 className="mt-5 text-xl font-semibold text-ink-950">{entry.title}</h2>
                <p className="mt-3 text-sm leading-6 text-ink-600">{entry.description}</p>
                <Link href={localizedHref(locale, entry.href)} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-steel-900">
                  {entry.title}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                {entry.products.length ? (
                  <div className="mt-5 border-t border-border pt-4">
                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-500">
                      <PackageCheck className="size-4" aria-hidden="true" />
                      {data.productRailLabel}
                    </div>
                    <div className="grid gap-2">
                      {entry.products.map((product) => (
                        <Link key={product.id} href={`/${locale}${product.href}`} className="flex items-center justify-between gap-3 rounded-md bg-ink-50 px-3 py-2 text-xs font-medium text-ink-700 hover:text-steel-900">
                          <span>{product.model}</span>
                          <span>{product.categoryLabel}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-panel">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <div className="mb-5 h-0.5 w-12 bg-silver" />
            <h2 className="text-2xl font-semibold text-ink-950">{data.rfq.title}</h2>
            <p className="mt-4 text-sm leading-7 text-ink-600">{data.rfq.body}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href={`/${locale}/contact`}>{data.rfq.primary}</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href={`/${locale}/products`}>{data.rfq.secondary}</Link>
              </Button>
            </div>
          </div>
          <ProductGrid
            products={data.entries.flatMap((entry) => entry.products).slice(0, 4)}
            getHref={(product) => `/${locale}${product.href}`}
            ctaLabel={data.rfq.primary}
          />
        </div>
      </section>
    </article>
  )
}
