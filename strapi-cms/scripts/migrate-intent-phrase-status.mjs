import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const cmsDirectory = path.resolve(scriptDirectory, '..');
const env = {
  ...readEnvFile(path.join(cmsDirectory, '.env')),
  ...process.env,
};

async function main() {
  const client = env.DATABASE_CLIENT ?? 'postgres';

  if (client === 'sqlite') {
    await migrateSqlite();
    return;
  }

  if (client === 'postgres') {
    await migratePostgres();
    return;
  }

  throw new Error(`[intent-phrase-status-migration] Unsupported database client: ${client}.`);
}

async function migratePostgres() {
  const pg = await import('pg');
  const Client = pg.Client ?? pg.default?.Client;
  const schema = env.DATABASE_SCHEMA || 'public';
  const client = new Client(getPostgresConnectionOptions());

  await client.connect();

  try {
    const columns = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'intent_phrases'",
      [schema],
    );
    const names = new Set(columns.rows.map((row) => row.column_name));

    if (!names.has('status')) {
      console.log('[intent-phrase-status-migration] PostgreSQL schema is already compatible.');
      return;
    }

    const table = `${quoteIdentifier(schema)}.${quoteIdentifier('intent_phrases')}`;

    await client.query('BEGIN');
    if (names.has('phrase_status')) {
      await client.query(`UPDATE ${table} SET phrase_status = COALESCE(phrase_status, status) WHERE phrase_status IS NULL`);
      await client.query(`ALTER TABLE ${table} DROP COLUMN status`);
    } else {
      await client.query(`ALTER TABLE ${table} RENAME COLUMN status TO phrase_status`);
    }
    await client.query('COMMIT');
    console.log('[intent-phrase-status-migration] Migrated PostgreSQL intent phrase status column.');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

async function migrateSqlite() {
  const { default: Database } = await import('better-sqlite3');
  const filename = path.resolve(cmsDirectory, env.DATABASE_FILENAME || '.tmp/data.db');
  const database = new Database(filename);

  try {
    const columns = database.prepare("PRAGMA table_info('intent_phrases')").all();
    const names = new Set(columns.map((column) => column.name));

    if (!names.has('status')) {
      console.log('[intent-phrase-status-migration] SQLite schema is already compatible.');
      return;
    }

    database.transaction(() => {
      if (names.has('phrase_status')) {
        database.prepare('UPDATE intent_phrases SET phrase_status = COALESCE(phrase_status, status) WHERE phrase_status IS NULL').run();
        database.prepare('ALTER TABLE intent_phrases DROP COLUMN status').run();
      } else {
        database.prepare('ALTER TABLE intent_phrases RENAME COLUMN status TO phrase_status').run();
      }
    })();
    console.log('[intent-phrase-status-migration] Migrated SQLite intent phrase status column.');
  } finally {
    database.close();
  }
}

function getPostgresConnectionOptions() {
  const ssl = readBoolean(env.DATABASE_SSL, false)
    ? { rejectUnauthorized: readBoolean(env.DATABASE_SSL_REJECT_UNAUTHORIZED, true) }
    : false;

  if (env.DATABASE_URL) {
    return {
      connectionString: env.DATABASE_URL,
      ssl,
    };
  }

  return {
    host: env.DATABASE_HOST || '127.0.0.1',
    port: Number(env.DATABASE_PORT || 5432),
    database: env.DATABASE_NAME || 'industrial_cms',
    user: env.DATABASE_USERNAME || 'strapi',
    password: env.DATABASE_PASSWORD || '',
    ssl,
  };
}

function readEnvFile(filename) {
  try {
    const values = {};

    for (const line of readFileSync(filename, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const separator = trimmed.indexOf('=');
      if (separator < 1) {
        continue;
      }

      const key = trimmed.slice(0, separator).trim();
      let value = trimmed.slice(separator + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      values[key] = value;
    }

    return values;
  } catch {
    return {};
  }
}

function readBoolean(value, defaultValue) {
  if (value === undefined) {
    return defaultValue;
  }

  return value === 'true' || value === '1';
}

function quoteIdentifier(value) {
  return `"${value.replace(/"/g, '""')}"`;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
