import { readFile } from 'node:fs/promises'
import { buildDomainFromCmsFacts, normalizeCmsFactInput } from '../adapter/product.adapter.ts'
import { sensorValveCmsFactInput } from '../adapter/cms-fact-family.fixture.ts'
import { generateCmsFacts } from './scale-fixtures.mjs'
import { summarizeScaleRisks } from './scale-risk-summary.mjs'

const sourceSummary = summarizeCmsFactsInput(await readCmsFactsInput(), getInputSourceLabel())
const familyFixtureSummary = summarizeCmsFactsInput(sensorValveCmsFactInput, 'sensor-valve-fixture')
const errors = []

validateSensorValveFixture(familyFixtureSummary.domain, errors)

if (errors.length) {
  console.error(JSON.stringify({ ok: false, source: sourceSummary.summary.source, errors }, null, 2))
  process.exit(1)
}

const summary = {
  ok: true,
  ...sourceSummary.summary,
  validatedInputs: [sourceSummary.summary.source, familyFixtureSummary.summary.source],
  fixtures: [familyFixtureSummary.summary],
}

console.log(JSON.stringify(summary, null, 2))

function summarizeCmsFactsInput(input, source) {
  const normalizedInput = normalizeCmsFactInput(input)
  const domain = buildDomainFromCmsFacts(normalizedInput)

  return {
    normalizedInput,
    domain,
    summary: {
      source,
      categoryFacts: normalizedInput.categoryFacts.length,
      productFacts: normalizedInput.productFacts.length,
      categoryTreeVersion: domain.categoryTree.version,
      productRecords: domain.products.length,
      productFamilies: countProductFamilies(domain.products),
      generatedSeoRecords: domain.products.filter((product) => product.seo?.jsonLd && product.seo.slug?.canonicalPath).length,
      generatedGeoRecords: domain.products.filter((product) => product.geoAi?.entity && product.geoAi.factTable.length).length,
      duplicateRisks: summarizeScaleRisks(normalizedInput, domain),
    },
  }
}

function validateSensorValveFixture(domain, errors) {
  const sensor = domain.products.find((product) => product.core.family === 'sensor')
  const valve = domain.products.find((product) => product.core.family === 'valve')

  if (!sensor) {
    errors.push('sensor-valve fixture must include a sensor product')
  }

  if (!valve) {
    errors.push('sensor-valve fixture must include a valve product')
  }

  if (sensor && (!sensor.sensorProfile || !sensor.measurements.length || sensor.measurements.some((measurement) => !measurement.overloadLimit) || !sensor.outputs.length)) {
    errors.push(`${sensor.identity.id}: fixture sensor must retain measurement, overloadLimit, and output coverage`)
  }

  if (valve && (!valve.valveProfile || valve.measurements.length || valve.outputs.length || valve.connections)) {
    errors.push(`${valve.identity.id}: fixture valve must validate without measurements, outputs, or electrical connections`)
  }
}

function countProductFamilies(products) {
  return products.reduce((families, product) => {
    families[product.core.family] = (families[product.core.family] ?? 0) + 1
    return families
  }, {})
}

async function readCmsFactsInput() {
  const filePath = readFlagValue('--file')

  if (filePath) {
    return JSON.parse(await readFile(filePath, 'utf8'))
  }

  if (process.env.CMS_FACTS_JSON?.trim()) {
    return JSON.parse(process.env.CMS_FACTS_JSON)
  }

  const stdin = await readStdin()

  if (stdin.trim()) {
    return JSON.parse(stdin)
  }

  const count = Number(readFlagValue('--count') ?? 300)
  return generateCmsFacts(count)
}

function getInputSourceLabel() {
  if (readFlagValue('--file')) {
    return 'file'
  }

  if (process.env.CMS_FACTS_JSON?.trim()) {
    return 'CMS_FACTS_JSON'
  }

  return 'scale-fixture'
}

function readFlagValue(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

async function readStdin() {
  if (process.stdin.isTTY) {
    return ''
  }

  let value = ''
  process.stdin.setEncoding('utf8')

  for await (const chunk of process.stdin) {
    value += chunk
  }

  return value
}
