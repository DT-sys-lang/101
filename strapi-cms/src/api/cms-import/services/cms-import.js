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
    const { cmsFacts, workbook } = await buildCmsFactsFromWorkbookBuffer(buffer)
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
