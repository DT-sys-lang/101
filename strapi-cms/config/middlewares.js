'use strict'

const developmentOrigins = [
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3002',
  'http://127.0.0.1:3109',
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:3109',
]

function readCorsOrigins(env) {
  const configured = env.array('STRAPI_CORS_ORIGINS', [])
  if (configured.length) {
    return configured
  }

  return env('NODE_ENV', 'development') === 'production' ? [] : developmentOrigins
}

function readCspMediaHosts(env) {
  return env.array('STRAPI_CSP_MEDIA_HOSTS', [])
}

module.exports = ({ env }) => [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'img-src': ["'self'", 'data:', 'blob:', ...readCspMediaHosts(env)],
          'media-src': ["'self'", 'data:', 'blob:', ...readCspMediaHosts(env)],
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: readCorsOrigins(env),
      credentials: false,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      maxAge: 3600,
      keepHeadersOnError: true,
    },
  },
  'global::internal-cms-auth-errors',
  'strapi::poweredBy',
  'strapi::query',
  {
    name: 'strapi::body',
    config: {
      formLimit: env('STRAPI_BODY_FORM_LIMIT', '5mb'),
      jsonLimit: env('STRAPI_BODY_JSON_LIMIT', '5mb'),
      textLimit: env('STRAPI_BODY_TEXT_LIMIT', '5mb'),
      formidable: {
        maxFileSize: env.int('STRAPI_UPLOAD_MAX_FILE_SIZE', 20 * 1024 * 1024),
      },
    },
  },
  'strapi::session',
  {
    name: 'strapi::favicon',
    config: {
      path: 'public/favicon.png',
    },
  },
  'strapi::public',
]
