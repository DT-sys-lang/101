import type {
  CategoryNode,
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
import { selectProductClaimTypes } from '@/lib/domain/intent-mapping'
import { localizeFactText, toNonEmptyArray } from './validation'

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
      allowedForAiExtraction: true,
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

export function buildFactTable(product: ProductGeoSource, sourceRef: SourceRef | undefined): NonEmptyReadonlyArray<GeoAiFact> {
  const selectedClaimTypes = new Set(selectProductClaimTypes(product))
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
    ...(product.connections
      ? [
          {
            id: buildEvidenceId(product.identity.id, 'process-connection'),
            claimType: 'installation' as const,
            label: 'Process connection',
            value: product.connections.process.value,
            sourceRefs,
          },
          {
            id: buildEvidenceId(product.identity.id, 'electrical-connection'),
            claimType: 'installation' as const,
            label: 'Electrical connection',
            value: product.connections.electrical.value,
            sourceRefs,
          },
        ]
      : []),
    ...(product.valveProfile
      ? [
          {
            id: buildEvidenceId(product.identity.id, 'valve-pressure-rating'),
            claimType: 'limitation' as const,
            label: 'Pressure rating',
            value: product.valveProfile.pressureRating,
            sourceRefs,
          },
          {
            id: buildEvidenceId(product.identity.id, 'valve-connection'),
            claimType: 'installation' as const,
            label: 'Connection',
            value: product.valveProfile.connection,
            sourceRefs,
          },
        ]
      : []),
    ...buildEnvironmentalFacts(product, sourceRef),
    ...(product.certifications ?? []).map((certification) => ({
      id: buildEvidenceId(product.identity.id, `cert-${certification}`),
      claimType: 'compliance' as const,
      label: 'Certification',
      value: certification,
      sourceRefs,
    })),
  ]

  return toNonEmptyArray(
    facts.filter((fact) => selectedClaimTypes.has(fact.claimType)),
    `product.${product.identity.id}.geoAi.factTable`,
  )
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
  const connectionText = product.connections
    ? `${product.connections.process.value} process connection and ${product.connections.electrical.value} electrical connection`
    : product.valveProfile
      ? `${product.valveProfile.connection} connection, ${product.valveProfile.material} material, and ${product.valveProfile.mode} mode`
      : 'documented installation requirements'
  const technicalFacts = [
    measurements ? `${measurements} measurement coverage` : undefined,
    outputs ? `${outputs} output options` : undefined,
    connectionText,
  ].filter(Boolean).join(', ')
  const primaryUseCaseText = product.content.applications.length
    ? product.content.applications.map((item) => localizeFactText(item, locale))
    : product.content.highlights.map((item) => localizeFactText(item, locale))
  const primaryUseCases = toNonEmptyArray(
    primaryUseCaseText.length ? primaryUseCaseText : [`${categoryName} applications`],
    `product.${product.identity.id}.geoAi.answerSummary.primaryUseCases`,
  )

  return {
    oneSentence: `${model} is a ${categoryName} for ${primaryUseCases[0]}.`,
    shortParagraph: summary,
    technicalAbstract: `${productName} combines ${technicalFacts}.`,
    primaryUseCases,
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
    ...(product.measurements.length ? [`Select range from ${product.measurements.map((measurement) => measurement.range.display).join(', ')}.`] : []),
    ...(product.outputs.length ? [`Match output to controller input: ${product.outputs.map((output) => output.value).join(', ')}.`] : []),
    ...(product.connections ? [`Confirm process connection ${product.connections.process.value}.`, `Confirm electrical connection ${product.connections.electrical.value}.`] : []),
    ...(product.valveProfile ? [`Confirm pressure rating ${product.valveProfile.pressureRating}.`, `Confirm valve size ${product.valveProfile.size}.`] : []),
  ], `product.${product.identity.id}.geoAi.selectionGuidance.decisionCriteria`)
  const installationNotes = [
    ...(product.connections ? [`Process connection: ${product.connections.process.value}`, `Electrical connection: ${product.connections.electrical.value}`] : []),
    ...(product.valveProfile ? [`Valve connection: ${product.valveProfile.connection}`, `Valve mode: ${product.valveProfile.mode}`] : []),
  ]

  return {
    bestFor,
    decisionCriteria,
    compatibleMedia: product.environmentalLimits.compatibleMedia,
    installationNotes,
    requiredOptions: product.variants.length ? product.variants.map((variant) => variant.orderCode) : undefined,
  }
}

export function buildEvidence(product: ProductGeoSource): readonly GeoAiEvidence[] {
  return (product.documents ?? []).map((document) => ({
    id: buildEvidenceId(product.identity.id, document.id),
    title: document.title,
    sourceType: mapDocumentKindToEvidenceSourceType(document.kind),
    href: document.href,
    revision: toRevisionString(document.revision),
    updatedAt: product.identity.revisedAt,
  }))
}

function buildGeoFaq(product: ProductGeoSource, sourceRef: SourceRef | undefined, locale: LocaleCode): readonly GeoAiFaqItem[] {
  const sourceRefs = toSourceRefs(sourceRef)
  const model = product.identity.model
  const items: GeoAiFaqItem[] = [
    {
      question: `What is ${model} used for?`,
      answer: product.content.summary[locale] ?? product.content.summary.en,
      audience: 'engineer',
      sourceRefs,
    },
  ]

  const ranges = product.measurements.map((measurement) => measurement.range.display).join(', ')
  if (ranges) {
    items.push({
      question: `What measurement range does ${model} support?`,
      answer: `${model} supports ${ranges}.`,
      audience: 'engineer',
      sourceRefs,
    })
  }

  const outputs = product.outputs.map((output) => output.value).join(', ')
  if (outputs) {
    items.push({
      question: `What output signal does ${model} provide?`,
      answer: `${model} provides ${outputs}.`,
      audience: 'buyer',
      sourceRefs,
    })
  }

  if (product.valveProfile) {
    items.push({
      question: `What pressure rating does ${model} support?`,
      answer: `${model} is specified with ${product.valveProfile.pressureRating} pressure rating, ${product.valveProfile.connection} connection, and ${product.valveProfile.size} size.`,
      audience: 'engineer',
      sourceRefs,
    })
  }

  const media = product.environmentalLimits.compatibleMedia?.join(', ') || product.environmentalLimits.wettedMaterials.join(', ')
  if (media) {
    items.push({
      question: `Which media is ${model} suitable for?`,
      answer: `${model} is listed for compatible media including ${media}.`,
      audience: 'buyer',
      sourceRefs,
    })
  }

  return items
}

function buildEnvironmentalFacts(product: ProductGeoSource, sourceRef: SourceRef | undefined): readonly GeoAiFact[] {
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

function toSourceRefs(sourceRef: SourceRef | undefined): readonly SourceRef[] {
  return sourceRef ? [sourceRef] : []
}

function buildPrimarySourceRef(product: ProductGeoSource): SourceRef | undefined {
  const documents = product.documents ?? []
  const primaryDocument = documents.find((document) => document.kind === 'datasheet') ?? documents[0]

  if (!primaryDocument) {
    return undefined
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

function mapDocumentKindToEvidenceSourceType(kind: NonNullable<ProductRecord['documents']>[number]['kind']): GeoAiEvidence['sourceType'] {
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
