export interface V5SystemLocaleObservation {
  readonly path: string
  readonly documentId: string
  readonly locale: unknown
}

export interface CmsBusinessLocaleNormalization {
  readonly cmsFacts: unknown
  readonly v5SystemLocales: readonly V5SystemLocaleObservation[]
}

export class BusinessLocaleCompatibilityError extends Error {
  constructor(path: string, message: string) {
    super(`${path}: ${message}`)
    this.name = 'BusinessLocaleCompatibilityError'
  }
}

/**
 * Projects the cross-version document locale shape into the CMS fact contract.
 * A v4 document's `locale` was business data; a v5 document's `locale` is a
 * system field and is retained only as boundary metadata, never domain input.
 */
export function normalizeCmsFactsBusinessLocale(value: unknown): CmsBusinessLocaleNormalization {
  const v5SystemLocales: V5SystemLocaleObservation[] = []

  if (!isRecord(value) || !Array.isArray(value.productFacts)) {
    return { cmsFacts: value, v5SystemLocales }
  }

  return {
    cmsFacts: {
      ...value,
      productFacts: value.productFacts.map((product, productIndex) => normalizeProductDocuments(product, productIndex, v5SystemLocales)),
    },
    v5SystemLocales,
  }
}

function normalizeProductDocuments(
  product: unknown,
  productIndex: number,
  v5SystemLocales: V5SystemLocaleObservation[],
): unknown {
  if (!isRecord(product) || !Array.isArray(product.documents)) {
    return product
  }

  return {
    ...product,
    documents: product.documents.map((document, documentIndex) => normalizeDocument(
      document,
      `cmsFacts.productFacts[${productIndex}].documents[${documentIndex}]`,
      v5SystemLocales,
    )),
  }
}

function normalizeDocument(
  document: unknown,
  path: string,
  v5SystemLocales: V5SystemLocaleObservation[],
): unknown {
  if (!isRecord(document) || !Object.prototype.hasOwnProperty.call(document, 'locale')) {
    return document
  }

  const hasContentLocale = Object.prototype.hasOwnProperty.call(document, 'contentLocale')
  const documentId = typeof document.documentId === 'string' && document.documentId.trim().length > 0
    ? document.documentId
    : undefined

  if (documentId) {
    if (!hasContentLocale) {
      throw new BusinessLocaleCompatibilityError(path, 'v5 system locale was supplied without the required business contentLocale')
    }

    v5SystemLocales.push({
      path,
      documentId,
      locale: document.locale,
    })

    const { documentId: _documentId, locale: _locale, ...businessDocument } = document
    return businessDocument
  }

  if (hasContentLocale && document.contentLocale !== document.locale) {
    throw new BusinessLocaleCompatibilityError(path, 'legacy locale and contentLocale disagree')
  }

  const { locale, ...documentWithoutLegacyLocale } = document
  return {
    ...documentWithoutLegacyLocale,
    contentLocale: hasContentLocale ? document.contentLocale : locale,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
