import Link from 'next/link'
import { ArrowRight, ImageIcon } from 'lucide-react'
import { OptimizedImage as Image } from '@/components/ui/optimized-image'
import { cn } from '@/lib/utils'
import type { ProductListItem } from '@/lib/domain'

export function ProductCard({ product, href, ctaLabel, className }: { product: ProductListItem; href: string; ctaLabel: string; className?: string }) {
  const primaryImage = product.media.primaryImage
  return (
    <article className={cn('group flex h-full flex-col border border-border bg-panel transition-colors hover:border-steel-700', className)}>
      <Link href={href} aria-label={product.title} className="relative block aspect-square overflow-hidden border-b border-border bg-ink-50">
        {primaryImage ? (
          <Image
            src={primaryImage.href}
            alt={primaryImage.alt}
            fill
            sizes="(min-width: 1280px) 280px, (min-width: 768px) 33vw, 100vw"
            className="object-contain p-8"
          />
        ) : null}
        {!primaryImage ? <span className="absolute inset-0 grid place-items-center text-ink-400"><ImageIcon className="size-10" aria-hidden="true" /></span> : null}
        <span className="absolute right-4 top-4 z-10 inline-flex items-center gap-1 font-mono text-[10px] uppercase text-ink-600"><i className="h-2 w-2 bg-emerald-500" />{product.availabilityLabel}</span>
      </Link>
      <div className="flex flex-1 flex-col p-6">
        <div className="text-xs font-semibold uppercase text-ink-600">{product.categoryLabel}</div>
        <h3 className="mt-2 text-xl font-medium leading-7 text-ink-950 transition-colors group-hover:text-steel-700">{product.title}</h3>
        <div className="mt-auto space-y-2 pt-8">
          {product.keySpecs.slice(0, 3).map((spec) => (
            <div key={`${product.id}-${spec.label}`} className="flex min-h-8 items-center justify-between gap-5 border-b border-border pb-1 text-sm">
              <span className="shrink-0 text-ink-600">{spec.label}</span>
              <span className="min-w-0 flex-1 truncate text-right text-ink-950" title={spec.value}>{spec.value}</span>
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
