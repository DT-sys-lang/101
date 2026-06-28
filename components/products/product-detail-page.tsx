import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, ClipboardList, Cpu, FileText, Gauge, Layers3, PackageCheck, ShieldCheck } from 'lucide-react'
import { ProductGrid } from '@/components/products/product-grid'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/i18n/routing'
import type { ProductDetailViewModel } from '@/lib/domain'

export function ProductDetailPageView({
  locale,
  data,
}: {
  locale: Locale
  data: ProductDetailViewModel
}) {
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
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
          <div className="space-y-8">
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <Badge variant="signal">{data.hero.categoryLabel}</Badge>
                <Badge variant="outline">{data.hero.availabilityLabel}</Badge>
                <Badge variant="secondary">{data.hero.model}</Badge>
              </div>
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-steel-700">{data.hero.eyebrow}</p>
                <h1 className="max-w-4xl text-4xl font-semibold tracking-normal text-ink-950 sm:text-5xl">
                  {data.hero.title}
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-ink-600">{data.hero.summary}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href={`/${locale}/contact`}>
                  {data.actions.quoteLabel}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              {data.actions.datasheetHref ? (
                <Button asChild variant="secondary" size="lg">
                  <Link href={data.actions.datasheetHref}>
                    <FileText aria-hidden="true" />
                    {data.actions.datasheetLabel}
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>

          <aside className="rounded-lg border border-border bg-ink-50 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-normal text-ink-500">
              <Layers3 className="size-4" aria-hidden="true" />
              {data.hero.model}
            </h2>
            <dl className="mt-5 grid gap-3 text-sm">
              {data.overviewSpecs.map((spec) => (
                <div key={spec.label} className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-b-0 last:pb-0">
                  <dt className="text-ink-500">{spec.label}</dt>
                  <dd className="text-right font-mono font-semibold text-ink-950">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </section>

      {data.geoSummary ? (
        <section className="border-b border-border bg-ink-50">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <SectionTitle icon={Cpu} title={data.geoSummary.title} />
            <div className="space-y-5 text-sm leading-7 text-ink-700">
              <p className="text-base leading-8 text-ink-800">{data.geoSummary.oneSentence}</p>
              <p>{data.geoSummary.technicalAbstract}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {data.geoSummary.facts.map((fact) => (
                  <div key={fact.label} className="rounded-md border border-border bg-panel p-4">
                    <div className="text-sm font-semibold text-ink-950">{fact.label}</div>
                    <div className="mt-1 font-mono text-sm text-steel-900">{fact.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-b border-border bg-panel">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
          <DetailPanel icon={Gauge} title={data.technicalParameters.title}>
            {data.technicalParameters.groups.map((group) => (
              <div key={group.title} className="space-y-3">
                <h3 className="text-sm font-semibold text-ink-950">{group.title}</h3>
                <dl className="grid gap-2">
                  {group.values.map((value) => (
                    <div key={`${group.title}-${value.label}`} className="flex items-center justify-between gap-4 border-b border-border py-2 text-sm last:border-b-0">
                      <dt className="text-ink-500">{value.label}</dt>
                      <dd className="text-right font-mono font-semibold text-ink-950">{value.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </DetailPanel>

          <DetailPanel icon={ShieldCheck} title={data.compatibility.title}>
            {data.compatibility.groups.map((group) => (
              <TagGroup key={group.title} title={group.title} items={group.items} />
            ))}
          </DetailPanel>

          <DetailPanel icon={PackageCheck} title={data.applications.title}>
            <BulletList items={data.applications.items} />
          </DetailPanel>

          <DetailPanel icon={ClipboardList} title={data.commercial.title}>
            {data.commercial.groups.map((group) => (
              <TagGroup key={group.title} title={group.title} items={group.items} />
            ))}
          </DetailPanel>
        </div>
      </section>

      <section className="border-b border-border bg-ink-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
          <DetailPanel icon={ClipboardList} title={data.variants.title}>
            <div className="grid gap-3">
              {data.variants.items.map((variant) => (
                <div key={variant.code} className="rounded-md border border-border bg-panel p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-sm font-semibold text-ink-950">{variant.code}</span>
                    <Badge variant="outline">{variant.availabilityLabel}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {variant.options.map((option) => (
                      <Badge key={`${variant.code}-${option}`} variant="secondary">
                        {option}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </DetailPanel>

          <DetailPanel icon={FileText} title={data.faq.title}>
            <div className="space-y-3">
              {data.faq.items.map((faq) => (
                <details key={faq.question} className="rounded-md border border-border bg-panel p-4 open:shadow-industrial">
                  <summary className="cursor-pointer text-sm font-semibold text-ink-950">{faq.question}</summary>
                  <p className="mt-3 text-sm leading-7 text-ink-700">{faq.answer}</p>
                </details>
              ))}
            </div>
          </DetailPanel>
        </div>
      </section>

      <section className="border-b border-border bg-panel">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <SectionTitle icon={FileText} title={data.seoContent.title} />
          <div className="space-y-4 text-sm leading-7 text-ink-700">
            {data.seoContent.paragraphs.map((paragraph, index) => (
              <p key={`${index}-${paragraph}`}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      {data.geoSummary?.evidence.length ? (
        <section className="border-b border-border bg-ink-50">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <SectionTitle icon={FileText} title={data.geoSummary.evidenceTitle} />
            <div className="grid gap-3 sm:grid-cols-2">
              {data.geoSummary.evidence.map((source) => (
                <div key={source.title} className="rounded-md border border-border bg-panel p-4 text-sm">
                  <div className="font-semibold text-ink-950">{source.title}</div>
                  <div className="mt-2 text-ink-500">{source.sourceType}</div>
                  {source.href ? (
                    <Link href={source.href} className="mt-3 inline-flex text-steel-900 hover:underline">
                      {source.href}
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {data.relatedProducts.items.length ? (
        <section className="bg-panel">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <SectionTitle icon={PackageCheck} title={data.relatedProducts.title} />
            <div className="mt-8">
              <ProductGrid
                products={data.relatedProducts.items}
                getHref={(product) => `/${locale}${product.href}`}
                ctaLabel={data.actions.quoteLabel}
              />
            </div>
          </div>
        </section>
      ) : null}
    </article>
  )
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: typeof ClipboardList
  title: string
}) {
  return (
    <div>
      <h2 className="flex items-center gap-3 text-2xl font-semibold text-ink-950">
        <span className="grid size-10 place-items-center rounded-md border border-border bg-panel text-steel-900">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        {title}
      </h2>
    </div>
  )
}

function DetailPanel({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof ClipboardList
  title: string
  children: ReactNode
}) {
  return (
    <section className="rounded-lg border border-border bg-panel p-5">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-950">
        <Icon className="size-5 text-steel-900" aria-hidden="true" />
        {title}
      </h2>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  )
}

function TagGroup({
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
    <div>
      <h3 className="text-sm font-semibold text-ink-950">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item} variant="outline">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  )
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-3 grid gap-2 text-sm leading-6 text-ink-700">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-process-700" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
