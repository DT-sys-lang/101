'use strict'

const path = require('node:path')
const JSZip = require('jszip')

const tableNames = {
  categories: 'categories',
  products: 'products',
  productSpecs: 'product_specs',
  productAssets: 'product_assets',
}

const derivedFieldNames = new Set([
  'slug',
  'slugpath',
  'canonical',
  'canonicalpath',
  'canonicalurl',
  'categorypath',
  'breadcrumb',
  'seo',
  'localizedseo',
  'jsonld',
  'geo',
  'geoai',
  'localizedgeoai',
  'geoentity',
  'entity',
  'identity',
  'classification',
  'depth',
  'children',
  'data',
  'attributes',
  'meta',
  'documentid',
  'createdat',
  'updatedat',
  'publishedat',
  'createdby',
  'updatedby',
])

const knownSpecKeys = new Set([
  'measurement_range',
  'range',
  'accuracy',
  'overload_limit',
  'output_signal',
  'output',
  'supply_voltage',
  'process_connection',
  'electrical_connection',
  'ingress_protection',
  'wetted_materials',
  'compatible_media',
  'ambient_temperature',
  'media_temperature',
  'feature',
])

const simplifiedValveSpecAliases = new Map([
  ['pressure_rating', 'feature'],
  ['size', 'feature'],
  ['connection', 'process_connection'],
  ['material', 'wetted_materials'],
  ['mode', 'feature'],
])
const simplifiedSpecKeys = new Set([...knownSpecKeys, ...simplifiedValveSpecAliases.keys()])
const simplifiedSpecLabels = {
  measurement_range: 'Measurement range',
  range: 'Range',
  accuracy: 'Accuracy',
  overload_limit: 'Overload limit',
  output_signal: 'Output signal',
  output: 'Output',
  supply_voltage: 'Supply voltage',
  process_connection: 'Process connection',
  electrical_connection: 'Electrical connection',
  ingress_protection: 'Ingress protection',
  compatible_media: 'Compatible media',
  wetted_materials: 'Wetted materials',
  media_temperature: 'Media temperature',
  ambient_temperature: 'Ambient temperature',
  pressure_rating: 'Pressure rating',
  size: 'Size',
  connection: 'Connection',
  material: 'Material',
  mode: 'Mode',
  feature: 'Feature',
}
const simplifiedAssetKinds = new Map([
  ['primary_image', 'primary-image'],
  ['gallery_image', 'gallery-image'],
  ['diagram', 'diagram'],
  ['dimension_drawing', 'dimension-drawing'],
  ['installation_photo', 'installation-photo'],
])
const simplifiedDocumentKinds = new Set([
  'datasheet',
  'manual',
  'certificate',
  'drawing',
  'catalog',
  'software',
])
const sensorRequiredSpecKeyOptions = [
  ['measurement_range', 'range'],
  ['accuracy'],
  ['overload_limit'],
  ['output_signal', 'output'],
  ['supply_voltage'],
  ['process_connection'],
  ['electrical_connection'],
  ['ingress_protection'],
  ['compatible_media'],
  ['wetted_materials'],
  ['media_temperature'],
  ['ambient_temperature'],
]
const valveRequiredSpecKeyOptions = [
  ['pressure_rating'],
  ['size'],
  ['connection', 'process_connection'],
  ['material', 'wetted_materials'],
  ['mode'],
  ['compatible_media'],
]
const dateColumns = new Set(['released_at', 'revised_at'])

module.exports = {
  buildCmsFactsFromWorkbookBuffer,
}

async function buildCmsFactsFromWorkbookBuffer(buffer) {
  const workbook = await readWorkbook(buffer)
  const simplifiedTables = {
    categories: requireSheetTable(workbook, tableNames.categories),
    products: requireSheetTable(workbook, tableNames.products),
    productSpecs: requireSheetTable(workbook, tableNames.productSpecs),
    productAssets: workbook.tables[tableNames.productAssets] || [],
  }
  const legacyTables = buildLegacyTablesFromSimplifiedTables(simplifiedTables)
  const cmsFacts = buildCmsFacts(legacyTables)

  return {
    cmsFacts,
    workbook: {
      mode: 'simplified',
      sheets: Object.fromEntries(Object.entries(workbook.tables).map(([name, rows]) => [name, rows.length])),
      categoryFacts: cmsFacts.categoryFacts.length,
      productFacts: cmsFacts.productFacts.length,
    },
  }
}

async function readWorkbook(buffer) {
  const zip = await JSZip.loadAsync(buffer)
  const workbookXml = await readZipText(zip, 'xl/workbook.xml')
  const relsXml = await readZipText(zip, 'xl/_rels/workbook.xml.rels')
  const sharedStrings = await readSharedStrings(zip)
  const relTargets = readWorkbookRelationships(relsXml)
  const sheets = readWorkbookSheets(workbookXml)
  const tables = {}

  for (const sheet of sheets) {
    const tableName = resolveTableName(sheet.name)

    if (!tableName) {
      continue
    }

    const target = relTargets.get(sheet.rId)

    if (!target) {
      throw new Error(`workbook:${sheet.name}: sheet relationship '${sheet.rId}' is missing`)
    }

    const sheetXml = await readZipText(zip, resolveWorkbookTarget(target))
    const rows = parseWorksheetRows(sheetXml, sharedStrings)
    tables[tableName] = rowsToTable(tableName, rows)
  }

  return { tables }
}

function requireSheetTable(workbook, tableName) {
  const rows = workbook.tables[tableName]

  if (!rows) {
    throw new Error(`Excel workbook is missing required sheet '${tableName}'`)
  }

  if (!rows.length) {
    throw new Error(`Excel sheet '${tableName}' has no data rows`)
  }

  return rows
}

function resolveTableName(sheetName) {
  const normalized = sheetName.toLowerCase().replace(/\.(csv|xlsx)$/g, '').replace(/[\s-]/g, '_')
  const compact = normalized.replace(/_/g, '')

  if (['categories', 'category'].includes(normalized) || ['categories', 'category'].includes(compact) || sheetName === '分类') {
    return tableNames.categories
  }

  if (['products', 'product'].includes(normalized) || ['products', 'product'].includes(compact) || sheetName === '产品') {
    return tableNames.products
  }

  if (normalized === 'product_specs' || compact === 'productspecs' || sheetName === '产品规格') {
    return tableNames.productSpecs
  }

  if (normalized === 'product_assets' || compact === 'productassets' || sheetName === '产品资料' || sheetName === '产品资产') {
    return tableNames.productAssets
  }

  return undefined
}

async function readZipText(zip, filePath) {
  const file = zip.file(filePath)

  if (!file) {
    throw new Error(`Excel workbook internal file '${filePath}' is missing`)
  }

  return file.async('text')
}

async function readSharedStrings(zip) {
  const file = zip.file('xl/sharedStrings.xml')

  if (!file) {
    return []
  }

  const xml = await file.async('text')
  return [...xml.matchAll(/<si\b[\s\S]*?<\/si>/g)].map(([siXml]) => (
    [...siXml.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
      .map((match) => decodeXml(match[1]))
      .join('')
  ))
}

function readWorkbookRelationships(xml) {
  const rels = new Map()

  for (const [tag] of xml.matchAll(/<Relationship\b[^>]*\/?>/g)) {
    const attrs = readXmlAttributes(tag)

    if (attrs.Id && attrs.Target) {
      rels.set(attrs.Id, attrs.Target)
    }
  }

  return rels
}

function readWorkbookSheets(xml) {
  return [...xml.matchAll(/<sheet\b[^>]*\/?>/g)].map(([tag]) => {
    const attrs = readXmlAttributes(tag)

    return {
      name: attrs.name,
      rId: attrs['r:id'],
    }
  }).filter((sheet) => sheet.name && sheet.rId)
}

function resolveWorkbookTarget(target) {
  if (target.startsWith('/')) {
    return target.slice(1)
  }

  if (target.startsWith('xl/')) {
    return target
  }

  return path.posix.normalize(`xl/${target}`)
}

function parseWorksheetRows(xml, sharedStrings) {
  const rows = []

  for (const [rowXml] of xml.matchAll(/<row\b[\s\S]*?<\/row>/g)) {
    const cells = []

    for (const [cellXml] of rowXml.matchAll(/<c\b[\s\S]*?<\/c>|<c\b[^>]*\/>/g)) {
      const openTag = cellXml.match(/^<c\b[^>]*>/)?.[0] || cellXml
      const attrs = readXmlAttributes(openTag)
      const columnIndex = attrs.r ? columnNameToIndex(attrs.r.replace(/[0-9]/g, '')) : cells.length
      cells[columnIndex] = parseCellValue(cellXml, attrs, sharedStrings)
    }

    rows.push(trimTrailingEmpty(cells))
  }

  return rows.filter((row) => row.some((value) => value !== ''))
}

function parseCellValue(cellXml, attrs, sharedStrings) {
  if (attrs.t === 'inlineStr') {
    return readInlineString(cellXml)
  }

  const rawValue = readFirstTagValue(cellXml, 'v')

  if (rawValue === undefined) {
    return ''
  }

  if (attrs.t === 's') {
    return sharedStrings[Number(rawValue)] || ''
  }

  if (attrs.t === 'b') {
    return rawValue === '1' ? 'true' : 'false'
  }

  return decodeXml(rawValue)
}

function readInlineString(cellXml) {
  const parts = [...cellXml.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]

  if (!parts.length) {
    return ''
  }

  return parts.map((match) => decodeXml(match[1])).join('')
}

function readFirstTagValue(xml, tagName) {
  const match = xml.match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`))
  return match ? match[1] : undefined
}

function rowsToTable(tableName, rows) {
  if (!rows.length) {
    return []
  }

  const [rawHeaders, ...rawRows] = rows
  const headers = rawHeaders.map((header) => String(header || '').replace(/^\uFEFF/, '').trim())
  const usefulHeaderCount = lastNonBlankIndex(headers) + 1
  const trimmedHeaders = headers.slice(0, usefulHeaderCount)
  const headerSet = new Set()

  for (const header of trimmedHeaders) {
    if (!header) {
      throw new Error(`${tableName}: blank header is not allowed`)
    }

    if (headerSet.has(header)) {
      throw new Error(`${tableName}: duplicate header '${header}'`)
    }

    rejectForbiddenColumn(tableName, header)
    headerSet.add(header)
  }

  return rawRows
    .map((row) => Object.fromEntries(trimmedHeaders.map((header, index) => [
      header,
      normalizeCellForColumn(header, row[index]),
    ])))
    .filter((row) => Object.values(row).some((value) => value !== ''))
}

function normalizeCellForColumn(header, value) {
  const text = value === undefined || value === null ? '' : String(value).trim()

  if (dateColumns.has(header) && /^\d+(?:\.\d+)?$/.test(text)) {
    return excelSerialDateToIso(Number(text))
  }

  return text
}

function excelSerialDateToIso(serial) {
  const millis = Math.round((serial - 25569) * 86400 * 1000)
  const date = new Date(millis)

  if (Number.isNaN(date.getTime())) {
    return String(serial)
  }

  return date.toISOString().slice(0, 10)
}

function rejectForbiddenColumn(tableName, header) {
  const normalized = header.toLowerCase().replace(/[\s_-]/g, '')

  if (derivedFieldNames.has(normalized)) {
    throw new Error(`${tableName}.${header}: generated or Strapi envelope field is not allowed`)
  }
}

function buildLegacyTablesFromSimplifiedTables(simplifiedTables) {
  const productIds = new Set()

  for (const row of simplifiedTables.products) {
    const productId = requireValue(row, 'product_id', 'products')

    if (productIds.has(productId)) {
      throw new Error(`products:${productId}.product_id is duplicated`)
    }

    productIds.add(productId)
  }

  const productSpecsByProductId = groupSimplifiedSpecsByProduct(simplifiedTables.productSpecs, productIds)
  const productAssets = splitSimplifiedProductAssets(simplifiedTables.productAssets, productIds)
  const legacyTables = {
    mode: 'simplified',
    categories: simplifiedTables.categories,
    products: simplifiedTables.products,
    measurements: [],
    outputs: [],
    connections: [],
    environmentalLimits: [],
    valveProfiles: [],
    specifications: [],
    variants: [],
    documents: productAssets.documents,
    assets: productAssets.assets,
    commercialTerms: [],
  }

  for (const row of simplifiedTables.productSpecs) {
    legacyTables.specifications.push(toSimplifiedSpecificationRow(row))
  }

  for (const productRow of simplifiedTables.products) {
    const productId = requireValue(productRow, 'product_id', 'products')
    const family = optionalValue(productRow, 'family') || 'sensor'
    const specRows = productSpecsByProductId.get(productId) ?? []

    if (family !== 'sensor' && family !== 'valve') {
      throw new Error(`products:${productId}.family must be sensor or valve`)
    }

    validateSimplifiedFamilySpecs(productId, family, specRows)

    if (family === 'sensor') {
      legacyTables.measurements.push(toSimplifiedMeasurementRow(productRow, specRows))
      legacyTables.outputs.push(toSimplifiedOutputRow(productId, specRows))
      legacyTables.connections.push(toSimplifiedConnectionRow(productId, specRows))
      legacyTables.environmentalLimits.push(toSimplifiedEnvironmentalLimitsRow(productId, specRows))
    } else {
      legacyTables.valveProfiles.push(toSimplifiedValveProfileRow(productId, specRows))
    }
  }

  return legacyTables
}

function groupSimplifiedSpecsByProduct(rows, productIds) {
  const rowsByProductId = new Map()

  rows.forEach((row, index) => {
    const rowLabel = `product_specs row ${index + 2}`
    const productId = requireValue(row, 'product_id', rowLabel)

    if (!productIds.has(productId)) {
      throw new Error(`product_specs:${productId}.product_id does not match any products product_id`)
    }

    const specKey = requireValue(row, 'spec_key', `product_specs:${productId}`)
    validateSimplifiedSpecKey(productId, specKey)
    requireValue(row, 'value', `product_specs:${productId}.${specKey}`)

    const productRows = rowsByProductId.get(productId) ?? []
    productRows.push(row)
    rowsByProductId.set(productId, productRows)
  })

  return rowsByProductId
}

function validateSimplifiedSpecKey(productId, specKey) {
  if (!simplifiedSpecKeys.has(specKey)) {
    throw new Error(`product_specs:${productId}.spec_key '${specKey}' is not supported`)
  }
}

function validateSimplifiedFamilySpecs(productId, family, specRows) {
  if (!specRows.length) {
    throw new Error(`product_specs:${productId}: family ${family} is missing required product_specs rows`)
  }

  const specKeys = new Set(specRows.map((row) => requireValue(row, 'spec_key', `product_specs:${productId}`)))
  const requiredOptions = family === 'sensor' ? sensorRequiredSpecKeyOptions : valveRequiredSpecKeyOptions
  const missing = requiredOptions
    .filter((options) => !options.some((key) => specKeys.has(key)))
    .map((options) => options.join(' or '))

  if (missing.length) {
    throw new Error(`product_specs:${productId}: family ${family} is missing required spec_key(s): ${missing.join(', ')}`)
  }
}

function toSimplifiedSpecificationRow(row) {
  const productId = requireValue(row, 'product_id', 'product_specs')
  const rawSpecKey = requireValue(row, 'spec_key', `product_specs:${productId}`)
  const internalSpecKey = simplifiedValveSpecAliases.get(rawSpecKey) ?? rawSpecKey
  const value = requireValue(row, 'value', `product_specs:${productId}.${rawSpecKey}`)
  const groupKey = optionalValue(row, 'group_key') || defaultGroupKeyForSpecKey(rawSpecKey)

  return {
    product_id: productId,
    group_key: groupKey,
    group_label: optionalValue(row, 'group_label') || defaultGroupLabel(groupKey),
    spec_key: internalSpecKey,
    spec_label: optionalValue(row, 'spec_label') || simplifiedSpecLabels[rawSpecKey] || simplifiedSpecLabels[internalSpecKey] || rawSpecKey,
    value,
    value_type: optionalValue(row, 'value_type') || (rawSpecKey === 'overload_limit' ? 'number' : undefined),
    unit: optionalValue(row, 'unit'),
    display: optionalValue(row, 'display') || value,
    source_ref_ids: optionalValue(row, 'source_ref_ids'),
    source_ref_labels: optionalValue(row, 'source_ref_labels'),
    source_ref_pages: optionalValue(row, 'source_ref_pages'),
    source_ref_confidences: optionalValue(row, 'source_ref_confidences'),
  }
}

function defaultGroupKeyForSpecKey(specKey) {
  if (['measurement_range', 'range', 'accuracy', 'overload_limit'].includes(specKey)) {
    return 'measurement'
  }

  if (['output_signal', 'output', 'supply_voltage'].includes(specKey)) {
    return 'electrical'
  }

  if (['process_connection', 'electrical_connection', 'pressure_rating', 'size', 'connection', 'material', 'mode'].includes(specKey)) {
    return 'mechanical'
  }

  if (['ingress_protection', 'compatible_media', 'wetted_materials', 'media_temperature', 'ambient_temperature'].includes(specKey)) {
    return 'environmental'
  }

  return 'general'
}

function defaultGroupLabel(groupKey) {
  return groupKey
    .split('_')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')
}

function toSimplifiedMeasurementRow(productRow, specRows) {
  const productId = requireValue(productRow, 'product_id', 'products')
  const range = parseQuantityRangeFromSpec(
    requireSimplifiedSpecRow(productId, specRows, ['measurement_range', 'range']),
    `product_specs:${productId}.measurement_range`,
  )
  const overloadLimit = parseQuantityValueFromSpec(
    requireSimplifiedSpecRow(productId, specRows, ['overload_limit']),
    `product_specs:${productId}.overload_limit`,
  )

  return {
    product_id: productId,
    kind: firstListValue(optionalValue(productRow, 'measurement_kinds')) || 'pressure',
    range_min: String(range.min),
    range_max: String(range.max),
    range_unit: range.unit,
    range_display: range.display,
    accuracy: specDisplay(requireSimplifiedSpecRow(productId, specRows, ['accuracy'])),
    overload_value: String(overloadLimit.value),
    overload_unit: overloadLimit.unit,
    overload_display: overloadLimit.display,
  }
}

function toSimplifiedOutputRow(productId, specRows) {
  const outputRow = requireSimplifiedSpecRow(productId, specRows, ['output_signal', 'output'])
  const supplyVoltage = specDisplay(requireSimplifiedSpecRow(productId, specRows, ['supply_voltage']))
  const value = specDisplay(outputRow)

  return {
    product_id: productId,
    kind: inferSignalOutputKind(value),
    value,
    wiring: `Supply voltage: ${supplyVoltage}`,
  }
}

function toSimplifiedConnectionRow(productId, specRows) {
  const processValue = specDisplay(requireSimplifiedSpecRow(productId, specRows, ['process_connection']))
  const electricalValue = specDisplay(requireSimplifiedSpecRow(productId, specRows, ['electrical_connection']))
  const wettedMaterials = specDisplay(requireSimplifiedSpecRow(productId, specRows, ['wetted_materials']))

  return {
    product_id: productId,
    process_kind: inferProcessConnectionKind(processValue),
    process_value: processValue,
    process_material: firstListValue(wettedMaterials),
    electrical_kind: inferElectricalConnectionKind(electricalValue),
    electrical_value: electricalValue,
  }
}

function toSimplifiedEnvironmentalLimitsRow(productId, specRows) {
  const mediaTemperature = parseQuantityRangeFromSpec(
    requireSimplifiedSpecRow(productId, specRows, ['media_temperature']),
    `product_specs:${productId}.media_temperature`,
  )
  const ambientTemperature = parseQuantityRangeFromSpec(
    requireSimplifiedSpecRow(productId, specRows, ['ambient_temperature']),
    `product_specs:${productId}.ambient_temperature`,
  )

  return {
    product_id: productId,
    ingress_protection: specDisplay(requireSimplifiedSpecRow(productId, specRows, ['ingress_protection'])),
    media_temp_min: String(mediaTemperature.min),
    media_temp_max: String(mediaTemperature.max),
    media_temp_unit: mediaTemperature.unit,
    media_temp_display: mediaTemperature.display,
    ambient_temp_min: String(ambientTemperature.min),
    ambient_temp_max: String(ambientTemperature.max),
    ambient_temp_unit: ambientTemperature.unit,
    ambient_temp_display: ambientTemperature.display,
    wetted_materials: toSemicolonList(specDisplay(requireSimplifiedSpecRow(productId, specRows, ['wetted_materials']))),
    compatible_media: toSemicolonList(specDisplay(requireSimplifiedSpecRow(productId, specRows, ['compatible_media']))),
  }
}

function toSimplifiedValveProfileRow(productId, specRows) {
  const material = specDisplay(requireSimplifiedSpecRow(productId, specRows, ['material', 'wetted_materials']))

  return {
    product_id: productId,
    pressure_rating: specDisplay(requireSimplifiedSpecRow(productId, specRows, ['pressure_rating'])),
    connection: specDisplay(requireSimplifiedSpecRow(productId, specRows, ['connection', 'process_connection'])),
    material: firstListValue(material),
    mode: specDisplay(requireSimplifiedSpecRow(productId, specRows, ['mode'])),
    compatible_media: toSemicolonList(specDisplay(requireSimplifiedSpecRow(productId, specRows, ['compatible_media']))),
    size: specDisplay(requireSimplifiedSpecRow(productId, specRows, ['size'])),
  }
}

function requireSimplifiedSpecRow(productId, rows, specKeys) {
  const row = rows.find((item) => specKeys.includes(optionalValue(item, 'spec_key')))

  if (!row) {
    throw new Error(`product_specs:${productId}: family spec extraction is missing spec_key ${specKeys.join(' or ')}`)
  }

  return row
}

function splitSimplifiedProductAssets(rows, productIds) {
  const documents = []
  const assets = []

  rows.forEach((row, index) => {
    const rowLabel = `product_assets row ${index + 2}`
    const productId = requireValue(row, 'product_id', rowLabel)

    if (!productIds.has(productId)) {
      throw new Error(`product_assets:${productId}.product_id does not match any products product_id`)
    }

    const rawAssetType = requireValue(row, 'asset_type', `product_assets:${productId}`)
    const assetType = rawAssetType.trim().toLowerCase().replace(/-/g, '_')
    const assetId = requireValue(row, 'asset_id', `product_assets:${productId}.${rawAssetType}`)
    const href = requireValue(row, 'href', `product_assets:${productId}.${rawAssetType}`)

    if (simplifiedAssetKinds.has(assetType)) {
      if (!assetId.startsWith('asset_')) {
        throw new Error(`product_assets:${productId}.asset_id '${assetId}' must start with asset_ for asset_type '${rawAssetType}'`)
      }

      assets.push({
        product_id: productId,
        asset_id: assetId,
        kind: simplifiedAssetKinds.get(assetType),
        href,
        alt: optionalValue(row, 'alt') || optionalValue(row, 'title') || assetId,
      })
      return
    }

    if (simplifiedDocumentKinds.has(assetType)) {
      if (!assetId.startsWith('doc_')) {
        throw new Error(`product_assets:${productId}.asset_id '${assetId}' must start with doc_ for asset_type '${rawAssetType}'`)
      }

      documents.push({
        product_id: productId,
        document_id: assetId,
        title: optionalValue(row, 'title') || assetId,
        kind: assetType,
        href,
        content_locale: optionalValue(row, 'content_locale') || optionalValue(row, 'contentLocale') || optionalValue(row, 'locale'),
        revision: optionalValue(row, 'revision'),
      })
      return
    }

    throw new Error(`product_assets:${productId}.asset_type '${rawAssetType}' is not supported`)
  })

  return { documents, assets }
}

function buildCmsFacts(tables) {
  return {
    categoryFacts: tables.categories.map(toCategoryFact).sort(compareById),
    productFacts: tables.products.map((row) => toProductFact(row, tables)).sort(compareById),
  }
}

function toCategoryFact(row) {
  const id = requireValue(row, 'category_id', 'categories')

  return {
    id,
    parentId: optionalValue(row, 'parent_category_id') || null,
    name: localizedText(row, 'name', `category ${id}.name`),
  }
}

function toProductFact(row, tables) {
  const id = requireValue(row, 'product_id', 'products')
  const family = optionalValue(row, 'family') || 'sensor'
  const measurements = rowsForProduct(tables.measurements, id).map(toMeasurement)
  const outputs = rowsForProduct(tables.outputs, id).map(toOutput)
  const connections = rowsForProduct(tables.connections, id).map(toConnection)
  const environmentalLimits = rowsForProduct(tables.environmentalLimits, id).map(toEnvironmentalLimits)
  const valveProfiles = rowsForProduct(tables.valveProfiles, id).map(toValveProfile)
  const documents = rowsForProduct(tables.documents, id).map(toDocument).sort(compareById)
  const assets = rowsForProduct(tables.assets, id).map(toAsset).sort(compareById)
  const specificationGroups = toSpecificationGroups(rowsForProduct(tables.specifications, id))
  const core = {
    family,
    sku: requireValue(row, 'sku', `products:${id}`),
    model: requireValue(row, 'model', `products:${id}`),
    brand: requireValue(row, 'brand', `products:${id}`),
    primaryCategory: requireValue(row, 'primary_category_id', `products:${id}`),
    name: localizedText(row, 'name', `products:${id}.name`),
    shortName: localizedText(row, 'short_name', `products:${id}.shortName`),
    summary: localizedText(row, 'summary', `products:${id}.summary`),
  }

  return optionalObject({
    id,
    family,
    core,
    sku: core.sku,
    model: core.model,
    seriesId: optionalValue(row, 'series_id'),
    brand: core.brand,
    manufacturer: optionalValue(row, 'manufacturer'),
    availability: requireValue(row, 'availability', `products:${id}`),
    releasedAt: optionalValue(row, 'released_at'),
    revisedAt: requireValue(row, 'revised_at', `products:${id}`),
    primaryCategoryId: core.primaryCategory,
    additionalCategoryIds: splitList(optionalValue(row, 'additional_category_ids')),
    industryIds: splitList(optionalValue(row, 'industry_ids')),
    applicationIds: splitList(optionalValue(row, 'application_ids')),
    measurementKinds: readMeasurementKinds(row, measurements),
    name: core.name,
    shortName: core.shortName,
    summary: core.summary,
    highlights: localizedList(row, 'highlights'),
    applications: localizedList(row, 'applications'),
    measurements: measurements.length ? measurements : undefined,
    outputs: outputs.length ? outputs : undefined,
    connections: firstOptional(connections),
    environmentalLimits: firstOptional(environmentalLimits),
    valveProfile: firstOptional(valveProfiles),
    specificationGroups,
    variants: [],
    certifications: splitList(optionalValue(row, 'certifications')),
    documents,
    assets,
  })
}

function toMeasurement(row) {
  return optionalObject({
    kind: requireValue(row, 'kind', 'measurements'),
    range: {
      min: requireNumber(row, 'range_min', 'measurements'),
      max: requireNumber(row, 'range_max', 'measurements'),
      unit: requireValue(row, 'range_unit', 'measurements'),
      display: requireValue(row, 'range_display', 'measurements'),
    },
    accuracy: optionalValue(row, 'accuracy'),
    overloadLimit: {
      value: requireNumber(row, 'overload_value', 'measurements'),
      unit: requireValue(row, 'overload_unit', 'measurements'),
      display: requireValue(row, 'overload_display', 'measurements'),
    },
  })
}

function toOutput(row) {
  return optionalObject({
    kind: requireValue(row, 'kind', 'outputs'),
    value: requireValue(row, 'value', 'outputs'),
    protocol: optionalValue(row, 'protocol'),
    wiring: optionalValue(row, 'wiring'),
  })
}

function toConnection(row) {
  return optionalObject({
    process: optionalObject({
      kind: requireValue(row, 'process_kind', 'connections'),
      value: requireValue(row, 'process_value', 'connections'),
      material: optionalValue(row, 'process_material'),
    }),
    electrical: optionalObject({
      kind: requireValue(row, 'electrical_kind', 'connections'),
      value: requireValue(row, 'electrical_value', 'connections'),
    }),
  })
}

function toEnvironmentalLimits(row) {
  return optionalObject({
    ingressProtection: optionalValue(row, 'ingress_protection'),
    mediaTemperature: quantityRangeFromColumns(row, 'media_temp'),
    ambientTemperature: quantityRangeFromColumns(row, 'ambient_temp'),
    wettedMaterials: splitList(optionalValue(row, 'wetted_materials')),
    compatibleMedia: splitList(optionalValue(row, 'compatible_media')),
  })
}

function toValveProfile(row) {
  return {
    pressureRating: requireValue(row, 'pressure_rating', 'valve_profiles'),
    connection: requireValue(row, 'connection', 'valve_profiles'),
    material: requireValue(row, 'material', 'valve_profiles'),
    mode: requireValue(row, 'mode', 'valve_profiles'),
    compatibleMedia: splitList(requireValue(row, 'compatible_media', 'valve_profiles')),
    size: requireValue(row, 'size', 'valve_profiles'),
  }
}

function toSpecificationGroups(rows) {
  const groupMap = new Map()

  for (const row of rows) {
    const productId = optionalValue(row, 'product_id') || 'unknown-product'
    const groupKey = requireValue(row, 'group_key', `specifications:${productId}`)
    const groupLabel = requireValue(row, 'group_label', `specifications:${productId}`)
    const specKey = requireValue(row, 'spec_key', `specifications:${productId}`)
    const rawValue = requireValue(row, 'value', `specifications:${productId}.${specKey}`)
    const group = groupMap.get(groupKey) ?? {
      key: groupKey,
      label: groupLabel,
      values: [],
    }

    group.values.push(optionalObject({
      key: specKey,
      label: requireValue(row, 'spec_label', `specifications:${productId}.${specKey}`),
      value: parseScalar(rawValue, optionalValue(row, 'value_type'), `specifications:${productId}.${specKey}.value`),
      unit: optionalValue(row, 'unit'),
      display: optionalValue(row, 'display') || rawValue,
      sourceRefs: toSourceRefs(row),
    }))
    groupMap.set(groupKey, group)
  }

  return [...groupMap.values()]
}

function toSourceRefs(row) {
  const ids = splitList(optionalValue(row, 'source_ref_ids'))
  const labels = splitList(optionalValue(row, 'source_ref_labels'))
  const pages = splitList(optionalValue(row, 'source_ref_pages'))
  const confidences = splitList(optionalValue(row, 'source_ref_confidences'))

  return ids.map((id, index) => optionalObject({
    id,
    label: labels[index] || id,
    page: pages[index] ? Number(pages[index]) : undefined,
    confidence: confidences[index] || 'source-backed',
  }))
}

function toDocument(row) {
  return optionalObject({
    id: requireValue(row, 'document_id', 'documents'),
    title: requireValue(row, 'title', 'documents'),
    kind: requireValue(row, 'kind', 'documents'),
    href: requireValue(row, 'href', 'documents'),
    contentLocale: optionalValue(row, 'content_locale') || optionalValue(row, 'contentLocale') || optionalValue(row, 'locale'),
    revision: optionalValue(row, 'revision'),
  })
}

function toAsset(row) {
  return optionalObject({
    id: requireValue(row, 'asset_id', 'assets'),
    kind: requireValue(row, 'kind', 'assets'),
    href: requireValue(row, 'href', 'assets'),
    alt: requireValue(row, 'alt', 'assets'),
  })
}

function localizedText(row, prefix, pathLabel) {
  return optionalObject({
    en: requireValue(row, `${prefix}_en`, pathLabel),
    zh: requireValue(row, `${prefix}_zh`, pathLabel),
    ru: optionalValue(row, `${prefix}_ru`),
    es: optionalValue(row, `${prefix}_es`),
  })
}

function localizedList(row, prefix) {
  const en = splitList(optionalValue(row, `${prefix}_en`))
  const zh = splitList(optionalValue(row, `${prefix}_zh`))
  const ru = splitList(optionalValue(row, `${prefix}_ru`))
  const es = splitList(optionalValue(row, `${prefix}_es`))

  if (!en.length && !zh.length) {
    return []
  }

  if (zh.length && zh.length !== en.length) {
    throw new Error(`${prefix}: en/zh list item counts must match`)
  }

  return en.map((text, index) => optionalObject({
    en: text,
    zh: zh[index] || text,
    ru: ru[index],
    es: es[index],
  }))
}

function quantityRangeFromColumns(row, prefix) {
  if (!hasAny(row, [`${prefix}_min`, `${prefix}_max`, `${prefix}_unit`, `${prefix}_display`])) {
    return undefined
  }

  return {
    min: requireNumber(row, `${prefix}_min`, prefix),
    max: requireNumber(row, `${prefix}_max`, prefix),
    unit: requireValue(row, `${prefix}_unit`, prefix),
    display: requireValue(row, `${prefix}_display`, prefix),
  }
}

function rowsForProduct(rows, productId) {
  return rows.filter((row) => optionalValue(row, 'product_id') === productId)
}

function readMeasurementKinds(row, measurements) {
  const authoredKinds = splitList(optionalValue(row, 'measurement_kinds'))

  if (authoredKinds.length) {
    return authoredKinds
  }

  return [...new Set(measurements.map((measurement) => measurement.kind))]
}

function hasAny(row, columns) {
  return columns.some((column) => Boolean(optionalValue(row, column)))
}

function parseQuantityRangeFromSpec(row, pathLabel) {
  const value = requireValue(row, 'value', pathLabel)
  const display = optionalValue(row, 'display') || value
  const match = value.match(/^\s*(-?\d+(?:\.\d+)?)\s*(?:\.{2,3}|to|~|-)\s*(-?\d+(?:\.\d+)?)\s*([a-zA-Z0-9_%/]+)?\s*$/i)

  if (!match) {
    throw new Error(`${pathLabel}.value: expected a numeric range such as 0...10 bar`)
  }

  return {
    min: Number(match[1]),
    max: Number(match[2]),
    unit: normalizeUnit(optionalValue(row, 'unit') || match[3], `${pathLabel}.unit`),
    display,
  }
}

function parseQuantityValueFromSpec(row, pathLabel) {
  const value = requireValue(row, 'value', pathLabel)
  const display = optionalValue(row, 'display') || value
  const match = value.match(/^\s*(-?\d+(?:\.\d+)?)\s*([a-zA-Z0-9_%/]+)?\s*$/)

  if (!match) {
    throw new Error(`${pathLabel}.value: expected a numeric value such as 20 bar`)
  }

  return {
    value: Number(match[1]),
    unit: normalizeUnit(optionalValue(row, 'unit') || match[2], `${pathLabel}.unit`),
    display,
  }
}

function normalizeUnit(value, pathLabel) {
  if (!value) {
    throw new Error(`${pathLabel}: unit is required`)
  }

  const normalized = value.trim().toLowerCase().replace(/\s+/g, '')
  const unitMap = new Map([
    ['%', 'percent'],
    ['percent', 'percent'],
    ['pa', 'pa'],
    ['kpa', 'kpa'],
    ['mpa', 'mpa'],
    ['bar', 'bar'],
    ['mbar', 'mbar'],
    ['psi', 'psi'],
    ['mh2o', 'mh2o'],
    ['mm', 'mm'],
    ['m', 'm'],
    ['c', 'c'],
    ['degc', 'c'],
    ['celsius', 'c'],
    ['f', 'f'],
    ['degf', 'f'],
    ['k', 'k'],
    ['ma', 'ma'],
    ['v', 'v'],
    ['mv', 'mv'],
    ['hz', 'hz'],
    ['ph', 'ph'],
    ['us/cm', 'us_cm'],
    ['us_cm', 'us_cm'],
    ['cycle', 'cycle'],
    ['custom', 'custom'],
  ])
  const mapped = unitMap.get(normalized)

  if (!mapped) {
    throw new Error(`${pathLabel}: unsupported unit '${value}'`)
  }

  return mapped
}

function inferSignalOutputKind(value) {
  const normalized = value.toLowerCase()

  if (normalized.includes('ma')) {
    return 'analog-current'
  }

  if (normalized.includes('0-10 v') || normalized.includes('v')) {
    return 'analog-voltage'
  }

  if (normalized.includes('relay')) {
    return 'relay'
  }

  if (normalized.includes('pulse')) {
    return 'pulse'
  }

  if (normalized.includes('wireless')) {
    return 'wireless'
  }

  if (['hart', 'modbus', 'rs485', 'io-link', 'fieldbus'].some((token) => normalized.includes(token))) {
    return 'fieldbus'
  }

  return 'switch'
}

function inferProcessConnectionKind(value) {
  const normalized = value.toLowerCase()

  if (normalized.includes('flange')) {
    return 'flange'
  }

  if (normalized.includes('clamp')) {
    return 'clamp'
  }

  if (normalized.includes('submersible')) {
    return 'submersible-cable'
  }

  if (normalized.includes('probe')) {
    return 'probe'
  }

  if (normalized.includes('remote')) {
    return 'remote'
  }

  if (normalized === 'none' || normalized.includes('none')) {
    return 'none'
  }

  return 'thread'
}

function inferElectricalConnectionKind(value) {
  const normalized = value.toLowerCase()

  if (normalized.includes('m12')) {
    return 'm12'
  }

  if (normalized.includes('din')) {
    return 'din43650'
  }

  if (normalized.includes('terminal')) {
    return 'terminal-head'
  }

  if (normalized.includes('cable')) {
    return 'cable'
  }

  if (normalized.includes('wireless')) {
    return 'wireless'
  }

  if (normalized.includes('custom')) {
    return 'custom'
  }

  return 'connector'
}

function specDisplay(row) {
  return optionalValue(row, 'display') || requireValue(row, 'value', 'product_specs')
}

function toSemicolonList(value) {
  return value
    .split(/[;|,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .join(';')
}

function firstListValue(value) {
  return splitList(value)[0] || toSemicolonList(value || '').split(';').filter(Boolean)[0]
}

function requireValue(row, column, pathLabel) {
  const value = optionalValue(row, column)

  if (!value) {
    throw new Error(`${pathLabel}.${column}: required value is missing`)
  }

  return value
}

function optionalValue(row, column) {
  return typeof row[column] === 'string' && row[column].trim() ? row[column].trim() : undefined
}

function requireNumber(row, column, pathLabel) {
  const value = optionalValue(row, column)
  const parsed = Number(value)

  if (!value || Number.isNaN(parsed)) {
    throw new Error(`${pathLabel}.${column}: expected a number`)
  }

  return parsed
}

function parseScalar(value, explicitType, pathLabel = 'specifications.value') {
  if (explicitType === 'number') {
    const parsed = Number(value)

    if (Number.isNaN(parsed)) {
      throw new Error(`${pathLabel} '${value}' expected number`)
    }

    return parsed
  }

  if (explicitType === 'boolean') {
    const normalized = value.toLowerCase()

    if (['true', '1', 'yes', 'y'].includes(normalized)) {
      return true
    }

    if (['false', '0', 'no', 'n'].includes(normalized)) {
      return false
    }

    throw new Error(`${pathLabel} '${value}' expected boolean`)
  }

  return value
}

function splitList(value) {
  if (!value) {
    return []
  }

  return value
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
}

function optionalObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined))
}

function firstOptional(items) {
  return items.length ? items[0] : undefined
}

function compareById(left, right) {
  return String(left.id).localeCompare(String(right.id), 'en')
}

function readXmlAttributes(tag) {
  const attrs = {}

  for (const match of tag.matchAll(/([A-Za-z0-9_:-]+)="([^"]*)"/g)) {
    attrs[match[1]] = decodeXml(match[2])
  }

  return attrs
}

function columnNameToIndex(columnName) {
  return columnName
    .toUpperCase()
    .split('')
    .reduce((index, char) => index * 26 + char.charCodeAt(0) - 64, 0) - 1
}

function trimTrailingEmpty(values) {
  return values.slice(0, lastNonBlankIndex(values) + 1).map((value) => String(value || '').trim())
}

function lastNonBlankIndex(values) {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (String(values[index] || '').trim()) {
      return index
    }
  }

  return -1
}

function decodeXml(value) {
  return String(value)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_match, code) => String.fromCharCode(parseInt(code, 16)))
}
