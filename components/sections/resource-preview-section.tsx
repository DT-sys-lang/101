import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getIndustrialIcon } from '@/components/shared/industrial-icons'
import { SectionHeading } from '@/components/shared/section-heading'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Locale } from '@/i18n/routing'
import type { HomepageProjection } from '@/lib/domain'

function localizedHref(locale: Locale, href: string) {
  return `/${locale}${href}`
}

export function ResourcePreviewSection({
  locale,
  data,
}: {
  locale: Locale
  data: HomepageProjection['resources']
}) {
  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} body={data.body} />
        <Link href={localizedHref(locale, '/resources')} className="inline-flex items-center gap-2 text-sm font-semibold text-steel-900">
          {locale === 'zh' ? '查看全部资料' : 'View all resources'}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {data.items.map((item) => {
          const Icon = getIndustrialIcon(item.icon)

          return (
            <Card key={item.href} className="group transition-shadow duration-200 hover:shadow-industrial">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-md border border-border bg-panel text-steel-900">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <Badge variant="outline">{item.meta}</Badge>
                </div>
                <CardTitle className="pt-3">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-ink-600">{item.description}</p>
                <Link
                  href={localizedHref(locale, item.href)}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-steel-900"
                >
                  {data.linkLabel}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
