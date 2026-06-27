export function summarizeScaleRisks(input, domain) {
  const categoryIdDuplicates = findDuplicates(input.categoryFacts.map((fact) => fact.id))
  const productIdDuplicates = findDuplicates(input.productFacts.map((fact) => fact.id))
  const skuDuplicates = findDuplicates(input.productFacts.map((fact) => fact.sku))
  const modelDuplicates = findDuplicates(input.productFacts.map((fact) => fact.model))
  const documentIds = input.productFacts.flatMap((fact) => fact.documents.map((document) => document.id))
  const documentDuplicates = findDuplicates(documentIds)
  const overloadLimitRisk = summarizeOverloadLimitRisk(input.productFacts)
  const categoryIds = new Set(domain.categoryTree ? flattenCategories(domain.categoryTree.root).map((category) => category.id) : [])
  const missingCategories = input.productFacts.reduce((accumulator, fact) => {
    if (!categoryIds.has(fact.primaryCategoryId)) {
      accumulator.push(fact.primaryCategoryId)
    }

    for (const categoryId of fact.additionalCategoryIds ?? []) {
      if (!categoryIds.has(categoryId)) {
        accumulator.push(categoryId)
      }
    }

    return accumulator
  }, [])

  return {
    categoryIdDuplicates,
    productIdDuplicates,
    skuDuplicates,
    modelDuplicates,
    documentDuplicates,
    missingCategories: findDuplicates(missingCategories),
    productsMissingOverloadLimit: overloadLimitRisk.missingCount,
    overloadLimitRisk,
  }
}

function summarizeOverloadLimitRisk(productFacts) {
  const signatures = new Map()
  let missingCount = 0
  let measurementCount = 0

  for (const fact of productFacts) {
    for (const measurement of fact.measurements) {
      measurementCount += 1

      if (!measurement.overloadLimit) {
        missingCount += 1
        continue
      }

      const signature = [
        measurement.kind,
        measurement.range.min,
        measurement.range.max,
        measurement.range.unit,
        measurement.overloadLimit.value,
        measurement.overloadLimit.unit ?? '',
      ].join('|')
      const entry = signatures.get(signature) ?? {
        signature,
        count: 0,
        sampleProductIds: [],
      }

      entry.count += 1

      if (entry.sampleProductIds.length < 5 && !entry.sampleProductIds.includes(fact.id)) {
        entry.sampleProductIds.push(fact.id)
      }

      signatures.set(signature, entry)
    }
  }

  const duplicateSignatures = [...signatures.values()]
    .filter((entry) => entry.count > 1)
    .sort((left, right) => right.count - left.count || left.signature.localeCompare(right.signature))

  return {
    measurementCount,
    missingCount,
    uniqueSignatureCount: signatures.size,
    duplicateSignatureCount: duplicateSignatures.length,
    duplicateMeasurementCount: duplicateSignatures.reduce((sum, entry) => sum + entry.count - 1, 0),
    duplicateSignatures: duplicateSignatures.slice(0, 20),
  }
}

function findDuplicates(values) {
  const seen = new Set()
  const duplicates = new Set()

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value)
      continue
    }

    seen.add(value)
  }

  return [...duplicates]
}

function flattenCategories(root) {
  return [root, ...(root.children ?? []).flatMap((child) => flattenCategories(child))]
}
