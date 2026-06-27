import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getIndustrialIcon } from '@/components/shared/industrial-icons'
import { SectionHeading } from '@/components/shared/section-heading'
import type { Locale } from '@/i18n/routing'
import type { HomepageProjection } from '@/lib/domain'

function localizedHref(locale: Locale, href: string) {
  return `/${locale}${href}`
}

export function CategoryGatewaySection({
  locale,
  data,
}: {
  locale: Locale
  data: HomepageProjection['categories']
}) {
  return (
    <div className="space-y-10">
      <SectionHeading eyebrow={data.eyebrow} title={data.title} body={data.body} />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {data.items.map((item) => {
          const Icon = getIndustrialIcon(item.icon)

          return (
            <Card key={item.title} className="group flex min-h-80 flex-col transition-shadow duration-200 hover:shadow-industrial">
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <span className="grid size-11 place-items-center rounded-md border border-border bg-ink-50 text-steel-900">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-xs text-ink-500">{item.meta}</span>
                </div>
                <CardTitle className="pt-3">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <p className="text-sm leading-6 text-ink-600">{item.description}</p>
                <Link
                  href={localizedHref(locale, item.href)}
                  className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-semibold text-steel-900"
                >
                  <span>{data.linkLabel}</span>
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
