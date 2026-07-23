'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, Globe2, Menu, Search, X } from 'lucide-react'
import type { Locale } from '@/i18n/routing'
import type { SiteLayoutProjection } from '@/lib/domain'
import { cn } from '@/lib/utils'

function localizedHref(locale: Locale, href: string) {
  return `/${locale}${href}`
}

export function SiteHeader({ locale, site }: { locale: Locale; site: SiteLayoutProjection }) {
  const pathname = usePathname()
  const alternateLocale: Locale = locale === 'zh' ? 'en' : 'zh'
  const languageLabel = locale === 'zh' ? 'ZH | EN' : 'EN | ZH'
  const contactLabel = locale === 'zh' ? site.actions.quote : 'Contact Engineering'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-panel">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:bg-panel focus:px-3 focus:py-2 focus:text-sm focus:text-steel-900 focus:ring-2 focus:ring-steel-700">
        Skip to content
      </a>

      <div className="hidden md:block">
        <div className="stitch-header-shell flex items-center justify-between gap-12 py-4">
          <div className="flex items-center gap-12">
            <BrandLink locale={locale} site={site} />
            <nav aria-label="Primary" className="flex items-center gap-6">
              {site.navigation.slice(0, 5).map((item) => {
                const href = localizedHref(locale, item.href)
                const active = pathname === href || (item.href !== '/' && pathname.startsWith(`${href}/`))

                return (
                  <Link
                    key={item.href}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'border-b-2 pb-1 text-sm font-medium transition-colors duration-200',
                      active
                        ? 'border-steel-700 text-steel-700'
                        : 'border-transparent text-ink-950 hover:text-steel-700',
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-8">
            <Link href={localizedHref(locale, '/contact')} className="inline-flex items-center gap-2 border border-ink-950 bg-panel px-6 py-3 text-sm font-semibold text-ink-950 transition-colors hover:border-steel-700 hover:text-steel-700">
              {contactLabel}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href={`/${alternateLocale}`} aria-label={site.language.alternateLabel} className="inline-flex items-center gap-2 text-sm font-medium text-ink-950 transition-colors hover:text-steel-700">
              <Globe2 className="size-4" aria-hidden="true" />
              {languageLabel}
            </Link>
          </div>
        </div>
        <div className="stitch-header-shell pb-4">
          <SiteSearch locale={locale} site={site} idSuffix="desktop" />
        </div>
      </div>

      <div className="stitch-header-shell flex items-center justify-between py-4 md:hidden">
        <BrandLink locale={locale} site={site} />
        <details className="group relative">
          <summary aria-label="Open menu" title="Open menu" className="grid h-10 w-10 cursor-pointer list-none place-items-center border border-border bg-panel text-ink-950 marker:content-none [&::-webkit-details-marker]:hidden">
            <Menu className="size-5 group-open:hidden" aria-hidden="true" />
            <X className="hidden size-5 group-open:block" aria-hidden="true" />
          </summary>
          <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[min(22rem,calc(100vw-2rem))] border border-border bg-panel p-4 shadow-lg">
            <SiteSearch locale={locale} site={site} idSuffix="mobile" />
            <nav aria-label="Mobile primary navigation" className="mt-4 grid border-y border-border py-2">
              {site.navigation.map((item) => {
                const href = localizedHref(locale, item.href)
                const active = pathname === href || (item.href !== '/' && pathname.startsWith(`${href}/`))
                return (
                  <Link key={item.href} href={href} aria-current={active ? 'page' : undefined} className={cn('px-3 py-3 text-sm font-medium', active ? 'text-steel-700' : 'text-ink-950 hover:text-steel-700')}>
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link href={localizedHref(locale, '/contact')} className="inline-flex h-10 items-center justify-center border border-ink-950 px-3 text-xs font-semibold text-ink-950 hover:border-steel-700 hover:text-steel-700">
                {contactLabel}
              </Link>
              <Link href={`/${alternateLocale}`} className="inline-flex h-10 items-center justify-center border border-border px-3 text-xs font-semibold text-ink-950 hover:border-steel-700 hover:text-steel-700">
                {languageLabel}
              </Link>
            </div>
          </div>
        </details>
      </div>
    </header>
  )
}

function BrandLink({ locale, site }: { locale: Locale; site: SiteLayoutProjection }) {
  return (
    <Link href={`/${locale}`} className="flex w-[168px] shrink-0 items-center justify-start gap-2 md:w-[184px] md:gap-2.5" aria-label={`${site.brand.name} - ${site.brand.descriptor}`}>
      <Image src="/images/brand/yufavor-mark.png" alt="" width={196} height={188} priority className="h-10 w-10 object-contain md:h-12 md:w-12" />
      <span className="flex min-w-0 items-baseline whitespace-nowrap font-serif text-[21px] font-bold italic leading-none tracking-normal text-steel-700 md:text-[24px]">
        Yufavor
      </span>
    </Link>
  )
}

function SiteSearch({ locale, site, idSuffix }: { locale: Locale; site: SiteLayoutProjection; idSuffix: string }) {
  const inputId = `site-search-${locale}-${idSuffix}`
  return (
    <form action={localizedHref(locale, site.search.actionPath)} method="get" className="relative flex max-w-2xl items-center">
      <label htmlFor={inputId} className="sr-only">{site.search.label}</label>
      <input
        id={inputId}
        name="search"
        type="search"
        placeholder={site.search.placeholder}
        className="w-full border-0 border-b border-border bg-transparent px-2 py-2 pr-9 text-sm text-ink-950 opacity-70 outline-none transition-all duration-300 placeholder:text-ink-600 focus:border-steel-700 focus:opacity-100"
      />
      <button type="submit" title={site.search.submitLabel} aria-label={site.search.submitLabel} className="absolute right-2 grid size-7 place-items-center text-ink-950 transition-colors hover:text-steel-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-steel-700">
        <Search className="size-4" aria-hidden="true" />
      </button>
    </form>
  )
}
