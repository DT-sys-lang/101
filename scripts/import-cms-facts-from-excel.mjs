import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { normalizeCmsFactInput } from '../adapter/product.adapter.ts'
import { defaultSpecificationRegistry } from '../lib/domain/specification.ts'

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

const tableNames = {
  categories: 'categories',
  products: 'products',
  measurements: 'measurements',
  outputs: 'outputs',
  connections: 'connections',
  environmentalLimits: 'environmental_limits',
  valveProfiles: 'valve_profiles',
  specifications: 'specifications',
  variants: 'variants',
  documents: 'documents',
  assets: 'assets',
  commercialTerms: 'commercial_terms',
  productSpecs: 'product_specs',
  productAssets: 'product_assets',
}

const registrySpecKeys = new Set(defaultSpecificationRegistry.definitions.map((definition) => definition.key))
const simplifiedValveSpecAliases = new Map([
  ['pressure_rating', 'feature'],
  ['size', 'feature'],
  ['connection', 'process_connection'],
  ['material', 'wetted_materials'],
  ['mode', 'feature'],
])
const simplifiedSpecKeys = new Set([...registrySpecKeys, ...simplifiedValveSpecAliases.keys()])
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

const args = readArgs(process.argv.slice(2))

if (args.help) {
  printHelp()
  process.exit(0)
}

if (!args.dir) {
  throw new Error('import-cms-facts-from-excel: pass --dir <csv-export-directory>')
}

const inputDir = path.resolve(args.dir)
const outputPath = path.resolve(args.out ?? 'outputs/cms-facts.json')
const tables = await readTables(inputDir)
const cmsFacts = buildCmsFacts(tables)
const normalizedFacts = normalizeCmsFactInput(cmsFacts)

await mkdir(path.dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(normalizedFacts, null, 2)}\n`)

console.log(JSON.stringify({
  ok: true,
  source: tables.mode === 'simplified' ? 'excel-csv-export:simplified' : 'excel-csv-export:legacy',
  mode: tables.mode,
  inputDir,
  outputPath,
  categoryFacts: normalizedFacts.categoryFacts.length,
  productFacts: normalizedFacts.productFacts.length,
}, null, 2))

function readArgs(argv) {
  const parsed = {}

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--help' || arg === '-h') {
      parsed.help = true
      continue
    }

    if (arg === '--dir') {
      parsed.dir = argv[index + 1]
      index += 1
      continue
    }

    if (arg === '--out') {
      parsed.out = argv[index + 1]
      index += 1
      continue
    }

    throw new Error(`import-cms-facts-from-excel: unknown argument '${arg}'`)
  }

  return parsed
}

function printHelp() {
  console.log(`Usage:
  npm run import:cms-facts -- --dir ./path/to/excel-csv-tabs --out outputs/cms-facts.json

Input is a directory of CSV files exported from Excel tabs.

Simplified mode is enabled when product_specs.csv exists. Required files:
  categories.csv
  products.csv
  product_specs.csv

Simplified mode optional files:
  product_assets.csv

Legacy mode is used when product_specs.csv is absent. Required files:
  categories.csv
  products.csv
  specifications.csv

Legacy mode optional files:
  measurements.csv
  outputs.csv
  connections.csv
  environmental_limits.csv
  valve_profiles.csv
  variants.csv
  documents.csv
  assets.csv
  commercial_terms.csv

The script writes direct CmsFactInput JSON and validates it through adapter/validation before saving.`)
}

async function readTables(directory) {
  if (await pathExists(path.join(directory, `${tableNames.productSpecs}.csv`))) {
    return readSimplifiedTables(directory)
  }

  return readLegacyTables(directory)
}

async function readLegacyTables(directory) {
  return {
    mode: 'legacy',
    categories: await readCsvTable(directory, tableNames.categories, true),
    products: await readCsvTable(directory, tableNames.products, true),
    measurements: await readCsvTable(directory, tableNames.measurements, false),
    outputs: await readCsvTable(directory, tableNames.outputs, false),
    connections: await readCsvTable(directory, tableNames.connections, false),
    environmentalLimits: await readCsvTable(directory, tableNames.environmentalLimits, false),
    valveProfiles: await readCsvTable(directory, tableNames.valveProfiles, false),
    specifications: await readCsvTable(directory, tableNames.specifications, true),
    variants: await readCsvTable(directory, tableNames.variants, false),
    documents: await readCsvTable(directory, tableNames.documents, false),
    assets: await readCsvTable(directory, tableNames.assets, false),
    commercialTerms: await readCsvTable(directory, tableNames.commercialTerms, false),
  }
}

async function readSimplifiedTables(directory) {
  const simplifiedTables = {
    categories: await readCsvTable(directory, tableNames.categories, true),
    products: await readCsvTable(directory, tableNames.products, true),
    productSpecs: await readCsvTable(directory, tableNames.productSpecs, true),
    productAssets: await readCsvTable(directory, tableNames.productAssets, false),
  }

  return buildLegacyTablesFromSimplifiedTables(simplifiedTables)
}

async function readCsvTable(directory, tableName, required) {
  const filePath = path.join(directory, `${tableName}.csv`)

  if (!(await pathExists(filePath))) {
    if (required) {
      throw new Error(`${tableName}.csv: required import tab is missing`)
    }

    return []
  }

  const text = await readFile(filePath, 'utf8')
  const rows = parseCsv(text)

  if (!rows.length) {
    return []
  }

  const [rawHeaders, ...rawRows] = rows
  const headers = rawHeaders.map((header) => header.replace(/^\uFEFF/, '').trim())
  const headerSet = new Set()

  for (const header of headers) {
    if (!header) {
      throw new Error(`${tableName}.csv: blank header is not allowed`)
    }

    if (headerSet.has(header)) {
      throw new Error(`${tableName}.csv: duplicate header '${header}'`)
    }

    rejectForbiddenColumn(tableName, header)
    headerSet.add(header)
  }

  return rawRows
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, (row[index] ?? '').trim()])))
    .filter((row) => Object.values(row).some((value) => value !== ''))
}

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]

    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"'
        index += 1
      } else if (char === '"') {
        quoted = false
      } else {
        field += char
      }

      continue
    }

    if (char === '"') {
      quoted = true
      continue
    }

    if (char === ',') {
      row.push(field)
      field = ''
      continue
    }

    if (char === '\n') {
      row.push(field.replace(/\r$/, ''))
      rows.push(row)
      row = []
      field = ''
      continue
    }

    field += char
  }

  row.push(field.replace(/\r$/, ''))
  if (row.some((value) => value !== '')) {
    rows.push(row)
  }

  if (quoted) {
    throw new Error('CSV parser: unterminated quoted field')
  }

  return rows
}

function rejectForbiddenColumn(tableName, header) {
  const normalized = header.toLowerCase().replace(/[\s_-]/g, '')

  // documents.csv owns the snake_case document ID fact; keep Strapi documentId envelope blocked.
  if (tableName === tableNames.documents && header === 'document_id') {
    return
  }

  if (derivedFieldNames.has(normalized)) {
    throw new Error(`${tableName}.csv:${header}: generated or Strapi envelope field is not allowed`)
  }

  if (tableName === tableNames.valveProfiles && (normalized === 'role' || normalized === 'function')) {
    throw new Error(`${tableName}.csv:${header}: valveProfile must not include role/function`)
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
    const rowLabel = `product_specs.csv row ${index + 2}`
    const productId = requireValue(row, 'product_id', rowLabel)

    if (!productIds.has(productId)) {
      throw new Error(`product_specs.csv:${productId}.product_id does not match any products.csv product_id`)
    }

    const specKey = requireValue(row, 'spec_key', `product_specs.csv:${productId}`)
    validateSimplifiedSpecKey(productId, specKey)
    requireValue(row, 'value', `product_specs.csv:${productId}.${specKey}`)

    const productRows = rowsByProductId.get(productId) ?? []
    productRows.push(row)
    rowsByProductId.set(productId, productRows)
  })

  return rowsByProductId
}

function validateSimplifiedSpecKey(productId, specKey) {
  if (!simplifiedSpecKeys.has(specKey)) {
    throw new Error(`product_specs.csv:${productId}.spec_key '${specKey}' is not supported`)
  }
}

function validateSimplifiedFamilySpecs(productId, family, specRows) {
  if (!specRows.length) {
    throw new Error(`product_specs.csv:${productId}: family ${family} is missing required product_specs rows`)
  }

  const specKeys = new Set(specRows.map((row) => requireValue(row, 'spec_key', `product_specs.csv:${productId}`)))
  const requiredOptions = family === 'sensor' ? sensorRequiredSpecKeyOptions : valveRequiredSpecKeyOptions
  const missing = requiredOptions
    .filter((options) => !options.some((key) => specKeys.has(key)))
    .map((options) => options.join(' or '))

  if (missing.length) {
    throw new Error(`product_specs.csv:${productId}: family ${family} is missing required spec_key(s): ${missing.join(', ')}`)
  }
}

function toSimplifiedSpecificationRow(row) {
  const productId = requireValue(row, 'product_id', 'product_specs.csv')
  const rawSpecKey = requireValue(row, 'spec_key', `product_specs.csv:${productId}`)
  const internalSpecKey = resolveInternalSpecKey(rawSpecKey)
  const value = requireValue(row, 'value', `product_specs.csv:${productId}.${rawSpecKey}`)
  const groupKey = optionalValue(row, 'group_key') || defaultGroupKeyForSpecKey(rawSpecKey)

  return {
    product_id: productId,
    group_key: groupKey,
    group_label: optionalValue(row, 'group_label') || defaultGroupLabel(groupKey),
    spec_key: internalSpecKey,
    spec_label: optionalValue(row, 'spec_label') || simplifiedSpecLabels[rawSpecKey] || simplifiedSpecLabels[internalSpecKey] || rawSpecKey,
    value,
    value_type: optionalValue(row, 'value_type') || inferSimplifiedValueType(rawSpecKey),
    unit: optionalValue(row, 'unit'),
    display: optionalValue(row, 'display') || value,
    source_ref_ids: optionalValue(row, 'source_ref_ids'),
    source_ref_labels: optionalValue(row, 'source_ref_labels'),
    source_ref_pages: optionalValue(row, 'source_ref_pages'),
    source_ref_confidences: optionalValue(row, 'source_ref_confidences'),
  }
}

function resolveInternalSpecKey(rawSpecKey) {
  return simplifiedValveSpecAliases.get(rawSpecKey) ?? rawSpecKey
}

function inferSimplifiedValueType(rawSpecKey) {
  return rawSpecKey === 'overload_limit' ? 'number' : undefined
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
    `product_specs.csv:${productId}.measurement_range`,
  )
  const overloadLimit = parseQuantityValueFromSpec(
    requireSimplifiedSpecRow(productId, specRows, ['overload_limit']),
    `product_specs.csv:${productId}.overload_limit`,
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
    `product_specs.csv:${productId}.media_temperature`,
  )
  const ambientTemperature = parseQuantityRangeFromSpec(
    requireSimplifiedSpecRow(productId, specRows, ['ambient_temperature']),
    `product_specs.csv:${productId}.ambient_temperature`,
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
    throw new Error(`product_specs.csv:${productId}: family spec extraction is missing spec_key ${specKeys.join(' or ')}`)
  }

  return row
}

function splitSimplifiedProductAssets(rows, productIds) {
  const documents = []
  const assets = []

  rows.forEach((row, index) => {
    const rowLabel = `product_assets.csv row ${index + 2}`
    const productId = requireValue(row, 'product_id', rowLabel)

    if (!productIds.has(productId)) {
      throw new Error(`product_assets.csv:${productId}.product_id does not match any products.csv product_id`)
    }

    const rawAssetType = requireValue(row, 'asset_type', `product_assets.csv:${productId}`)
    const assetType = normalizeAssetType(rawAssetType)
    const assetId = requireValue(row, 'asset_id', `product_assets.csv:${productId}.${rawAssetType}`)
    const href = requireValue(row, 'href', `product_assets.csv:${productId}.${rawAssetType}`)

    if (simplifiedAssetKinds.has(assetType)) {
      if (!assetId.startsWith('asset_')) {
        throw new Error(`product_assets.csv:${productId}.asset_id '${assetId}' must start with asset_ for asset_type '${rawAssetType}'`)
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
        throw new Error(`product_assets.csv:${productId}.asset_id '${assetId}' must start with doc_ for asset_type '${rawAssetType}'`)
      }

      documents.push({
        product_id: productId,
        document_id: assetId,
        title: optionalValue(row, 'title') || assetId,
        kind: assetType,
        href,
        content_locale: readContentLocale(row, `product_assets.csv:${productId}`),
        revision: optionalValue(row, 'revision'),
      })
      return
    }

    throw new Error(`product_assets.csv:${productId}.asset_type '${rawAssetType}' is not supported`)
  })

  return { documents, assets }
}

function normalizeAssetType(value) {
  return value.trim().toLowerCase().replace(/-/g, '_')
}

function parseQuantityRangeFromSpec(row, pathLabel) {
  const value = requireValue(row, 'value', pathLabel)
  const display = optionalValue(row, 'display') || value
  const match = value.match(/^\s*(-?\d+(?:\.\d+)?)\s*(?:\.{2,3}|to|~|-)\s*(-?\d+(?:\.\d+)?)\s*([a-zA-Z0-9_%/]+)?\s*$/i)

  if (!match) {
    throw new Error(`${pathLabel}.value: expected a numeric range such as 0...10 bar`)
  }

  const min = Number(match[1])
  const max = Number(match[2])

  if (Number.isNaN(min) || Number.isNaN(max)) {
    throw new Error(`${pathLabel}.value: expected numeric range bounds`)
  }

  return {
    min,
    max,
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

  const parsed = Number(match[1])

  if (Number.isNaN(parsed)) {
    throw new Error(`${pathLabel}.value: expected a number`)
  }

  return {
    value: parsed,
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

function buildCmsFacts(tables) {
  const categoryFacts = tables.categories.map(toCategoryFact).sort(compareById)
  const productFacts = tables.products.map((row) => toProductFact(row, tables)).sort(compareById)

  return {
    categoryFacts,
    productFacts,
  }
}

function toCategoryFact(row) {
  const id = requireValue(row, 'category_id', 'categories')
  const parentId = optionalValue(row, 'parent_category_id') || null

  return {
    id,
    parentId,
    name: localizedText(row, 'name', `category ${id}.name`),
  }
}

function toProductFact(row, tables) {
  const id = requireValue(row, 'product_id', 'products')
  const family = optionalValue(row, 'family') || 'sensor'

  if (family !== 'sensor' && family !== 'valve') {
    throw new Error(`products:${id}.family must be sensor or valve`)
  }

  const measurements = rowsForProduct(tables.measurements, id).map(toMeasurement)
  const outputs = rowsForProduct(tables.outputs, id).map(toOutput)
  const connections = rowsForProduct(tables.connections, id).map(toConnection)
  const environmentalLimits = rowsForProduct(tables.environmentalLimits, id).map(toEnvironmentalLimits)
  const valveProfiles = rowsForProduct(tables.valveProfiles, id).map(toValveProfile)
  const documents = rowsForProduct(tables.documents, id).map(toDocument).sort(compareById)
  const assets = rowsForProduct(tables.assets, id).map(toAsset).sort(compareById)
  const commercialTerms = rowsForProduct(tables.commercialTerms, id).map(toCommercialTerms)
  const variants = toVariants(rowsForProduct(tables.variants, id), row)
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
  const sensorProfile = measurements.length || outputs.length
    ? optionalObject({
        measurements,
        outputs,
        connections: firstOptional(connections),
        environmentalLimits: firstOptional(environmentalLimits),
      })
    : undefined
  const valveProfile = firstOptional(valveProfiles)

  return optionalObject({
    id,
    family,
    core,
    sensorProfile,
    valveProfile,
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
    specificationGroups,
    variants,
    certifications: splitList(optionalValue(row, 'certifications')),
    documents,
    assets,
    commercialTerms: firstOptional(commercialTerms),
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
    overloadLimit: hasAny(row, ['overload_value', 'overload_unit', 'overload_display'])
      ? {
          value: requireNumber(row, 'overload_value', 'measurements'),
          unit: requireValue(row, 'overload_unit', 'measurements'),
          display: requireValue(row, 'overload_display', 'measurements'),
        }
      : undefined,
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

function toVariants(rows, productRow) {
  const variantMap = new Map()

  for (const row of rows) {
    const variantId = requireValue(row, 'variant_id', 'variants')
    const variant = variantMap.get(variantId) ?? {
      id: variantId,
      orderCode: requireValue(row, 'order_code', 'variants'),
      optionValues: [],
      availability: optionalValue(row, 'availability') || requireValue(productRow, 'availability', 'products'),
    }

    if (optionalValue(row, 'option_key')) {
      variant.optionValues.push(optionalObject({
        optionKey: requireValue(row, 'option_key', 'variants'),
        label: requireValue(row, 'option_label', 'variants'),
        value: requireValue(row, 'option_value', 'variants'),
        code: optionalValue(row, 'option_code'),
      }))
    }

    variantMap.set(variantId, variant)
  }

  return [...variantMap.values()]
}

function toDocument(row) {
  return optionalObject({
    id: requireValue(row, 'document_id', 'documents'),
    title: requireValue(row, 'title', 'documents'),
    kind: requireValue(row, 'kind', 'documents'),
    href: requireValue(row, 'href', 'documents'),
    contentLocale: readContentLocale(row, 'documents'),
    revision: optionalValue(row, 'revision'),
  })
}

function readContentLocale(row, pathLabel) {
  const contentLocale = optionalValue(row, 'content_locale') ?? optionalValue(row, 'contentLocale')
  const legacyLocale = optionalValue(row, 'locale')

  if (contentLocale && legacyLocale && contentLocale !== legacyLocale) {
    throw new Error(`${pathLabel}: content_locale and legacy locale disagree`)
  }

  return contentLocale ?? legacyLocale
}

function toAsset(row) {
  return optionalObject({
    id: requireValue(row, 'asset_id', 'assets'),
    kind: requireValue(row, 'kind', 'assets'),
    href: requireValue(row, 'href', 'assets'),
    alt: requireValue(row, 'alt', 'assets'),
  })
}

function toCommercialTerms(row) {
  return optionalObject({
    minimumOrderQuantity: optionalNumber(row, 'minimum_order_quantity'),
    standardLeadTime: optionalValue(row, 'standard_lead_time'),
    warranty: optionalValue(row, 'warranty'),
    oemCustomizable: optionalBoolean(row, 'oem_customizable') ?? false,
    privateLabelAvailable: optionalBoolean(row, 'private_label_available') ?? false,
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

function optionalNumber(row, column) {
  const value = optionalValue(row, column)

  if (!value) {
    return undefined
  }

  const parsed = Number(value)

  if (Number.isNaN(parsed)) {
    throw new Error(`${column}: expected a number`)
  }

  return parsed
}

function optionalBoolean(row, column) {
  const value = optionalValue(row, column)?.toLowerCase()

  if (!value) {
    return undefined
  }

  if (['true', '1', 'yes', 'y'].includes(value)) {
    return true
  }

  if (['false', '0', 'no', 'n'].includes(value)) {
    return false
  }

  throw new Error(`${column}: expected boolean true/false`)
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

async function pathExists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}
