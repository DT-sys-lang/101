'use strict'

const { readFile } = require('node:fs/promises')
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

  async deleteProducts(productIds, options = {}) {
    return deleteImportedProducts(strapi, productIds, options)
  },
}

const productFactUid = 'api::product-fact.product-fact'
const documentAssetUid = 'api::document-asset.document-asset'

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
