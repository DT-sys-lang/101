'use strict'

module.exports = {
  async find(ctx) {
    try {
      const cmsFacts = await strapi.service('api::cms-facts.cms-facts').find(ctx.query)

      ctx.set('cache-control', 'no-store')
      ctx.body = cmsFacts
    } catch (error) {
      if (error && error.status) {
        return ctx.throw(error.status, error.message)
      }

      throw error
    }
  },
}
