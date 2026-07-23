'use strict'

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/inquiries',
      handler: 'inquiry-submission.create',
      config: {
        auth: false,
        policies: ['global::internal-cms-inquiry'],
      },
    },
  ],
}
