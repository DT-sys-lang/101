import Link from 'next/link'
import { ArrowRight, ImageIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ProductListItem } from '@/lib/domain'

export function ProductCard({ product, href, ctaLabel, className }: { product: ProductListItem; href: string; ctaLabel: string; className?: string }) {
  const primaryImage = product.media.primaryImage
  return (
    <article className={cn('group flex h-full flex-col border border-border bg-panel transition-colors hover:border-steel-700', className)}>
      <Link href={href} aria-label={product.title} className="relative block aspect-square border-b border-border bg-ink-50 p-8" style={primaryImage ? { backgroundImage: `url("${primaryImage.href}")`, backgroundPosition: 'center', backgroundSize: 'contain', backgroundRepeat: 'no-repeat' } : undefined}>
        {!primaryImage ? <span className="absolute inset-0 grid place-items-center text-ink-400"><ImageIcon className="size-10" aria-hidden="true" /></span> : null}
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 font-mono text-[10px] uppercase text-ink-600"><i className="h-2 w-2 bg-emerald-500" />{product.availabilityLabel}</span>
      </Link>
      <div className="flex flex-1 flex-col p-6">
        <div className="text-xs font-semibold uppercase text-ink-600">{product.categoryLabel}</div>
        <h3 className="mt-2 text-xl font-medium leading-7 text-ink-950 transition-colors group-hover:text-steel-700">{product.title}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-semibold text-ink-950">{product.model}</span>
          <Badge variant="outline">{product.familyLabel}</Badge>
        </div>
        <div className="mt-auto space-y-2 pt-6">
          {product.keySpecs.slice(0, 3).map((spec) => (
            <div key={`${product.id}-${spec.label}`} className="flex justify-between gap-4 border-b border-border pb-1 text-sm">
              <span className="text-ink-600">{spec.label}</span>
              <span className="text-right text-ink-950">{spec.value}</span>
            </div>
          ))}
        </div>
        <Link href={href} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase text-steel-700">
          {ctaLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}
