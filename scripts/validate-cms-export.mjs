import { readFile } from 'node:fs/promises'
import { normalizeCmsFactInput, CmsFactValidationError } from '../adapter/product.adapter.ts'
import { generateCmsFacts } from './scale-fixtures.mjs'

const input = await readCmsFactExportInput()

try {
  const normalizedInput = normalizeCmsFactInput(input)

  console.log(JSON.stringify({
    ok: true,
    source: getInputSourceLabel(),
    categoryFacts: normalizedInput.categoryFacts.length,
    productFacts: normalizedInput.productFacts.length,
  }, null, 2))
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    source: getInputSourceLabel(),
    error: serializeError(error),
  }, null, 2))
  process.exit(1)
}

async function readCmsFactExportInput() {
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

  return generateCmsFacts(Number(readFlagValue('--count') ?? 300))
}

function getInputSourceLabel() {
  if (readFlagValue('--file')) {
    return 'file'
  }

  if (process.env.CMS_FACTS_JSON?.trim()) {
    return 'CMS_FACTS_JSON'
  }

  if (!process.stdin.isTTY) {
    return 'stdin'
  }

  return 'scale-fixture'
}

function serializeError(error) {
  if (error instanceof CmsFactValidationError) {
    return {
      name: error.name,
      path: error.path,
      message: error.message,
    }
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    }
  }

  return {
    name: 'UnknownError',
    message: String(error),
  }
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
