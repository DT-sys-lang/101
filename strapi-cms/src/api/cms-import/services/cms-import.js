'use strict'

const path = require('node:path')
const { mkdir, readFile, stat, writeFile } = require('node:fs/promises')
const JSZip = require('jszip')
const { importCmsFactsIntoStrapi } = require('../../../utils/cms-facts-importer')
const { buildCmsFactsFromWorkbookBuffer } = require('../../../utils/cms-facts-workbook-importer')

module.exports = {
  async import(cmsFacts, options = {}) {
    return importCmsFactsIntoStrapi(strapi, cmsFacts, options)
  },

  async importWorkbook(file, options = {}) {
    const buffer = await readUploadedFileBuffer(file)
    const { cmsFacts, workbook } = await readWorkbookFacts(buffer)
    const result = await importCmsFactsIntoStrapi(strapi, cmsFacts, {
      ...options,
      input: file.originalFilename || file.name || 'cms-facts-import.xlsx',
    })

    return {
      ...result,
      source: 'excel-workbook:simplified',
      workbook,
    }
  },

  async importResourceZip(file, options = {}) {
    const buffer = await readUploadedFileBuffer(file)
    return importResourceZip(strapi, buffer, {
      ...options,
      input: file.originalFilename || file.name || 'cms-resource-import.zip',
    })
  },

  async deleteProducts(productIds, options = {}) {
    return deleteImportedProducts(strapi, productIds, options)
  },
}

const productFactUid = 'api::product-fact.product-fact'
const documentAssetUid = 'api::document-asset.document-asset'
const maxResourceFiles = 500
const maxResourceBytes = 250 * 1024 * 1024
const maxSingleResourceBytes = 50 * 1024 * 1024
const supportedImageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'])
const supportedDocumentExtensions = new Set(['.pdf', '.doc', '.docx', '.xls', '.xlsx'])
const mediaKindAliases = [
  ['primary_image', 'primary-image'],
  ['primary', 'primary-image'],
  ['gallery_image', 'gallery-image'],
  ['gallery', 'gallery-image'],
  ['dimension_drawing', 'dimension-drawing'],
  ['dimension', 'dimension-drawing'],
  ['installation_photo', 'installation-photo'],
  ['installation', 'installation-photo'],
  ['diagram', 'diagram'],
]
const documentKindAliases = [
  ['datasheet', 'datasheet'],
  ['data_sheet', 'datasheet'],
  ['manual', 'manual'],
  ['certificate', 'certificate'],
  ['cert', 'certificate'],
  ['drawing', 'drawing'],
  ['catalog', 'catalog'],
  ['software', 'software'],
]

async function readWorkbookFacts(buffer) {
  try {
    return await buildCmsFactsFromWorkbookBuffer(buffer)
  } catch (error) {
    throw httpError(400, `Workbook import failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function readUploadedFileBuffer(file) {
  if (file.buffer) {
    return file.buffer
  }

  const filePath = file.filepath || file.path

  if (!filePath) {
    throw new Error('Uploaded workbook file path is missing.')
  }

  return readFile(filePath)
}

function httpError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

async function importResourceZip(strapiInstance, buffer, options = {}) {
  const dryRun = options.dryRun !== false
  const overwrite = options.overwrite !== false
  const input = options.input || 'cms-resource-import.zip'
  const productIndex = await readProductIndex(strapiInstance)
  const productIds = [...productIndex.keys()]
  const zip = await readResourceZip(buffer)
  const plan = planResourceZip(zip, productIds, strapiInstance)

  if (dryRun) {
    return {
      ok: plan.resources.length > 0,
      input,
      dryRun: true,
      overwrite,
      source: 'resource-zip',
      plan: summarizeResourcePlan(plan),
    }
  }

  if (!plan.resources.length) {
    throw httpError(400, 'No importable product resources were found in the ZIP package.')
  }

  const productRecords = await findProductsByFactIds(strapiInstance, unique(plan.resources.map((resource) => resource.productId)))
  const now = new Date().toISOString()
  const writtenFiles = []
  const skippedFiles = []
  const upsertedDocumentAssets = []
  const relationUpdates = []

  for (const resource of plan.resources) {
    const fileBuffer = await resource.entry.async('nodebuffer')

    if (fileBuffer.length > maxSingleResourceBytes) {
      throw httpError(400, `${resource.entryName} is too large. Maximum single resource size is ${maxSingleResourceBytes} bytes.`)
    }

    const fileWritten = await writeResourceFile(resource, fileBuffer, { overwrite, uploadRootDir: options.uploadRootDir })

    if (fileWritten) {
      writtenFiles.push(resource)
    } else {
      skippedFiles.push(resource)
    }

    const documentAsset = await upsertDocumentAsset(strapiInstance, resource, now)
    upsertedDocumentAssets.push({
      ...documentAsset,
      productId: resource.productId,
      relationField: resource.relationField,
    })
  }

  for (const product of productRecords) {
    const related = upsertedDocumentAssets.filter((asset) => asset.productId === product.factId)
    const documentIds = related.filter((asset) => asset.relationField === 'documents').map((asset) => asset.id)
    const assetIds = related.filter((asset) => asset.relationField === 'assets').map((asset) => asset.id)
    const data = {}

    if (documentIds.length) {
      data.documents = unique([...relationArray(product.documents).map((item) => item.id), ...documentIds])
    }

    if (assetIds.length) {
      data.assets = unique([...relationArray(product.assets).map((item) => item.id), ...assetIds])
    }

    if (Object.keys(data).length) {
      await strapiInstance.entityService.update(productFactUid, product.id, { data })
      relationUpdates.push({
        factId: product.factId,
        documents: documentIds.length,
        assets: assetIds.length,
      })
    }
  }

  return {
    ok: true,
    input,
    dryRun: false,
    overwrite,
    source: 'resource-zip',
    plan: summarizeResourcePlan(plan),
    operations: {
      filesWritten: writtenFiles.length,
      filesSkipped: skippedFiles.length,
      documentAssetsUpserted: upsertedDocumentAssets.length,
      productFactsUpdated: relationUpdates.length,
      relationUpdates,
    },
  }
}

async function readResourceZip(buffer) {
  let zip

  try {
    zip = await JSZip.loadAsync(buffer)
  } catch (error) {
    throw httpError(400, `Resource ZIP could not be read: ${error instanceof Error ? error.message : String(error)}`)
  }

  const entries = Object.values(zip.files).filter((entry) => !entry.dir)

  if (entries.length > maxResourceFiles) {
    throw httpError(400, `Resource ZIP contains too many files. Maximum is ${maxResourceFiles}.`)
  }

  const estimatedBytes = entries.reduce((sum, entry) => sum + Number(entry?._data?.uncompressedSize || 0), 0)

  if (estimatedBytes > maxResourceBytes) {
    throw httpError(400, `Resource ZIP is too large after extraction. Maximum is ${maxResourceBytes} bytes.`)
  }

  return { zip, entries }
}

async function readProductIndex(strapiInstance) {
  const products = ensureArray(await strapiInstance.entityService.findMany(productFactUid, {
    fields: ['id', 'factId', 'sku', 'model'],
    publicationState: 'preview',
    limit: 10000,
  }))

  return new Map(products
    .filter((product) => product.factId)
    .map((product) => [product.factId, product]))
}

function planResourceZip(zip, productIds, strapiInstance) {
  const sortedProductIds = [...productIds].sort((left, right) => right.length - left.length)
  const resources = []
  const unmatchedFiles = []
  const unsupportedFiles = []
  const warnings = []
  let estimatedBytes = 0

  for (const entry of zip.entries) {
    const entryName = entry.unsafeOriginalName || entry.name

    if (isIgnoredZipEntry(entryName)) {
      continue
    }

    if (!isSafeZipEntryName(entryName)) {
      unsupportedFiles.push({ entryName, reason: 'Unsafe ZIP entry path.' })
      continue
    }

    const resource = classifyResourceEntry(entry, sortedProductIds, strapiInstance)

    if (!resource) {
      unmatchedFiles.push({ entryName, reason: 'Filename does not start with an existing product_id.' })
      continue
    }

    if (!resource.supported) {
      unsupportedFiles.push({ entryName, reason: resource.reason })
      continue
    }

    estimatedBytes += resource.estimatedBytes
    if (estimatedBytes > maxResourceBytes) {
      throw httpError(400, `Resource ZIP is too large after extraction. Maximum is ${maxResourceBytes} bytes.`)
    }

    resources.push(resource)
  }

  if (!resources.length) {
    warnings.push('No importable resources were found. Product records must exist before uploading their files.')
  }

  return { resources, unmatchedFiles, unsupportedFiles, warnings }
}

function classifyResourceEntry(entry, productIds, strapiInstance) {
  const entryName = entry.unsafeOriginalName || entry.name
  const filename = safeFilename(path.posix.basename(entry.name))
  const extension = path.extname(filename).toLowerCase()
  const baseName = filename.slice(0, -extension.length).toLowerCase()
  const productId = productIds.find((candidate) => baseName === candidate || baseName.startsWith(`${candidate}_`))

  if (!productId) {
    return undefined
  }

  const remainder = baseName === productId ? '' : baseName.slice(productId.length + 1)
  const fileClass = classifyResourceKind(remainder, extension)

  if (!fileClass) {
    return {
      supported: false,
      entryName,
      reason: `Unsupported file extension or resource type '${extension || 'none'}'.`,
    }
  }

  const idSuffix = normalizeIdSuffix(remainder || fileClass.defaultSuffix)
  const publicFilename = `${fileClass.factPrefix}_${stripProductPrefix(productId)}_${idSuffix}${extension}`
  const publicPath = `/uploads/cms-import/${productId}/${publicFilename}`

  return {
    supported: true,
    entry,
    entryName,
    originalFilename: filename,
    filename: publicFilename,
    extension,
    productId,
    assetClass: fileClass.assetClass,
    assetKind: fileClass.assetKind,
    documentKind: fileClass.documentKind,
    relationField: fileClass.assetClass === 'document' ? 'documents' : 'assets',
    factId: `${fileClass.factPrefix}_${stripProductPrefix(productId)}_${idSuffix}`,
    hrefOverride: absolutePublicUploadUrl(strapiInstance, publicPath),
    publicPath,
    estimatedBytes: Number(entry?._data?.uncompressedSize || 0),
    title: resourceTitle(productId, fileClass.documentKind || fileClass.assetKind, idSuffix),
    alt: resourceAlt(productId, fileClass.assetKind || fileClass.documentKind),
  }
}

function classifyResourceKind(remainder, extension) {
  const normalizedRemainder = normalizeIdSuffix(remainder)

  if (supportedImageExtensions.has(extension)) {
    const kind = matchAlias(normalizedRemainder, mediaKindAliases) || 'primary-image'
    return {
      assetClass: 'media',
      assetKind: kind,
      factPrefix: 'asset',
      defaultSuffix: kind.replace(/-/g, '_'),
    }
  }

  if (supportedDocumentExtensions.has(extension)) {
    const kind = matchAlias(normalizedRemainder, documentKindAliases) || 'datasheet'
    return {
      assetClass: 'document',
      documentKind: kind,
      factPrefix: 'doc',
      defaultSuffix: kind,
    }
  }

  return undefined
}

function matchAlias(value, aliases) {
  for (const [alias, kind] of aliases) {
    if (value === alias || value.startsWith(`${alias}_`) || value.endsWith(`_${alias}`) || value.includes(`_${alias}_`)) {
      return kind
    }
  }

  return undefined
}

async function writeResourceFile(resource, buffer, options = {}) {
  const rootDir = options.uploadRootDir || path.join(process.cwd(), 'public', 'uploads', 'cms-import')
  const productDir = path.join(rootDir, resource.productId)
  const outputPath = path.join(productDir, resource.filename)

  await mkdir(productDir, { recursive: true })

  if (!options.overwrite && await fileExists(outputPath)) {
    return false
  }

  await writeFile(outputPath, buffer)
  return true
}

async function fileExists(filePath) {
  try {
    await stat(filePath)
    return true
  } catch (_error) {
    return false
  }
}

async function upsertDocumentAsset(strapiInstance, resource, now) {
  const data = withoutUndefined({
    factId: resource.factId,
    assetClass: resource.assetClass,
    title: resource.assetClass === 'document' ? resource.title : undefined,
    documentKind: resource.documentKind,
    assetKind: resource.assetKind,
    hrefOverride: resource.hrefOverride,
    alt: resource.assetClass === 'media' ? resource.alt : undefined,
    publishedAt: now,
  })
  const existing = await findOneByFactId(strapiInstance, documentAssetUid, resource.factId)

  if (existing) {
    return strapiInstance.entityService.update(documentAssetUid, existing.id, { data })
  }

  return strapiInstance.entityService.create(documentAssetUid, { data })
}

async function findOneByFactId(strapiInstance, uid, factId) {
  const rows = await strapiInstance.entityService.findMany(uid, {
    filters: { factId: { $eq: factId } },
    publicationState: 'preview',
    limit: 1,
  })

  return ensureArray(rows)[0]
}

function summarizeResourcePlan(plan) {
  return {
    ok: plan.resources.length > 0,
    counts: {
      resources: plan.resources.length,
      products: unique(plan.resources.map((resource) => resource.productId)).length,
      documents: plan.resources.filter((resource) => resource.assetClass === 'document').length,
      mediaAssets: plan.resources.filter((resource) => resource.assetClass === 'media').length,
      unmatchedFiles: plan.unmatchedFiles.length,
      unsupportedFiles: plan.unsupportedFiles.length,
    },
    resources: plan.resources.map((resource) => ({
      productId: resource.productId,
      factId: resource.factId,
      assetClass: resource.assetClass,
      assetKind: resource.assetKind,
      documentKind: resource.documentKind,
      hrefOverride: resource.hrefOverride,
      entryName: resource.entryName,
    })),
    unmatchedFiles: plan.unmatchedFiles,
    unsupportedFiles: plan.unsupportedFiles,
    warnings: plan.warnings,
  }
}

function absolutePublicUploadUrl(strapiInstance, publicPath) {
  const serverUrl = strapiInstance.config && typeof strapiInstance.config.get === 'function'
    ? strapiInstance.config.get('server.url')
    : undefined

  if (typeof serverUrl === 'string' && serverUrl.trim()) {
    return `${serverUrl.replace(/\/+$/, '')}${publicPath}`
  }

  return publicPath
}

function isIgnoredZipEntry(entryName) {
  const normalized = String(entryName || '').replace(/\\/g, '/')
  const basename = path.posix.basename(normalized)

  return normalized.startsWith('__MACOSX/')
    || basename === '.DS_Store'
    || basename.startsWith('._')
}

function isSafeZipEntryName(entryName) {
  const normalized = String(entryName || '').replace(/\\/g, '/')

  return normalized
    && !normalized.startsWith('/')
    && !normalized.split('/').includes('..')
}

function safeFilename(filename) {
  const extension = path.extname(filename).toLowerCase()
  const baseName = filename.slice(0, -extension.length)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')

  return `${baseName}${extension}`
}

function normalizeIdSuffix(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_') || 'primary'
}

function stripProductPrefix(productId) {
  return String(productId).replace(/^prd_/, '')
}

function resourceTitle(productId, kind, suffix) {
  return `${productId} ${String(kind || suffix).replace(/[-_]/g, ' ')}`
}

function resourceAlt(productId, kind) {
  return `${productId} ${String(kind || 'product image').replace(/[-_]/g, ' ')}`
}

async function deleteImportedProducts(strapiInstance, productIds, options = {}) {
  const dryRun = options.dryRun !== false
  const deleteAssets = options.deleteAssets !== false
  const normalizedProductIds = normalizeProductIds(productIds)
  const products = await findProductsByFactIds(strapiInstance, normalizedProductIds)
  const foundProductIds = unique(products.map((product) => product.factId).filter(Boolean))
  const missingProductIds = normalizedProductIds.filter((productId) => !foundProductIds.includes(productId))
  const assetCandidates = deleteAssets ? collectDocumentAssetCandidates(products) : []
  const assetPlan = deleteAssets
    ? await planDocumentAssetDeletion(strapiInstance, assetCandidates, foundProductIds)
    : {
        deleteAssets: false,
        documentAssetsToDelete: [],
        preservedDocumentAssets: assetCandidates,
        warnings: [],
      }
  const plan = {
    requestedProductIds: normalizedProductIds,
    foundProductIds,
    missingProductIds,
    productFactsToDelete: products.map(toDeletionPreview),
    documentAssetsToDelete: assetPlan.documentAssetsToDelete.map(toDeletionPreview),
    preservedDocumentAssets: assetPlan.preservedDocumentAssets.map(toDeletionPreview),
    warnings: assetPlan.warnings,
    preservedCollections: [
      'category-fact',
      'industry-fact',
      'application-fact',
      'certification',
    ],
  }

  if (dryRun) {
    return {
      ok: true,
      dryRun: true,
      deleteAssets,
      plan,
    }
  }

  const deletedProductFacts = await deleteEntities(strapiInstance, productFactUid, products)
  const deletedDocumentAssets = await deleteEntities(strapiInstance, documentAssetUid, assetPlan.documentAssetsToDelete)

  return {
    ok: true,
    dryRun: false,
    deleteAssets,
    plan,
    operations: {
      productFacts: {
        deleted: deletedProductFacts.length,
        factIds: deletedProductFacts.map((entity) => entity.factId).filter(Boolean),
      },
      documentAssets: {
        deleted: deletedDocumentAssets.length,
        factIds: deletedDocumentAssets.map((entity) => entity.factId).filter(Boolean),
      },
    },
  }
}

function normalizeProductIds(productIds) {
  const values = Array.isArray(productIds) ? productIds : []
  const normalized = unique(values
    .map((productId) => String(productId || '').trim().toLowerCase())
    .filter(Boolean))

  if (!normalized.length) {
    throw httpError(400, 'At least one product_id is required.')
  }

  if (normalized.length > 200) {
    throw httpError(400, 'A single delete request supports at most 200 product_id values.')
  }

  const invalid = normalized.filter((productId) => !/^prd_[a-z0-9_]+$/.test(productId))

  if (invalid.length) {
    throw httpError(400, `Invalid product_id value(s): ${invalid.join(', ')}. Product ids must match prd_[a-z0-9_].`)
  }

  return normalized
}

async function findProductsByFactIds(strapiInstance, productIds) {
  return ensureArray(await strapiInstance.entityService.findMany(productFactUid, {
    filters: {
      factId: {
        $in: productIds,
      },
    },
    fields: ['id', 'factId', 'sku', 'model'],
    populate: {
      documents: {
        fields: ['id', 'factId', 'title', 'assetClass'],
      },
      assets: {
        fields: ['id', 'factId', 'title', 'assetClass', 'alt'],
      },
    },
    publicationState: 'preview',
    limit: Math.max(productIds.length * 2, 100),
  }))
}

function collectDocumentAssetCandidates(products) {
  const byFactId = new Map()

  for (const product of products) {
    for (const asset of [...relationArray(product.documents), ...relationArray(product.assets)]) {
      if (asset && asset.factId && !byFactId.has(asset.factId)) {
        byFactId.set(asset.factId, asset)
      }
    }
  }

  return [...byFactId.values()]
}

async function planDocumentAssetDeletion(strapiInstance, candidates, selectedProductIds) {
  if (!candidates.length) {
    return {
      documentAssetsToDelete: [],
      preservedDocumentAssets: [],
      warnings: [],
    }
  }

  const candidateIds = new Set(candidates.map((candidate) => candidate.factId).filter(Boolean))
  const allProducts = ensureArray(await strapiInstance.entityService.findMany(productFactUid, {
    fields: ['id', 'factId'],
    populate: {
      documents: {
        fields: ['id', 'factId'],
      },
      assets: {
        fields: ['id', 'factId'],
      },
    },
    publicationState: 'preview',
    limit: 1000,
  }))

  if (allProducts.length >= 1000) {
    return {
      documentAssetsToDelete: [],
      preservedDocumentAssets: candidates,
      warnings: [
        'Document/media asset deletion was skipped because the safety scan reached 1000 product records. Delete products first, then review orphan assets manually.',
      ],
    }
  }

  const selectedSet = new Set(selectedProductIds)
  const usedByOtherProducts = new Map()

  for (const product of allProducts) {
    if (!product.factId || selectedSet.has(product.factId)) {
      continue
    }

    for (const asset of [...relationArray(product.documents), ...relationArray(product.assets)]) {
      if (!asset?.factId || !candidateIds.has(asset.factId)) {
        continue
      }

      const users = usedByOtherProducts.get(asset.factId) || []
      users.push(product.factId)
      usedByOtherProducts.set(asset.factId, users)
    }
  }

  const documentAssetsToDelete = []
  const preservedDocumentAssets = []

  for (const candidate of candidates) {
    const usedBy = usedByOtherProducts.get(candidate.factId)

    if (usedBy && usedBy.length) {
      preservedDocumentAssets.push({
        ...candidate,
        preservedReason: `Still used by product(s): ${unique(usedBy).join(', ')}`,
      })
    } else {
      documentAssetsToDelete.push(candidate)
    }
  }

  return {
    documentAssetsToDelete,
    preservedDocumentAssets,
    warnings: [],
  }
}

async function deleteEntities(strapiInstance, uid, entities) {
  const uniqueEntities = uniqueById(entities)
  const deleted = []

  for (const entity of uniqueEntities) {
    if (!entity?.id) {
      continue
    }

    await strapiInstance.entityService.delete(uid, entity.id)
    deleted.push(entity)
  }

  return deleted
}

function toDeletionPreview(entity) {
  return withoutUndefined({
    id: entity.id,
    factId: entity.factId,
    sku: entity.sku,
    model: entity.model,
    title: entity.title,
    assetClass: entity.assetClass,
    alt: entity.alt,
    preservedReason: entity.preservedReason,
  })
}

function relationArray(value) {
  if (!value) {
    return []
  }

  return Array.isArray(value) ? value : [value]
}

function ensureArray(value) {
  if (value === undefined || value === null) {
    return []
  }

  return Array.isArray(value) ? value : [value]
}

function unique(values) {
  return [...new Set(values)]
}

function uniqueById(entities) {
  const byId = new Map()

  for (const entity of entities) {
    if (entity?.id) {
      byId.set(entity.id, entity)
    }
  }

  return [...byId.values()]
}

function withoutUndefined(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined))
}
