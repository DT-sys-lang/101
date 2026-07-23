'use strict'

module.exports = ({ env }) => ({
  'users-permissions': {
    enabled: true,
  },
  upload: {
    config: buildUploadConfig(env),
  },
})

function buildUploadConfig(env) {
  const provider = env('STRAPI_UPLOAD_PROVIDER', 'local')
  const sizeLimit = env.int('STRAPI_UPLOAD_SIZE_LIMIT', 200 * 1024 * 1024)

  if (provider !== 'aws-s3') {
    return { sizeLimit }
  }

  return {
    provider: 'aws-s3',
    sizeLimit,
    providerOptions: removeUndefined({
      baseUrl: optionalString(env('STRAPI_UPLOAD_BASE_URL')),
      rootPath: optionalString(env('STRAPI_UPLOAD_ROOT_PATH')),
      s3Options: {
        credentials: {
          accessKeyId: env('STRAPI_S3_ACCESS_KEY_ID'),
          secretAccessKey: env('STRAPI_S3_SECRET_ACCESS_KEY'),
        },
        region: env('STRAPI_S3_REGION', 'auto'),
        endpoint: optionalString(env('STRAPI_S3_ENDPOINT')),
        forcePathStyle: env.bool('STRAPI_S3_FORCE_PATH_STYLE', false),
        params: removeUndefined({
          Bucket: env('STRAPI_S3_BUCKET'),
          ACL: optionalString(env('STRAPI_S3_ACL')),
        }),
      },
    }),
    actionOptions: {
      upload: {},
      uploadStream: {},
      delete: {},
    },
  }
}

function optionalString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function removeUndefined(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined))
}
