import Link from 'next/link'
import { ArrowRight, Download, FileText, FolderOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Locale } from '@/i18n/routing'
import type { ResourceCollectionViewModel } from '@/lib/domain'

function localizedHref(locale: Locale, href: string) {
  return `/${locale}${href}`
}

export function ResourceCollectionPage({
  locale,
  data,
}: {
  locale: Locale
  data: ResourceCollectionViewModel
}) {
  const visibleEntries = data.entries.filter((entry) => !entry.hiddenFromCollection)
  const labels = locale === 'zh'
    ? {
        library: '\u8d44\u6599\u5e93',
        records: '\u6761\u8bb0\u5f55',
        context: '\u5173\u8054\u573a\u666f',
        download: '\u76f4\u63a5\u4e0b\u8f7d',
      }
    : {
        library: 'Resource library',
        records: 'records',
        context: 'Related context',
        download: 'Download',
      }

  return (
    <article className="bg-background">
      <header className="border-b border-border bg-panel">
        <div className="stitch-shell grid gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end lg:py-16">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center border border-border bg-panel text-steel-700">
                <FolderOpen className="size-5" aria-hidden="true" />
              </span>
              <p className="stitch-eyebrow">{data.eyebrow}</p>
            </div>
            <h1 className="mt-6 stitch-display">{data.title}</h1>
            <p className="mt-5 text-base leading-8 text-ink-600 sm:text-lg">{data.body}</p>
          </div>
          <div className="border-l-4 border-steel-700 bg-panel p-6">
            <div className="font-mono text-4xl font-semibold text-steel-900">{data.countLabel}</div>
            <p className="mt-3 text-sm leading-6 text-ink-600">{labels.library}</p>
          </div>
        </div>
      </header>

      <section className="stitch-section bg-panel">
        <div className="stitch-shell">
          <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
            <div>
              <p className="stitch-eyebrow">{labels.library}</p>
              <h2 className="mt-2 stitch-heading">{data.title}</h2>
            </div>
            <span className="font-mono text-xs text-ink-500">{visibleEntries.length} {labels.records}</span>
          </div>

          {visibleEntries.length ? (
            <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visibleEntries.map((entry) => (
                <article key={entry.key} className="flex min-h-[372px] flex-col border border-border bg-panel transition-colors hover:border-steel-700">
                  {entry.coverImage ? (
                    <div
                      aria-label={entry.coverImage.alt}
                      className="aspect-[16/8] border-b border-border bg-cover bg-center bg-ink-100"
                      role="img"
                      style={{ backgroundImage: `url("${entry.coverImage.href}")` }}
                    />
                  ) : (
                    <div className="grid aspect-[16/8] place-items-center border-b border-border bg-ink-50 text-steel-700">
                      <FileText className="size-7" aria-hidden="true" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="signal">{entry.kindLabel}</Badge>
                      <span className="font-mono text-[11px] text-ink-500">{entry.meta}</span>
                    </div>
                    <h2 className="mt-5 text-xl font-medium leading-7 text-ink-950">
                      <Link href={localizedHref(locale, entry.href)} className="hover:text-steel-700">
                        {entry.title}
                      </Link>
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-ink-600">{entry.description}</p>
                    {entry.contextLabels.length ? (
                      <div className="mt-5 border-t border-border pt-4">
                        <div className="font-mono text-[10px] uppercase text-ink-500">{labels.context}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {entry.contextLabels.map((label) => (
                            <Badge key={`${entry.key}-${label}`} variant="secondary">
                              {label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <div className="mt-auto flex flex-wrap items-center gap-4 border-t border-border pt-4">
                      <Link href={localizedHref(locale, entry.href)} className="inline-flex items-center gap-2 text-sm font-semibold uppercase text-steel-700">
                        {entry.ctaLabel}
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                      {entry.downloadHref ? (
                        <a href={entry.downloadHref} className="inline-flex items-center gap-2 text-sm text-ink-700 hover:text-steel-900">
                          <Download className="size-4" aria-hidden="true" />
                          {labels.download}
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-7 border border-dashed border-ink-300 bg-ink-50 p-8 text-sm leading-7 text-ink-600">
              {data.emptyLabel}
            </div>
          )}
        </div>
      </section>
    </article>
  )
}
