import { readFile } from 'node:fs/promises'
import { buildDomainFromCmsFacts, normalizeCmsFactInput } from '../adapter/product.adapter.ts'
import { generateCmsFacts } from './scale-fixtures.mjs'
import { summarizeScaleRisks } from './scale-risk-summary.mjs'

const input = await readCmsFactsInput()
const normalizedInput = normalizeCmsFactInput(input)
const domain = buildDomainFromCmsFacts(normalizedInput)

const summary = {
  ok: true,
  source: getInputSourceLabel(),
  categoryFacts: normalizedInput.categoryFacts.length,
  productFacts: normalizedInput.productFacts.length,
  categoryTreeVersion: domain.categoryTree.version,
  productRecords: domain.products.length,
  generatedSeoRecords: domain.products.filter((product) => product.seo?.jsonLd && product.seo.slug?.canonicalPath).length,
  generatedGeoRecords: domain.products.filter((product) => product.geoAi?.entity && product.geoAi.factTable.length).length,
  duplicateRisks: summarizeScaleRisks(normalizedInput, domain),
}

console.log(JSON.stringify(summary, null, 2))

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
