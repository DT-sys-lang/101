'use strict'

module.exports = ({ env }) => ({
  internalToken: env('INTERNAL_CMS_FACTS_TOKEN'),
})
