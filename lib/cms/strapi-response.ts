export type StrapiEntityRecord = Readonly<Record<string, unknown>>

export function readStrapiCollectionData(value: unknown): readonly StrapiEntityRecord[] {
  if (!isStrapiEntityRecord(value) || !Array.isArray(value.data)) {
    return []
  }

  return value.data.map(readStrapiEntityRecord).filter(isStrapiEntityRecord)
}

export function readStrapiRelationMany(value: unknown): readonly StrapiEntityRecord[] {
  if (Array.isArray(value)) {
    return value.map(readStrapiEntityRecord).filter(isStrapiEntityRecord)
  }

  if (!isStrapiEntityRecord(value) || !Array.isArray(value.data)) {
    return []
  }

  return value.data.map(readStrapiEntityRecord).filter(isStrapiEntityRecord)
}

export function readStrapiRelationOne(value: unknown): StrapiEntityRecord | undefined {
  if (!isStrapiEntityRecord(value)) {
    return undefined
  }

  if ('data' in value) {
    return readStrapiEntityRecord(value.data)
  }

  return readStrapiEntityRecord(value)
}

export function readStrapiEntityRecord(value: unknown): StrapiEntityRecord | undefined {
  if (!isStrapiEntityRecord(value)) {
    return undefined
  }

  if (!isStrapiEntityRecord(value.attributes)) {
    return value
  }

  return {
    ...value.attributes,
    ...readSystemFields(value),
  }
}

function readSystemFields(value: StrapiEntityRecord): StrapiEntityRecord {
  const fields: Record<string, unknown> = {}

  for (const key of ['id', 'documentId', 'locale', 'createdAt', 'updatedAt', 'publishedAt']) {
    if (key in value) {
      fields[key] = value[key]
    }
  }

  return fields
}

function isStrapiEntityRecord(value: unknown): value is StrapiEntityRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
