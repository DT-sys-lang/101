import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const REQUIRED_NODE_VERSION = '20.20.2'
const TARGET_DATABASE_PATTERN = /^industrial_cms_v5_locale_[a-z0-9_]+$/
const FORBIDDEN_DATABASES = new Set(['industrial_cms', 'industrial_cms_v5_trial'])
const TABLES = [
  { table: 'document_assets', stableColumn: 'fact_id' },
  { table: 'product_manuals', stableColumn: 'manual_id' },
  { table: 'intent_phrases', stableColumn: 'phrase_id' },
]
const RELATION_TABLES = [
  'product_manuals_document_links',
  'product_manuals_products_links',
  'product_manuals_related_categories_links',
  'product_manuals_intent_phrases_links',
  'intent_phrases_products_links',
  'intent_phrases_categories_links',
  'intent_phrases_industries_links',
  'intent_phrases_applications_links',
  'product_facts_documents_links',
  'product_facts_assets_links',
]

assertNodeVersion()

const args = readArgs(process.argv.slice(2))
const cmsRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const workspaceRoot = dirname(cmsRoot)
const env = await readDotEnv(resolve(cmsRoot, '.env'))
const database = args.database
const reportPath = resolve(args.report ?? resolve(workspaceRoot, 'tmp', 'strapi-v5-locale', `${database}-rename-report.json`))

assertTargetDatabase(database)

const connection = {
  host: args.host ?? env.DATABASE_HOST ?? '127.0.0.1',
  port: readPort(args.port ?? env.DATABASE_PORT ?? '55432'),
  database,
  user: args.username ?? env.DATABASE_USERNAME ?? 'strapi',
  password: readPassword(args, env),
}

const client = new pg.Client(connection)
await client.connect()

let transactionOpen = false

try {
  const before = await inspectDatabase(client)
  const state = getMigrationState(before)
  const report = {
    migration: 'business-locale-to-content-locale-v1',
    executedAt: new Date().toISOString(),
    database: connection.database,
    host: connection.host,
    port: connection.port,
    node: process.version,
    applyRequested: args.apply,
    stateBefore: state,
    before,
    after: undefined,
    result: undefined,
  }

  if (state === 'already-applied') {
    report.after = before
    report.result = 'already-applied'
    await writeReport(reportPath, report)
    console.log(JSON.stringify({ ok: true, result: report.result, reportPath }, null, 2))
    process.exit(0)
  }

  if (!args.apply) {
    report.result = 'dry-run'
    await writeReport(reportPath, report)
    console.log(JSON.stringify({ ok: true, result: report.result, reportPath }, null, 2))
    process.exit(0)
  }

  await client.query('BEGIN')
  transactionOpen = true
  await client.query("SELECT pg_advisory_xact_lock(hashtext('business-locale-to-content-locale-v1'))")

  const lockedBefore = await inspectDatabase(client)
  if (getMigrationState(lockedBefore) !== 'pending') {
    throw new Error('Migration state changed while waiting for the advisory lock.')
  }

  for (const descriptor of TABLES) {
    await client.query(`ALTER TABLE "${descriptor.table}" RENAME COLUMN "locale" TO "content_locale"`)
  }

  const after = await inspectDatabase(client)
  assertPostRenameInvariants(lockedBefore, after)

  await client.query('COMMIT')
  transactionOpen = false

  report.after = after
  report.result = 'applied'
  await writeReport(reportPath, report)
  console.log(JSON.stringify({ ok: true, result: report.result, reportPath, tables: after.tables }, null, 2))
} catch (error) {
  if (transactionOpen) {
    await client.query('ROLLBACK')
  }

  throw error
} finally {
  await client.end()
}

function assertNodeVersion() {
  if (process.versions.node !== REQUIRED_NODE_VERSION) {
    throw new Error(`This migration must run with Node ${REQUIRED_NODE_VERSION}; received ${process.versions.node}.`)
  }
}

function readArgs(argv) {
  const result = { apply: false }

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]

    if (value === '--apply') {
      result.apply = true
      continue
    }

    if (value === '--help' || value === '-h') {
      printHelp()
      process.exit(0)
    }

    if (!value.startsWith('--')) {
      throw new Error(`Unknown argument '${value}'.`)
    }

    const name = value.slice(2)
    const next = argv[index + 1]
    if (!next || next.startsWith('--')) {
      throw new Error(`Argument --${name} requires a value.`)
    }

    if (!['database', 'host', 'port', 'username', 'password-env', 'report'].includes(name)) {
      throw new Error(`Unknown argument --${name}.`)
    }

    result[name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = next
    index += 1
  }

  if (!result.database) {
    throw new Error('Pass --database industrial_cms_v5_locale_<new_trial_name>.')
  }

  return result
}

function printHelp() {
  console.log(`Usage:
  node scripts/migrate-business-locale-to-content-locale.mjs \
    --database industrial_cms_v5_locale_<new_trial_name> \
    --port 55432 \
    --apply \
    --report ../../tmp/strapi-v5-locale/<new_trial_name>-rename-report.json

Safety rules:
  - Requires Node ${REQUIRED_NODE_VERSION}.
  - Refuses industrial_cms and industrial_cms_v5_trial.
  - Requires a new database name beginning industrial_cms_v5_locale_.
  - Refuses a database that already has Strapi v5 document_id columns.
  - Without --apply, only writes a preflight report.`)
}

function assertTargetDatabase(value) {
  if (FORBIDDEN_DATABASES.has(value) || !TARGET_DATABASE_PATTERN.test(value)) {
    throw new Error(`Refusing database '${value}'. Use a new industrial_cms_v5_locale_* database only.`)
  }
}

function readPort(value) {
  const port = Number.parseInt(String(value), 10)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PostgreSQL port '${value}'.`)
  }

  return port
}

function readPassword(args, env) {
  const requestedName = args.passwordEnv ?? 'PGPASSWORD'
  const password = process.env[requestedName] ?? env[requestedName] ?? env.DATABASE_PASSWORD

  if (!password) {
    throw new Error(`Database password is missing. Set ${requestedName} or DATABASE_PASSWORD before running this script.`)
  }

  return password
}

async function inspectDatabase(client) {
  const allColumns = await readColumns(client)
  assertNoV5DocumentColumns(allColumns)

  const tables = {}
  for (const descriptor of TABLES) {
    const columns = allColumns.get(descriptor.table) ?? new Map()
    const locale = columns.get('locale')
    const contentLocale = columns.get('content_locale')

    if (!columns.has(descriptor.stableColumn)) {
      throw new Error(`${descriptor.table}.${descriptor.stableColumn} is missing.`)
    }

    const businessColumn = locale && !contentLocale
      ? 'locale'
      : !locale && contentLocale
        ? 'content_locale'
        : undefined

    if (!businessColumn) {
      throw new Error(`${descriptor.table} has an invalid business locale column state.`)
    }

    tables[descriptor.table] = {
      columns: {
        stable: columns.get(descriptor.stableColumn),
        locale,
        contentLocale,
      },
      snapshot: await readBusinessSnapshot(client, descriptor, businessColumn),
    }
  }

  return {
    tables,
    relationCounts: await readRelationCounts(client),
  }
}

async function readColumns(client) {
  const result = await client.query(`
    SELECT table_name, column_name, data_type, udt_name, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ANY($1::text[])
    ORDER BY table_name, ordinal_position
  `, [TABLES.map((descriptor) => descriptor.table)])
  const columns = new Map()

  for (const row of result.rows) {
    const table = columns.get(row.table_name) ?? new Map()
    table.set(row.column_name, {
      dataType: row.data_type,
      udtName: row.udt_name,
      nullable: row.is_nullable,
    })
    columns.set(row.table_name, table)
  }

  return columns
}

function assertNoV5DocumentColumns(columns) {
  for (const descriptor of TABLES) {
    if (columns.get(descriptor.table)?.has('document_id')) {
      throw new Error(`${descriptor.table}.document_id exists. Run this only before Strapi v5 starts against the restored target database.`)
    }
  }
}

function getMigrationState(inspection) {
  const states = TABLES.map((descriptor) => {
    const table = inspection.tables[descriptor.table]
    return table.columns.locale && !table.columns.contentLocale
      ? 'pending'
      : !table.columns.locale && table.columns.contentLocale
        ? 'already-applied'
        : 'invalid'
  })

  if (states.every((state) => state === 'pending')) {
    return 'pending'
  }

  if (states.every((state) => state === 'already-applied')) {
    return 'already-applied'
  }

  throw new Error(`The target database has inconsistent locale rename state: ${states.join(', ')}.`)
}

async function readBusinessSnapshot(client, descriptor, valueColumn) {
  const result = await client.query(`
    SELECT "${descriptor.stableColumn}"::text AS stable_id, "${valueColumn}"::text AS value
    FROM "${descriptor.table}"
    ORDER BY "${descriptor.stableColumn}"
  `)
  const records = result.rows.map((row) => ({
    stableId: row.stable_id,
    value: row.value ?? null,
  }))
  const stableIds = new Set(records.map((record) => record.stableId))

  if (stableIds.size !== records.length) {
    throw new Error(`${descriptor.table}.${descriptor.stableColumn} must be unique before the v5 upgrade.`)
  }

  const distribution = {}
  for (const record of records) {
    const key = record.value ?? '<null>'
    distribution[key] = (distribution[key] ?? 0) + 1
  }

  return {
    rowCount: records.length,
    stableIdCount: stableIds.size,
    valueDistribution: distribution,
    checksum: checksum(records.map((record) => `${record.stableId}\u0000${record.value ?? '<null>'}`)),
  }
}

async function readRelationCounts(client) {
  const result = {}

  for (const table of RELATION_TABLES) {
    const exists = await client.query(`
      SELECT EXISTS(
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = $1
      ) AS exists
    `, [table])

    if (!exists.rows[0].exists) {
      result[table] = null
      continue
    }

    const count = await client.query(`SELECT count(*)::int AS count FROM "${table}"`)
    result[table] = count.rows[0].count
  }

  return result
}

function assertPostRenameInvariants(before, after) {
  if (getMigrationState(after) !== 'already-applied') {
    throw new Error('Business locale rename did not reach the expected completed state.')
  }

  for (const descriptor of TABLES) {
    const beforeTable = before.tables[descriptor.table]
    const afterTable = after.tables[descriptor.table]

    if (!sameJson(beforeTable.snapshot, afterTable.snapshot)) {
      throw new Error(`${descriptor.table} stable IDs or business locale values changed during the rename.`)
    }

    if (!sameJson(beforeTable.columns.locale, afterTable.columns.contentLocale)) {
      throw new Error(`${descriptor.table}.content_locale did not preserve the original locale column definition.`)
    }
  }

  if (!sameJson(before.relationCounts, after.relationCounts)) {
    throw new Error('Relation table counts changed during the column rename.')
  }
}

function checksum(values) {
  return createHash('sha256').update(values.join('\n')).digest('hex')
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

async function writeReport(path, report) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
}

async function readDotEnv(path) {
  try {
    const text = await readFile(path, 'utf8')
    const values = {}

    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)=(.*)$/)
      if (!match) {
        continue
      }

      values[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
    }

    return values
  } catch {
    return {}
  }
}
