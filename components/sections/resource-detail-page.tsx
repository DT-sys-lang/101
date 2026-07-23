import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Download,
  FileText,
  Lightbulb,
  PackageCheck,
  Send,
  TriangleAlert,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/i18n/routing'
import type { ResourceDetailViewModel } from '@/lib/domain'

const contentIcons = [CircleDot, TriangleAlert, Lightbulb]

export function ResourceDetailPage({
  locale,
  data,
}: {
  locale: Locale
  data: ResourceDetailViewModel
}) {
  const labels = locale === 'zh'
    ? {
        materialEntries: '\u516c\u53f8\u8d44\u6599\u5165\u53e3',
        entryCount: '\u4e2a\u5165\u53e3',
        projectRecord: '\u9879\u76ee\u8bb0\u5f55',
        status: '\u72b6\u6001',
        products: '\u5173\u8054\u4ea7\u54c1',
        contexts: '\u5e94\u7528\u5173\u8054',
        relatedMaterials: '\u76f8\u5173\u8d44\u6599',
        relatedProducts: '\u5173\u8054\u4ea7\u54c1',
        noProducts: '\u6682\u65e0\u5173\u8054\u4ea7\u54c1\u3002',
        discuss: '\u6709\u7c7b\u4f3c\u7684\u6280\u672f\u6311\u6218\uff1f',
        discussBody: '\u5c06\u5de5\u51b5\u3001\u578b\u53f7\u548c\u5df2\u77e5\u53c2\u6570\u63d0\u4ea4\u7ed9\u5e94\u7528\u5de5\u7a0b\u56e2\u961f\u8bc4\u4f30\u3002',
        contact: '\u8054\u7cfb\u5de5\u7a0b\u5e08',
        back: '\u8fd4\u56de\u5217\u8868',
      }
    : {
        materialEntries: 'Company material entries',
        entryCount: 'entries',
        projectRecord: 'Project record',
        status: 'Status',
        products: 'Related products',
        contexts: 'Application contexts',
        relatedMaterials: 'Related materials',
        relatedProducts: 'Related products',
        noProducts: 'No related products yet.',
        discuss: 'Facing a similar technical challenge?',
        discussBody: 'Send the application, model, and known parameters for an engineering review.',
        contact: 'Contact engineering',
        back: 'Back to list',
      }

  return (
    <article className="bg-background">
      <header className="border-b border-border bg-panel">
        <div className="stitch-shell py-10 lg:py-14">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
            {data.breadcrumb.map((item, index) => (
              <span key={item.href} className="inline-flex items-center gap-2">
                {index ? <span aria-hidden="true">/</span> : null}
                <Link href={item.href} className="hover:text-steel-900">
                  {item.label}
                </Link>
              </span>
            ))}
          </nav>
          <div className="mt-7 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="signal">{data.eyebrow}</Badge>
              <Badge variant="outline">{data.statusLabel}</Badge>
              <span className="font-mono text-[11px] text-ink-500">{data.meta}</span>
            </div>
            <h1 className="mt-5 stitch-display">{data.title}</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-ink-600 sm:text-lg">{data.body}</p>
          </div>
        </div>
      </header>

      {data.coverImage ? (
        <section className="border-b border-border bg-panel">
          <div className="stitch-shell py-8 lg:py-10">
            <div
              aria-label={data.coverImage.alt}
              className="aspect-[16/7] border border-border bg-cover bg-center bg-ink-100"
              role="img"
              style={{ backgroundImage: `url("${data.coverImage.href}")` }}
            />
          </div>
        </section>
      ) : null}

      <section className="stitch-section bg-panel">
        <div className="stitch-shell grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            {data.childLinks?.length ? (
              <section className="mb-10 border border-border bg-ink-50 p-6 lg:p-7">
                <div className="flex flex-col justify-between gap-3 border-b border-border pb-5 sm:flex-row sm:items-end">
                  <div>
                    <p className="stitch-eyebrow">{labels.materialEntries}</p>
                    <h2 className="mt-2 text-2xl font-semibold text-ink-950">{data.title}</h2>
                  </div>
                  <span className="font-mono text-xs text-ink-500">{data.childLinks.length} {labels.entryCount}</span>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {data.childLinks.map((item) => (
                    <article key={item.href} className="flex min-h-[220px] flex-col border border-border bg-panel p-5 transition-colors hover:border-steel-700">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="signal">{item.kindLabel}</Badge>
                        <span className="font-mono text-[11px] text-ink-500">{item.meta}</span>
                      </div>
                      <h3 className="mt-5 text-2xl font-medium leading-8 text-ink-950">{item.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-ink-600">{item.description}</p>
                      <Button asChild variant="secondary" className="mt-auto w-full justify-center">
                        <Link href={`/${locale}${item.href}`}>
                          {item.ctaLabel}
                          <ArrowRight aria-hidden="true" />
                        </Link>
                      </Button>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="space-y-10">
              {data.contentBlocks.map((block, index) => {
                const Icon = contentIcons[index % contentIcons.length]

                return (
                  <section key={`${block.title}-${index}`} className="border-b border-border pb-10 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-3 text-steel-900">
                      <Icon className="size-5 text-steel-700" aria-hidden="true" />
                      <h2 className="text-2xl font-semibold">{block.title}</h2>
                    </div>
                    <p className="mt-5 text-base leading-8 text-ink-700">{block.body}</p>
                    {block.links?.length ? (
                      <div className="mt-6 grid gap-3">
                        {block.links.map((link) => (
                          <a
                            key={`${block.title}-${link.href}`}
                            href={link.href}
                            target={isExternalHref(link.href) ? '_blank' : undefined}
                            rel={isExternalHref(link.href) ? 'noreferrer' : undefined}
                            className="flex items-center justify-between gap-4 border border-border bg-ink-50 p-4 text-sm font-semibold text-steel-900 transition-colors hover:border-steel-700 hover:bg-panel"
                          >
                            <span className="min-w-0 break-words">{link.label}</span>
                            <Download className="size-4 shrink-0" aria-hidden="true" />
                          </a>
                        ))}
                      </div>
                    ) : null}
                    {block.video ? (
                      <video controls preload="metadata" className="mt-6 w-full border border-border bg-ink-950" aria-label={block.video.label}>
                        <source src={block.video.href} />
                      </video>
                    ) : null}
                    {block.items?.length ? (
                      <ul className="mt-6 grid gap-3">
                        {block.items.map((item) => (
                          <li key={`${block.title}-${item}`} className="flex gap-3 border border-border bg-ink-50 p-4 text-sm leading-6 text-ink-700">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-steel-700" aria-hidden="true" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                )
              })}
            </div>
          </div>

          <aside className="grid content-start gap-5">
            <section className="border border-border bg-panel p-6 text-ink-950">
              <div className="flex items-center gap-2 border-b border-border pb-4">
                <CircleDot className="size-5" aria-hidden="true" />
                <h2 className="text-xl font-medium">{labels.projectRecord}</h2>
              </div>
              <ProjectMetric label={labels.status} value={data.statusLabel} />
              <ProjectMetric label={labels.products} value={String(data.relatedProducts.length)} />
              <ProjectMetric label={labels.contexts} value={String(data.relatedIndustryIds.length)} />
            </section>

            {data.primaryAction ? (
              <section className="border border-border bg-panel p-5">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-steel-900">
                  <FileText className="size-5 text-steel-700" aria-hidden="true" />
                  {labels.relatedMaterials}
                </h2>
                <Button asChild variant="secondary" className="mt-5 w-full justify-center">
                  <a
                    href={data.primaryAction.href}
                    target={isExternalHref(data.primaryAction.href) ? '_blank' : undefined}
                    rel={isExternalHref(data.primaryAction.href) ? 'noreferrer' : undefined}
                  >
                    <Download aria-hidden="true" />
                    {data.primaryAction.label}
                  </a>
                </Button>
              </section>
            ) : null}

            <section className="border border-border bg-panel p-5">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-steel-900">
                <PackageCheck className="size-5 text-steel-700" aria-hidden="true" />
                {labels.relatedProducts}
              </h2>
              {data.relatedProducts.length ? (
                <div className="mt-5 grid gap-3">
                  {data.relatedProducts.map((product) => (
                    <Link key={product.id} href={`/${locale}${product.href}`} className="border border-border bg-ink-50 p-3 transition-colors hover:border-steel-700 hover:bg-panel">
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-mono text-xs font-semibold text-steel-900">{product.model}</span>
                        <span className="text-[11px] text-ink-500">{product.familyLabel}</span>
                      </div>
                      <p className="mt-2 text-sm leading-5 text-ink-700">{product.title}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-ink-600">{labels.noProducts}</p>
              )}
            </section>

            <section className="border border-border bg-ink-50 p-5 text-center">
              <h2 className="text-xl font-semibold text-steel-900">{labels.discuss}</h2>
              <p className="mt-3 text-sm leading-6 text-ink-600">{labels.discussBody}</p>
              <Button asChild className="mt-5 w-full">
                <Link href={`/${locale}/contact`}>
                  <Send aria-hidden="true" />
                  {labels.contact}
                </Link>
              </Button>
            </section>
          </aside>
        </div>
      </section>

      <section className="border-t border-border bg-panel">
        <div className="stitch-shell py-8">
          <Link href={`/${locale}${data.backHref}`} className="inline-flex items-center gap-2 text-sm font-semibold text-steel-900 hover:text-steel-700">
            <ArrowLeft className="size-4" aria-hidden="true" />
            {labels.back}
          </Link>
        </div>
      </section>
    </article>
  )
}

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href)
}

function ProjectMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-border py-5 last:border-b-0 last:pb-0">
      <div className="font-mono text-2xl font-semibold text-steel-700">{value}</div>
      <div className="mt-1 font-mono text-[11px] uppercase text-ink-600">{label}</div>
    </div>
  )
}
