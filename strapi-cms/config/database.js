'use strict'

module.exports = ({ env }) => {
  const client = env('DATABASE_CLIENT', 'postgres')

  if (client === 'sqlite') {
    return {
      connection: {
        client: 'sqlite',
        connection: {
          filename: env('DATABASE_FILENAME', '.tmp/data.db'),
        },
        useNullAsDefault: true,
      },
    }
  }

  const connectionString = env('DATABASE_URL', '')
  const ssl = env.bool('DATABASE_SSL', false)

  return {
    connection: {
      client: 'postgres',
      connection: {
        connectionString,
        host: env('DATABASE_HOST', '127.0.0.1'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'industrial_cms'),
        schema: env('DATABASE_SCHEMA', 'public'),
        user: env('DATABASE_USERNAME', 'strapi'),
        password: env('DATABASE_PASSWORD', ''),
        ssl: ssl ? { rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', true) } : false,
      },
      pool: {
        min: env.int('DATABASE_POOL_MIN', 2),
        max: env.int('DATABASE_POOL_MAX', 10),
      },
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT_MS', 60000),
    },
  }
}
