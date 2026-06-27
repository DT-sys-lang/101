import type { ProductListItem } from '@/lib/domain'
import { ProductCard } from './product-card'

export function ProductGrid({
  products,
  getHref,
  ctaLabel,
}: {
  products: readonly ProductListItem[]
  getHref: (product: ProductListItem) => string
  ctaLabel: string
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} href={getHref(product)} ctaLabel={ctaLabel} />
      ))}
    </div>
  )
}
