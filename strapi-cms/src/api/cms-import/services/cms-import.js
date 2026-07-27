'use strict'

const { importCmsFactsIntoStrapi } = require('../../../utils/cms-facts-importer')

module.exports = {
  async import(cmsFacts, options = {}) {
    return importCmsFactsIntoStrapi(strapi, cmsFacts, options)
  },
}
