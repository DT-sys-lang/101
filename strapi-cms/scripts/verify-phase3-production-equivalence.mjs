import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const REQUIRED_NODE_VERSION = '20.20.2'
const TARGET_DATABASE_PATTERN = /^industrial_cms_v5_locale_phase3_[a-z0-9_]+$/
const SOURCE_DATABASE = 'industrial_cms'
const REQUIRED_TABLES = [
  { table: 'product_facts', stableColumn: 'fact_id' },
  { table: 'category_facts', stableColumn: 'fact_id' },
  { table: 'blog_posts', stableColumn: 'post_id' },
  { table: 'case_studies', stableColumn: 'case_id' },
  { table: 'document_assets', stableColumn: 'fact_id', businessLocale: true },
  { table: 'product_manuals', stableColumn: 'manual_id', businessLocale: true },
  { table: 'intent_phrases', stableColumn: 'phrase_id', businessLocale: true },
]
const RELATION_SPECS = [
  ['category-parent', 'category_facts_parent_links', 'category_facts_parent_lnk', 'category_facts', 'fact_id', 'category_fact_id', 'category_facts', 'fact_id', 'inv_category_fact_id'],
  ['product-primary-category', 'product_facts_primary_category_links', 'product_facts_primary_category_lnk', 'product_facts', 'fact_id', 'product_fact_id', 'category_facts', 'fact_id', 'category_fact_id'],
  ['product-additional-category', 'product_facts_additional_categories_links', 'product_facts_additional_categories_lnk', 'product_facts', 'fact_id', 'product_fact_id', 'category_facts', 'fact_id', 'category_fact_id'],
  ['product-industry', 'product_facts_industries_links', 'product_facts_industries_lnk', 'product_facts', 'fact_id', 'product_fact_id', 'industry_facts', 'fact_id', 'industry_fact_id'],
  ['product-application', 'product_facts_applications_links', 'product_facts_applications_lnk', 'product_facts', 'fact_id', 'product_fact_id', 'application_facts', 'fact_id', 'application_fact_id'],
  ['product-document', 'product_facts_documents_links', 'product_facts_documents_lnk', 'product_facts', 'fact_id', 'product_fact_id', 'document_assets', 'fact_id', 'document_asset_id'],
  ['product-asset', 'product_facts_assets_links', 'product_facts_assets_lnk', 'product_facts', 'fact_id', 'product_fact_id', 'document_assets', 'fact_id', 'document_asset_id'],
  ['product-certification', 'product_facts_certifications_links', 'product_facts_certifications_lnk', 'product_facts', 'fact_id', 'product_fact_id', 'certifications', 'code', 'certification_id'],
  ['blog-product', 'blog_posts_related_products_links', 'blog_posts_related_products_lnk', 'blog_posts', 'post_id', 'blog_post_id', 'product_facts', 'fact_id', 'product_fact_id'],
  ['blog-category', 'blog_posts_related_categories_links', 'blog_posts_related_categories_lnk', 'blog_posts', 'post_id', 'blog_post_id', 'category_facts', 'fact_id', 'category_fact_id'],
  ['blog-industry', 'blog_posts_related_industries_links', 'blog_posts_related_industries_lnk', 'blog_posts', 'post_id', 'blog_post_id', 'industry_facts', 'fact_id', 'industry_fact_id'],
  ['blog-application', 'blog_posts_related_applications_links', 'blog_posts_related_applications_lnk', 'blog_posts', 'post_id', 'blog_post_id', 'application_facts', 'fact_id', 'application_fact_id'],
  ['blog-intent', 'blog_posts_intent_phrases_links', 'blog_posts_intent_phrases_lnk', 'blog_posts', 'post_id', 'blog_post_id', 'intent_phrases', 'phrase_id', 'intent_phrase_id'],
  ['case-product', 'case_studies_products_links', 'case_studies_products_lnk', 'case_studies', 'case_id', 'case_study_id', 'product_facts', 'fact_id', 'product_fact_id'],
  ['case-industry', 'case_studies_industries_links', 'case_studies_industries_lnk', 'case_studies', 'case_id', 'case_study_id', 'industry_facts', 'fact_id', 'industry_fact_id'],
  ['case-application', 'case_studies_applications_links', 'case_studies_applications_lnk', 'case_studies', 'case_id', 'case_study_id', 'application_facts', 'fact_id', 'application_fact_id'],
  ['case-document', 'case_studies_supporting_documents_links', 'case_studies_supporting_documents_lnk', 'case_studies', 'case_id', 'case_study_id', 'document_assets', 'fact_id', 'document_asset_id'],
  ['case-intent', 'case_studies_intent_phrases_links', 'case_studies_intent_phrases_lnk', 'case_studies', 'case_id', 'case_study_id', 'intent_phrases', 'phrase_id', 'intent_phrase_id'],
  ['manual-document', 'product_manuals_document_links', 'product_manuals_document_lnk', 'product_manuals', 'manual_id', 'product_manual_id', 'document_assets', 'fact_id', 'document_asset_id'],
  ['manual-product', 'product_manuals_products_links', 'product_manuals_products_lnk', 'product_manuals', 'manual_id', 'product_manual_id', 'product_facts', 'fact_id', 'product_fact_id'],
  ['manual-category', 'product_manuals_related_categories_links', 'product_manuals_related_categories_lnk', 'product_manuals', 'manual_id', 'product_manual_id', 'category_facts', 'fact_id', 'category_fact_id'],
  ['manual-intent', 'product_manuals_intent_phrases_links', 'product_manuals_intent_phrases_lnk', 'product_manuals', 'manual_id', 'product_manual_id', 'intent_phrases', 'phrase_id', 'intent_phrase_id'],
  ['intent-product', 'intent_phrases_products_links', 'intent_phrases_products_lnk', 'intent_phrases', 'phrase_id', 'intent_phrase_id', 'product_facts', 'fact_id', 'product_fact_id'],
  ['intent-category', 'intent_phrases_categories_links', 'intent_phrases_categories_lnk', 'intent_phrases', 'phrase_id', 'intent_phrase_id', 'category_facts', 'fact_id', 'category_fact_id'],
  ['intent-industry', 'intent_phrases_industries_links', 'intent_phrases_industries_lnk', 'intent_phrases', 'phrase_id', 'intent_phrase_id', 'industry_facts', 'fact_id', 'industry_fact_id'],
  ['intent-application', 'intent_phrases_applications_links', 'intent_phrases_applications_lnk', 'intent_phrases', 'phrase_id', 'intent_phrase_id', 'application_facts', 'fact_id', 'application_fact_id'],
].map(([name, sourceTable, targetTable, leftTable, leftStableColumn, leftForeignKey, rightTable, rightStableColumn, rightForeignKey]) => ({ name, sourceTable, targetTable, leftTable, leftStableColumn, leftForeignKey, rightTable, rightStableColumn, rightForeignKey }))

assertNodeVersion()
const args = readArgs(process.argv.slice(2))
const cmsRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const workspaceRoot = dirname(cmsRoot)
const env = await readDotEnv(resolve(cmsRoot, '.env'))
const reportPath = resolve(args.report ?? resolve(workspaceRoot, 'tmp', 'strapi-v5-locale', `${args.targetDatabase}-phase3-equivalence.json`))
assertTargetDatabase(args.targetDatabase)

const credentials = {
  user: args.username ?? env.DATABASE_USERNAME ?? 'strapi',
  password: readPassword(args, env),
}
const source = new pg.Client({
  ...credentials,
  host: args.sourceHost ?? '127.0.0.1',
  port: parsePort(args.sourcePort ?? '5432'),
  database: args.sourceDatabase ?? SOURCE_DATABASE,
})
const target = new pg.Client({
  ...credentials,
  host: args.targetHost ?? '127.0.0.1',
  port: parsePort(args.targetPort ?? '55432'),
  database: args.targetDatabase,
})

await Promise.all([source.connect(), target.connect()])
try {
  const [sourceSnapshot, targetSnapshot] = await Promise.all([readSnapshot(source, 'v4'), readSnapshot(target, 'v5')])
  const failures = []
  assertSnapshots(sourceSnapshot, targetSnapshot, failures)

  const report = {
    verification: 'strapi-v5-phase3-production-equivalence-v1',
    executedAt: new Date().toISOString(),
    node: process.version,
    source: { database: source.database, host: source.host, port: source.port },
    target: { database: target.database, host: target.host, port: target.port },
    ok: failures.length === 0,
    failures,
    sourceSnapshot,
    targetSnapshot,
  }
  await mkdir(dirname(reportPath), { recursive: true })
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  console.log(JSON.stringify({ ok: report.ok, failures, reportPath, tables: targetSnapshot.tables, media: targetSnapshot.media }, null, 2))
  if (failures.length) process.exitCode = 1
} finally {
  await Promise.all([source.end(), target.end()])
}

function assertNodeVersion() {
  if (process.versions.node !== REQUIRED_NODE_VERSION) throw new Error(`This verifier must run with Node ${REQUIRED_NODE_VERSION}; received ${process.versions.node}.`)
}

function readArgs(argv) {
  const result = {}
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === '--help' || value === '-h') {
      console.log('Usage: node scripts/verify-phase3-production-equivalence.mjs --target-database industrial_cms_v5_locale_phase3_<new_name> --target-port 55432')
      process.exit(0)
    }
    if (!value.startsWith('--')) throw new Error(`Unknown argument '${value}'.`)
    const name = value.slice(2)
    const next = argv[index + 1]
    if (!next || next.startsWith('--')) throw new Error(`Argument --${name} requires a value.`)
    if (!['source-database', 'source-host', 'source-port', 'target-database', 'target-host', 'target-port', 'username', 'password-env', 'report'].includes(name)) throw new Error(`Unknown argument --${name}.`)
    result[name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = next
    index += 1
  }
  if (!result.targetDatabase) throw new Error('Pass --target-database industrial_cms_v5_locale_phase3_<new_name>.')
  return result
}

function assertTargetDatabase(value) {
  if (!TARGET_DATABASE_PATTERN.test(value)) throw new Error(`Refusing target database '${value}'. Use a new industrial_cms_v5_locale_phase3_* database only.`)
}

function parsePort(value) {
  const port = Number.parseInt(String(value), 10)
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`Invalid port '${value}'.`)
  return port
}

function readPassword(args, env) {
  const name = args.passwordEnv ?? 'PGPASSWORD'
  const password = process.env[name] ?? env[name] ?? env.DATABASE_PASSWORD
  if (!password) throw new Error(`Database password is missing. Set ${name} through the environment or local Strapi .env.`)
  return password
}

async function readSnapshot(client, version) {
  const tables = {}
  for (const descriptor of REQUIRED_TABLES) tables[descriptor.table] = await readTable(client, descriptor, version)
  const relations = {}
  for (const spec of RELATION_SPECS) relations[spec.name] = await readRelation(client, spec, version)
  return {
    tables,
    relations,
    media: await readMedia(client, version),
    systemLocales: version === 'v5' ? await readSystemLocales(client) : undefined,
  }
}

async function readTable(client, descriptor, version) {
  const businessColumn = descriptor.businessLocale ? (version === 'v4' ? 'locale' : 'content_locale') : undefined
  const documentExpression = version === 'v5' ? 'document_id::text AS document_id,' : ''
  const systemLocaleExpression = version === 'v5' ? 'locale::text AS system_locale,' : ''
  const query = `SELECT "${descriptor.stableColumn}"::text AS stable_id, ${businessColumn ? `${businessColumn}::text AS business_locale,` : 'NULL::text AS business_locale,'} ${documentExpression} ${systemLocaleExpression} (published_at IS NOT NULL) AS is_published FROM "${descriptor.table}" ORDER BY "${descriptor.stableColumn}", id`
  const rows = (await client.query(query)).rows.map((row) => ({
    stableId: row.stable_id,
    businessLocale: row.business_locale ?? null,
    documentId: row.document_id ?? null,
    systemLocale: row.system_locale ?? null,
    published: row.is_published,
  }))
  const byStableId = new Map()
  for (const row of rows) {
    const group = byStableId.get(row.stableId) ?? []
    group.push(row)
    byStableId.set(row.stableId, group)
  }
  const records = [...byStableId.entries()].map(([stableId, group]) => ({
    stableId,
    physicalRows: group.length,
    publishedRows: group.filter((row) => row.published).length,
    businessLocales: unique(group.map((row) => row.businessLocale)),
    systemLocales: unique(group.map((row) => row.systemLocale)),
    documentIds: unique(group.map((row) => row.documentId)),
  })).sort((left, right) => left.stableId.localeCompare(right.stableId, 'en'))
  return {
    physicalRows: rows.length,
    stableRecords: records.length,
    publishedStableRecords: records.filter((record) => record.publishedRows > 0).length,
    businessLocaleDistribution: distribution(records.flatMap((record) => record.businessLocales)),
    stableIdsChecksum: checksum(records.map((record) => record.stableId)),
    records,
  }
}

async function readRelation(client, spec, version) {
  const table = version === 'v4' ? spec.sourceTable : spec.targetTable
  const query = `SELECT DISTINCT left_row."${spec.leftStableColumn}"::text || chr(31) || right_row."${spec.rightStableColumn}"::text AS signature FROM "${table}" rel JOIN "${spec.leftTable}" left_row ON left_row.id = rel."${spec.leftForeignKey}" JOIN "${spec.rightTable}" right_row ON right_row.id = rel."${spec.rightForeignKey}" ORDER BY signature`
  const signatures = (await client.query(query)).rows.map((row) => row.signature)
  return { count: signatures.length, checksum: checksum(signatures), signatures }
}

async function readMedia(client, version) {
  const relationTable = version === 'v4' ? 'files_related_morphs' : 'files_related_mph'
  const count = await client.query(`SELECT count(*)::int AS count FROM "${relationTable}" WHERE related_type = 'api::document-asset.document-asset' AND field = 'file'`)
  const fileCount = await client.query('SELECT count(*)::int AS count FROM files')
  return { relationTable, documentAssetFileReferences: count.rows[0].count, fileRows: fileCount.rows[0].count }
}

async function readSystemLocales(client) {
  return (await client.query('SELECT code FROM i18n_locale ORDER BY code')).rows.map((row) => row.code)
}

function assertSnapshots(source, target, failures) {
  for (const descriptor of REQUIRED_TABLES) {
    const sourceTable = source.tables[descriptor.table]
    const targetTable = target.tables[descriptor.table]
    if (sourceTable.stableRecords !== targetTable.stableRecords) failures.push(`${descriptor.table}: stable record count differs (${sourceTable.stableRecords} vs ${targetTable.stableRecords})`)
    if (sourceTable.stableIdsChecksum !== targetTable.stableIdsChecksum) failures.push(`${descriptor.table}: stable ID checksum differs`)
    const sourceById = new Map(sourceTable.records.map((record) => [record.stableId, record]))
    for (const record of targetTable.records) {
      const sourceRecord = sourceById.get(record.stableId)
      if (!sourceRecord) continue
      const expectedRows = sourceRecord.publishedRows > 0 ? 2 : 1
      if (record.physicalRows !== expectedRows) failures.push(`${descriptor.table}:${record.stableId}: expected ${expectedRows} physical v5 rows, received ${record.physicalRows}`)
      if (record.publishedRows !== (sourceRecord.publishedRows > 0 ? 1 : 0)) failures.push(`${descriptor.table}:${record.stableId}: publication state differs`)
      if (record.documentIds.length !== 1 || !record.documentIds[0]) failures.push(`${descriptor.table}:${record.stableId}: expected exactly one v5 documentId`)
      if (descriptor.businessLocale) {
        if (record.businessLocales.length !== 1 || record.businessLocales[0] !== sourceRecord.businessLocales[0]) failures.push(`${descriptor.table}:${record.stableId}: business locale mapping differs`)
        if (record.systemLocales.length !== 1 || record.systemLocales[0] !== null) failures.push(`${descriptor.table}:${record.stableId}: non-localized v5 system locale must be NULL`)
      }
    }
  }
  for (const spec of RELATION_SPECS) {
    const sourceRelation = source.relations[spec.name]
    const targetRelation = target.relations[spec.name]
    if (sourceRelation.count !== targetRelation.count || sourceRelation.checksum !== targetRelation.checksum) failures.push(`${spec.name}: stable relation signatures differ`)
  }
  if (source.media.documentAssetFileReferences !== target.media.documentAssetFileReferences) failures.push(`document asset media-reference count differs (${source.media.documentAssetFileReferences} vs ${target.media.documentAssetFileReferences})`)
}

function unique(values) { return [...new Set(values)].sort((left, right) => String(left).localeCompare(String(right), 'en')) }
function distribution(values) { const result = {}; for (const value of values) { const key = value ?? '<null>'; result[key] = (result[key] ?? 0) + 1 } return result }
function checksum(values) { return createHash('sha256').update(values.join('\n')).digest('hex') }

async function readDotEnv(path) {
  try {
    const values = {}
    for (const line of (await readFile(path, 'utf8')).split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)=(.*)$/)
      if (match) values[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
    }
    return values
  } catch { return {} }
}
