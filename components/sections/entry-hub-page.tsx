import Link from 'next/link'
import { ArrowRight, Factory, Gauge, Layers3, Send, Waves } from 'lucide-react'
import { ProductGrid } from '@/components/products/product-grid'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/i18n/routing'
import type { EntryCardViewModel, EntryPageViewModel } from '@/lib/domain'

function localizedHref(locale: Locale, href: string) {
  return `/${locale}${href}`
}

export function EntryHubPage({ locale, data }: { locale: Locale; data: EntryPageViewModel }) {
  return data.entries.length === 1 ? <FocusedEntryPage locale={locale} data={data} entry={data.entries[0]} /> : <EntryOverviewPage locale={locale} data={data} />
}

function EntryOverviewPage({ locale, data }: { locale: Locale; data: EntryPageViewModel }) {
  const labels = locale === 'zh'
    ? { directory: '行业目录', choose: '按系统场景选择路径', paths: '个入口', ecosystem: '生态搭配', open: '查看路径' }
    : { directory: 'Industry directory', choose: 'Choose a path by system context', paths: 'paths', ecosystem: 'Ecosystem pairing', open: 'View path' }

  return (
    <article className="bg-background">
      <section className="border-b border-border bg-panel">
        <div className="stitch-shell grid min-h-[480px] gap-10 py-16 lg:grid-cols-[1fr_0.9fr] lg:items-end lg:py-24">
          <div className="max-w-3xl">
            <p className="stitch-eyebrow">{data.eyebrow}</p>
            <h1 className="mt-4 stitch-display">{data.title}</h1>
            <p className="mt-6 text-lg leading-8 text-ink-600">{data.body}</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg"><Link href={localizedHref(locale, data.primaryAction.href)}>{data.primaryAction.label}<ArrowRight aria-hidden="true" /></Link></Button>
              <Button asChild size="lg" variant="secondary"><Link href={localizedHref(locale, data.secondaryAction.href)}>{data.secondaryAction.label}<Send aria-hidden="true" /></Link></Button>
            </div>
          </div>
          <ProofGrid data={data} />
        </div>
      </section>

      <section className="stitch-section bg-panel">
        <div className="stitch-shell">
          <div className="flex flex-col justify-between gap-5 border-b border-border pb-6 lg:flex-row lg:items-end">
            <div>
              <p className="stitch-eyebrow">{labels.directory}</p>
              <h2 className="mt-4 stitch-heading">{labels.choose}</h2>
            </div>
            <span className="font-mono text-xs text-ink-600">{data.entries.length} {labels.paths}</span>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {data.entries.map((entry, index) => <EntryCard key={entry.key} locale={locale} entry={entry} label={labels.open} index={index} />)}
          </div>
        </div>
      </section>

      {data.ecosystem ? <EcosystemSection locale={locale} data={data} title={labels.ecosystem} /> : null}
      {data.news ? <NewsSection locale={locale} data={data} /> : null}
      <RfqBand locale={locale} data={data} />
    </article>
  )
}

function FocusedEntryPage({ locale, data, entry }: { locale: Locale; data: EntryPageViewModel; entry: EntryCardViewModel }) {
  const labels = locale === 'zh'
    ? { scenarios: '典型应用场景', products: '适配该场景的产品', configuration: '技术配置', baseline: '建立可复核的选型基线', model: '型号', parameter: '参数', value: '数值' }
    : { scenarios: 'Application scenarios', products: 'Products aligned to this context', configuration: 'Technical configuration', baseline: 'Establish a reviewable selection baseline', model: 'Model', parameter: 'Parameter', value: 'Value' }
  const tableRows = entry.products.flatMap((product) => product.keySpecs.map((spec) => ({ product: product.model, ...spec }))).slice(0, 12)

  return (
    <article className="bg-background">
      <section className="border-b border-border bg-panel">
        <div className="stitch-shell grid min-h-[480px] gap-10 py-16 lg:grid-cols-[1fr_0.86fr] lg:items-end lg:py-24">
          <div>
            <p className="stitch-eyebrow">{data.eyebrow}</p>
            <h1 className="mt-4 stitch-display">{data.title}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-ink-600">{data.body}</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg"><Link href={`/${locale}/contact`}>{data.rfq.primary}<ArrowRight aria-hidden="true" /></Link></Button>
              <Button asChild size="lg" variant="secondary"><Link href={`/${locale}/products`}>{data.rfq.secondary}</Link></Button>
            </div>
          </div>
          <ProofGrid data={data} />
        </div>
      </section>

      <section className="stitch-section bg-panel">
        <div className="stitch-shell">
          <div className="max-w-3xl">
            <p className="stitch-eyebrow">{labels.scenarios}</p>
            <h2 className="mt-4 stitch-heading">{entry.title}</h2>
            <p className="mt-5 text-base leading-7 text-ink-600">{entry.description}</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <ScenarioCard icon={Waves} title={entry.meta} body={entry.description} />
            <ScenarioCard icon={Gauge} title="Measurement & control" body="Confirm range, output, connection, and media with traceable parameters." />
            <ScenarioCard icon={Factory} title="Continuous operation" body="Support stable monitoring paths across equipment, lines, and process steps." />
          </div>
        </div>
      </section>

      <section className="stitch-section bg-ink-50">
        <div className="stitch-shell">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div><p className="stitch-eyebrow">{data.productRailLabel}</p><h2 className="mt-4 stitch-heading">{labels.products}</h2></div>
            <Link href={`/${locale}/products`} className="inline-flex items-center gap-2 text-sm font-semibold uppercase text-steel-700">{data.primaryAction.label}<ArrowRight className="size-4" aria-hidden="true" /></Link>
          </div>
          {entry.products.length ? <div className="mt-8"><ProductGrid products={entry.products} getHref={(product) => `/${locale}${product.href}`} ctaLabel={data.rfq.primary} /></div> : <div className="mt-8 border border-dashed border-ink-300 bg-panel p-8 text-sm text-ink-600">Recommended products are being prepared.</div>}
        </div>
      </section>

      <section className="stitch-section bg-panel">
        <div className="stitch-shell grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
          <SectionIntro eyebrow={labels.configuration} title={labels.baseline} body="Use catalog specifications to align the measurement task, installation condition, and procurement brief." />
          <div className="overflow-hidden border border-border bg-panel">
            <div className="grid grid-cols-[0.28fr_0.32fr_0.4fr] bg-ink-50 px-4 py-3 font-mono text-[11px] font-semibold text-ink-950"><span>{labels.model}</span><span>{labels.parameter}</span><span>{labels.value}</span></div>
            {tableRows.map((row, index) => <div key={`${row.product}-${row.label}-${index}`} className="grid grid-cols-[0.28fr_0.32fr_0.4fr] gap-3 border-t border-border px-4 py-3 text-sm"><span className="font-mono font-semibold text-ink-950">{row.product}</span><span className="text-ink-600">{row.label}</span><span className="font-mono text-ink-950">{row.value}</span></div>)}
          </div>
        </div>
      </section>
      <RfqBand locale={locale} data={data} />
    </article>
  )
}

function ProofGrid({ data }: { data: EntryPageViewModel }) {
  return <div className="grid gap-px border border-border bg-border sm:grid-cols-3">{data.proof.map((item) => <div key={item.label} className="bg-ink-50 p-6"><div className="font-mono text-3xl font-semibold text-ink-950">{item.value}</div><div className="mt-2 text-xs leading-5 text-ink-600">{item.label}</div></div>)}</div>
}

function EntryCard({ locale, entry, label, index }: { locale: Locale; entry: EntryCardViewModel; label: string; index: number }) {
  const Icon = [Gauge, Waves, Factory, Layers3][index % 4]
  return <Link href={localizedHref(locale, entry.href)} className="group flex min-h-[292px] flex-col border border-border bg-panel p-6 transition-colors hover:border-steel-700"><div className="flex items-start justify-between gap-4"><span className="grid h-11 w-11 place-items-center border border-border text-steel-700"><Icon className="size-5" aria-hidden="true" /></span><Badge variant="outline">{entry.meta}</Badge></div><h2 className="mt-8 text-xl font-medium text-ink-950 group-hover:text-steel-700">{entry.title}</h2><p className="mt-4 text-sm leading-6 text-ink-600">{entry.description}</p><div className="mt-auto flex items-center justify-between border-t border-border pt-5"><span className="font-mono text-[11px] text-ink-600">{entry.products.length} products</span><span className="inline-flex items-center gap-2 text-sm font-semibold uppercase text-steel-700">{label}<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span></div></Link>
}

function ScenarioCard({ icon: Icon, title, body }: { icon: typeof Gauge; title: string; body: string }) {
  return <section className="border border-border bg-ink-50 p-6"><span className="grid h-11 w-11 place-items-center border border-border bg-panel text-steel-700"><Icon className="size-5" aria-hidden="true" /></span><h3 className="mt-7 text-xl font-medium text-ink-950">{title}</h3><p className="mt-4 text-sm leading-6 text-ink-600">{body}</p></section>
}

function SectionIntro({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return <div><p className="stitch-eyebrow">{eyebrow}</p><h2 className="mt-4 stitch-heading">{title}</h2><p className="mt-5 text-base leading-7 text-ink-600">{body}</p></div>
}

function NewsSection({ locale, data }: { locale: Locale; data: EntryPageViewModel }) {
  if (!data.news) return null
  return <section className="stitch-section bg-panel"><div className="stitch-shell grid gap-10 lg:grid-cols-[0.72fr_1.28fr]"><SectionIntro eyebrow={data.news.eyebrow} title={data.news.title} body={data.news.body} /><div className="grid gap-6 md:grid-cols-2">{data.news.entries.length ? data.news.entries.map((item) => <Link key={item.href} href={localizedHref(locale, item.href)} className="border border-border bg-ink-50 p-6 hover:border-steel-700"><Badge variant="outline">{item.meta}</Badge><h3 className="mt-6 text-xl font-medium text-ink-950">{item.title}</h3><p className="mt-3 text-sm leading-6 text-ink-600">{item.description}</p></Link>) : <div className="border border-dashed border-ink-300 bg-ink-50 p-6 text-sm text-ink-600">{data.news.emptyLabel}</div>}</div></div></section>
}

function EcosystemSection({ locale, data, title }: { locale: Locale; data: EntryPageViewModel; title: string }) {
  const ecosystem = data.ecosystem
  if (!ecosystem) return null
  return <section id="ecosystem" className="stitch-section bg-ink-50"><div className="stitch-shell"><SectionIntro eyebrow={ecosystem.eyebrow} title={ecosystem.title || title} body={ecosystem.body} />{ecosystem.items.length ? <div className="mt-8 grid gap-6 md:grid-cols-2">{ecosystem.items.map((item) => <article key={item.id} className="border border-border bg-panel p-6"><Badge variant="outline">{item.industryLabel}</Badge><h3 className="mt-5 text-xl font-medium text-ink-950">{item.title}</h3><p className="mt-3 text-sm leading-6 text-ink-600">{item.scenario}</p><p className="mt-5 border-t border-border pt-4 text-sm leading-6 text-ink-600">{item.rationale}</p><Link href={`/${locale}/contact`} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase text-steel-700">{ecosystem.quoteLabel}<ArrowRight className="size-4" aria-hidden="true" /></Link></article>)}</div> : <div className="mt-8 border border-dashed border-ink-300 bg-panel p-8 text-sm text-ink-600">{ecosystem.emptyLabel}</div>}</div></section>
}

function RfqBand({ locale, data }: { locale: Locale; data: EntryPageViewModel }) {
  return <section className="border-t border-border bg-panel"><div className="stitch-shell grid gap-6 py-12 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="stitch-eyebrow">RFQ</p><h2 className="mt-3 text-3xl font-medium text-ink-950">{data.rfq.title}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-ink-600">{data.rfq.body}</p></div><div className="flex flex-col gap-3 sm:flex-row"><Button asChild><Link href={`/${locale}/contact`}>{data.rfq.primary}<ArrowRight aria-hidden="true" /></Link></Button><Button asChild variant="secondary"><Link href={`/${locale}/products`}>{data.rfq.secondary}</Link></Button></div></div></section>
}
