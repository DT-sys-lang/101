import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getIndustrialIcon } from '@/components/shared/industrial-icons'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/i18n/routing'
import type { StaticInfoPageViewModel } from '@/lib/domain'

function localizedHref(locale: Locale, href: string) {
  return `/${locale}${href}`
}

export function StaticInfoPage({
  locale,
  data,
}: {
  locale: Locale
  data: StaticInfoPageViewModel
}) {
  const Icon = getIndustrialIcon(data.icon)

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
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-4 border-y border-border bg-ink-50 p-6">
            <div className="grid size-14 place-items-center rounded-md border border-border bg-panel text-steel-900">
              <Icon className="size-7" aria-hidden="true" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {data.quickLinks.map((item) => (
                <Link key={item.href} href={localizedHref(locale, item.href)} className="rounded-md border border-border bg-panel p-4 text-sm font-semibold text-ink-950 hover:text-steel-900">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </article>
  )
}
