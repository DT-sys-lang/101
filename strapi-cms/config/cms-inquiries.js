'use strict'

module.exports = ({ env }) => ({
  internalToken: env('INTERNAL_CMS_INQUIRY_TOKEN'),
})
