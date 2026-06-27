import { Route, Settings2, Workflow } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { HomepageProjection } from '@/lib/domain'

export function ApplicationProofSection({ data }: { data: HomepageProjection['applicationProof'] }) {
  const icons = [Route, Workflow, Settings2]

  return (
    <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
      <div>
        <div className="mb-5 h-0.5 w-12 bg-silver" />
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-steel-700">{data.eyebrow}</p>
        <h2 className="mt-3 text-2xl font-semibold leading-tight text-ink-950 sm:text-3xl lg:text-4xl">{data.title}</h2>
        <p className="mt-4 text-base leading-7 text-ink-600">{data.body}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {data.items.map((item, index) => {
          const Icon = icons[index] ?? Route

          return (
            <Card key={item.label} className="bg-panel">
              <CardHeader>
                <span className="grid size-11 place-items-center rounded-md border border-border bg-ink-50 text-steel-900">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <CardTitle className="pt-3 text-lg">{item.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="font-mono">
                  {item.value}
                </Badge>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
