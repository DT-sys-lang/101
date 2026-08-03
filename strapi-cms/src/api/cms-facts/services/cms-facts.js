'use strict'

const allowedPreviewContentTypes = new Set([
  'api::application-fact.application-fact',
  'api::category-fact.category-fact',
  'api::certification.certification',
  'api::document-asset.document-asset',
  'api::industry-fact.industry-fact',
  'api::product-fact.product-fact',
])

const forbiddenOutputFieldNames = new Set([
  'data',
  'attributes',
  'meta',
  'documentId',
  'createdAt',
  'updatedAt',
  'publishedAt',
  'createdBy',
  'updatedBy',
  'lifecycle',
  'slug',
  'slugPath',
  'canonical',
  'canonicalPath',
  'breadcrumb',
  'seo',
  'localizedSeo',
  'jsonld',
  'jsonLd',
  'jsonLD',
  'geo',
  'geoAi',
  'localizedGeoAi',
  'geoEntity',
  'entity',
  'identity',
  'classification',
  'categoryPath',
  'depth',
  'children',
])

const graphReaders = {
  categoryFacts: {
    uid: 'api::category-fact.category-fact',
    options: {
      fields: ['factId'],
      populate: {
        parent: { fields: ['factId'] },
        name: true,
      },
    },
  },
  productFacts: {
    uid: 'api::product-fact.product-fact',
    options: {
      fields: [
        'factId',
        'family',
        'sku',
        'model',
        'seriesId',
        'brand',
        'manufacturer',
        'availability',
        'releasedAt',
        'revisedAt',
        'measurementKinds',
      ],
      populate: {
        primaryCategory: { fields: ['factId'] },
        additionalCategories: { fields: ['factId'] },
        industries: { fields: ['factId'] },
        applications: { fields: ['factId'] },
        name: true,
        shortName: true,
        summary: true,
        highlights: true,
        applicationCopy: true,
        measurements: { populate: { range: true, overloadLimit: true } },
        outputs: true,
        connections: true,
        environmentalLimits: { populate: { mediaTemperature: true, ambientTemperature: true } },
        valveProfile: true,
        specificationGroups: { populate: { values: { populate: { sourceRefs: true } } } },
        variants: { populate: { optionValues: true } },
        documents: {
          fields: ['factId', 'assetClass', 'title', 'documentKind', 'hrefOverride', 'contentLocale', 'revision'],
          populate: { file: { fields: ['url'] } },
        },
        assets: {
          fields: ['factId', 'assetClass', 'assetKind', 'hrefOverride', 'alt'],
          populate: { file: { fields: ['url'] } },
        },
        certifications: { fields: ['code'] },
        commercialTerms: true,
      },
    },
  },
  industryFacts: {
    uid: 'api::industry-fact.industry-fact',
    options: {
      fields: ['factId'],
    },
  },
  applicationFacts: {
    uid: 'api::application-fact.application-fact',
    options: {
      fields: ['factId'],
    },
  },
  documentAssets: {
    uid: 'api::document-asset.document-asset',
    options: {
      fields: ['factId', 'assetClass'],
      populate: { file: { fields: ['url'] } },
    },
  },
  certifications: {
    uid: 'api::certification.certification',
    options: {
      fields: ['code'],
    },
  },
}

module.exports = {
  async find(query = {}) {
    const request = normalizeRequest(query)
    const graph = await readFactGraph(request)
    const cmsFacts = buildCmsFactInput(graph)

    assertDirectCmsFactInputShape(cmsFacts)
    assertNoForbiddenOutputFields(cmsFacts)

    return cmsFacts
  },
}

function normalizeRequest(query) {
  const publicationState = readQueryString(query.publicationState) || 'live'
  const localeSet = readQueryString(query.localeSet) || 'default'
  const previewContentType = readQueryString(query.previewContentType)
  const previewEntryId = readQueryString(query.previewEntryId)

  if (publicationState !== 'live' && publicationState !== 'preview') {
    throw httpError(400, 'publicationState must be live or preview.')
  }

  if (localeSet !== 'default' && localeSet !== 'all') {
    throw httpError(400, 'localeSet must be default or all.')
  }

  if ((previewContentType || previewEntryId) && publicationState !== 'preview') {
    throw httpError(400, 'Preview parameters require publicationState=preview.')
  }

  if (Boolean(previewContentType) !== Boolean(previewEntryId)) {
    throw httpError(400, 'previewContentType and previewEntryId must be provided together.')
  }

  if (previewContentType && !allowedPreviewContentTypes.has(previewContentType)) {
    throw httpError(400, 'previewContentType is not facts-only.')
  }

  return {
    publicationState,
    localeSet,
    previewContentType,
    previewEntryId,
  }
}

async function readFactGraph(request) {
  if (request.publicationState === 'preview' && request.previewContentType && request.previewEntryId) {
    const graph = await readFactGraphForPublicationState('live')
    const previewEntry = await readPreviewEntry(request.previewContentType, request.previewEntryId)

    return overlayPreviewEntry(graph, request.previewContentType, previewEntry)
  }

  return readFactGraphForPublicationState(request.publicationState)
}

async function readFactGraphForPublicationState(publicationState) {
  const [
    categoryFacts,
    productFacts,
    industryFacts,
    applicationFacts,
    documentAssets,
    certifications,
  ] = await Promise.all([
    readCollection(graphReaders.categoryFacts, publicationState),
    readCollection(graphReaders.productFacts, publicationState),
    readCollection(graphReaders.industryFacts, publicationState),
    readCollection(graphReaders.applicationFacts, publicationState),
    readCollection(graphReaders.documentAssets, publicationState),
    readCollection(graphReaders.certifications, publicationState),
  ])

  return {
    categoryFacts,
    productFacts,
    industryFacts,
    applicationFacts,
    documentAssets,
    certifications,
  }
}

async function readCollection(reader, publicationState) {
  const rows = await strapi.documents(reader.uid).findMany({
    ...reader.options,
    status: documentStatusFor(publicationState),
    limit: 10000,
  })

  return ensureArray(rows)
}

function documentStatusFor(publicationState) {
  return publicationState === 'live' ? 'published' : 'draft'
}

async function readPreviewEntry(previewContentType, previewEntryId) {
  const reader = readerForUid(previewContentType)
  const filters = previewFiltersFor(previewContentType, previewEntryId)
  const rows = await strapi.documents(previewContentType).findMany({
    ...reader.options,
    filters,
    status: "draft",
    limit: 2,
  })

  const entries = ensureArray(rows)

  if (entries.length !== 1) {
    throw httpError(404, 'Preview entry was not found or is ambiguous.')
  }

  return entries[0]
}

function readerForUid(uid) {
  const reader = Object.values(graphReaders).find((candidate) => candidate.uid === uid)

  if (!reader) {
    throw httpError(400, 'Unsupported preview content type.')
  }

  return reader
}

function previewFiltersFor(uid, previewEntryId) {
  if (uid === 'api::certification.certification') {
    return { code: { $eq: previewEntryId } }
  }

  if (/^[a-z0-9]{24}$/i.test(previewEntryId)) {
    return { documentId: { $eq: previewEntryId } }
  }

  return { factId: { $eq: previewEntryId } }
}

function overlayPreviewEntry(graph, previewContentType, previewEntry) {
  const target = graphKeyForUid(previewContentType)
  const stableId = stableIdFor(previewContentType, previewEntry)

  return {
    ...graph,
    [target]: replaceByStableId(graph[target], stableId, previewEntry, previewContentType),
  }
}

function graphKeyForUid(uid) {
  for (const [key, reader] of Object.entries(graphReaders)) {
    if (reader.uid === uid) {
      return key
    }
  }

  throw httpError(400, 'Unsupported preview content type.')
}

function stableIdFor(uid, row) {
  return uid === 'api::certification.certification' ? row.code : row.factId
}

function replaceByStableId(rows, stableId, previewEntry, uid) {
  const nextRows = []
  let replaced = false

  for (const row of rows) {
    if (stableIdFor(uid, row) === stableId) {
      nextRows.push(previewEntry)
      replaced = true
    } else {
      nextRows.push(row)
    }
  }

  if (!replaced) {
    nextRows.push(previewEntry)
  }

  return nextRows
}

function buildCmsFactInput(graph) {
  const categoryIdSet = new Set(graph.categoryFacts.map((row) => row.factId))
  const industryIdSet = new Set(graph.industryFacts.map((row) => row.factId))
  const applicationIdSet = new Set(graph.applicationFacts.map((row) => row.factId))
  const documentAssetIdSet = new Set(graph.documentAssets.map((row) => row.factId))
  const certificationCodeSet = new Set(graph.certifications.map((row) => row.code))

  return {
    categoryFacts: graph.categoryFacts.map(toCategoryFact).sort(compareById),
    productFacts: buildProductFactsWithTolerance(graph.productFacts, {
      categoryIdSet,
      industryIdSet,
      applicationIdSet,
      documentAssetIdSet,
      certificationCodeSet,
    }),
  }
}

function buildProductFactsWithTolerance(rows, indexes) {
  const productFacts = []

  for (const row of rows) {
    try {
      productFacts.push(toProductFact(row, indexes))
    } catch (error) {
      const productId = optionalString(row?.factId) || optionalString(row?.model) || 'unknown-product'
      const message = error instanceof Error ? error.message : String(error)
      strapi.log.error(`[cms-facts] Rejected malformed product '${productId}' while keeping the remaining catalog available: ${message}`)
    }
  }

  return productFacts.sort(compareById)
}

function toCategoryFact(row) {
  return withoutUndefined({
    id: requireString(row.factId, 'category-fact.factId'),
    parentId: row.parent ? requireString(row.parent.factId, 'category-fact.parent.factId') : null,
    name: toLocalizedText(row.name, 'category-fact.name'),
  })
}

function toProductFact(row, indexes) {
  const family = readProductFamily(row.family)
  const primaryCategoryId = requireRelationId(row.primaryCategory, 'product-fact.primaryCategory')
  const additionalCategoryIds = relationIds(row.additionalCategories, 'product-fact.additionalCategories')
  const industryIds = relationIds(row.industries, 'product-fact.industries')
  const applicationIds = relationIds(row.applications, 'product-fact.applications')
  const certificationCodes = relationCodes(row.certifications, 'product-fact.certifications')
  const documents = ensureArray(row.documents).filter((asset) => asset.assetClass === 'document')
  const assets = ensureArray(row.assets).filter((asset) => asset.assetClass === 'media')

  requireKnown(primaryCategoryId, indexes.categoryIdSet, 'product-fact.primaryCategory')
  additionalCategoryIds.forEach((id) => requireKnown(id, indexes.categoryIdSet, 'product-fact.additionalCategories'))
  industryIds.forEach((id) => requireKnown(id, indexes.industryIdSet, 'product-fact.industries'))
  applicationIds.forEach((id) => requireKnown(id, indexes.applicationIdSet, 'product-fact.applications'))
  certificationCodes.forEach((code) => requireKnown(code, indexes.certificationCodeSet, 'product-fact.certifications'))
  documents.forEach((asset) => requireKnown(asset.factId, indexes.documentAssetIdSet, 'product-fact.documents'))
  assets.forEach((asset) => requireKnown(asset.factId, indexes.documentAssetIdSet, 'product-fact.assets'))

  const measurements = ensureArray(row.measurements).map(toMeasurementFact)
  const outputs = ensureArray(row.outputs).map(toSignalOutputFact)
  const connections = row.connections ? toConnectionSet(row.connections) : undefined
  const environmentalLimits = row.environmentalLimits ? toEnvironmentalLimits(row.environmentalLimits) : undefined
  const sensorProfile = buildSensorProfile(row, measurements, outputs, connections, environmentalLimits)
  const valveProfile = row.valveProfile ? toValveProfile(row.valveProfile) : undefined
  const core = {
    family,
    sku: requireString(row.sku, 'product-fact.sku'),
    model: requireString(row.model, 'product-fact.model'),
    brand: requireString(row.brand, 'product-fact.brand'),
    primaryCategory: primaryCategoryId,
    name: toLocalizedText(row.name, 'product-fact.name'),
    shortName: toLocalizedText(row.shortName, 'product-fact.shortName'),
    summary: toLocalizedText(row.summary, 'product-fact.summary'),
  }

  if (family === 'sensor' && !sensorProfile) {
    throw httpError(500, 'product-fact.sensorProfile requires measurements and outputs for sensor products.')
  }

  if (family === 'valve' && !valveProfile) {
    throw httpError(500, 'product-fact.valveProfile is required for valve products.')
  }

  return withoutUndefined({
    id: requireString(row.factId, 'product-fact.factId'),
    family,
    core,
    sensorProfile,
    valveProfile,
    sku: core.sku,
    model: core.model,
    seriesId: optionalString(row.seriesId),
    brand: core.brand,
    manufacturer: optionalString(row.manufacturer),
    availability: requireString(row.availability, 'product-fact.availability'),
    releasedAt: optionalString(row.releasedAt),
    revisedAt: requireString(row.revisedAt, 'product-fact.revisedAt'),
    primaryCategoryId,
    additionalCategoryIds,
    industryIds,
    applicationIds,
    measurementKinds: readMeasurementKinds(row.measurementKinds, measurements),
    name: core.name,
    shortName: core.shortName,
    summary: core.summary,
    highlights: ensureArray(row.highlights).map((item) => toLocalizedText(item, 'product-fact.highlights')),
    applications: ensureArray(row.applicationCopy).map((item) => toLocalizedText(item, 'product-fact.applicationCopy')),
    measurements: measurements.length ? measurements : undefined,
    outputs: outputs.length ? outputs : undefined,
    connections,
    environmentalLimits,
    specificationGroups: ensureArray(row.specificationGroups).map(toSpecificationGroup),
    variants: ensureArray(row.variants).map(toVariantFact),
    certifications: certificationCodes.length ? certificationCodes : undefined,
    documents: documents.length ? documents.map(toDocument).sort(compareById) : undefined,
    assets: assets.length ? assets.map(toAsset).sort(compareById) : undefined,
    commercialTerms: row.commercialTerms ? toCommercialTerms(row.commercialTerms) : undefined,
  })
}

function buildSensorProfile(row, measurements, outputs, connections, environmentalLimits) {
  if (!measurements.length && !outputs.length) {
    return undefined
  }

  if (!measurements.length || !outputs.length) {
    throw httpError(500, 'product-fact.sensorProfile requires both measurements and outputs when sensor facts are present.')
  }

  return withoutUndefined({
    measurements,
    outputs,
    connections,
    environmentalLimits,
  })
}

function toValveProfile(row) {
  requireObject(row, 'product-fact.valveProfile')

  return {
    pressureRating: requireString(row.pressureRating, 'valveProfile.pressureRating'),
    connection: requireString(row.connection, 'valveProfile.connection'),
    material: requireString(row.material, 'valveProfile.material'),
    mode: requireString(row.mode, 'valveProfile.mode'),
    compatibleMedia: stringArray(row.compatibleMedia, 'valveProfile.compatibleMedia'),
    size: requireString(row.size, 'valveProfile.size'),
  }
}

function toMeasurementFact(row) {
  return withoutUndefined({
    kind: requireString(row.kind, 'measurement.kind'),
    range: toQuantityRange(row.range, 'measurement.range'),
    accuracy: optionalString(row.accuracy),
    overloadLimit: row.overloadLimit ? toQuantityValue(row.overloadLimit, 'measurement.overloadLimit') : undefined,
  })
}

function toSignalOutputFact(row) {
  return withoutUndefined({
    kind: requireString(row.kind, 'output.kind'),
    value: requireString(row.value, 'output.value'),
    protocol: optionalString(row.protocol),
    wiring: optionalString(row.wiring),
  })
}

function toConnectionSet(row) {
  requireObject(row, 'product-fact.connections')

  return withoutUndefined({
    process: withoutUndefined({
      kind: requireString(row.processKind, 'connections.processKind'),
      value: requireString(row.processValue, 'connections.processValue'),
      material: optionalString(row.processMaterial),
    }),
    electrical: withoutUndefined({
      kind: requireString(row.electricalKind, 'connections.electricalKind'),
      value: requireString(row.electricalValue, 'connections.electricalValue'),
    }),
  })
}

function toEnvironmentalLimits(row) {
  requireObject(row, 'product-fact.environmentalLimits')

  return withoutUndefined({
    ingressProtection: optionalString(row.ingressProtection),
    mediaTemperature: row.mediaTemperature ? toQuantityRange(row.mediaTemperature, 'environmentalLimits.mediaTemperature') : undefined,
    ambientTemperature: row.ambientTemperature ? toQuantityRange(row.ambientTemperature, 'environmentalLimits.ambientTemperature') : undefined,
    wettedMaterials: stringArray(row.wettedMaterials, 'environmentalLimits.wettedMaterials'),
    compatibleMedia: stringArray(row.compatibleMedia, 'environmentalLimits.compatibleMedia'),
  })
}

function toSpecificationGroup(row) {
  return {
    key: requireString(row.key, 'specificationGroup.key'),
    label: requireString(row.label, 'specificationGroup.label'),
    values: ensureArray(row.values).map(toSpecificationValue),
  }
}

function toSpecificationValue(row) {
  return withoutUndefined({
    key: requireString(row.key, 'specificationValue.key'),
    label: requireString(row.label, 'specificationValue.label'),
    value: requireScalar(row.value, 'specificationValue.value'),
    unit: optionalString(row.unit),
    display: requireString(row.display, 'specificationValue.display'),
    sourceRefs: ensureArray(row.sourceRefs).map(toSourceRef),
  })
}

function toSourceRef(row) {
  return withoutUndefined({
    id: requireString(row.sourceId, 'sourceRef.sourceId'),
    label: requireString(row.label, 'sourceRef.label'),
    href: optionalString(row.href),
    page: optionalNumber(row.page),
    confidence: requireString(row.confidence, 'sourceRef.confidence'),
  })
}

function toVariantFact(row) {
  return withoutUndefined({
    id: requireString(row.factId, 'variant.factId'),
    orderCode: requireString(row.orderCode, 'variant.orderCode'),
    optionValues: ensureArray(row.optionValues).map(toOptionValue),
    availability: requireString(row.availability, 'variant.availability'),
  })
}

function toOptionValue(row) {
  return withoutUndefined({
    optionKey: requireString(row.optionKey, 'optionValue.optionKey'),
    label: requireString(row.label, 'optionValue.label'),
    value: requireString(row.value, 'optionValue.value'),
    code: optionalString(row.code),
  })
}

function toDocument(row) {
  return withoutUndefined({
    id: requireString(row.factId, 'document.factId'),
    title: requireString(row.title, 'document.title'),
    kind: requireString(row.documentKind, 'document.documentKind'),
    href: hrefForAsset(row, 'document'),
    contentLocale: optionalString(row.contentLocale),
    revision: optionalString(row.revision),
  })
}

function toAsset(row) {
  return withoutUndefined({
    id: requireString(row.factId, 'asset.factId'),
    kind: requireString(row.assetKind, 'asset.assetKind'),
    href: hrefForAsset(row, 'asset'),
    alt: requireString(row.alt, 'asset.alt'),
  })
}

function hrefForAsset(row, path) {
  return optionalString(row.hrefOverride) || absoluteUploadUrl(requireString(row.file && row.file.url, `${path}.file.url`))
}

function absoluteUploadUrl(value) {
  if (/^https?:\/\//i.test(value)) {
    return value
  }

  const serverUrl = optionalString(strapi.config.get('server.url'))
  if (value.startsWith('/') && serverUrl) {
    return `${serverUrl.replace(/\/+$/, '')}${value}`;
  }

  return value
}

function toCommercialTerms(row) {
  requireObject(row, 'product-fact.commercialTerms')

  return withoutUndefined({
    minimumOrderQuantity: optionalNumber(row.minimumOrderQuantity),
    standardLeadTime: optionalString(row.standardLeadTime),
    warranty: optionalString(row.warranty),
    oemCustomizable: Boolean(row.oemCustomizable),
    privateLabelAvailable: Boolean(row.privateLabelAvailable),
  })
}

function toQuantityRange(row, path) {
  requireObject(row, path)

  return {
    min: requireNumber(row.min, `${path}.min`),
    max: requireNumber(row.max, `${path}.max`),
    unit: requireString(row.unit, `${path}.unit`),
    display: requireString(row.display, `${path}.display`),
  }
}

function toQuantityValue(row, path) {
  requireObject(row, path)

  return withoutUndefined({
    value: requireNumber(row.value, `${path}.value`),
    unit: requireString(row.unit, `${path}.unit`),
    display: requireString(row.display, `${path}.display`),
  })
}

function toLocalizedText(row, path) {
  requireObject(row, path)

  return withoutUndefined({
    en: requireString(row.en, `${path}.en`),
    zh: requireString(row.zh, `${path}.zh`),
    ru: optionalString(row.ru),
    es: optionalString(row.es),
  })
}

function relationIds(rows, path) {
  return ensureArray(rows).map((row) => requireRelationId(row, path)).sort(compareString)
}

function relationCodes(rows, path) {
  return ensureArray(rows).map((row) => requireString(row.code, path)).sort(compareString)
}

function requireRelationId(row, path) {
  requireObject(row, path)
  return requireString(row.factId, `${path}.factId`)
}

function requireKnown(value, knownValues, path) {
  if (!knownValues.has(value)) {
    throw httpError(500, `${path} references an unknown facts-only row.`)
  }
}

function readProductFamily(value) {
  if (value === 'sensor' || value === undefined || value === null || value === '') {
    return 'sensor'
  }

  if (value === 'valve') {
    return 'valve'
  }

  throw httpError(500, 'product-fact.family must be sensor or valve.')
}

function readMeasurementKinds(value, measurements) {
  if (value !== undefined && value !== null) {
    return stringArray(value, 'product-fact.measurementKinds')
  }

  return [...new Set(measurements.map((measurement) => measurement.kind))].sort(compareString)
}

function stringArray(value, path) {
  const array = ensureArray(value)

  for (const item of array) {
    requireString(item, path)
  }

  return array.slice().sort(compareString)
}

function ensureArray(value) {
  if (value === undefined || value === null) {
    return []
  }

  return Array.isArray(value) ? value : [value]
}

function readQueryString(value) {
  if (Array.isArray(value)) {
    return readQueryString(value[0])
  }

  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed || undefined
}

function requireObject(value, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw httpError(500, `${path} must be an object.`)
  }
}

function requireString(value, path) {
  if (typeof value !== 'string' || !value.trim()) {
    throw httpError(500, `${path} must be a non-empty string.`)
  }

  return value
}

function optionalString(value) {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function requireNumber(value, path) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw httpError(500, `${path} must be a number.`)
  }

  return value
}

function optionalNumber(value) {
  return typeof value === 'number' && !Number.isNaN(value) ? value : undefined
}

function requireScalar(value, path) {
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
    throw httpError(500, `${path} must be a string, number, or boolean.`)
  }

  return value
}

function withoutUndefined(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value
  }

  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined))
}

function assertDirectCmsFactInputShape(value) {
  requireObject(value, 'cmsFacts')
  const keys = Object.keys(value)

  if (keys.length !== 2 || !keys.includes('categoryFacts') || !keys.includes('productFacts')) {
    throw httpError(500, 'CMS facts response must contain only categoryFacts and productFacts.')
  }

  if (!Array.isArray(value.categoryFacts) || !Array.isArray(value.productFacts)) {
    throw httpError(500, 'categoryFacts and productFacts must be arrays.')
  }
}

function assertNoForbiddenOutputFields(value, path = 'cmsFacts') {
  if (!value || typeof value !== 'object') {
    return
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenOutputFields(item, `${path}[${index}]`))
    return
  }

  for (const [key, child] of Object.entries(value)) {
    if (forbiddenOutputFieldNames.has(key)) {
      throw httpError(500, `${path}.${key} is forbidden in direct CmsFactInput.`)
    }

    if (key === 'id' && typeof child === 'number') {
      throw httpError(500, `${path}.id must not expose a Strapi numeric id.`)
    }

    assertNoForbiddenOutputFields(child, `${path}.${key}`)
  }
}

function compareById(left, right) {
  return compareString(left.id, right.id)
}

function compareString(left, right) {
  return String(left).localeCompare(String(right), 'en')
}

function httpError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}
