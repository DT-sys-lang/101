import Link from 'next/link'
import { ChevronRight, Filter, Search, SlidersHorizontal, X } from 'lucide-react'
import { ProductGrid } from '@/components/products/product-grid'
import type { Locale } from '@/i18n/routing'
import type { ProductListFilterItemViewModel, ProductListPageViewModel } from '@/lib/domain'
import { cn } from '@/lib/utils'

export function ProductListPageView({ locale, data }: { locale: Locale; data: ProductListPageViewModel }) {
  const text = data.labels
  const activeFilters = data.filterGroups.flatMap((group) => group.items.filter((item) => item.active))

  return (
    <article className="bg-background">
      <section className="border-b border-border bg-panel">
        <div className="stitch-shell py-12 lg:py-24">
          <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-1.5 text-xs text-ink-600">
            {data.breadcrumb.map((item, index) => <span key={item.href} className="inline-flex items-center gap-1.5">{index ? <ChevronRight className="size-3" aria-hidden="true" /> : null}<Link href={item.href} className="hover:text-steel-700">{item.label}</Link></span>)}
          </nav>
          <div className="max-w-4xl">
            <p className="stitch-eyebrow">{text.eyebrow}</p>
            <h1 className="mt-4 stitch-display">{data.category.name}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-ink-600">{data.category.description}</p>
          </div>
        </div>
      </section>

      <section className="stitch-shell grid gap-8 py-16 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="h-fit lg:sticky lg:top-36">
          <div className="border border-border bg-panel p-6">
            <div className="flex items-center gap-3 border-b border-border pb-6">
              <SlidersHorizontal className="size-5 text-steel-700" aria-hidden="true" />
              <h2 className="text-sm font-semibold uppercase text-ink-950">{locale === 'zh' ? 'Engineering Filters' : 'Engineering Filters'}</h2>
            </div>
            <form action={`/${locale}${data.search.actionPath}`} method="get" className="mt-6">
              {data.search.hiddenInputs.map((input, index) => <input key={`${input.name}-${input.value}-${index}`} type="hidden" name={input.name} value={input.value} />)}
              <label htmlFor="product-keyword-search" className="stitch-eyebrow">{data.search.label}</label>
              <div className="relative mt-2">
                <input id="product-keyword-search" name="search" type="search" defaultValue={data.search.value} placeholder={data.search.placeholder} className="input-industrial w-full pr-10" />
                <button type="submit" aria-label={data.search.submitLabel} title={data.search.submitLabel} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center text-ink-950 hover:text-steel-700"><Search className="size-4" aria-hidden="true" /></button>
              </div>
            </form>
            <div className="mt-6 space-y-8">
              {data.filterGroups.map((group) => <FacetGroup locale={locale} key={group.title} title={group.title} items={group.items} />)}
            </div>
            {(data.search.value || activeFilters.length) ? <Link href={`/${locale}${data.search.clearHref}`} scroll={false} className="mt-8 inline-flex h-11 w-full items-center justify-center border border-ink-950 text-sm font-semibold text-ink-950 hover:border-steel-700 hover:text-steel-700">{text.allProducts}</Link> : null}
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-8 flex flex-col justify-between gap-4 border-b border-border pb-4 md:flex-row md:items-center">
            <div className="text-sm text-ink-600">{data.countLabel}</div>
            <div className="flex items-center gap-2 text-sm text-ink-600">
              <span className="uppercase">{locale === 'zh' ? 'Sort by:' : 'Sort by:'}</span>
              <select className="border-0 bg-transparent p-0 pr-7 text-ink-950 outline-none focus:ring-0">
                <option>{locale === 'zh' ? 'Relevant' : 'Relevant'}</option>
                <option>{locale === 'zh' ? 'Model' : 'Model'}</option>
              </select>
            </div>
          </div>

          <div className="min-h-8 pb-6">
            {data.search.value || activeFilters.length ? <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-[11px] text-ink-600">{locale === 'zh' ? 'Active filters' : 'Active filters'}</span>{data.search.value ? <ActiveFilter label={data.search.value} /> : null}{activeFilters.map((item) => <ActiveFilter key={`${item.value}-${item.label}`} label={item.label} />)}<Link href={`/${locale}${data.search.clearHref}`} scroll={false} className="ml-1 text-xs font-semibold text-steel-700 hover:underline">{locale === 'zh' ? 'Clear all' : 'Clear all'}</Link></div> : null}
          </div>

          {data.productList.items.length ? <ProductGrid products={data.productList.items} getHref={(product) => `/${locale}${product.href}`} ctaLabel={text.details} /> : <div className="border border-dashed border-ink-300 bg-panel p-8 text-sm text-ink-600"><Filter className="mb-3 size-5 text-steel-700" aria-hidden="true" />{text.empty}</div>}

          <footer className="mt-12 flex justify-center border-t border-border pt-8">
            <div className="flex gap-2"><span className="grid h-10 min-w-10 place-items-center border border-steel-700 bg-panel px-3 font-mono text-sm font-semibold text-steel-700">1</span><span className="grid h-10 min-w-10 place-items-center border border-border px-3 font-mono text-sm text-ink-600">2</span><span className="grid h-10 min-w-10 place-items-center border border-border px-3 font-mono text-sm text-ink-600">3</span></div>
          </footer>
        </section>
      </section>
    </article>
  )
}

function ActiveFilter({ label }: { label: string }) {
  return <span className="inline-flex items-center gap-1.5 border border-border bg-panel px-2 py-1 font-mono text-[11px] text-ink-950">{label}<X className="size-3 text-ink-500" aria-hidden="true" /></span>
}

function FacetGroup({ locale, title, items }: { locale: Locale; title: string; items: readonly ProductListFilterItemViewModel[] }) {
  if (!items.length) return null
  return <section className="border-t border-border pt-4"><h3 className="mb-4 text-sm font-medium text-ink-950">{title}</h3><div className="space-y-3">{items.slice(0, 8).map((item) => <Link key={`${title}-${item.value}`} href={`/${locale}${item.href}`} scroll={false} aria-current={item.active ? 'true' : undefined} className="group flex items-center gap-3 text-sm"><span className={cn('grid h-4 w-4 place-items-center border', item.active ? 'border-steel-700 bg-steel-700' : 'border-border bg-panel group-hover:border-steel-700')} /> <span className={cn('min-w-0 flex-1 truncate', item.active ? 'font-semibold text-ink-950' : 'text-ink-600 group-hover:text-ink-950')}>{item.label}</span><span className="font-mono text-[10px] text-ink-500">{item.count}</span></Link>)}</div></section>
}
