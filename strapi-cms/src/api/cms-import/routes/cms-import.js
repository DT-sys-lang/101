'use strict'

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/import',
      handler: 'cms-import.ui',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/import',
      handler: 'cms-import.import',
      config: {
        auth: false,
        policies: ['global::internal-cms-import'],
      },
    },
  ],
}
