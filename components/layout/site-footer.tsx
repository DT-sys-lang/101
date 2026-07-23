import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Factory, FileCheck2, Globe2, type LucideIcon } from 'lucide-react'
import type { Locale } from '@/i18n/routing'
import type { SiteLayoutProjection } from '@/lib/domain'

const badgeIcons: Record<string, LucideIcon> = {
  'ISO 9001': FileCheck2,
  OEM: Factory,
  'OEM 閰嶅': Factory,
  'Global Delivery': Globe2,
  '鍏ㄧ悆浜や粯': Globe2,
}

function localizedHref(locale: Locale, href: string) {
  return `/${locale}${href}`
}

export function SiteFooter({ locale, site }: { locale: Locale; site: SiteLayoutProjection }) {
  const contact = site.footer.contact

  return (
    <footer className="mt-auto border-t border-border bg-panel text-ink-950">
      <div className="stitch-shell grid gap-8 py-16 md:grid-cols-6">
        <div className="col-span-2 flex flex-col items-start gap-6 md:col-span-1 md:items-center md:text-center">
          <Link href={`/${locale}`} className="inline-flex flex-col items-start gap-3 md:items-center" aria-label={site.brand.name}>
            <Image src="/images/brand/yufavor-mark.png" alt="" width={64} height={62} className="h-14 w-14 object-contain" />
            <span className="font-mono text-xs font-semibold uppercase text-ink-600">(c) {new Date().getFullYear()} {site.brand.name}</span>
          </Link>
          <p className="max-w-xs text-sm leading-6 text-ink-600">{site.footer.summary}</p>
          <div className="flex flex-wrap gap-2 md:justify-center">
            {site.footer.badges.map((badge) => {
              const Icon = badgeIcons[badge] ?? FileCheck2
              return (
                <span key={badge} className="inline-flex items-center gap-1.5 border border-border px-2 py-1 font-mono text-[11px] text-ink-600">
                  <Icon className="size-3.5" aria-hidden="true" />
                  {badge}
                </span>
              )
            })}
          </div>
        </div>

        {site.footer.columns.map((column) => (
          <div key={column.title} className="flex flex-col gap-4">
            <h2 className="border-b border-border pb-2 font-mono text-xs font-semibold uppercase text-ink-950">{column.title}</h2>
            <ul className="grid gap-3">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={localizedHref(locale, link.href)} className="text-sm leading-6 text-ink-600 transition-colors hover:text-steel-700 hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="flex flex-col gap-4">
          <h2 className="border-b border-border pb-2 font-mono text-xs font-semibold uppercase text-ink-950">{contact.title}</h2>
          <div className="grid gap-2 text-sm leading-6 text-ink-600">
            <p className="font-semibold text-ink-950">{contact.companyName}</p>
            <p>{contact.phoneLabel}: {contact.phone}</p>
            <p>
              {contact.emailLabel}:{' '}
              <a href={`mailto:${contact.email}`} className="hover:text-steel-700 hover:underline">
                {contact.email}
              </a>
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="stitch-shell flex flex-col gap-3 py-5 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <span>{site.brand.descriptor}</span>
          <Link href={localizedHref(locale, '/contact')} className="inline-flex items-center gap-1 font-semibold text-ink-950 hover:text-steel-700">
            {site.actions.quote}
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </footer>
  )
}
