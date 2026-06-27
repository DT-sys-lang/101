import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CircuitBoard, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/i18n/routing'
import type { HomepageProjection } from '@/lib/domain'

function localizedHref(locale: Locale, href: string) {
  return `/${locale}${href}`
}

export function HeroSection({
  locale,
  hero,
}: {
  locale: Locale
  hero: HomepageProjection['hero']
}) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-panel">
      <div className="absolute inset-0 industrial-grid opacity-70" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-px metal-rule" aria-hidden="true" />
      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-14">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-border bg-panel px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-steel-700">
            <CircuitBoard className="size-4" aria-hidden="true" />
            {hero.eyebrow}
          </div>
          <h1 className="max-w-4xl text-4xl font-semibold leading-[1.08] text-ink-950 sm:text-5xl lg:text-6xl">
            {hero.title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-ink-700 sm:text-lg">
            {hero.body}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href={localizedHref(locale, '/products')}>
                {hero.primary}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={localizedHref(locale, '/industries')}>
                {hero.secondary}
                <FileText aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <div className="mt-10 grid max-w-2xl grid-cols-3 border-y border-border bg-panel/75">
            {hero.metrics.map((metric) => (
              <div key={metric.label} className="border-r border-border px-4 py-4 last:border-r-0">
                <div className="font-mono text-xl font-semibold text-ink-950">{metric.value}</div>
                <div className="mt-1 text-xs leading-5 text-ink-500">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-border bg-ink-100 shadow-industrial">
            <Image
              src="/images/hero/industrial-instrumentation.png"
              alt={hero.imageAlt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="grid gap-3 border-x border-b border-border bg-panel p-3 sm:grid-cols-3">
            {hero.entries.map((entry) => (
              <Link
                key={entry.href}
                href={localizedHref(locale, entry.href)}
                className="group rounded-md border border-border bg-ink-50 p-4 transition-colors hover:bg-panel"
              >
                <span className="flex items-center justify-between gap-3 text-sm font-semibold text-ink-950">
                  {entry.label}
                  <ArrowRight className="size-4 text-ink-400 transition-colors group-hover:text-steel-900" aria-hidden="true" />
                </span>
                <span className="mt-2 block text-xs leading-5 text-ink-600">{entry.description}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
