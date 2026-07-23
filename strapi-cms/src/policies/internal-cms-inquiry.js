'use strict'

const crypto = require('node:crypto')

module.exports = async (policyContext, _config, { strapi }) => {
  const expectedToken = strapi.config.get('cms-inquiries.internalToken')

  if (!expectedToken) {
    return deny(policyContext, 'INTERNAL_CMS_INQUIRY_TOKEN is required.')
  }

  const providedToken = readBearerToken(policyContext)

  if (!providedToken || !safeEqual(providedToken, expectedToken)) {
    return deny(policyContext, 'Invalid CMS inquiry token.')
  }

  return true
}

function readBearerToken(ctx) {
  const authorization = ctx.request.header.authorization

  if (!authorization || !authorization.toLowerCase().startsWith('bearer ')) {
    return undefined
  }

  return authorization.slice('bearer '.length).trim()
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

function deny(ctx, message) {
  if (typeof ctx.unauthorized === 'function') {
    return ctx.unauthorized(message)
  }

  return false
}
