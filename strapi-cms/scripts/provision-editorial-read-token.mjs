import { createRequire } from 'node:module'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const tokenName = 'Frontend editorial read-only'
const cmsRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const workspaceRoot = dirname(cmsRoot)
const environmentPath = join(workspaceRoot, '.env.local')
const require = createRequire(join(cmsRoot, 'package.json'))
const { createStrapi } = require('@strapi/core')

process.chdir(cmsRoot)
const app = await createStrapi({ appDir: cmsRoot, distDir: join(cmsRoot, 'dist') }).load()
let createdToken
let environmentUpdated = false

try {
  const tokenService = app.service('admin::api-token-content-api')
  const previousTokens = await app.db.query('admin::api-token').findMany({
    select: ['id'],
    where: { name: tokenName },
  })

  createdToken = await tokenService.create({
    name: `${tokenName} ${Date.now()}`,
    description: 'Read-only token used by the Next.js editorial resource reader.',
    type: 'read-only',
    lifespan: null,
  })

  if (!createdToken.accessKey || typeof createdToken.accessKey !== 'string') {
    throw new Error('Strapi did not return an access key for the editorial read-only token.')
  }

  await updateFrontendEnvironment(createdToken.accessKey)
  environmentUpdated = true

  for (const previousToken of previousTokens) {
    await tokenService.revoke(previousToken.id)
  }

  await tokenService.update(createdToken.id, {
    name: tokenName,
    description: 'Read-only token used by the Next.js editorial resource reader.',
    type: 'read-only',
  })

  console.log(JSON.stringify({
    ok: true,
    tokenId: createdToken.id,
    rotatedTokenCount: previousTokens.length,
    environmentPath,
  }, null, 2))
} catch (error) {
  if (createdToken && !environmentUpdated) {
    await app.service('admin::api-token-content-api').revoke(createdToken.id)
  }

  throw error
} finally {
  await destroyStrapiApp(app)
}

async function updateFrontendEnvironment(accessKey) {
  let current = ''

  try {
    current = await readFile(environmentPath, 'utf8')
  } catch (error) {
    if (!isMissingFile(error)) {
      throw error
    }
  }

  const newline = current.includes('\r\n') ? '\r\n' : '\n'
  const trailingNewline = current.endsWith('\n')
  const lines = current ? current.split(/\r?\n/) : []
  if (trailingNewline) {
    lines.pop()
  }

  const nextLines = setEnvironmentValue(lines, 'CMS_RESOURCES_API_TOKEN', accessKey)
  const finalLines = setEnvironmentValue(nextLines, 'CMS_STRAPI_API_VERSION', '5')
  const next = `${finalLines.join(newline)}${newline}`
  const temporaryPath = `${environmentPath}.${process.pid}.tmp`

  await mkdir(dirname(environmentPath), { recursive: true })
  await writeFile(temporaryPath, next, { encoding: 'utf8', mode: 0o600 })
  await rename(temporaryPath, environmentPath)
}

function setEnvironmentValue(lines, name, value) {
  const matcher = new RegExp(`^(\\s*${escapeRegExp(name)})=.*$`)
  let replaced = false
  const updated = lines.map((line) => {
    if (!matcher.test(line)) {
      return line
    }

    replaced = true
    return `${name}=${value}`
  })

  return replaced ? updated : [...updated, `${name}=${value}`]
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isMissingFile(error) {
  return Boolean(error) && typeof error === 'object' && 'code' in error && error.code === 'ENOENT'
}

async function destroyStrapiApp(instance) {
  try {
    await instance.destroy()
  } catch (error) {
    if (!(error instanceof Error) || (error.message !== 'aborted' && error.name !== 'KnexTimeoutError')) {
      throw error
    }
  }
}
