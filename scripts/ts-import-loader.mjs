import { stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const scriptsDir = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(scriptsDir, '..')

export async function resolve(specifier, context, defaultResolve) {
  const basePath = toWorkspacePath(specifier, context.parentURL)

  if (basePath) {
    for (const candidate of getCandidates(basePath)) {
      if (await pathIsFile(candidate)) {
        return {
          shortCircuit: true,
          url: pathToFileURL(candidate).href,
        }
      }
    }
  }

  return defaultResolve(specifier, context, defaultResolve)
}

export async function load(url, context, defaultLoad) {
  if (url.endsWith('.json')) {
    const { readFile } = await import('node:fs/promises')
    const source = await readFile(fileURLToPath(url), 'utf8')

    return {
      format: 'module',
      shortCircuit: true,
      source: `export default ${source}\n`,
    }
  }

  return defaultLoad(url, context, defaultLoad)
}

function toWorkspacePath(specifier, parentUrl) {
  if (specifier.startsWith('file:')) {
    return fileURLToPath(specifier)
  }

  if (specifier.startsWith('@/')) {
    return path.join(workspaceRoot, specifier.slice(2))
  }

  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    const parentDir = parentUrl?.startsWith('file:') ? path.dirname(fileURLToPath(parentUrl)) : workspaceRoot
    return path.resolve(parentDir, specifier)
  }

  if (path.isAbsolute(specifier)) {
    return specifier
  }

  return null
}

function getCandidates(basePath) {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.mjs`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
    path.join(basePath, 'index.js'),
    path.join(basePath, 'index.mjs'),
  ]

  return [...new Set(candidates)]
}

async function pathIsFile(filePath) {
  try {
    return (await stat(filePath)).isFile()
  } catch {
    return false
  }
}
