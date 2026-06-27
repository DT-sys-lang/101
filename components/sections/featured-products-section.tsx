import Link from 'next/link'
import { Database, ListFilter } from 'lucide-react'
import { ProductGrid } from '@/components/products/product-grid'
import { SectionHeading } from '@/components/shared/section-heading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/i18n/routing'
import type { HomepageProjection } from '@/lib/domain'

function localizedHref(locale: Locale, href: string) {
  return `/${locale}${href}`
}

export function FeaturedProductsSection({
  locale,
  data,
}: {
  locale: Locale
  data: HomepageProjection['products']
}) {
  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} body={data.body} />
        <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
          <Badge variant="signal" className="h-9 justify-center px-3">
            <Database className="mr-2 size-4" aria-hidden="true" />
            {data.totalLabel}
          </Badge>
          <Button asChild variant="secondary">
            <Link href={localizedHref(locale, '/products')}>
              <ListFilter aria-hidden="true" />
              {data.viewAllLabel}
            </Link>
          </Button>
        </div>
      </div>
      <ProductGrid
        products={data.items}
        getHref={(product) => localizedHref(locale, product.href)}
        ctaLabel={data.detailsLabel}
      />
    </div>
  )
}
