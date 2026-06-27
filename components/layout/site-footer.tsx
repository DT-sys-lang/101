import Link from 'next/link'
import { Factory, FileCheck2, Globe2, type LucideIcon } from 'lucide-react'
import type { Locale } from '@/i18n/routing'
import type { SiteLayoutProjection } from '@/lib/domain'

const badgeIcons: Record<string, LucideIcon> = {
  'ISO 9001': FileCheck2,
  OEM: Factory,
  'Global Delivery': Globe2,
}

function localizedHref(locale: Locale, href: string) {
  return `/${locale}${href}`
}

export function SiteFooter({
  locale,
  site,
}: {
  locale: Locale
  site: SiteLayoutProjection
}) {
  return (
    <footer className="border-t border-border bg-panel">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_2fr] lg:px-8">
        <div className="space-y-5">
          <Link href={`/${locale}`} className="inline-flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-md bg-steel-900 text-sm font-bold text-white">H</span>
            <span>
              <span className="block text-sm font-semibold text-ink-950">{site.brand.name}</span>
              <span className="block text-xs text-ink-500">{site.brand.descriptor}</span>
            </span>
          </Link>
          <p className="max-w-md text-sm leading-6 text-ink-600">{site.footer.summary}</p>
          <div className="flex flex-wrap gap-2 text-xs font-medium text-ink-600">
            {site.footer.badges.map((badge) => {
              const Icon = badgeIcons[badge] ?? FileCheck2

              return (
                <span key={badge} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1">
                  <Icon className="size-3.5" aria-hidden="true" />
                  {badge}
                </span>
              )
            })}
          </div>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {site.footer.columns.map((column) => (
            <div key={column.title}>
              <h2 className="text-sm font-semibold text-ink-950">{column.title}</h2>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={localizedHref(locale, link.href)} className="text-sm text-ink-600 hover:text-steel-900">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}
