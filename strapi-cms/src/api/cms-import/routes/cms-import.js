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
    {
      method: 'POST',
      path: '/import/delete-products',
      handler: 'cms-import.deleteProducts',
      config: {
        auth: false,
        policies: ['global::internal-cms-import'],
      },
    },
    {
      method: 'POST',
      path: '/import/resources',
      handler: 'cms-import.uploadResources',
      config: {
        auth: false,
        policies: ['global::internal-cms-import'],
      },
    },
  ],
}
