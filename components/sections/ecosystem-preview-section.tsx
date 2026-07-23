import Link from 'next/link'
import { ArrowRight, Network, PackageCheck } from 'lucide-react'
import { SectionHeading } from '@/components/shared/section-heading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/i18n/routing'
import type { EntryEcosystemSectionViewModel, ProductListItem } from '@/lib/domain'

function localizedHref(locale: Locale, href: string) {
  return `/${locale}${href}`
}

export function EcosystemPreviewSection({
  locale,
  data,
}: {
  locale: Locale
  data: EntryEcosystemSectionViewModel
}) {
  const previewItems = data.items.slice(0, 2)

  return (
    <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
      <div>
        <SectionHeading eyebrow={data.eyebrow} title={data.title} body={data.body} />
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="secondary">
            <Link href={localizedHref(locale, '/industries#ecosystem')}>
              {locale === 'zh' ? '查看行业生态' : 'View ecosystem'}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild>
            <Link href={localizedHref(locale, '/contact')}>{data.quoteLabel}</Link>
          </Button>
        </div>
      </div>

      {previewItems.length ? (
        <div className="grid gap-4">
          {previewItems.map((item) => (
            <section key={item.id} className="rounded-lg border border-border bg-panel p-5 shadow-industrial">
              <div className="flex flex-wrap gap-2">
                <Badge variant="signal">{item.industryLabel}</Badge>
                <Badge variant="outline">{item.scenario}</Badge>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-ink-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-ink-600">{item.rationale}</p>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <ProductMiniRail title={locale === 'zh' ? '推荐传感器' : 'Recommended sensors'} products={item.sensorProducts} locale={locale} />
                <ProductMiniRail title={locale === 'zh' ? '推荐阀门' : 'Recommended valves'} products={item.valveProducts} locale={locale} />
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-ink-300 bg-panel p-6 text-sm leading-7 text-ink-600">
          <Network className="mb-3 size-5 text-steel-900" aria-hidden="true" />
          {data.emptyLabel}
        </div>
      )}
    </div>
  )
}

function ProductMiniRail({
  title,
  products,
  locale,
}: {
  title: string
  products: readonly ProductListItem[]
  locale: Locale
}) {
  return (
    <div className="rounded-md border border-border bg-ink-50 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-500">
        <PackageCheck className="size-4" aria-hidden="true" />
        {title}
      </div>
      <div className="mt-3 grid gap-2">
        {products.length ? (
          products.slice(0, 3).map((product) => (
            <Link
              key={product.id}
              href={localizedHref(locale, product.href)}
              className="flex items-center justify-between gap-3 rounded-md bg-panel px-3 py-2 text-xs font-medium text-ink-700 hover:text-steel-900"
            >
              <span>{product.model}</span>
              <span className="text-right text-ink-500">{product.categoryLabel}</span>
            </Link>
          ))
        ) : (
          <div className="rounded-md border border-dashed border-ink-300 bg-panel px-3 py-2 text-xs text-ink-500">
            {locale === 'zh' ? '等待运营推荐' : 'Waiting for curated content'}
          </div>
        )}
      </div>
    </div>
  )
}
