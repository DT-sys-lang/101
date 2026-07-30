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
import { localizeTechnicalValue, localizeTechnicalValues } from '@/lib/domain/localization'
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
      canonicalName: getProductDisplayName(product, locale),
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
  const productName = getProductDisplayName(product, locale)
  const categoryName = getCategoryDisplayName(categoryPath, locale)
  const summary = localizeFactText(product.content.summary, locale) || getProductSummaryFallback(product, categoryName, locale)
  const measurements = product.measurements.map((measurement) => measurement.range.display).join(', ')
  const outputs = product.outputs.map((output) => output.value).join(', ')
  const connectionText = getConnectionText(product, locale)
  const technicalFacts = [
    measurements ? (locale === 'zh' ? `${measurements} 测量覆盖` : `${measurements} measurement coverage`) : undefined,
    outputs ? (locale === 'zh' ? `${outputs} 输出选项` : `${outputs} output options`) : undefined,
    connectionText,
  ].filter(Boolean).join(', ')
  const primaryUseCaseText = product.content.applications.length
    ? product.content.applications.map((item) => localizeFactText(item, locale))
    : product.content.highlights.map((item) => localizeFactText(item, locale))
  const filteredPrimaryUseCases = primaryUseCaseText.filter(Boolean)
  const primaryUseCases = toNonEmptyArray(
    filteredPrimaryUseCases.length
      ? filteredPrimaryUseCases
      : [locale === 'zh' ? `${categoryName}应用` : `${categoryName} applications`],
    `product.${product.identity.id}.geoAi.answerSummary.primaryUseCases`,
  )
  const primaryUseCase = normalizeUseCasePhrase(primaryUseCases[0], locale)

  return {
    oneSentence: locale === 'zh'
      ? `${model} 是${categoryName}，适用于${primaryUseCase}。`
      : `${model} is a ${categoryName} for ${primaryUseCase}.`,
    shortParagraph: summary,
    technicalAbstract: locale === 'zh'
      ? `${productName} 集成 ${technicalFacts}。`
      : `${productName} combines ${technicalFacts}.`,
    primaryUseCases,
  }
}

export function buildSelectionGuidance(
  product: ProductGeoSource,
  categoryPath: NonEmptyReadonlyArray<CategoryNode>,
  locale: LocaleCode,
): ProductGeoAiProfile['selectionGuidance'] {
  const categoryName = getCategoryDisplayName(categoryPath, locale)
  const applicationText = product.content.applications.map((item) => localizeFactText(item, locale)).filter(Boolean)
  const bestFor = toNonEmptyArray(
    applicationText.length
      ? applicationText
      : [locale === 'zh' ? `${categoryName}应用` : `${categoryName} applications`],
    `product.${product.identity.id}.geoAi.selectionGuidance.bestFor`,
  )
  const decisionCriteria = toNonEmptyArray([
    ...(product.measurements.length ? [locale === 'zh' ? `根据 ${product.measurements.map((measurement) => measurement.range.display).join(', ')} 确认量程。` : `Select range from ${product.measurements.map((measurement) => measurement.range.display).join(', ')}.`] : []),
    ...(product.outputs.length ? [locale === 'zh' ? `匹配控制器输入：${product.outputs.map((output) => output.value).join(', ')}。` : `Match output to controller input: ${product.outputs.map((output) => output.value).join(', ')}.`] : []),
    ...(product.connections ? [
      locale === 'zh' ? `确认过程连接 ${localizeTechnicalValue(product.connections.process.value, locale)}。` : `Confirm process connection ${localizeTechnicalValue(product.connections.process.value, locale)}.`,
      locale === 'zh' ? `确认电气连接 ${localizeTechnicalValue(product.connections.electrical.value, locale)}。` : `Confirm electrical connection ${localizeTechnicalValue(product.connections.electrical.value, locale)}.`,
    ] : []),
    ...(product.valveProfile ? [
      locale === 'zh' ? `确认压力等级 ${product.valveProfile.pressureRating}。` : `Confirm pressure rating ${product.valveProfile.pressureRating}.`,
      locale === 'zh' ? `确认阀门尺寸 ${localizeTechnicalValue(product.valveProfile.size, locale)}。` : `Confirm valve size ${localizeTechnicalValue(product.valveProfile.size, locale)}.`,
    ] : []),
  ], `product.${product.identity.id}.geoAi.selectionGuidance.decisionCriteria`)
  const installationNotes = [
    ...(product.connections ? [
      locale === 'zh' ? `过程连接：${localizeTechnicalValue(product.connections.process.value, locale)}` : `Process connection: ${localizeTechnicalValue(product.connections.process.value, locale)}`,
      locale === 'zh' ? `电气连接：${localizeTechnicalValue(product.connections.electrical.value, locale)}` : `Electrical connection: ${localizeTechnicalValue(product.connections.electrical.value, locale)}`,
    ] : []),
    ...(product.valveProfile ? [
      locale === 'zh' ? `阀门连接：${localizeTechnicalValue(product.valveProfile.connection, locale)}` : `Valve connection: ${localizeTechnicalValue(product.valveProfile.connection, locale)}`,
      locale === 'zh' ? `阀门模式：${localizeTechnicalValue(product.valveProfile.mode, locale)}` : `Valve mode: ${localizeTechnicalValue(product.valveProfile.mode, locale)}`,
    ] : []),
  ]

  return {
    bestFor,
    decisionCriteria,
    compatibleMedia: localizeTechnicalValues(product.environmentalLimits.compatibleMedia ?? [], locale),
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
  const summary = localizeFactText(product.content.summary, locale) || getProductSummaryFallback(product, undefined, locale)
  const items: GeoAiFaqItem[] = [
    {
      question: locale === 'zh' ? `${model} 用于什么场景？` : `What is ${model} used for?`,
      answer: summary,
      audience: 'engineer',
      sourceRefs,
    },
  ]

  const ranges = product.measurements.map((measurement) => measurement.range.display).join(', ')
  if (ranges) {
    items.push({
      question: locale === 'zh' ? `${model} 支持什么测量范围？` : `What measurement range does ${model} support?`,
      answer: locale === 'zh' ? `${model} 支持 ${ranges}。` : `${model} supports ${ranges}.`,
      audience: 'engineer',
      sourceRefs,
    })
  }

  const outputs = product.outputs.map((output) => output.value).join(', ')
  if (outputs) {
    items.push({
      question: locale === 'zh' ? `${model} 提供什么输出信号？` : `What output signal does ${model} provide?`,
      answer: locale === 'zh' ? `${model} 提供 ${outputs}。` : `${model} provides ${outputs}.`,
      audience: 'buyer',
      sourceRefs,
    })
  }

  if (product.valveProfile) {
    items.push({
      question: locale === 'zh' ? `${model} 支持什么压力等级？` : `What pressure rating does ${model} support?`,
      answer: locale === 'zh'
        ? `${model} 标注压力等级为 ${product.valveProfile.pressureRating}，连接为 ${localizeTechnicalValue(product.valveProfile.connection, locale)}，尺寸为 ${localizeTechnicalValue(product.valveProfile.size, locale)}。`
        : `${model} is specified with ${product.valveProfile.pressureRating} pressure rating, ${localizeTechnicalValue(product.valveProfile.connection, locale)} connection, and ${localizeTechnicalValue(product.valveProfile.size, locale)} size.`,
      audience: 'engineer',
      sourceRefs,
    })
  }

  const media = localizeTechnicalValues(product.environmentalLimits.compatibleMedia?.length ? product.environmentalLimits.compatibleMedia : product.environmentalLimits.wettedMaterials, locale).join(', ')
  if (media) {
    items.push({
      question: locale === 'zh' ? `${model} 适合哪些介质？` : `Which media is ${model} suitable for?`,
      answer: locale === 'zh' ? `${model} 适用介质包括 ${media}。` : `${model} is listed for compatible media including ${media}.`,
      audience: 'buyer',
      sourceRefs,
    })
  }

  return items
}

function getProductDisplayName(product: ProductGeoSource, locale: LocaleCode) {
  return localizeFactText(product.content.name, locale)
    || localizeFactText(product.content.shortName, locale)
    || product.identity.model
}

function getCategoryDisplayName(categoryPath: NonEmptyReadonlyArray<CategoryNode>, locale: LocaleCode) {
  return localizeFactText(categoryPath[categoryPath.length - 1].name, locale)
    || (locale === 'zh' ? '工业产品' : 'industrial product')
}

function getProductSummaryFallback(product: ProductGeoSource, categoryName: string | undefined, locale: LocaleCode) {
  const category = categoryName ?? (locale === 'zh' ? '工业产品' : 'industrial product')

  return locale === 'zh'
    ? `${product.identity.model} 是用于${category}选型、参数确认和询价沟通的工业产品。`
    : `${product.identity.model} is an industrial product for ${category} selection, parameter review, and RFQ discussion.`
}

function getConnectionText(product: ProductGeoSource, locale: LocaleCode) {
  if (product.connections) {
    const process = localizeTechnicalValue(product.connections.process.value, locale)
    const electrical = localizeTechnicalValue(product.connections.electrical.value, locale)

    return locale === 'zh'
      ? `${process} 过程连接和 ${electrical} 电气连接`
      : `${process} process connection and ${electrical} electrical connection`
  }

  if (product.valveProfile) {
    const connection = localizeTechnicalValue(product.valveProfile.connection, locale)
    const material = localizeTechnicalValue(product.valveProfile.material, locale)
    const mode = localizeTechnicalValue(product.valveProfile.mode, locale)

    return locale === 'zh'
      ? `${connection} 连接、${material} 材质和 ${mode} 模式`
      : `${connection} connection, ${material} material, and ${mode} mode`
  }

  return locale === 'zh' ? '已记录安装要求' : 'documented installation requirements'
}

function normalizeUseCasePhrase(value: string, locale: LocaleCode) {
  const trimmed = value.trim().replace(/[.。]+$/g, '')

  if (locale === 'zh') {
    return trimmed.replace(/^用于/, '')
  }

  return trimmed
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
