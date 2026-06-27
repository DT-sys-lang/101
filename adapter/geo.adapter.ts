import type {
  CategoryId,
  CategoryNode,
  DocumentId,
  EvidenceId,
  GeoAiEvidence,
  GeoAiFact,
  GeoAiFaqItem,
  LocaleCode,
  NonEmptyReadonlyArray,
  ProductGeoAiProfile,
  ProductRecord,
  ProductSeoFields,
  RevisionString,
  SourceRef,
} from '@/lib/domain'
import { localizeFactText, reject, toNonEmptyArray } from './validation'

export type ProductGeoSource = Omit<ProductRecord, 'geoAi' | 'localizedGeoAi'>
export type AIReadableIndustrialProduct = ProductGeoAiProfile

export function buildLocalizedGeoAiProfiles(
  product: ProductGeoSource,
  categoryPath: NonEmptyReadonlyArray<CategoryNode>,
  localizedSeo: Partial<Record<LocaleCode, ProductSeoFields>>,
  locales: NonEmptyReadonlyArray<LocaleCode>,
): Partial<Record<LocaleCode, ProductGeoAiProfile>> {
  return Object.fromEntries(
    locales.map((locale) => [locale, buildGeoAiProfile(product, categoryPath, localizedSeo[locale] ?? product.seo, locale)]),
  ) as Partial<Record<LocaleCode, ProductGeoAiProfile>>
}

export function buildGeoAiProfile(
  product: ProductGeoSource,
  categoryPath: NonEmptyReadonlyArray<CategoryNode>,
  seo: ProductSeoFields,
  locale: LocaleCode,
): ProductGeoAiProfile {
  const sourceRef = buildPrimarySourceRef(product)

  return {
    governance: {
      schemaVersion: 'product-geo-ai-profile-v1',
      locale,
      lastReviewedAt: product.identity.revisedAt,
      reviewedBy: 'product-engineering',
      allowedForAiExtraction: product.identity.lifecycle !== 'hidden',
    },
    entity: {
      productId: product.identity.id,
      canonicalName: localizeFactText(product.content.name, locale),
      model: product.identity.model,
      brand: product.identity.brand,
      canonicalPath: seo.slug.canonicalPath,
      categoryIds: toNonEmptyArray(categoryPath.map((category) => category.id), `product.${product.identity.id}.geoAi.entity.categoryIds`),
    },
    answerSummary: buildAnswerSummary(product, categoryPath, locale),
    factTable: buildFactTable(product, sourceRef),
    selectionGuidance: buildSelectionGuidance(product, categoryPath, locale),
    evidence: buildEvidence(product),
    faq: buildGeoFaq(product, sourceRef, locale),
  }
}

export function buildFactTable(product: ProductGeoSource, sourceRef: SourceRef): NonEmptyReadonlyArray<GeoAiFact> {
  const sourceRefs = toSourceRefs(sourceRef)
  const facts: GeoAiFact[] = [
    {
      id: buildEvidenceId(product.identity.id, 'identity'),
      claimType: 'identity',
      label: 'Product identity',
      value: `${product.identity.brand} ${product.identity.model} (${product.identity.sku})`,
      sourceRefs,
    },
    ...product.measurements.flatMap((measurement) => [
      {
        id: buildEvidenceId(product.identity.id, `${measurement.kind}-range`),
        claimType: 'measurement-range' as const,
        label: `${measurement.kind} range`,
        value: measurement.range.display,
        unit: measurement.range.unit,
        sourceRefs,
      },
      ...(measurement.accuracy
        ? [{
            id: buildEvidenceId(product.identity.id, `${measurement.kind}-accuracy`),
            claimType: 'capability' as const,
            label: `${measurement.kind} accuracy`,
            value: measurement.accuracy,
            sourceRefs,
          }]
        : []),
      ...(measurement.overloadLimit
        ? [{
            id: buildEvidenceId(product.identity.id, `${measurement.kind}-overload`),
            claimType: 'limitation' as const,
            label: `${measurement.kind} overload limit`,
            value: measurement.overloadLimit.display,
            unit: measurement.overloadLimit.unit,
            sourceRefs,
          }]
        : []),
    ]),
    ...product.outputs.map((output) => ({
      id: buildEvidenceId(product.identity.id, `${output.kind}-output`),
      claimType: 'capability' as const,
      label: `${output.kind} output`,
      value: output.value,
      sourceRefs,
    })),
    {
      id: buildEvidenceId(product.identity.id, 'process-connection'),
      claimType: 'installation',
      label: 'Process connection',
      value: product.connections.process.value,
      sourceRefs,
    },
    {
      id: buildEvidenceId(product.identity.id, 'electrical-connection'),
      claimType: 'installation',
      label: 'Electrical connection',
      value: product.connections.electrical.value,
      sourceRefs,
    },
    ...buildEnvironmentalFacts(product, sourceRef),
    ...product.certifications.map((certification) => ({
      id: buildEvidenceId(product.identity.id, `cert-${certification}`),
      claimType: 'compliance' as const,
      label: 'Certification',
      value: certification,
      sourceRefs,
    })),
  ]

  return toNonEmptyArray(facts, `product.${product.identity.id}.geoAi.factTable`)
}

export function buildAnswerSummary(
  product: ProductGeoSource,
  categoryPath: NonEmptyReadonlyArray<CategoryNode>,
  locale: LocaleCode,
): ProductGeoAiProfile['answerSummary'] {
  const model = product.identity.model
  const productName = localizeFactText(product.content.name, locale)
  const categoryName = localizeFactText(categoryPath[categoryPath.length - 1].name, locale)
  const summary = localizeFactText(product.content.summary, locale)
  const measurements = product.measurements.map((measurement) => measurement.range.display).join(', ')
  const outputs = product.outputs.map((output) => output.value).join(', ')
  const primaryUseCases = toNonEmptyArray(
    product.content.applications.length
      ? product.content.applications.map((item) => localizeFactText(item, locale))
      : product.content.highlights.map((item) => localizeFactText(item, locale)),
    `product.${product.identity.id}.geoAi.answerSummary.primaryUseCases`,
  )

  return {
    oneSentence: `${model} is a ${categoryName} for ${primaryUseCases[0]}.`,
    shortParagraph: summary,
    technicalAbstract: `${productName} combines ${measurements} measurement coverage with ${outputs} output options, ${product.connections.process.value} process connection, and ${product.connections.electrical.value} electrical connection.`,
    primaryUseCases,
    notRecommendedFor: product.identity.lifecycle === 'active' ? undefined : ['New design-in projects'],
  }
}

export function buildSelectionGuidance(
  product: ProductGeoSource,
  categoryPath: NonEmptyReadonlyArray<CategoryNode>,
  locale: LocaleCode,
): ProductGeoAiProfile['selectionGuidance'] {
  const categoryName = localizeFactText(categoryPath[categoryPath.length - 1].name, locale)
  const bestFor = toNonEmptyArray(
    product.content.applications.length
      ? product.content.applications.map((item) => localizeFactText(item, locale))
      : [`${categoryName} applications`],
    `product.${product.identity.id}.geoAi.selectionGuidance.bestFor`,
  )
  const decisionCriteria = toNonEmptyArray([
    `Select range from ${product.measurements.map((measurement) => measurement.range.display).join(', ')}.`,
    `Match output to controller input: ${product.outputs.map((output) => output.value).join(', ')}.`,
    `Confirm process connection ${product.connections.process.value}.`,
    `Confirm electrical connection ${product.connections.electrical.value}.`,
  ], `product.${product.identity.id}.geoAi.selectionGuidance.decisionCriteria`)

  return {
    bestFor,
    decisionCriteria,
    compatibleMedia: product.environmentalLimits.compatibleMedia,
    installationNotes: [
      `Process connection: ${product.connections.process.value}`,
      `Electrical connection: ${product.connections.electrical.value}`,
    ],
    requiredOptions: product.variants.length ? product.variants.map((variant) => variant.orderCode) : undefined,
  }
}

export function buildEvidence(product: ProductGeoSource): NonEmptyReadonlyArray<GeoAiEvidence> {
  return toNonEmptyArray(
    product.documents.map((document) => ({
      id: buildEvidenceId(product.identity.id, document.id),
      title: document.title,
      sourceType: mapDocumentKindToEvidenceSourceType(document.kind),
      href: document.href,
      revision: toRevisionString(document.revision),
      updatedAt: product.identity.revisedAt,
    })),
    `product.${product.identity.id}.geoAi.evidence`,
  )
}

function buildGeoFaq(product: ProductGeoSource, sourceRef: SourceRef, locale: LocaleCode): readonly GeoAiFaqItem[] {
  const sourceRefs = toSourceRefs(sourceRef)
  const model = product.identity.model
  const ranges = product.measurements.map((measurement) => measurement.range.display).join(', ')
  const outputs = product.outputs.map((output) => output.value).join(', ')
  const media = product.environmentalLimits.compatibleMedia?.join(', ') || product.environmentalLimits.wettedMaterials.join(', ')

  return [
    {
      question: locale === 'zh' ? `${model} 鐢ㄤ簬浠€涔堝満鏅紵` : `What is ${model} used for?`,
      answer: product.content.summary[locale],
      audience: 'engineer',
      sourceRefs,
    },
    {
      question: locale === 'zh' ? `${model} 鏀寔浠€涔堟祴閲忚寖鍥达紵` : `What measurement range does ${model} support?`,
      answer: `${model} supports ${ranges}.`,
      audience: 'engineer',
      sourceRefs,
    },
    {
      question: locale === 'zh' ? `${model} 鎻愪緵浠€涔堣緭鍑轰俊鍙凤紵` : `What output signal does ${model} provide?`,
      answer: `${model} provides ${outputs}.`,
      audience: 'buyer',
      sourceRefs,
    },
    {
      question: locale === 'zh' ? `${model} 閫傜敤浜庡摢浜涗粙璐紵` : `Which media is ${model} suitable for?`,
      answer: `${model} is listed for compatible media including ${media}.`,
      audience: 'buyer',
      sourceRefs,
    },
  ]
}

function buildEnvironmentalFacts(product: ProductGeoSource, sourceRef: SourceRef): readonly GeoAiFact[] {
  const sourceRefs = toSourceRefs(sourceRef)

  return [
    ...(product.environmentalLimits.mediaTemperature
      ? [{
          id: buildEvidenceId(product.identity.id, 'media-temperature'),
          claimType: 'compatibility' as const,
          label: 'Media temperature',
          value: product.environmentalLimits.mediaTemperature.display,
          unit: product.environmentalLimits.mediaTemperature.unit,
          sourceRefs,
        }]
      : []),
    ...(product.environmentalLimits.ambientTemperature
      ? [{
          id: buildEvidenceId(product.identity.id, 'ambient-temperature'),
          claimType: 'compatibility' as const,
          label: 'Ambient temperature',
          value: product.environmentalLimits.ambientTemperature.display,
          unit: product.environmentalLimits.ambientTemperature.unit,
          sourceRefs,
        }]
      : []),
    ...(product.environmentalLimits.compatibleMedia?.length
      ? [{
          id: buildEvidenceId(product.identity.id, 'compatible-media'),
          claimType: 'compatibility' as const,
          label: 'Compatible media',
          value: product.environmentalLimits.compatibleMedia.join(', '),
          sourceRefs,
        }]
      : []),
    ...(product.environmentalLimits.ingressProtection
      ? [{
          id: buildEvidenceId(product.identity.id, 'ingress-protection'),
          claimType: 'limitation' as const,
          label: 'Ingress protection',
          value: product.environmentalLimits.ingressProtection,
          sourceRefs,
        }]
      : []),
  ]
}

function toSourceRefs(sourceRef: SourceRef): NonEmptyReadonlyArray<SourceRef> {
  return [sourceRef]
}

function buildPrimarySourceRef(product: ProductGeoSource): SourceRef {
  const primaryDocument = product.documents.find((document) => document.kind === 'datasheet') ?? product.documents[0]

  if (!primaryDocument) {
    reject(`product.${product.identity.id}.geoAi.evidence`, 'at least one document is required to build GEO evidence refs')
  }

  return {
    id: primaryDocument.id,
    label: primaryDocument.title,
    href: primaryDocument.href,
    confidence: 'source-backed',
  }
}

function buildEvidenceId(productId: string, key: string): EvidenceId {
  return `evidence_${productId}_${key}` as EvidenceId
}

function mapDocumentKindToEvidenceSourceType(kind: ProductRecord['documents'][number]['kind']): GeoAiEvidence['sourceType'] {
  switch (kind) {
    case 'manual':
      return 'manual'
    case 'certificate':
      return 'certificate'
    case 'catalog':
      return 'catalog'
    case 'drawing':
      return 'engineering-note'
    case 'software':
      return 'engineering-note'
    default:
      return 'datasheet'
  }
}

function toRevisionString(value: string | undefined): RevisionString | undefined {
  if (!value || !/^v\d+(\.\d+){0,2}$/.test(value)) {
    return undefined
  }

  return value as RevisionString
}
