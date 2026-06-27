import { CheckCircle2 } from 'lucide-react'
import { getIndustrialIcon } from '@/components/shared/industrial-icons'
import { SectionHeading } from '@/components/shared/section-heading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { HomepageProjection } from '@/lib/domain'

export function ModuleSystemSection({ data }: { data: HomepageProjection['modules'] }) {
  return (
    <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
      <SectionHeading eyebrow={data.eyebrow} title={data.title} body={data.body} />
      <div className="grid gap-5">
        {data.items.map((item) => {
          const Icon = getIndustrialIcon(item.icon)

          return (
            <Card key={item.title} className="bg-panel">
              <CardHeader className="flex-row items-start gap-4 space-y-0">
                <span className="grid size-11 shrink-0 place-items-center rounded-md border border-border bg-ink-50 text-steel-900">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <CardTitle>{item.title}</CardTitle>
                  <p className="mt-2 text-sm leading-6 text-ink-600">{item.description}</p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-3">
                  {item.points.map((point) => (
                    <div key={point} className="flex items-center gap-2 rounded-md bg-ink-50 px-3 py-2 text-xs font-medium text-ink-700">
                      <CheckCircle2 className="size-4 text-process-700" aria-hidden="true" />
                      {point}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
