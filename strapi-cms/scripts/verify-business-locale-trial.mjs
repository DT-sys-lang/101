import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const REQUIRED_NODE_VERSION = '20.20.2'
const TARGET_DATABASE_PATTERN = /^industrial_cms_v5_locale_[a-z0-9_]+$/
const TABLES = [
  { table: 'document_assets', stableColumn: 'fact_id' },
  { table: 'product_manuals', stableColumn: 'manual_id' },
  { table: 'intent_phrases', stableColumn: 'phrase_id' },
]
const RELATION_SPECS = [
  {
    name: 'product-manual-document',
    sourceTable: 'product_manuals_document_links',
    targetTable: 'product_manuals_document_lnk',
    leftTable: 'product_manuals',
    leftStableColumn: 'manual_id',
    leftForeignKey: 'product_manual_id',
    rightTable: 'document_assets',
    rightStableColumn: 'fact_id',
    rightForeignKey: 'document_asset_id',
  },
  {
    name: 'product-manual-product',
    sourceTable: 'product_manuals_products_links',
    targetTable: 'product_manuals_products_lnk',
    leftTable: 'product_manuals',
    leftStableColumn: 'manual_id',
    leftForeignKey: 'product_manual_id',
    rightTable: 'product_facts',
    rightStableColumn: 'fact_id',
    rightForeignKey: 'product_fact_id',
  },
  {
    name: 'product-manual-category',
    sourceTable: 'product_manuals_related_categories_links',
    targetTable: 'product_manuals_related_categories_lnk',
    leftTable: 'product_manuals',
    leftStableColumn: 'manual_id',
    leftForeignKey: 'product_manual_id',
    rightTable: 'category_facts',
    rightStableColumn: 'fact_id',
    rightForeignKey: 'category_fact_id',
  },
  {
    name: 'product-manual-intent',
    sourceTable: 'product_manuals_intent_phrases_links',
    targetTable: 'product_manuals_intent_phrases_lnk',
    leftTable: 'product_manuals',
    leftStableColumn: 'manual_id',
    leftForeignKey: 'product_manual_id',
    rightTable: 'intent_phrases',
    rightStableColumn: 'phrase_id',
    rightForeignKey: 'intent_phrase_id',
  },
  {
    name: 'intent-product',
    sourceTable: 'intent_phrases_products_links',
    targetTable: 'intent_phrases_products_lnk',
    leftTable: 'intent_phrases',
    leftStableColumn: 'phrase_id',
    leftForeignKey: 'intent_phrase_id',
    rightTable: 'product_facts',
    rightStableColumn: 'fact_id',
    rightForeignKey: 'product_fact_id',
  },
  {
    name: 'intent-category',
    sourceTable: 'intent_phrases_categories_links',
    targetTable: 'intent_phrases_categories_lnk',
    leftTable: 'intent_phrases',
    leftStableColumn: 'phrase_id',
    leftForeignKey: 'intent_phrase_id',
    rightTable: 'category_facts',
    rightStableColumn: 'fact_id',
    rightForeignKey: 'category_fact_id',
  },
  {
    name: 'intent-industry',
    sourceTable: 'intent_phrases_industries_links',
    targetTable: 'intent_phrases_industries_lnk',
    leftTable: 'intent_phrases',
    leftStableColumn: 'phrase_id',
    leftForeignKey: 'intent_phrase_id',
    rightTable: 'industry_facts',
    rightStableColumn: 'fact_id',
    rightForeignKey: 'industry_fact_id',
  },
  {
    name: 'intent-application',
    sourceTable: 'intent_phrases_applications_links',
    targetTable: 'intent_phrases_applications_lnk',
    leftTable: 'intent_phrases',
    leftStableColumn: 'phrase_id',
    leftForeignKey: 'intent_phrase_id',
    rightTable: 'application_facts',
    rightStableColumn: 'fact_id',
    rightForeignKey: 'application_fact_id',
  },
  {
    name: 'product-document',
    sourceTable: 'product_facts_documents_links',
    targetTable: 'product_facts_documents_lnk',
    leftTable: 'product_facts',
    leftStableColumn: 'fact_id',
    leftForeignKey: 'product_fact_id',
    rightTable: 'document_assets',
    rightStableColumn: 'fact_id',
    rightForeignKey: 'document_asset_id',
  },
  {
    name: 'product-asset',
    sourceTable: 'product_facts_assets_links',
    targetTable: 'product_facts_assets_lnk',
    leftTable: 'product_facts',
    leftStableColumn: 'fact_id',
    leftForeignKey: 'product_fact_id',
    rightTable: 'document_assets',
    rightStableColumn: 'fact_id',
    rightForeignKey: 'document_asset_id',
  },
]

assertNodeVersion()

const args = readArgs(process.argv.slice(2))
const cmsRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const workspaceRoot = dirname(cmsRoot)
const env = await readDotEnv(resolve(cmsRoot, '.env'))
const targetDatabase = args.targetDatabase
const reportPath = resolve(args.report ?? resolve(workspaceRoot, 'tmp', 'strapi-v5-locale', `${targetDatabase}-database-verification.json`))

assertTargetDatabase(targetDatabase)

const sharedConnection = {
  user: args.username ?? env.DATABASE_USERNAME ?? 'strapi',
  password: readPassword(args, env),
}
const source = new pg.Client({
  ...sharedConnection,
  host: args.sourceHost ?? '127.0.0.1',
  port: readPort(args.sourcePort ?? '5432'),
  database: args.sourceDatabase ?? 'industrial_cms',
})
const target = new pg.Client({
  ...sharedConnection,
  host: args.targetHost ?? '127.0.0.1',
  port: readPort(args.targetPort ?? '55432'),
  database: targetDatabase,
})

await Promise.all([source.connect(), target.connect()])

try {
  const [sourceSnapshot, targetSnapshot] = await Promise.all([
    readSourceSnapshot(source),
    readTargetSnapshot(target),
  ])
  const failures = []

  assertStableBusinessRecords(sourceSnapshot, targetSnapshot, failures)
  assertV5SystemFields(sourceSnapshot, targetSnapshot, failures)
  assertRelations(sourceSnapshot, targetSnapshot, failures)
  assertFileReferences(sourceSnapshot, targetSnapshot, failures)

  const report = {
    verification: 'business-locale-v5-trial-v1',
    executedAt: new Date().toISOString(),
    node: process.version,
    source: { database: source.database, host: source.host, port: source.port },
    target: { database: target.database, host: target.host, port: target.port },
    ok: failures.length === 0,
    failures,
    sourceSnapshot,
    targetSnapshot,
  }

  await writeReport(reportPath, report)
  console.log(JSON.stringify({ ok: report.ok, failures, reportPath, tables: targetSnapshot.tables }, null, 2))

  if (failures.length) {
    process.exitCode = 1
  }
} finally {
  await Promise.all([source.end(), target.end()])
}

function assertNodeVersion() {
  if (process.versions.node !== REQUIRED_NODE_VERSION) {
    throw new Error(`This verification must run with Node ${REQUIRED_NODE_VERSION}; received ${process.versions.node}.`)
  }
}

function readArgs(argv) {
  const result = {}

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
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

    if (![
      'source-database', 'source-host', 'source-port',
      'target-database', 'target-host', 'target-port',
      'username', 'password-env', 'report',
    ].includes(name)) {
      throw new Error(`Unknown argument --${name}.`)
    }

    result[name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = next
    index += 1
  }

  if (!result.targetDatabase) {
    throw new Error('Pass --target-database industrial_cms_v5_locale_<new_trial_name>.')
  }

  return result
}

function printHelp() {
  console.log(`Usage:
  node scripts/verify-business-locale-trial.mjs \
    --target-database industrial_cms_v5_locale_<new_trial_name> \
    --target-port 55432 \
    --report ../../tmp/strapi-v5-locale/<new_trial_name>-database-verification.json

The source defaults to industrial_cms on port 5432 and is queried read-only.`)
}

function assertTargetDatabase(value) {
  if (!TARGET_DATABASE_PATTERN.test(value)) {
    throw new Error(`Refusing target database '${value}'. Use a new industrial_cms_v5_locale_* database only.`)
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

async function readSourceSnapshot(client) {
  const tables = {}
  for (const descriptor of TABLES) {
    tables[descriptor.table] = await readSourceTable(client, descriptor)
  }

  const relations = await readRelationSignatures(client, 'source')
  const fileReferences = await readFileReferenceCount(client, 'source')

  return { tables, relations, fileReferences }
}

async function readTargetSnapshot(client) {
  const localeResult = await client.query('SELECT code FROM "i18n_locale" ORDER BY code')
  const systemLocales = localeResult.rows.map((row) => row.code)
  const tables = {}
  for (const descriptor of TABLES) {
    tables[descriptor.table] = await readTargetTable(client, descriptor)
  }

  const relations = await readRelationSignatures(client, 'target')
  const fileReferences = await readFileReferenceCount(client, 'target')

  return { systemLocales, tables, relations, fileReferences }
}

async function readSourceTable(client, descriptor) {
  const result = await client.query(`
    SELECT "${descriptor.stableColumn}"::text AS stable_id,
           "locale"::text AS content_locale,
           (published_at IS NOT NULL) AS is_published
    FROM "${descriptor.table}"
    ORDER BY "${descriptor.stableColumn}"
  `)
  const records = result.rows.map((row) => ({
    stableId: row.stable_id,
    contentLocale: row.content_locale ?? null,
    isPublished: row.is_published,
  }))
  records.sort((left, right) => left.stableId.localeCompare(right.stableId, 'en'))

  return summarizeSourceRecords(records)
}

function summarizeSourceRecords(records) {
  return {
    rowCount: records.length,
    stableIdCount: new Set(records.map((record) => record.stableId)).size,
    publishedStableIdCount: records.filter((record) => record.isPublished).length,
    contentLocaleDistribution: distribution(records.map((record) => record.contentLocale)),
    contentLocaleChecksum: checksum(records.map((record) => `${record.stableId}\u0000${record.contentLocale ?? '<null>'}`)),
    records,
  }
}

async function readTargetTable(client, descriptor) {
  const result = await client.query(`
    SELECT "${descriptor.stableColumn}"::text AS stable_id,
           content_locale::text AS content_locale,
           locale::text AS system_locale,
           document_id::text AS document_id,
           (published_at IS NOT NULL) AS is_published
    FROM "${descriptor.table}"
    ORDER BY "${descriptor.stableColumn}", id
  `)
  const physicalRecords = result.rows.map((row) => ({
    stableId: row.stable_id,
    contentLocale: row.content_locale ?? null,
    systemLocale: row.system_locale ?? null,
    documentId: row.document_id ?? null,
    isPublished: row.is_published,
  }))
  const byStableId = new Map()

  for (const record of physicalRecords) {
    const group = byStableId.get(record.stableId) ?? []
    group.push(record)
    byStableId.set(record.stableId, group)
  }

  const records = [...byStableId.entries()]
    .map(([stableId, group]) => ({
      stableId,
      physicalRowCount: group.length,
      contentLocales: uniqueSorted(group.map((record) => record.contentLocale)),
      systemLocales: uniqueSorted(group.map((record) => record.systemLocale)),
      documentIds: uniqueSorted(group.map((record) => record.documentId)),
      publishedPhysicalRowCount: group.filter((record) => record.isPublished).length,
    }))
    .sort((left, right) => left.stableId.localeCompare(right.stableId, 'en'))

  return {
    physicalRowCount: physicalRecords.length,
    stableIdCount: records.length,
    contentLocaleDistribution: distribution(records.flatMap((record) => record.contentLocales)),
    contentLocaleChecksum: checksum(records.map((record) => `${record.stableId}\u0000${record.contentLocales.map((value) => value ?? '<null>').join('|')}`)),
    records,
  }
}

async function readRelationSignatures(client, schema) {
  const result = {}

  for (const spec of RELATION_SPECS) {
    const relationTable = schema === 'source' ? spec.sourceTable : spec.targetTable
    await assertTableExists(client, relationTable)
    const rows = await client.query(`
      SELECT DISTINCT left_record."${spec.leftStableColumn}"::text || chr(31) || right_record."${spec.rightStableColumn}"::text AS signature
      FROM "${relationTable}" relation
      JOIN "${spec.leftTable}" left_record ON left_record.id = relation."${spec.leftForeignKey}"
      JOIN "${spec.rightTable}" right_record ON right_record.id = relation."${spec.rightForeignKey}"
      ORDER BY signature
    `)
    const signatures = rows.rows.map((row) => row.signature)
    result[spec.name] = {
      count: signatures.length,
      checksum: checksum(signatures),
      signatures,
    }
  }

  return result
}

async function assertTableExists(client, table) {
  const result = await client.query(`
    SELECT EXISTS(
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = $1
    ) AS exists
  `, [table])

  if (!result.rows[0].exists) {
    throw new Error(`Expected relation table '${table}' is missing.`)
  }
}

async function readFileReferenceCount(client, schema) {
  const relationTable = schema === 'source' ? 'files_related_morphs' : 'files_related_mph'
  const tableExists = await client.query(`
    SELECT EXISTS(
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = $1
    ) AS exists
  `, [relationTable])

  if (!tableExists.rows[0].exists) {
    return { relationTable, count: 0, tableExists: false }
  }

  const result = await client.query(`
    SELECT count(*)::int AS count
    FROM "${relationTable}" relation
    JOIN document_assets asset ON asset.id = relation.related_id
    WHERE relation.related_type = 'api::document-asset.document-asset'
      AND relation.field = 'file'
  `)

  return { relationTable, count: result.rows[0].count, tableExists: true }
}

function assertStableBusinessRecords(source, target, failures) {
  for (const descriptor of TABLES) {
    const sourceTable = source.tables[descriptor.table]
    const targetTable = target.tables[descriptor.table]
    const label = descriptor.table

    if (sourceTable.stableIdCount !== sourceTable.rowCount) {
      failures.push(`${label}: source stable ID count differs from source row count`)
    }

    if (targetTable.stableIdCount !== sourceTable.stableIdCount) {
      failures.push(`${label}: stable business record count differs (source ${sourceTable.stableIdCount}, target ${targetTable.stableIdCount})`)
    }

    if (targetTable.contentLocaleChecksum !== sourceTable.contentLocaleChecksum) {
      failures.push(`${label}: contentLocale stable-ID mapping differs from the v4 source`)
    }

    const expectedPhysicalRows = sourceTable.rowCount + sourceTable.publishedStableIdCount
    if (targetTable.physicalRowCount !== expectedPhysicalRows) {
      failures.push(`${label}: expected ${expectedPhysicalRows} v5 physical rows from draft/publish conversion, received ${targetTable.physicalRowCount}`)
    }

    const sourceById = new Map(sourceTable.records.map((record) => [record.stableId, record]))
    for (const record of targetTable.records) {
      const sourceRecord = sourceById.get(record.stableId)
      if (!sourceRecord) {
        failures.push(`${label}:${record.stableId}: target stable ID is absent from v4 source`)
        continue
      }

      if (record.contentLocales.length !== 1 || record.contentLocales[0] !== sourceRecord.contentLocale) {
        failures.push(`${label}:${record.stableId}: contentLocale changed across the v5 migration`)
      }

      const expectedRows = sourceRecord.isPublished ? 2 : 1
      if (record.physicalRowCount !== expectedRows) {
        failures.push(`${label}:${record.stableId}: expected ${expectedRows} physical row(s), received ${record.physicalRowCount}`)
      }

      if (record.publishedPhysicalRowCount !== (sourceRecord.isPublished ? 1 : 0)) {
        failures.push(`${label}:${record.stableId}: published status does not match the v4 source`)
      }
    }
  }
}

function assertV5SystemFields(source, target, failures) {

  for (const descriptor of TABLES) {
    for (const record of target.tables[descriptor.table].records) {
      if (record.documentIds.length !== 1 || !record.documentIds[0]) {
        failures.push(`${descriptor.table}:${record.stableId}: expected exactly one v5 documentId`)
      }

      if (record.systemLocales.length !== 1 || record.systemLocales[0] !== null) {
        failures.push(`${descriptor.table}:${record.stableId}: a non-localized content type must not receive a v5 system locale`)
      }

      if (record.systemLocales.includes('multi')) {
        failures.push(`${descriptor.table}:${record.stableId}: business value multi leaked into the v5 system locale`)
      }
    }
  }
}

function assertRelations(source, target, failures) {
  for (const spec of RELATION_SPECS) {
    const sourceRelation = source.relations[spec.name]
    const targetRelation = target.relations[spec.name]

    if (sourceRelation.count !== targetRelation.count || sourceRelation.checksum !== targetRelation.checksum) {
      failures.push(`${spec.name}: stable business relation signature differs between v4 and v5`)
    }
  }
}

function assertFileReferences(source, target, failures) {
  if (source.fileReferences.count !== target.fileReferences.count) {
    failures.push(`document asset file references differ (source ${source.fileReferences.count}, target ${target.fileReferences.count})`)
  }
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((left, right) => String(left).localeCompare(String(right), 'en'))
}

function distribution(values) {
  const result = {}
  for (const value of values) {
    const key = value ?? '<null>'
    result[key] = (result[key] ?? 0) + 1
  }

  return result
}

function checksum(values) {
  return createHash('sha256').update(values.join('\n')).digest('hex')
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
      if (match) {
        values[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
      }
    }

    return values
  } catch {
    return {}
  }
}
