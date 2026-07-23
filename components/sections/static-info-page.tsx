import Link from 'next/link'
import { ArrowRight, Factory, FileCheck2, Gauge, PackageCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/i18n/routing'
import type { StaticInfoPageViewModel } from '@/lib/domain'

function localizedHref(locale: Locale, href: string) {
  return `/${locale}${href}`
}

export function StaticInfoPage({ locale, data }: { locale: Locale; data: StaticInfoPageViewModel }) {
  const isChinese = locale === 'zh'
  const directives = isChinese
    ? ['精密制造', '可靠供货', '工程协同']
    : ['Precision', 'Reliability', 'Engineering support']

  return (
    <article className="bg-background">
      <section className="border-b border-border bg-panel">
        <div className="stitch-shell grid min-h-[500px] gap-10 py-16 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-24">
          <div className="max-w-3xl">
            <p className="stitch-eyebrow">{data.eyebrow}</p>
            <h1 className="mt-4 stitch-display">{data.title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-600">{data.body}</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg"><Link href={localizedHref(locale, data.primaryAction.href)}>{data.primaryAction.label}<ArrowRight aria-hidden="true" /></Link></Button>
              <Button asChild size="lg" variant="secondary"><Link href={localizedHref(locale, data.secondaryAction.href)}>{data.secondaryAction.label}</Link></Button>
            </div>
          </div>
          <div className="grid gap-px border border-border bg-border sm:grid-cols-3 lg:grid-cols-1">
            {directives.map((item, index) => <div key={item} className="bg-ink-50 p-6"><div className="font-mono text-sm font-semibold text-steel-700">0{index + 1}</div><h2 className="mt-6 text-2xl font-medium text-ink-950">{item}</h2></div>)}
          </div>
        </div>
      </section>

      <section className="stitch-section bg-panel">
        <div className="stitch-shell">
          <h2 className="border-l-4 border-steel-700 pl-4 stitch-heading">{isChinese ? '核心能力' : 'Core Directives'}</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {data.quickLinks.map((item, index) => {
              const Icon = [FileCheck2, Gauge, PackageCheck][index] ?? Factory
              return (
                <Link key={item.href} href={localizedHref(locale, item.href)} className="group border border-border bg-panel p-6 transition-colors hover:border-steel-700">
                  <Icon className="size-7 text-steel-700" aria-hidden="true" />
                  <h3 className="mt-7 text-2xl font-medium text-ink-950 group-hover:text-steel-700">{item.label}</h3>
                  <p className="mt-4 text-sm leading-7 text-ink-600">{item.description}</p>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="stitch-section bg-ink-50">
        <div className="stitch-shell grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="border-l-4 border-steel-700 pl-4 stitch-heading">{isChinese ? '先进制造能力' : 'Advanced Manufacturing Capability'}</h2>
            <p className="mt-8 text-base leading-8 text-ink-600">{isChinese ? '页面优先展示可支持业务判断的信息：产品能力、工程支持、质量资料、海外询盘与批量交付路径。' : 'The page prioritizes decision-grade information: product capability, engineering support, quality records, overseas RFQ handling, and repeat-delivery paths.'}</p>
          </div>
          <div className="aspect-[4/3] border border-border bg-panel industrial-grid" />
        </div>
      </section>
    </article>
  )
}
