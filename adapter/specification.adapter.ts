import type {
  SpecificationDefinition,
  SpecificationDefinitionRegistry,
  SpecificationValueLike,
} from '@/lib/domain'
import {
  defaultSpecificationRegistry,
  normalizeSpecificationRegistry,
  validateSpecificationDefinitionRegistry,
  validateSpecificationValueAgainstRegistry,
} from '@/lib/domain'

export interface SpecificationRegistryValidationOptions {
  readonly enabled?: boolean
  readonly registry?: SpecificationDefinitionRegistry | readonly SpecificationDefinition[]
}

export function normalizeSpecificationRegistryValidationOptions(
  options: SpecificationRegistryValidationOptions = {},
) {
  return {
    enabled: options.enabled ?? true,
    registry: normalizeSpecificationRegistry(options.registry ?? defaultSpecificationRegistry),
  }
}

export function validateSpecificationRegistryOrThrow(options: SpecificationRegistryValidationOptions = {}) {
  const normalized = normalizeSpecificationRegistryValidationOptions(options)

  if (!normalized.enabled) {
    return normalized.registry
  }

  const errors = validateSpecificationDefinitionRegistry(normalized.registry)

  if (errors.length) {
    throw new Error(`Specification definition registry is invalid: ${errors.join('; ')}`)
  }

  return normalized.registry
}

export function validateSpecificationValueOrThrow(
  value: SpecificationValueLike,
  path: string,
  options: SpecificationRegistryValidationOptions = {},
) {
  const normalized = normalizeSpecificationRegistryValidationOptions(options)

  if (!normalized.enabled) {
    return
  }

  const errors = validateSpecificationValueAgainstRegistry(value, normalized.registry)

  if (errors.length) {
    throw new Error(`${path}: ${errors.join('; ')}`)
  }
}
