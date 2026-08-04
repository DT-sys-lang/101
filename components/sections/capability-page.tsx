import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, Factory, Gauge, PackageCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/i18n/routing'
import type { CapabilityPageViewModel } from '@/lib/domain'

function localizedHref(locale: Locale, href: string) {
  return `/${locale}${href}`
}

export function CapabilityPage({ locale, data }: { locale: Locale; data: CapabilityPageViewModel }) {
  const labels = locale === 'zh'
    ? { metrics: '能力指标', evidence: '可复核证据', cta: '需要按项目确认能力？', product: '进入产品中心' }
    : { metrics: 'Capability metrics', evidence: 'Reviewable evidence', cta: 'Need capability details for a project?', product: 'Open Product Center' }
  const icons = [BadgeCheck, Gauge, Factory, PackageCheck] as const

  return (
    <article className="bg-background">
      <section className="border-b border-border bg-panel">
        <div className="stitch-shell grid min-h-[560px] gap-10 py-16 lg:grid-cols-[1fr_0.92fr] lg:items-center lg:py-24">
          <div className="max-w-3xl">
            <p className="stitch-eyebrow">{data.eyebrow}</p>
            <h1 className="mt-4 stitch-display">{data.title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-600">{data.body}</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg"><Link href={localizedHref(locale, data.primaryAction.href)}>{data.primaryAction.label}<ArrowRight aria-hidden="true" /></Link></Button>
              <Button asChild size="lg" variant="secondary"><Link href={localizedHref(locale, data.secondaryAction.href)}>{data.secondaryAction.label}</Link></Button>
            </div>
          </div>

          <div className="relative min-h-[360px] overflow-hidden border border-border bg-ink-50">
            <Image src={data.heroImage.src} alt={data.heroImage.alt} fill preload sizes="(min-width: 1024px) 44vw, 100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/65 via-ink-950/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 border-t border-white/20 bg-ink-950/75 p-5 text-white backdrop-blur-sm">
              <Badge variant="outline" className="border-white/35 text-white">{labels.metrics}</Badge>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {data.metrics.map((metric) => (
                  <div key={metric.label}>
                    <div className="font-mono text-2xl font-semibold">{metric.value}</div>
                    <div className="mt-1 text-xs uppercase text-white/70">{metric.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {data.sections.map((section, sectionIndex) => (
        <section key={section.id} id={section.id} className={sectionIndex % 2 ? 'stitch-section bg-ink-50' : 'stitch-section bg-panel'}>
          <div className="stitch-shell grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <p className="stitch-eyebrow">{section.eyebrow}</p>
              <h2 className="mt-4 stitch-heading">{section.title}</h2>
              <p className="mt-5 text-base leading-7 text-ink-600">{section.body}</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {section.items.map((item, index) => {
                const Icon = icons[index % icons.length]

                return (
                  <article key={`${section.id}-${item.title}`} className="border border-border bg-panel p-6 transition-colors hover:border-steel-700">
                    <div className="flex items-start justify-between gap-4">
                      <span className="grid h-11 w-11 place-items-center border border-border text-steel-700"><Icon className="size-5" aria-hidden="true" /></span>
                      <Badge variant="outline">{item.meta}</Badge>
                    </div>
                    <h3 className="mt-7 text-xl font-medium text-ink-950">{item.title}</h3>
                    <p className="mt-4 text-sm leading-6 text-ink-600">{item.body}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      ))}

      <section className="stitch-section bg-panel">
        <div className="stitch-shell grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="stitch-eyebrow">{labels.evidence}</p>
            <h2 className="mt-4 stitch-heading">{data.quickLinks[0]?.label ?? labels.evidence}</h2>
            <p className="mt-5 text-base leading-7 text-ink-600">{data.quickLinks[0]?.description ?? data.body}</p>
          </div>
          <div className="overflow-hidden border border-border bg-panel">
            {data.evidence.map((item) => (
              <div key={item.label} className="grid gap-3 border-b border-border px-5 py-5 last:border-b-0 md:grid-cols-[0.22fr_0.24fr_1fr] md:items-start">
                <span className="font-mono text-[11px] font-semibold uppercase text-steel-700">{item.label}</span>
                <span className="font-mono text-sm font-semibold text-ink-950">{item.value}</span>
                <span className="text-sm leading-6 text-ink-600">{item.note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-ink-950 text-white">
        <div className="stitch-shell grid gap-6 py-12 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase text-white/60">RFQ</p>
            <h2 className="mt-3 text-3xl font-medium">{labels.cta}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">{data.secondaryAction.label}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild><Link href={localizedHref(locale, data.secondaryAction.href)}>{data.secondaryAction.label}<ArrowRight aria-hidden="true" /></Link></Button>
            <Button asChild variant="secondary"><Link href={localizedHref(locale, data.primaryAction.href)}>{labels.product}</Link></Button>
          </div>
        </div>
      </section>
    </article>
  )
}
