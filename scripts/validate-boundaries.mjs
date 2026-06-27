import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import * as ts from 'typescript'

const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs'])
const rules = [
  'no lib/cms imports',
  'no adapter imports',
  'no raw-facts imports',
  'no Strapi imports',
  'no CMS_FACTS_JSON in boundary layers',
  'no public CMS/Strapi/webhook/facts env variables in boundary layers',
]

export function getDefaultBoundaryTargetRoots(workspaceRoot = process.cwd()) {
  return [
    { label: 'components', dir: path.join(workspaceRoot, 'components') },
    { label: 'app/[locale]', dir: path.join(workspaceRoot, 'app', '[locale]') },
    { label: 'lib/seo', dir: path.join(workspaceRoot, 'lib', 'seo') },
    { label: 'lib/geo', dir: path.join(workspaceRoot, 'lib', 'geo') },
  ]
}

export async function validateBoundaryRules(options = {}) {
  const workspaceRoot = options.workspaceRoot ?? process.cwd()
  const targetRoots = options.targetRoots ?? getDefaultBoundaryTargetRoots(workspaceRoot)
  const violations = []
  let filesChecked = 0

  for (const root of targetRoots) {
    const rootStat = await stat(root.dir).catch(() => null)

    if (!rootStat?.isDirectory()) {
      violations.push(formatViolation(root.label, '<root>', 'missing boundary root directory'))
      continue
    }

    for await (const filePath of walk(root.dir)) {
      filesChecked += 1
      const source = await readFile(filePath, 'utf8')
      analyzeFile(root.label, filePath, source, violations, workspaceRoot)
    }
  }

  return {
    ok: violations.length === 0,
    filesChecked,
    roots: targetRoots.map((root) => root.label),
    rules,
    violations,
  }
}

if (isCliEntrypoint()) {
  const result = await validateBoundaryRules()

  if (!result.ok) {
    console.error(JSON.stringify(result, null, 2))
    process.exit(1)
  }

  console.log(JSON.stringify(result, null, 2))
}

async function* walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
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

function analyzeFile(rootLabel, filePath, source, output, workspaceRoot) {
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, getScriptKind(filePath))

  if (/\bprocess\.env\.CMS_FACTS_JSON\b/.test(source)) {
    output.push(formatViolation(rootLabel, toWorkspaceRelative(filePath, workspaceRoot), 'raw facts env access via process.env.CMS_FACTS_JSON'))
  }

  const publicEnvMatches = source.match(/\bprocess\.env\.(NEXT_PUBLIC_[A-Z0-9_]*(?:CMS|STRAPI|WEBHOOK|FACTS)[A-Z0-9_]*)\b/g) ?? []

  for (const match of publicEnvMatches) {
    output.push(formatViolation(rootLabel, toWorkspaceRelative(filePath, workspaceRoot), `public CMS/Strapi/webhook/facts env access (${match})`))
  }

  for (const { specifier, kind } of collectModuleSpecifiers(sourceFile)) {
    const issue = classifySpecifier(filePath, specifier, workspaceRoot)

    if (issue) {
      output.push(formatViolation(rootLabel, toWorkspaceRelative(filePath, workspaceRoot), `${kind}: ${issue} (${specifier})`))
    }
  }
}

function collectModuleSpecifiers(sourceFile) {
  const moduleSpecifiers = []

  function visit(node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      const specifier = node.moduleSpecifier

      if (specifier && ts.isStringLiteralLike(specifier)) {
        moduleSpecifiers.push({ kind: ts.isImportDeclaration(node) ? 'import' : 'export', specifier: specifier.text })
      }
    }

    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const [argument] = node.arguments

      if (argument && ts.isStringLiteralLike(argument)) {
        moduleSpecifiers.push({ kind: 'dynamic import', specifier: argument.text })
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return moduleSpecifiers
}

function classifySpecifier(filePath, specifier, workspaceRoot) {
  if (/strapi/i.test(specifier)) {
    return 'forbidden Strapi import'
  }

  const resolved = resolveSpecifier(filePath, specifier, workspaceRoot)

  if (!resolved) {
    return null
  }

  const relativePath = normalizePath(path.relative(workspaceRoot, resolved))

  if (isForbiddenPath(relativePath, /(^|\/)adapter(\/|$)/)) {
    return 'forbidden adapter import'
  }

  if (isForbiddenPath(relativePath, /(^|\/)lib\/cms(\/|$)/)) {
    return 'forbidden lib/cms import'
  }

  if (isForbiddenPath(relativePath, /(^|\/)(mock-products|scale-fixtures|generate-scale-cms-facts|validate-cms-facts|validate-cms-export)(\/|$)/)) {
    return 'forbidden raw facts import'
  }

  return null
}

function resolveSpecifier(filePath, specifier, workspaceRoot) {
  if (specifier.startsWith('@/')) {
    return path.resolve(workspaceRoot, specifier.slice(2))
  }

  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    return path.resolve(path.dirname(filePath), specifier)
  }

  if (path.isAbsolute(specifier)) {
    return specifier
  }

  return null
}

function isForbiddenPath(relativePath, pattern) {
  return pattern.test(normalizePath(relativePath))
}

function toWorkspaceRelative(filePath, workspaceRoot) {
  return normalizePath(path.relative(workspaceRoot, filePath))
}

function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/')
}

function getScriptKind(filePath) {
  switch (path.extname(filePath)) {
    case '.ts':
      return ts.ScriptKind.TS
    case '.tsx':
      return ts.ScriptKind.TSX
    case '.jsx':
      return ts.ScriptKind.JSX
    default:
      return ts.ScriptKind.JS
  }
}

function formatViolation(rootLabel, file, message) {
  return {
    root: rootLabel,
    file,
    message,
  }
}

function isCliEntrypoint() {
  return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href
}
