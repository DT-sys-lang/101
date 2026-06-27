'use strict'

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/facts',
      handler: 'cms-facts.find',
      config: {
        auth: false,
        policies: ['global::internal-cms-facts'],
      },
    },
  ],
}
