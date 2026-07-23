'use strict'

module.exports = {
  async create(ctx) {
    try {
      const result = await strapi.service('api::inquiry-submission.inquiry-submission').create(ctx.request.body)

      ctx.status = 201
      ctx.set('cache-control', 'no-store')
      ctx.body = result
    } catch (error) {
      if (error && error.status) {
        return ctx.throw(error.status, error.message)
      }

      throw error
    }
  },
}
