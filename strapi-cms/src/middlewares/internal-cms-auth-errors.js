'use strict'

const internalCmsPrefix = '/internal/cms/'

/**
 * Normalizes a duplicated-package ForbiddenError emitted before Strapi's core
 * error middleware can recognize it. The scope is intentionally restricted to
 * protected internal CMS REST routes.
 */
module.exports = () => async (ctx, next) => {
  try {
    await next()
  } catch (error) {
    if (!isInternalCmsAuthError(ctx, error)) {
      throw error
    }

    const authorization = ctx.get('authorization')
    const status = authorization ? 403 : 401
    if (status === 401) {
      ctx.set('WWW-Authenticate', 'Bearer')
    }

    ctx.status = status
    ctx.body = {
      data: null,
      error: {
        status,
        name: status === 401 ? 'UnauthorizedError' : 'ForbiddenError',
        message: status === 401 ? 'Missing or invalid credentials' : 'Forbidden access',
        details: {},
      },
    }
  }
}

function isInternalCmsAuthError(ctx, error) {
  return ctx.path.startsWith(internalCmsPrefix)
    && error
    && typeof error === 'object'
    && error.name === 'ForbiddenError'
}
