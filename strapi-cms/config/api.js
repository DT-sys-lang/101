'use strict'

module.exports = ({ env }) => ({
  responses: {
    privateAttributes: [
      'createdAt',
      'updatedAt',
      'publishedAt',
      'createdBy',
      'updatedBy',
    ],
  },
  rest: {
    prefix: env('STRAPI_REST_PREFIX', '/internal/cms'),
    defaultLimit: env.int('STRAPI_REST_DEFAULT_LIMIT', 100),
    maxLimit: env.int('STRAPI_REST_MAX_LIMIT', 100),
  },
})
