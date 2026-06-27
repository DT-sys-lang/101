import type {
  CategoryCanonicalPath,
  CategoryFacetKey,
  CategoryId,
  CategoryKind,
  CategoryNode,
  CategoryTree,
  CategoryDepth,
  LocaleCode,
  LocalizedText,
  NonEmptyReadonlyArray,
  SeoBreadcrumbItem,
  SeoSlugPath,
  SlugSegment,
} from '@/lib/domain'
import { localizeText } from '@/lib/domain'
import {
  localizeFactText,
  normalizeAdapterConfig,
  normalizeSlug,
  reject,
  toNonEmptyArray,
  validateCategoryFacts,
  type AdapterConfig,
  type CategoryFact,
  type CategoryFactGraph,
  type CmsFactAdapterOptions,
} from './validation'

export interface CategoryContext {
  readonly graph: CategoryFactGraph
  readonly tree: CategoryTree
  readonly byId: ReadonlyMap<CategoryId, CategoryNode>
  readonly pathById: ReadonlyMap<CategoryId, NonEmptyReadonlyArray<CategoryNode>>
  readonly locales: NonEmptyReadonlyArray<LocaleCode>
  readonly defaultLocale: LocaleCode
  readonly depthById: ReadonlyMap<CategoryId, number>
}

const defaultCategoryIndexKeys = [
  'measurementRange',
  'outputSignal',
  'processConnection',
  'electricalConnection',
  'accuracyClass',
  'ingressProtection',
  'mediaCompatibility',
  'certification',
  'industry',
  'availability',
] as const satisfies readonly CategoryFacetKey[]

export function buildCategoryContext(facts: readonly CategoryFact[], options: CmsFactAdapterOptions = {}): CategoryContext {
  const config = normalizeAdapterConfig(options)
  const graph = validateCategoryFacts(facts, options)
  const byId = new Map<CategoryId, CategoryNode>()
  const pathById = new Map<CategoryId, NonEmptyReadonlyArray<CategoryNode>>()
  const root = buildCategoryNode(graph.rootFact, [], graph, config, byId, pathById, 0)

  return {
    graph,
    tree: {
      version: 'category-tree-v1',
      root,
      indexKeys: defaultCategoryIndexKeys,
      maxDepth: 4,
    },
    byId,
    pathById,
    locales: config.locales,
    defaultLocale: config.defaultLocale,
    depthById: graph.depthById,
  }
}

export function buildCategoryTreeFromFacts(facts: readonly CategoryFact[], options: CmsFactAdapterOptions = {}): CategoryTree {
  return buildCategoryContext(facts, options).tree
}

export function buildCategoryTreeWithBreadcrumbs(facts: readonly CategoryFact[], options: CmsFactAdapterOptions = {}): CategoryContext {
  return buildCategoryContext(facts, options)
}

export function buildCategoryBreadcrumb(
  context: CategoryContext,
  categoryId: CategoryId,
  locale: LocaleCode = context.defaultLocale,
): NonEmptyReadonlyArray<SeoBreadcrumbItem> {
  const categoryPath = context.pathById.get(categoryId)

  if (!categoryPath) {
    reject(`categoryFacts.${categoryId}`, `unknown category '${categoryId}'`)
  }

  return toNonEmptyArray(
    categoryPath.map((category) => ({
      label: localizeText(category.name, locale),
      canonicalPath: category.canonicalPath,
      categoryId: category.id,
    })),
    `categoryFacts.${categoryId}.breadcrumb`,
  )
}

export function flattenCategoryNodes(root: CategoryNode): readonly CategoryNode[] {
  const nodes: CategoryNode[] = []
  const stack: CategoryNode[] = [root]

  while (stack.length > 0) {
    const node = stack.pop()

    if (!node) {
      continue
    }

    nodes.push(node)

    for (const child of [...(node.children ?? [])].reverse()) {
      stack.push(child)
    }
  }

  return nodes
}

function buildCategoryNode(
  fact: CategoryFact,
  parentPath: readonly CategoryNode[],
  graph: CategoryFactGraph,
  config: AdapterConfig,
  byId: Map<CategoryId, CategoryNode>,
  pathById: Map<CategoryId, NonEmptyReadonlyArray<CategoryNode>>,
  sortOrder: number,
): CategoryNode {
  const localizedNames = buildLocalizedNames(fact.name, config.locales)
  const defaultLabel = localizedNames[config.defaultLocale]
  const slug = normalizeSlug(defaultLabel)

  if (!slug) {
    reject(`categoryFacts.${fact.id}.name.${config.defaultLocale}`, 'category name did not produce a valid slug')
  }

  const slugSegments = [...parentPath.map((category) => category.slug), slug as SlugSegment]
  const slugPath = slugSegments.join('/') as SeoSlugPath
  const canonicalPath = `/products/${slugPath}` as CategoryCanonicalPath
  const depth = parentPath.length as CategoryDepth
  const baseNode: CategoryNode = {
    id: fact.id,
    parentId: fact.parentId,
    depth,
    kind: inferCategoryKind(depth, defaultLabel),
    slug: slug as SlugSegment,
    slugPath,
    canonicalPath,
    name: fact.name,
    description: buildCategoryDescription(localizedNames, depth),
    sortOrder,
    facetKeys: inferCategoryFacetKeys(depth, defaultLabel),
    seo: {
      indexable: true,
      canonicalPath,
      titlePattern: '{category} | HEIYU Industrial',
      descriptionPattern: `Browse ${defaultLabel} by measurement type, connection, and application.`,
    },
  }

  const nodePath = toNonEmptyArray([...parentPath, baseNode], `categoryFacts.${fact.id}.path`)
  const children = (graph.childrenByParentId.get(fact.id) ?? []).map((childFact, index) =>
    buildCategoryNode(childFact, nodePath, graph, config, byId, pathById, (index + 1) * 10),
  )
  const node = children.length > 0 ? { ...baseNode, children } : baseNode

  byId.set(fact.id, node)
  pathById.set(fact.id, nodePath)

  return node
}

function buildLocalizedNames(name: LocalizedText, locales: readonly LocaleCode[]) {
  const result = {} as Record<LocaleCode, string>

  for (const locale of locales) {
    result[locale] = localizeFactText(name, locale)
  }

  return result
}

function buildCategoryDescription(localizedNames: Record<LocaleCode, string>, depth: number): LocalizedText {
  const suffix = depth === 0
    ? 'product catalog and selection hub.'
    : depth === 1
      ? 'products for industrial measurement and OEM selection.'
      : 'models and technical variants for comparison and specification review.'

  return {
    en: `${localizedNames.en} ${suffix}`,
    zh: `${localizedNames.zh} ${suffix}`,
  }
}

function inferCategoryKind(depth: number, label: string): CategoryKind {
  const normalizedLabel = label.toLowerCase()

  if (depth === 0) {
    return 'catalog-root'
  }

  if (normalizedLabel.includes('accessory')) {
    return 'accessory-group'
  }

  if (normalizedLabel.includes('series')) {
    return 'series-group'
  }

  if (depth === 1) {
    return 'measurement-family'
  }

  if (normalizedLabel.includes('switch')) {
    return 'product-function'
  }

  if (normalizedLabel.includes('temperature') || normalizedLabel.includes('pressure') || normalizedLabel.includes('level') || normalizedLabel.includes('flow')) {
    return 'measurement-principle'
  }

  return depth >= 3 ? 'series-group' : 'product-function'
}

function inferCategoryFacetKeys(depth: number, label: string): readonly CategoryFacetKey[] {
  const normalizedLabel = label.toLowerCase()

  if (depth === 0) {
    return ['industry', 'availability', 'certification']
  }

  if (depth === 1) {
    return ['measurementRange', 'outputSignal', 'processConnection', 'accuracyClass', 'ingressProtection']
  }

  if (normalizedLabel.includes('switch')) {
    return ['measurementRange', 'processConnection', 'electricalConnection', 'ingressProtection']
  }

  if (normalizedLabel.includes('temperature')) {
    return ['measurementRange', 'outputSignal', 'processConnection', 'certification']
  }

  if (normalizedLabel.includes('level')) {
    return ['measurementRange', 'outputSignal', 'mediaCompatibility', 'ingressProtection']
  }

  return ['measurementRange', 'outputSignal', 'processConnection', 'electricalConnection']
}
