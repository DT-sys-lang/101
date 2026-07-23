import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Factory, FileCheck2, PackageCheck } from 'lucide-react'
import { ProductGrid } from '@/components/products/product-grid'
import { getIndustrialIcon } from '@/components/shared/industrial-icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/i18n/routing'
import type { HomepageProjection } from '@/lib/domain'

function localizedHref(locale: Locale, href: string) {
  return `/${locale}${href}`
}

export function HomePage({ locale, data }: { locale: Locale; data: HomepageProjection }) {
  return (
    <article className="bg-background">
      <section className="border-b border-border bg-panel">
        <div className="stitch-shell grid min-h-[560px] gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div className="max-w-3xl">
            <p className="stitch-eyebrow">{data.hero.eyebrow}</p>
            <h1 className="mt-4 stitch-display">{data.hero.title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-600">{data.hero.body}</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg"><Link href={`/${locale}/products`}>{data.hero.primary}<ArrowRight aria-hidden="true" /></Link></Button>
              <Button asChild size="lg" variant="secondary"><Link href={`/${locale}/industries`}>{data.hero.secondary}</Link></Button>
            </div>
          </div>
          <div className="border border-border bg-ink-50 p-6">
            <div className="relative aspect-[4/3] border border-border bg-panel">
              <Image src="/images/hero/industrial-instrumentation.png" alt={data.hero.imageAlt} fill priority sizes="(min-width: 1024px) 44vw, 100vw" className="object-cover grayscale" />
            </div>
            <div className="mt-6 grid gap-px border border-border bg-border sm:grid-cols-3">
              {data.hero.metrics.map((metric) => (
                <div key={metric.label} className="bg-panel p-4">
                  <div className="font-mono text-2xl font-semibold text-ink-950">{metric.value}</div>
                  <div className="mt-2 text-xs leading-5 text-ink-600">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="stitch-section bg-panel">
        <div className="stitch-shell">
          <SectionLead eyebrow={data.categories.eyebrow} title={data.categories.title} body={data.categories.body} linkLabel={data.categories.linkLabel} href="/products" locale={locale} />
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {data.hero.entries.map((entry) => <QuickEntry key={entry.href} locale={locale} entry={entry} />)}
            {data.resources.items.slice(2, 3).map((item) => <QuickEntry key={item.href} locale={locale} entry={{ label: item.title, description: item.description, href: item.href }} />)}
          </div>
        </div>
      </section>

      <section className="stitch-section bg-ink-50">
        <div className="stitch-shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="stitch-eyebrow">{data.modules.eyebrow}</p>
            <h2 className="mt-4 stitch-heading">{data.modules.title}</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-ink-600">{data.modules.body}</p>
            <Button asChild className="mt-8"><Link href={`/${locale}/oem`}>{locale === 'zh' ? '鏌ョ湅 OEM 鏂规' : 'Explore OEM solutions'}<ArrowRight aria-hidden="true" /></Link></Button>
          </div>
          <div className="grid gap-6">
            {data.modules.items.map((item) => {
              const Icon = getIndustrialIcon(item.icon)
              return (
                <section key={item.title} className="grid gap-5 border border-border bg-panel p-6 sm:grid-cols-[48px_minmax(0,1fr)]">
                  <span className="grid h-12 w-12 place-items-center border border-border bg-panel text-steel-700"><Icon className="size-5" aria-hidden="true" /></span>
                  <div>
                    <h3 className="text-xl font-medium text-ink-950">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-ink-600">{item.description}</p>
                    <div className="mt-5 flex flex-wrap gap-2">{item.points.map((point) => <span key={point} className="inline-flex items-center gap-1.5 border border-border bg-ink-50 px-2 py-1 font-mono text-[11px] text-ink-600"><CheckCircle2 className="size-3.5 text-steel-700" aria-hidden="true" />{point}</span>)}</div>
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      </section>

      <section className="stitch-section bg-panel">
        <div className="stitch-shell">
          <SectionLead eyebrow={data.products.eyebrow} title={data.products.title} body={data.products.body} linkLabel={data.products.viewAllLabel} href="/products" locale={locale} />
          <div className="mt-6 flex items-center justify-between border-y border-border py-4"><span className="font-mono text-xs text-ink-600">{data.products.totalLabel}</span><Badge variant="outline">{locale === 'zh' ? '宸ョ▼鐩綍' : 'Engineering catalog'}</Badge></div>
          <div className="mt-8"><ProductGrid products={data.products.items.slice(0, 6)} getHref={(product) => `/${locale}${product.href}`} ctaLabel={data.products.detailsLabel} /></div>
        </div>
      </section>

      <section className="stitch-section bg-ink-50">
        <div className="stitch-shell">
          <SectionLead eyebrow={data.industries.eyebrow} title={data.industries.title} body={data.industries.body} linkLabel={data.industries.linkLabel} href="/industries" locale={locale} />
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{data.industries.items.slice(0, 6).map((item) => <IndustryCard key={item.href} locale={locale} item={item} label={data.industries.linkLabel} />)}</div>
        </div>
      </section>

      <section className="stitch-section bg-panel">
        <div className="stitch-shell grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-end">
          <div>
            <p className="stitch-eyebrow">{data.trust.eyebrow}</p>
            <h2 className="mt-4 stitch-heading">{data.trust.title}</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-ink-600">{data.trust.body}</p>
            <div className="mt-6 flex flex-wrap gap-2">{data.trust.proof.map((item) => <span key={item.label} className="border border-border px-2 py-1 font-mono text-[11px] text-ink-600">{item.label}: {item.value}</span>)}</div>
          </div>
          <div className="grid gap-px border border-border bg-border sm:grid-cols-3">{data.trust.metrics.map((metric, index) => { const Icon = [FileCheck2, Factory, PackageCheck][index] ?? FileCheck2; return <div key={metric.label} className="bg-ink-50 p-6"><Icon className="size-5 text-steel-700" aria-hidden="true" /><div className="mt-8 font-mono text-2xl font-semibold text-ink-950">{metric.value}</div><div className="mt-2 text-sm leading-5 text-ink-600">{metric.label}</div></div> })}</div>
        </div>
      </section>
    </article>
  )
}

function SectionLead({ eyebrow, title, body, linkLabel, href, locale }: { eyebrow: string; title: string; body: string; linkLabel: string; href: string; locale: Locale }) {
  return <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div className="max-w-3xl"><p className="stitch-eyebrow">{eyebrow}</p><h2 className="mt-4 stitch-heading">{title}</h2><p className="mt-5 text-base leading-7 text-ink-600">{body}</p></div><Link href={localizedHref(locale, href)} className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold uppercase text-steel-700">{linkLabel}<ArrowRight className="size-4" aria-hidden="true" /></Link></div>
}

function QuickEntry({ locale, entry }: { locale: Locale; entry: { label: string; description: string; href: string } }) {
  return <Link href={localizedHref(locale, entry.href)} className="group border border-border bg-panel p-6 transition-colors hover:border-steel-700"><h3 className="text-xl font-medium text-ink-950 group-hover:text-steel-700">{entry.label}</h3><p className="mt-4 text-sm leading-6 text-ink-600">{entry.description}</p><span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold uppercase text-steel-700">Open<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span></Link>
}

function IndustryCard({ locale, item, label }: { locale: Locale; item: HomepageProjection['industries']['items'][number]; label: string }) {
  const Icon = getIndustrialIcon(item.icon)
  return <Link href={localizedHref(locale, item.href)} className="group flex min-h-[280px] flex-col border border-border bg-panel p-6 transition-colors hover:border-steel-700"><div className="flex items-start justify-between gap-4"><span className="grid h-11 w-11 place-items-center border border-border text-steel-700"><Icon className="size-5" aria-hidden="true" /></span><Badge variant="outline">{item.productCount}</Badge></div><h3 className="mt-8 text-xl font-medium text-ink-950 group-hover:text-steel-700">{item.title}</h3><p className="mt-4 text-sm leading-6 text-ink-600">{item.description}</p><span className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold uppercase text-steel-700">{label}<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span></Link>
}
