import Link from 'next/link'
import { ArrowRight, Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/i18n/routing'
import type { SiteLayoutProjection } from '@/lib/domain'

function localizedHref(locale: Locale, href: string) {
  return `/${locale}${href}`
}

export function SiteHeader({
  locale,
  site,
}: {
  locale: Locale
  site: SiteLayoutProjection
}) {
  const alternateLocale: Locale = locale === 'zh' ? 'en' : 'zh'

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-panel/95 backdrop-blur">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-panel focus:px-3 focus:py-2 focus:text-sm focus:text-steel-900 focus:ring-2 focus:ring-steel-700"
      >
        Skip to content
      </a>
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href={`/${locale}`} className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-md border border-steel-700 bg-steel-900 text-sm font-bold text-white">
            H
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold leading-5 text-ink-950">{site.brand.name}</span>
            <span className="block truncate text-xs leading-4 text-ink-500">{site.brand.descriptor}</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {site.navigation.map((item) => (
            <Link
              key={item.href}
              href={localizedHref(locale, item.href)}
              className="rounded-md px-3 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50 hover:text-ink-950"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/${alternateLocale}`}
            className="hidden h-9 items-center gap-2 rounded-md border border-border bg-panel px-3 text-xs font-semibold text-ink-700 transition-colors hover:bg-ink-50 sm:inline-flex"
          >
            <Languages className="size-4" aria-hidden="true" />
            {site.language.alternateLabel}
          </Link>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href={localizedHref(locale, '/contact')}>
              {site.actions.quote}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
