'use strict'

const { createCoreService } = require('@strapi/strapi').factories

module.exports = createCoreService('api::product-manual.product-manual')
