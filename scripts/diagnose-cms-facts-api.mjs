import { readFile } from 'node:fs/promises'
import { diagnoseCmsFactsApi } from '../lib/cms/diagnostics.ts'

if (hasFlag('--help')) {
  printHelp()
  process.exit(0)
}

const envFile = readFlagValue('--env-file')

if (envFile) {
  await loadEnvFile(envFile)
}

const publicUrl = readTrimmedValue(process.env.PUBLIC_URL)
const internalFactsToken = readTrimmedValue(process.env.INTERNAL_CMS_FACTS_TOKEN)

if (!readTrimmedValue(process.env.CMS_FACTS_API_URL) && publicUrl) {
  process.env.CMS_FACTS_API_URL = `${publicUrl.replace(/\/+$/, '')}/internal/cms/facts`
}

if (!readTrimmedValue(process.env.CMS_FACTS_API_TOKEN) && internalFactsToken) {
  process.env.CMS_FACTS_API_TOKEN = internalFactsToken
}

if (!readTrimmedValue(process.env.CMS_SOURCE_MODE)) {
  process.env.CMS_SOURCE_MODE = 'cms-facts-api'
}

if (!readTrimmedValue(process.env.CMS_FACTS_API_ALLOW_FETCH)) {
  process.env.CMS_FACTS_API_ALLOW_FETCH = 'true'
}

const diagnostics = await diagnoseCmsFactsApi({
  endpoint: readFlagValue('--url'),
  token: readFlagValue('--token'),
  publicationState: normalizePublicationState(readFlagValue('--publication-state')),
})

console.log(JSON.stringify(diagnostics, null, 2))
process.exit(diagnostics.ok ? 0 : 1)

async function loadEnvFile(filePath) {
  const content = await readFile(filePath, 'utf8')

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')

    if (separatorIndex <= 0) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = unquoteEnvValue(trimmed.slice(separatorIndex + 1).trim())

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

function unquoteEnvValue(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
  }

  return value
}

function normalizePublicationState(value) {
  if (value === undefined) {
    return undefined
  }

  if (value === 'live' || value === 'preview') {
    return value
  }

  throw new Error('--publication-state must be live or preview.')
}

function readFlagValue(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function hasFlag(name) {
  return process.argv.includes(name)
}

function readTrimmedValue(value) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function printHelp() {
  console.log(`Usage:
  npm run diagnose:cms-facts-api -- --env-file deploy/production.env
  npm run diagnose:cms-facts-api -- --url https://cms.yufavor.com/internal/cms/facts --token <token>

Options:
  --env-file <path>             Load CMS env values from a production env file.
  --url <url>                   Override CMS_FACTS_API_URL.
  --token <token>               Override CMS_FACTS_API_TOKEN.
  --publication-state <state>   live or preview. Default: live.
`)
}
