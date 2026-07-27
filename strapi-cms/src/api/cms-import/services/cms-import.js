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
}

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
