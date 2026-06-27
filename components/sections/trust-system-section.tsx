import { BadgeCheck, Factory, FileCheck2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { HomepageProjection } from '@/lib/domain'

export function TrustSystemSection({ data }: { data: HomepageProjection['trust'] }) {
  const icons = [FileCheck2, BadgeCheck, Factory]

  return (
    <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
      <div>
        <div className="mb-5 h-0.5 w-12 bg-silver" />
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-steel-700">{data.eyebrow}</p>
        <h2 className="mt-3 text-2xl font-semibold leading-tight text-ink-950 sm:text-3xl lg:text-4xl">{data.title}</h2>
        <p className="mt-4 text-base leading-7 text-ink-600">{data.body}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {data.proof.map((item) => (
            <Badge key={item.label} variant="outline">
              {item.label}: {item.value}
            </Badge>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {data.metrics.map((metric, index) => {
          const Icon = icons[index] ?? BadgeCheck

          return (
            <Card key={metric.label} className="bg-panel">
              <CardHeader>
                <span className="grid size-11 place-items-center rounded-md border border-border bg-ink-50 text-steel-900">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <CardTitle className="pt-3 font-mono text-2xl">{metric.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-ink-600">{metric.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
