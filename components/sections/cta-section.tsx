import Link from 'next/link'
import { ArrowRight, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/i18n/routing'
import type { HomepageProjection } from '@/lib/domain'

function localizedHref(locale: Locale, href: string) {
  return `/${locale}${href}`
}

export function CtaSection({
  locale,
  data,
}: {
  locale: Locale
  data: HomepageProjection['cta']
}) {
  return (
    <div className="rounded-lg border border-border bg-panel p-6 shadow-industrial sm:p-8 lg:p-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="mb-5 h-0.5 w-12 bg-silver" />
          <h2 className="max-w-3xl text-2xl font-semibold leading-tight text-ink-950 sm:text-3xl">
            {data.title}
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-ink-600">{data.body}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <Button asChild size="lg">
            <Link href={localizedHref(locale, '/products')}>
              {data.primary}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href={localizedHref(locale, '/contact')}>
              {data.secondary}
              <Send aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
