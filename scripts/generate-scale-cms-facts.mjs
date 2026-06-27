import { writeFile } from 'node:fs/promises'
import { buildDomainFromCmsFacts } from '../adapter/product.adapter.ts'
import { generateCmsFacts } from './scale-fixtures.mjs'
import { summarizeScaleRisks } from './scale-risk-summary.mjs'

const count = Number(readFlagValue('--count') ?? 300)
const outputPath = readFlagValue('--out')
const shouldValidate = process.argv.includes('--validate')
const facts = generateCmsFacts(count)

if (shouldValidate) {
  const domain = buildDomainFromCmsFacts(facts)

  console.log(JSON.stringify({
    ok: true,
    generatedProductFacts: facts.productFacts.length,
    generatedCategoryFacts: facts.categoryFacts.length,
    convertedProductRecords: domain.products.length,
    categoryTreeVersion: domain.categoryTree.version,
    duplicateRisks: summarizeScaleRisks(facts, domain),
  }, null, 2))
} else if (outputPath) {
  await writeFile(outputPath, `${JSON.stringify(facts, null, 2)}\n`)
  console.log(JSON.stringify({ ok: true, outputPath, productFacts: facts.productFacts.length }, null, 2))
} else {
  console.log(JSON.stringify(facts, null, 2))
}

function readFlagValue(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

export { generateCmsFacts } from './scale-fixtures.mjs'
