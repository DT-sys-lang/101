import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, ChevronRight, Download, ImageIcon } from 'lucide-react'
import { ProductGrid } from '@/components/products/product-grid'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/i18n/routing'
import type { ProductDetailViewModel } from '@/lib/domain'

export function ProductDetailPageView({ locale, data }: { locale: Locale; data: ProductDetailViewModel }) {
  const specificationRows = data.technicalParameters.groups.flatMap((group) => group.values.map((value) => ({ group: group.title, ...value })))
  return (
    <article className="bg-background">
      <main className="stitch-shell py-12">
        <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-1.5 text-xs text-ink-600">
          {data.breadcrumb.map((item, index) => <span key={item.href} className="inline-flex items-center gap-1.5">{index ? <ChevronRight className="size-3" aria-hidden="true" /> : null}<Link href={item.href} className="hover:text-steel-700">{item.label}</Link></span>)}
        </nav>

        <section className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-2">
          <ProductGallery data={data} />
          <div className="flex flex-col justify-center">
            <span className="mb-2 text-sm font-medium text-ink-600">Model: {data.hero.model}</span>
            <h1 className="stitch-heading">{data.hero.title}</h1>
            <p className="mt-5 text-base leading-8 text-ink-600">{data.hero.summary}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge variant="outline">{data.hero.categoryLabel}</Badge>
              {data.hero.badges.slice(0, 3).map((badge) => <Badge key={badge} variant="secondary">{badge}</Badge>)}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg"><Link href={`/${locale}/contact`}>{data.actions.quoteLabel}<ArrowRight aria-hidden="true" /></Link></Button>
              {data.actions.datasheetHref ? <Button asChild size="lg" variant="secondary"><Link href={data.actions.datasheetHref}><Download aria-hidden="true" />{data.actions.datasheetLabel}</Link></Button> : null}
            </div>
          </div>
        </section>

        <nav aria-label="Product sections" className="mb-8 flex gap-8 overflow-x-auto border-b border-border">
          <a href="#specifications" className="tab-active shrink-0 pb-4 text-sm font-semibold whitespace-nowrap">{data.technicalParameters.title}</a>
          <a href="#description" className="shrink-0 pb-4 text-sm text-ink-600 hover:text-ink-950 whitespace-nowrap">{locale === 'zh' ? 'Description' : 'Description'}</a>
          <a href="#documentation" className="shrink-0 pb-4 text-sm text-ink-600 hover:text-ink-950 whitespace-nowrap">{locale === 'zh' ? 'Downloads' : 'Downloads'}</a>
        </nav>

        <section id="specifications" className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="overflow-x-auto border border-border bg-panel md:col-span-8">
            <table className="data-table w-full text-sm text-ink-950">
              <thead>
                <tr><th className="w-1/3">{locale === 'zh' ? 'Parameter' : 'Parameter'}</th><th>{locale === 'zh' ? 'Value / Description' : 'Value / Description'}</th></tr>
              </thead>
              <tbody>
                {specificationRows.slice(0, 14).map((row, index) => <tr key={`${row.group}-${row.label}-${index}`}><td className="text-ink-600">{row.label}</td><td className="font-mono text-ink-950">{row.value}</td></tr>)}
              </tbody>
            </table>
          </div>
          <aside className="border border-border bg-panel p-8 md:col-span-4">
            <h2 className="text-2xl font-medium text-ink-950">{locale === 'zh' ? 'Key Features' : 'Key Features'}</h2>
            <ul className="mt-6 grid gap-4 text-sm leading-6 text-ink-600">
              {[...data.applications.items, ...data.compatibility.groups.flatMap((group) => group.items)].slice(0, 6).map((item) => <li key={item} className="flex items-start gap-2"><CheckCircle2 className="mt-1 size-4 shrink-0 text-steel-700" aria-hidden="true" /><span>{item}</span></li>)}
            </ul>
          </aside>
        </section>

        <section id="description" className="mb-16 border-t border-border pt-12">
          <h2 className="border-b border-border pb-4 text-3xl font-medium text-ink-950">{data.seoContent.title}</h2>
          <div className="mt-8 grid gap-4 text-sm leading-7 text-ink-600 lg:grid-cols-2">{data.seoContent.paragraphs.map((paragraph, index) => <p key={`${index}-${paragraph}`}>{paragraph}</p>)}</div>
        </section>

        <section id="documentation" className="mb-16 grid gap-6 md:grid-cols-2">
          <InfoPanel title={data.variants.title}>{data.variants.items.slice(0, 5).map((variant) => <div key={variant.code} className="border-b border-border py-3 last:border-b-0"><div className="flex items-center justify-between gap-3"><span className="font-mono text-sm font-semibold text-ink-950">{variant.code}</span><Badge variant="outline">{variant.availabilityLabel}</Badge></div><p className="mt-2 text-xs leading-5 text-ink-600">{variant.options.join(' | ')}</p></div>)}</InfoPanel>
          <InfoPanel title={data.faq.title}>{data.faq.items.map((faq) => <details key={faq.question} className="border-b border-border py-3 last:border-b-0"><summary className="cursor-pointer text-sm font-semibold text-ink-950">{faq.question}</summary><p className="mt-3 text-sm leading-6 text-ink-600">{faq.answer}</p></details>)}</InfoPanel>
        </section>

        {data.relatedProducts.items.length ? <section className="border-t border-border pt-12"><h2 className="mb-8 border-b border-border pb-4 text-3xl font-medium text-ink-950">{data.relatedProducts.title}</h2><ProductGrid products={data.relatedProducts.items} getHref={(product) => `/${locale}${product.href}`} ctaLabel={data.actions.quoteLabel} /></section> : null}
      </main>
    </article>
  )
}

function ProductGallery({ data }: { data: ProductDetailViewModel }) {
  const primaryImage = data.media.primaryImage
  return <div><div role="img" aria-label={primaryImage?.alt ?? data.hero.title} className="relative flex aspect-square items-center justify-center border border-border bg-panel p-8" style={primaryImage ? { backgroundImage: `url("${primaryImage.href}")`, backgroundPosition: 'center', backgroundSize: 'contain', backgroundRepeat: 'no-repeat' } : undefined}>{!primaryImage ? <ImageIcon className="size-12 text-ink-400" aria-hidden="true" /> : null}</div>{data.media.galleryImages.length ? <div className="mt-3 grid grid-cols-4 gap-3">{data.media.galleryImages.slice(0, 4).map((image, index) => <div key={`${image.kind}-${image.href}-${index}`} role="img" aria-label={image.alt} className="aspect-square border border-border bg-panel" style={{ backgroundImage: `url("${image.href}")`, backgroundPosition: 'center', backgroundSize: 'contain', backgroundRepeat: 'no-repeat' }} />)}</div> : null}</div>
}

function InfoPanel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="border border-border bg-panel p-6"><h2 className="text-xl font-medium text-ink-950">{title}</h2><div className="mt-5">{children}</div></section>
}
