import { industrialSiteConfig, type ProductAvailabilityStatus, type ProductDetailPageData } from '@/lib/domain'
import { getAbsoluteUrl, getLocalizedPath, getLocalizedProductUrl, hrefLangByLocale } from '../canonical'

export type JsonObject = Record<string, unknown>

export function buildProductSchemaJsonLd(data: ProductDetailPageData): JsonObject {
  const canonicalUrl = getLocalizedProductUrl(data.locale, data.seo.slug.canonicalPath)
  const product = data.product

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': industrialSiteConfig.organizationId,
        name: industrialSiteConfig.brandName,
        url: industrialSiteConfig.origin,
      },
      {
        '@type': 'WebSite',
        '@id': industrialSiteConfig.websiteId,
        name: industrialSiteConfig.brandName,
        url: industrialSiteConfig.origin,
        publisher: {
          '@id': industrialSiteConfig.organizationId,
        },
      },
      {
        '@type': 'WebPage',
        '@id': `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: data.seo.title,
        description: data.seo.metaDescription,
        inLanguage: hrefLangByLocale[data.locale],
        isPartOf: {
          '@id': industrialSiteConfig.websiteId,
        },
        about: {
          '@id': `${canonicalUrl}#product`,
        },
        breadcrumb: {
          '@id': `${canonicalUrl}#breadcrumb`,
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: data.seo.breadcrumb.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.label,
          item: getAbsoluteUrl(getLocalizedPath(data.locale, item.canonicalPath)),
        })),
      },
      {
        '@type': 'Product',
        '@id': `${canonicalUrl}#product`,
        name: data.seo.jsonLd.name,
        description: data.seo.jsonLd.description,
        sku: product.identity.sku,
        mpn: product.identity.model,
        model: product.identity.model,
        brand: {
          '@type': 'Brand',
          name: industrialSiteConfig.brandName,
        },
        manufacturer: {
          '@id': industrialSiteConfig.organizationId,
        },
        category: data.listItem.categoryLabel,
        url: canonicalUrl,
        image: product.assets?.map((asset) => getAbsoluteUrl(asset.href)) ?? [],
        material: product.environmentalLimits.wettedMaterials.join(', '),
        additionalProperty: buildProductProperties(data),
        offers: {
          '@type': 'Offer',
          url: canonicalUrl,
          availability: mapAvailabilityToSchema(product.identity.availability),
          seller: {
            '@id': industrialSiteConfig.organizationId,
          },
        },
      },
    ],
  }
}

function buildProductProperties(data: ProductDetailPageData): readonly JsonObject[] {
  const properties: JsonObject[] = []

  for (const group of data.product.specificationGroups) {
    for (const value of group.values) {
      properties.push({
        '@type': 'PropertyValue',
        name: value.label,
        value: value.display,
        unitText: value.unit ?? null,
      })
    }
  }

  for (const measurement of data.product.measurements) {
    properties.push({
      '@type': 'PropertyValue',
      name: `${measurement.kind} range`,
      value: measurement.range.display,
      unitText: measurement.range.unit,
    })

    if (measurement.accuracy) {
      properties.push({
        '@type': 'PropertyValue',
        name: `${measurement.kind} accuracy`,
        value: measurement.accuracy,
      })
    }
  }

  for (const output of data.product.outputs) {
    properties.push({
      '@type': 'PropertyValue',
      name: output.kind,
      value: output.value,
    })
  }

  if (data.product.connections) {
    properties.push(
      {
        '@type': 'PropertyValue',
        name: 'Process connection',
        value: data.product.connections.process.value,
      },
      {
        '@type': 'PropertyValue',
        name: 'Electrical connection',
        value: data.product.connections.electrical.value,
      },
    )
  }

  if (data.product.valveProfile) {
    properties.push(
      {
        '@type': 'PropertyValue',
        name: 'Pressure rating',
        value: data.product.valveProfile.pressureRating,
      },
      {
        '@type': 'PropertyValue',
        name: 'Valve connection',
        value: data.product.valveProfile.connection,
      },
      {
        '@type': 'PropertyValue',
        name: 'Valve material',
        value: data.product.valveProfile.material,
      },
      {
        '@type': 'PropertyValue',
        name: 'Valve mode',
        value: data.product.valveProfile.mode,
      },
      {
        '@type': 'PropertyValue',
        name: 'Valve size',
        value: data.product.valveProfile.size,
      },
    )
  }

  if (data.product.environmentalLimits.ingressProtection) {
    properties.push({
      '@type': 'PropertyValue',
      name: 'Ingress protection',
      value: data.product.environmentalLimits.ingressProtection,
    })
  }

  if (data.product.certifications?.length) {
    properties.push({
      '@type': 'PropertyValue',
      name: 'Certifications',
      value: data.product.certifications.join(', '),
    })
  }

  return dedupeProperties(properties)
}

function dedupeProperties(properties: readonly JsonObject[]) {
  const seen = new Set<string>()
  const result: JsonObject[] = []

  for (const property of properties) {
    const key = `${property.name}:${property.value}`

    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    result.push(property)
  }

  return result
}

function mapAvailabilityToSchema(availability: ProductAvailabilityStatus) {
  const availabilityMap: Record<ProductAvailabilityStatus, string> = {
    'stock-model': 'https://schema.org/InStock',
    'standard-lead-time': 'https://schema.org/LimitedAvailability',
    configurable: 'https://schema.org/LimitedAvailability',
    'made-to-order': 'https://schema.org/PreOrder',
    'quote-required': 'https://schema.org/LimitedAvailability',
    'not-available': 'https://schema.org/OutOfStock',
  }

  return availabilityMap[availability]
}
