import type {
  CategoryCanonicalPath,
  CategoryNode,
  LocaleCode,
  LocalizedCanonicalPath,
  NonEmptyReadonlyArray,
  ProductAvailabilityStatus,
  ProductCanonicalPath,
  ProductJsonLd,
  ProductLifecycleStatus,
  ProductPropertyValueJsonLd,
  ProductRecord,
  ProductSeoFields,
  SearchIntent,
  SeoBreadcrumbItem,
  SeoOpenGraphFields,
  SlugSegment,
} from '@/lib/domain'
import { industrialSiteConfig, selectProductSeo } from '@/lib/domain'
import { getAbsoluteUrl, getLocalizedPath, getLocalizedProductUrl } from '@/lib/seo/canonical'
import { buildCategoryBreadcrumb, type CategoryContext } from './category.adapter'
import { localizeFactText, reject, toNonEmptyArray, type ProductFact } from './validation'

export interface ProductSeoSource {
  readonly fact: ProductFact
  readonly categoryContext: CategoryContext
  readonly primaryCategory: CategoryNode
  readonly primaryCategoryPath: NonEmptyReadonlyArray<CategoryNode>
  readonly additionalCategoryPaths: readonly NonEmptyReadonlyArray<CategoryNode>[]
  readonly productSlug: SlugSegment
  readonly canonicalPath: ProductCanonicalPath
}

export interface ItemListSchemaSource {
  readonly locale: LocaleCode
  readonly canonicalPath: CategoryCanonicalPath
  readonly title: string
  readonly description: string
  readonly products: readonly ProductRecord[]
}

export type JsonObject = Record<string, unknown>

export function buildProductCanonicalPath(categoryPath: readonly CategoryNode[], productSlug: SlugSegment): ProductCanonicalPath {
  if (!categoryPath.length) {
    reject('productSeo.categoryPath', 'expected a non-empty category path')
  }

  return `/products/${categoryPath.map((category) => category.slug).join('/')}/${productSlug}` as ProductCanonicalPath
}

export function buildProductSeoFields(source: ProductSeoSource, locale: LocaleCode): ProductSeoFields {
  const title = buildProductTitle(source, locale)
  const metaDescription = buildProductDescription(source, locale)
  const h1 = buildProductHeading(source, locale)
  const breadcrumb = buildProductBreadcrumb(source, locale)
  const alternates = buildLocalizedCanonicalPaths(source)

  return {
    locale,
    slug: {
      segment: source.productSlug,
      categoryPath: toNonEmptyArray(source.primaryCategoryPath.map((category) => category.slug), `productFacts.${source.fact.id}.slug.categoryPath`),
      canonicalPath: source.canonicalPath,
      aliases: buildProductAliasPaths(source),
    },
    title,
    metaDescription,
    h1,
    indexingPolicy: getProductIndexingPolicy(source.fact.lifecycle),
    searchIntent: buildSearchIntent(source),
    breadcrumb,
    alternates,
    openGraph: buildProductOpenGraphMetadata(source, locale),
    jsonLd: buildProductJsonLd(source, locale),
  }
}

export function buildLocalizedProductSeoFields(source: ProductSeoSource): Record<LocaleCode, ProductSeoFields> {
  return Object.fromEntries(
    source.categoryContext.locales.map((locale) => [locale, buildProductSeoFields(source, locale)]),
  ) as Record<LocaleCode, ProductSeoFields>
}

export function buildProductOpenGraphMetadata(source: ProductSeoSource, locale: LocaleCode): SeoOpenGraphFields {
  const title = buildProductTitle(source, locale)
  const description = buildProductDescription(source, locale)
  const image = source.fact.assets?.[0]

  return {
    title,
    description,
    imageUrl: image ? getAbsoluteUrl(image.href) : undefined,
    imageAlt: image?.alt ?? title,
    type: 'product',
  }
}

export function buildProductJsonLd(source: ProductSeoSource, locale: LocaleCode): ProductJsonLd {
  const productName = buildProductHeading(source, locale)
  const description = buildProductDescription(source, locale)
  const primaryCategoryName = localizeFactText(source.primaryCategory.name, locale)
  const imageUrls = source.fact.assets?.map((asset) => getAbsoluteUrl(asset.href))
  const additionalProperty = buildProductPropertyValues(source, locale)

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productName,
    sku: source.fact.sku,
    mpn: source.fact.model,
    brand: {
      '@type': 'Brand',
      name: source.fact.brand,
    },
    category: primaryCategoryName,
    description,
    url: source.canonicalPath,
    image: imageUrls?.length ? imageUrls : undefined,
    additionalProperty: additionalProperty.length ? additionalProperty : undefined,
    offers: {
      '@type': 'Offer',
      availability: mapAvailabilityToSchema(source.fact.availability),
      url: source.canonicalPath,
    },
  }
}

export function buildItemListSchema(source: ItemListSchemaSource): JsonObject {
  const localizedCollectionUrl = getAbsoluteUrl(getLocalizedPath(source.locale, source.canonicalPath))

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${localizedCollectionUrl}#collection`,
        url: localizedCollectionUrl,
        name: source.title,
        description: source.description,
        isPartOf: {
          '@id': industrialSiteConfig.websiteId,
        },
        mainEntity: {
          '@id': `${localizedCollectionUrl}#products`,
        },
      },
      {
        '@type': 'ItemList',
        '@id': `${localizedCollectionUrl}#products`,
        numberOfItems: source.products.length,
        itemListElement: source.products.map((product, index) => {
          const seo = selectProductSeo(product, source.locale)

          return {
            '@type': 'ListItem',
            position: index + 1,
            url: getLocalizedProductUrl(source.locale, seo.slug.canonicalPath),
            name: seo.h1,
          }
        }),
      },
    ],
  }
}

export function buildFAQPageSchema(source: ProductSeoSource, locale: LocaleCode, faqItems?: readonly { readonly question: string; readonly answer: string }[]): JsonObject {
  const items = faqItems?.length ? faqItems : buildProductFaqItems(source, locale)

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${getLocalizedProductUrl(locale, source.canonicalPath)}#faq`,
    mainEntity: items.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

export function buildCategoryOpenGraphMetadata(category: CategoryNode, locale: LocaleCode): SeoOpenGraphFields {
  const label = localizeFactText(category.name, locale)
  const description = applyTemplate(category.seo.descriptionPattern, {
    category: label,
    brand: industrialSiteConfig.brandName,
  })

  return {
    title: applyTemplate(category.seo.titlePattern, {
      category: label,
      brand: industrialSiteConfig.brandName,
    }),
    description,
    type: 'website',
  }
}

export function buildCategorySeoFields(category: CategoryNode, locale: LocaleCode, categoryContext: CategoryContext) {
  const breadcrumb = buildCategoryBreadcrumb(categoryContext, category.id, locale)
  const categoryLabel = localizeFactText(category.name, locale)

  return {
    locale,
    canonicalPath: category.canonicalPath,
    title: applyTemplate(category.seo.titlePattern, {
      category: categoryLabel,
      brand: industrialSiteConfig.brandName,
    }),
    metaDescription: applyTemplate(category.seo.descriptionPattern, {
      category: categoryLabel,
      brand: industrialSiteConfig.brandName,
    }),
    h1: categoryLabel,
    indexingPolicy: category.seo.indexable ? 'index-follow' : 'noindex-follow',
    searchIntent: toNonEmptyArray(['category-discovery', 'technical-comparison', 'quote-request'], `categoryFacts.${category.id}.searchIntent`),
    breadcrumb,
    alternates: categoryContext.locales.map((alternateLocale) => ({
      locale: alternateLocale,
      canonicalPath: category.canonicalPath,
    })) as readonly LocalizedCanonicalPath[],
    openGraph: buildCategoryOpenGraphMetadata(category, locale),
  } satisfies import('@/lib/domain').CategorySeoFields
}

function buildProductTitle(source: ProductSeoSource, locale: LocaleCode) {
  const shortName = localizeFactText(source.fact.shortName, locale)
  const categoryLabel = localizeFactText(source.primaryCategory.name, locale)
  return `${shortName} | ${categoryLabel} | ${industrialSiteConfig.brandName}`
}

function buildProductHeading(source: ProductSeoSource, locale: LocaleCode) {
  return localizeFactText(source.fact.shortName, locale)
}

function buildProductDescription(source: ProductSeoSource, locale: LocaleCode) {
  const summary = localizeFactText(source.fact.summary, locale)
  const measurement = source.fact.measurements[0]?.range.display
  const output = source.fact.outputs[0]?.value
  const parts = [summary]

  if (measurement) {
    parts.push(`Measurement range: ${measurement}.`)
  }

  if (output) {
    parts.push(`Output: ${output}.`)
  }

  return parts.join(' ')
}

function buildProductBreadcrumb(source: ProductSeoSource, locale: LocaleCode): NonEmptyReadonlyArray<SeoBreadcrumbItem> {
  const categoryBreadcrumb = buildCategoryBreadcrumb(source.categoryContext, source.primaryCategory.id, locale)
  const breadcrumb = [
    ...categoryBreadcrumb,
    {
      label: buildProductHeading(source, locale),
      canonicalPath: source.canonicalPath,
    },
  ]

  return toNonEmptyArray(breadcrumb, `productFacts.${source.fact.id}.breadcrumb`)
}

function buildLocalizedCanonicalPaths(source: ProductSeoSource): readonly LocalizedCanonicalPath[] {
  return source.categoryContext.locales.map((locale) => ({
    locale,
    canonicalPath: source.canonicalPath,
  }))
}

function buildProductAliasPaths(source: ProductSeoSource): readonly ProductCanonicalPath[] | undefined {
  const aliases = uniqueStrings(
    source.additionalCategoryPaths
      .map((categoryPath) => buildProductCanonicalPath(categoryPath, source.productSlug))
      .filter((alias) => alias !== source.canonicalPath),
  )

  return aliases.length ? aliases : undefined
}

function buildSearchIntent(source: ProductSeoSource): NonEmptyReadonlyArray<SearchIntent> {
  const searchIntents = uniqueStrings([
    'model-lookup',
    'technical-comparison',
    'application-selection',
    'datasheet-download',
    'quote-request',
    ...(source.fact.applicationIds.length ? ['application-selection'] : []),
  ]) as SearchIntent[]

  return toNonEmptyArray(searchIntents.length ? searchIntents : ['model-lookup'], `productFacts.${source.fact.id}.searchIntent`)
}

function buildProductPropertyValues(source: ProductSeoSource, locale: LocaleCode): readonly ProductPropertyValueJsonLd[] {
  const properties: ProductPropertyValueJsonLd[] = []

  for (const measurement of source.fact.measurements) {
    properties.push({
      '@type': 'PropertyValue',
      name: `${measurement.kind} range`,
      value: measurement.range.display,
      unitText: measurement.range.unit,
    })

    if (measurement.overloadLimit) {
      properties.push({
        '@type': 'PropertyValue',
        name: `${measurement.kind} overload limit`,
        value: measurement.overloadLimit.display,
        unitText: measurement.overloadLimit.unit,
      })
    }
  }

  for (const output of source.fact.outputs) {
    properties.push({
      '@type': 'PropertyValue',
      name: 'Output signal',
      value: output.value,
    })
  }

  properties.push(
    {
      '@type': 'PropertyValue',
      name: 'Process connection',
      value: source.fact.connections.process.value,
    },
    {
      '@type': 'PropertyValue',
      name: 'Electrical connection',
      value: source.fact.connections.electrical.value,
    },
  )

  if (source.fact.environmentalLimits.ingressProtection) {
    properties.push({
      '@type': 'PropertyValue',
      name: 'Ingress protection',
      value: source.fact.environmentalLimits.ingressProtection,
    })
  }

  if (source.fact.environmentalLimits.mediaTemperature) {
    properties.push({
      '@type': 'PropertyValue',
      name: 'Media temperature',
      value: source.fact.environmentalLimits.mediaTemperature.display,
      unitText: source.fact.environmentalLimits.mediaTemperature.unit,
    })
  }

  if (source.fact.environmentalLimits.ambientTemperature) {
    properties.push({
      '@type': 'PropertyValue',
      name: 'Ambient temperature',
      value: source.fact.environmentalLimits.ambientTemperature.display,
      unitText: source.fact.environmentalLimits.ambientTemperature.unit,
    })
  }

  for (const group of source.fact.specificationGroups) {
    for (const value of group.values) {
      properties.push({
        '@type': 'PropertyValue',
        name: value.label,
        value: value.display,
        unitText: value.unit,
      })
    }
  }

  if (source.fact.certifications?.length) {
    properties.push({
      '@type': 'PropertyValue',
      name: 'Certifications',
      value: source.fact.certifications.join(', '),
    })
  }

  return dedupeProperties(properties)
}

function buildProductFaqItems(source: ProductSeoSource, locale: LocaleCode) {
  const productName = buildProductHeading(source, locale)
  const summary = localizeFactText(source.fact.summary, locale)
  const measurement = source.fact.measurements[0]?.range.display
  const output = source.fact.outputs[0]?.value
  const primaryCategory = localizeFactText(source.primaryCategory.name, locale)

  return [
    {
      question: locale === 'zh' ? `${productName} 用于什么场景？` : `What is ${productName} used for?`,
      answer: summary,
    },
    {
      question: locale === 'zh' ? `${productName} 支持什么测量范围？` : `What measurement range does ${productName} support?`,
      answer: measurement ? (locale === 'zh' ? `主要测量范围为 ${measurement}。` : `The primary range is ${measurement}.`) : (locale === 'zh' ? '请查看技术参数表确认可用量程。' : 'Check the technical parameter table for available ranges.'),
    },
    {
      question: locale === 'zh' ? `${productName} 适合哪些应用？` : `Which applications fit ${productName}?`,
      answer: locale === 'zh' ? `${primaryCategory} 应用和工业选型场景。` : `${primaryCategory} application and industrial selection scenarios.`,
    },
    {
      question: locale === 'zh' ? `${productName} 提供什么输出？` : `What output does ${productName} provide?`,
      answer: output ? (locale === 'zh' ? `标准输出为 ${output}。` : `The standard output is ${output}.`) : (locale === 'zh' ? '请查看数据表确认输出配置。' : 'Check the datasheet for output configurations.'),
    },
  ]
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

function getProductIndexingPolicy(lifecycle: ProductLifecycleStatus): ProductSeoFields['indexingPolicy'] {
  return lifecycle === 'draft' || lifecycle === 'hidden' ? 'noindex-follow' : 'index-follow'
}

function uniqueStrings<T extends string>(values: readonly T[]) {
  return [...new Set(values.filter((value) => Boolean(value.trim())))]
}

function dedupeProperties(properties: readonly ProductPropertyValueJsonLd[]) {
  const seen = new Set<string>()
  const result: ProductPropertyValueJsonLd[] = []

  for (const property of properties) {
    const key = `${property.name}:${property.value}:${property.unitText ?? ''}`

    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    result.push(property)
  }

  return result
}

function applyTemplate(template: string, replacements: Record<string, string>) {
  return template.replace(/\{([a-zA-Z0-9_-]+)\}/g, (_, key: string) => replacements[key] ?? '')
}
