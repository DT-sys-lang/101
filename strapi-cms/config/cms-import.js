'use strict'

module.exports = ({ env }) => ({
  internalToken: env('INTERNAL_CMS_IMPORT_TOKEN'),
})
