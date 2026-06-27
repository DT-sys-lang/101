import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ProductListItem } from '@/lib/domain'

function getProductTags(product: ProductListItem) {
  return [...product.categoryPathLabels.slice(1), ...product.measurementKinds].slice(0, 3)
}

export function ProductCard({
  product,
  href,
  ctaLabel,
  className,
}: {
  product: ProductListItem
  href: string
  ctaLabel: string
  className?: string
}) {
  const tags = getProductTags(product)

  return (
    <Card className={cn('group flex min-h-[360px] flex-col transition-shadow duration-200 hover:shadow-industrial', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <Badge variant="secondary">{product.categoryLabel}</Badge>
          <span className="rounded-md bg-ink-50 px-2 py-1 font-mono text-xs text-ink-500">{product.model}</span>
        </div>
        <CardTitle className="pt-3 text-xl">
          <Link href={href} className="hover:text-steel-900">
            {product.title}
          </Link>
        </CardTitle>
        <p className="text-sm leading-6 text-ink-600">{product.summary}</p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="rounded-md border border-border bg-ink-50 p-3">
          {product.keySpecs.map((spec) => (
            <div key={`${product.id}-${spec.label}`} className="flex items-center justify-between gap-4 border-b border-border py-2 text-xs last:border-b-0">
              <span className="text-ink-500">{spec.label}</span>
              <span className="font-mono font-semibold text-ink-900">{spec.value}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={`${product.id}-${tag}`} variant="outline" className="text-[11px]">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
          <span className="text-xs font-medium text-process-700">{product.availabilityLabel}</span>
          <Link href={href} className="inline-flex items-center gap-2 text-sm font-semibold text-steel-900">
            {ctaLabel}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
