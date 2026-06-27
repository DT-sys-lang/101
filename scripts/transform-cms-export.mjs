import { readFile, writeFile } from 'node:fs/promises'
import { normalizeCmsFactInput } from '../adapter/product.adapter.ts'

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
])

const input = await readCmsExportInput()
const facts = transformCmsExportToFacts(input)
const normalizedFacts = normalizeCmsFactInput(facts)
const outputPath = readFlagValue('--out')
const serializedFacts = `${JSON.stringify(normalizedFacts, null, 2)}\n`

if (outputPath) {
  await writeFile(outputPath, serializedFacts)
  console.error(JSON.stringify({
    ok: true,
    outputPath,
    categoryFacts: normalizedFacts.categoryFacts.length,
    productFacts: normalizedFacts.productFacts.length,
  }, null, 2))
} else {
  process.stdout.write(serializedFacts)
}

export function transformCmsExportToFacts(value) {
  assertObject(value, 'cmsExport')
  const root = unwrapEntity(value, 'cmsExport')
  const categorySource = pickFirstDefined(root, ['categoryFacts', 'categories', 'category_facts'])
  const productSource = pickFirstDefined(root, ['productFacts', 'products', 'product_facts'])

  if (categorySource === undefined) {
    throw new Error('cmsExport.categoryFacts: missing category facts collection')
  }

  if (productSource === undefined) {
    throw new Error('cmsExport.productFacts: missing product facts collection')
  }

  return {
    categoryFacts: unwrapCollection(categorySource, 'cmsExport.categoryFacts').map((item, index) => sanitizeFact(item, `cmsExport.categoryFacts[${index}]`)),
    productFacts: unwrapCollection(productSource, 'cmsExport.productFacts').map((item, index) => sanitizeFact(item, `cmsExport.productFacts[${index}]`)),
  }
}

async function readCmsExportInput() {
  const filePath = readFlagValue('--file')

  if (filePath) {
    return JSON.parse(await readFile(filePath, 'utf8'))
  }

  if (process.env.CMS_EXPORT_JSON?.trim()) {
    return JSON.parse(process.env.CMS_EXPORT_JSON)
  }

  if (process.env.CMS_FACTS_JSON?.trim()) {
    return JSON.parse(process.env.CMS_FACTS_JSON)
  }

  const stdin = await readStdin()

  if (stdin.trim()) {
    return JSON.parse(stdin)
  }

  throw new Error('cmsExport: provide --file, stdin, CMS_EXPORT_JSON, or CMS_FACTS_JSON')
}

function unwrapCollection(value, path) {
  if (Array.isArray(value)) {
    return value.map((item, index) => unwrapEntity(item, `${path}[${index}]`))
  }

  if (isPlainObject(value) && Array.isArray(value.data)) {
    return value.data.map((item, index) => unwrapEntity(item, `${path}.data[${index}]`))
  }

  throw new Error(`${path}: expected an array or a Strapi collection object with data[]`)
}

function unwrapEntity(value, path) {
  assertObject(value, path)

  if (isPlainObject(value.data) && !Array.isArray(value.data)) {
    return unwrapEntity(value.data, `${path}.data`)
  }

  if (isPlainObject(value.attributes)) {
    const attributes = unwrapNestedValues(value.attributes, `${path}.attributes`)
    const externalId = typeof value.id === 'string' && !attributes.id ? { id: value.id } : {}
    return { ...externalId, ...attributes }
  }

  return unwrapNestedValues(value, path)
}

function unwrapNestedValues(value, path) {
  if (Array.isArray(value)) {
    return value.map((item, index) => unwrapNestedValues(item, `${path}[${index}]`))
  }

  if (!isPlainObject(value)) {
    return value
  }

  if (isPlainObject(value.data) && Object.keys(value).every((key) => key === 'data' || key === 'meta')) {
    if (Array.isArray(value.data)) {
      return value.data.map((item, index) => unwrapEntity(item, `${path}.data[${index}]`))
    }

    if (isPlainObject(value.data)) {
      return unwrapEntity(value.data, `${path}.data`)
    }
  }

  if (isPlainObject(value.attributes)) {
    return unwrapEntity(value, path)
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== 'meta')
      .map(([key, nestedValue]) => [key, unwrapNestedValues(nestedValue, `${path}.${key}`)]),
  )
}

function sanitizeFact(value, path) {
  assertObject(value, path)
  rejectDerivedFields(value, path)
  return value
}

function rejectDerivedFields(value, path) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectDerivedFields(item, `${path}[${index}]`))
    return
  }

  if (!isPlainObject(value)) {
    return
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (derivedFieldNames.has(key.toLowerCase())) {
      throw new Error(`${path}.${key}: derived field is not allowed in CMS export`)
    }

    rejectDerivedFields(nestedValue, `${path}.${key}`)
  }
}

function pickFirstDefined(value, keys) {
  for (const key of keys) {
    if (value[key] !== undefined) {
      return value[key]
    }
  }

  return undefined
}

function assertObject(value, path) {
  if (!isPlainObject(value)) {
    throw new Error(`${path}: expected an object`)
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function readFlagValue(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

async function readStdin() {
  if (process.stdin.isTTY) {
    return ''
  }

  let value = ''
  process.stdin.setEncoding('utf8')

  for await (const chunk of process.stdin) {
    value += chunk
  }

  return value
}
