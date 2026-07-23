import type { ProductListItem } from '@/lib/domain'
import { ProductCard } from './product-card'

function uniqueProductsById(products: readonly ProductListItem[]) {
  const seen = new Set<string>()
  return products.filter((product) => {
    if (seen.has(product.id)) return false
    seen.add(product.id)
    return true
  })
}

export function ProductGrid({ products, getHref, ctaLabel }: { products: readonly ProductListItem[]; getHref: (product: ProductListItem) => string; ctaLabel: string }) {
  return <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">{uniqueProductsById(products).map((product) => <ProductCard key={product.id} product={product} href={getHref(product)} ctaLabel={ctaLabel} />)}</div>
}
