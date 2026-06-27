import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'

const workspaceRoot = process.cwd()
const extensions = new Set(['.ts', '.tsx', '.mjs'])
const ignoredDirectories = new Set(['.git', '.next', 'node_modules'])
const removedLintCommand = ['next', 'lint'].join(' ')
const errors = []

for await (const filePath of walk(workspaceRoot)) {
  const source = await readText(filePath)
  validateTextFile(filePath, source)
}

if (errors.length) {
  console.error(JSON.stringify({ ok: false, errors }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({ ok: true, checked: 'ts-tsx-mjs-quality-gate' }, null, 2))

async function* walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) {
      continue
    }

    const fullPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      yield* walk(fullPath)
      continue
    }

    if (entry.isFile() && extensions.has(path.extname(entry.name))) {
      yield fullPath
    }
  }
}

async function readText(filePath) {
  const fileStat = await stat(filePath)

  if (fileStat.size > 1024 * 1024) {
    return ''
  }

  return (await import('node:fs/promises')).readFile(filePath, 'utf8')
}

function validateTextFile(filePath, source) {
  const relativePath = path.relative(workspaceRoot, filePath).replace(/\\/g, '/')

  if (source.includes('\t')) {
    errors.push(`${relativePath}: contains tab indentation`)
  }

  if (/console\.log\([^)]*TODO/i.test(source)) {
    errors.push(`${relativePath}: contains TODO console output`)
  }

  if (relativePath.endsWith('.tsx') && /<img\s/i.test(source)) {
    errors.push(`${relativePath}: use next/image instead of raw <img>`)
  }

  if (source.includes(removedLintCommand)) {
    errors.push(`${relativePath}: references removed Next.js lint command`)
  }
}
