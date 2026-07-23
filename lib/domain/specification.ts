import type { GeoAiClaimType } from './geo-ai'
import type { CategoryId, LocalizedText, UnitCode } from './primitives'

export type SpecificationKey =
  | 'measurement_range'
  | 'range'
  | 'accuracy'
  | 'overload_limit'
  | 'output_signal'
  | 'output'
  | 'supply_voltage'
  | 'process_connection'
  | 'electrical_connection'
  | 'ingress_protection'
  | 'wetted_materials'
  | 'compatible_media'
  | 'ambient_temperature'
  | 'media_temperature'
  | 'feature'

export type SpecificationUnitFamily =
  | 'pressure'
  | 'temperature'
  | 'length'
  | 'measurement'
  | 'current'
  | 'voltage'
  | 'frequency'
  | 'percent'
  | 'cycles'
  | 'dimensionless'
  | 'custom'

export type SpecificationValueType = 'string' | 'number' | 'boolean' | 'range' | 'enum' | 'multi-enum'

export type SpecificationFacetMode = 'exact' | 'range' | 'multi-select'

export interface SpecificationFacetPolicy {
  readonly enabled: boolean
  readonly mode?: SpecificationFacetMode
  readonly priority?: number
}

export interface SpecificationComparisonPolicy {
  readonly enabled: boolean
  readonly priority?: number
  readonly normalize?: boolean
}

export type SpecificationDatasheetSection =
  | 'measurement'
  | 'electrical'
  | 'mechanical'
  | 'environmental'
  | 'approval'
  | 'commercial'

export interface SpecificationDatasheetPolicy {
  readonly section: SpecificationDatasheetSection
  readonly priority: number
}

export interface SpecificationGeoPolicy {
  readonly claimType?: GeoAiClaimType
  readonly includeInFactTable: boolean
}

export interface SpecificationDefinition {
  readonly key: SpecificationKey
  readonly label: LocalizedText
  readonly valueType: SpecificationValueType
  readonly unitFamily?: SpecificationUnitFamily
  readonly allowedUnits?: readonly UnitCode[]
  readonly allowedValues?: readonly string[]
  readonly appliesToCategoryIds: readonly CategoryId[]
  readonly facet: SpecificationFacetPolicy
  readonly comparison: SpecificationComparisonPolicy
  readonly datasheet: SpecificationDatasheetPolicy
  readonly geo: SpecificationGeoPolicy
}

export interface SpecificationDefinitionRegistry {
  readonly version: 'specification-definition-registry-v1'
  readonly definitions: readonly SpecificationDefinition[]
}

export interface SpecificationValueLike {
  readonly key: string
  readonly value: string | number | boolean
  readonly unit?: UnitCode
  readonly display: string
}

export const specificationUnitFamilyUnits = {
  pressure: ['pa', 'kpa', 'mpa', 'bar', 'mbar', 'psi', 'mh2o'],
  temperature: ['c', 'f', 'k'],
  length: ['mm', 'm', 'mh2o'],
  measurement: ['pa', 'kpa', 'mpa', 'bar', 'mbar', 'psi', 'mh2o', 'mm', 'm', 'c', 'f', 'k', 'custom'],
  current: ['ma'],
  voltage: ['v', 'mv'],
  frequency: ['hz'],
  percent: ['percent'],
  cycles: ['cycle'],
  dimensionless: ['custom'],
  custom: ['custom'],
} as const satisfies Record<SpecificationUnitFamily, readonly UnitCode[]>

const allIndustrialSensorCategories = [
  'cat_industrial_sensors',
  'cat_industrial_valves',
  'cat_solenoid_valves',
  'cat_proportional_valves',
  'cat_pressure_regulating_valves',
  'cat_safety_valves',
  'cat_valve_manifolds_protection',
  'cat_pressure_sensors',
  'cat_pressure_transmitters',
  'cat_differential_pressure',
  'cat_high_pressure_sensors',
  'cat_low_pressure_sensors',
  'cat_explosion_proof_pressure_sensors',
  'cat_temperature_sensors',
  'cat_temperature_measurement',
  'cat_temperature_transmitters',
  'cat_rtd_sensors',
  'cat_thermocouples',
  'cat_explosion_proof_temperature_sensors',
  'cat_pressure_switches',
  'cat_industrial_switches',
  'cat_electronic_pressure_switches',
  'cat_differential_pressure_switches',
  'cat_adjustable_pressure_switches',
  'cat_level_sensors',
  'cat_submersible_level',
  'cat_pressure_gauges',
  'cat_mechanical_pressure_gauges',
  'cat_digital_pressure_gauges',
  'cat_differential_pressure_gauges',
  'cat_wireless_transmitters',
  'cat_wireless_pressure_transmitters',
  'cat_wireless_temperature_transmitters',
  'cat_wireless_level_transmitters',
] as const satisfies readonly CategoryId[]
const measurementCategories = [
  ...allIndustrialSensorCategories,
] as const satisfies readonly CategoryId[]
const electricalCategories = [
  'cat_industrial_sensors',
  'cat_industrial_valves',
  'cat_solenoid_valves',
  'cat_proportional_valves',
  'cat_pressure_sensors',
  'cat_pressure_transmitters',
  'cat_temperature_sensors',
  'cat_temperature_measurement',
  'cat_temperature_transmitters',
  'cat_pressure_switches',
  'cat_electronic_pressure_switches',
  'cat_wireless_transmitters',
] as const satisfies readonly CategoryId[]

export const defaultSpecificationDefinitions = [
  definition({
    key: 'measurement_range',
    en: 'Measurement range',
    zh: 'Measurement range',
    valueType: 'string',
    unitFamily: 'measurement',
    allowedUnits: ['pa', 'kpa', 'mpa', 'bar', 'mbar', 'psi', 'mh2o', 'mm', 'm', 'c', 'f', 'k', 'custom'],
    appliesToCategoryIds: measurementCategories,
    facet: { enabled: true, mode: 'range', priority: 10 },
    comparison: { enabled: true, priority: 10, normalize: true },
    datasheet: { section: 'measurement', priority: 10 },
    geo: { claimType: 'measurement-range', includeInFactTable: true },
  }),
  definition({
    key: 'range',
    en: 'Range',
    zh: 'Range',
    valueType: 'string',
    unitFamily: 'measurement',
    allowedUnits: ['pa', 'kpa', 'mpa', 'bar', 'mbar', 'psi', 'mh2o', 'mm', 'm', 'c', 'f', 'k', 'custom'],
    appliesToCategoryIds: measurementCategories,
    facet: { enabled: true, mode: 'range', priority: 10 },
    comparison: { enabled: true, priority: 10, normalize: true },
    datasheet: { section: 'measurement', priority: 10 },
    geo: { claimType: 'measurement-range', includeInFactTable: true },
  }),
  definition({
    key: 'accuracy',
    en: 'Accuracy',
    zh: 'Accuracy',
    valueType: 'string',
    unitFamily: 'percent',
    allowedUnits: ['percent'],
    appliesToCategoryIds: measurementCategories,
    facet: { enabled: true, mode: 'multi-select', priority: 30 },
    comparison: { enabled: true, priority: 20, normalize: false },
    datasheet: { section: 'measurement', priority: 20 },
    geo: { claimType: 'capability', includeInFactTable: true },
  }),
  definition({
    key: 'overload_limit',
    en: 'Overload limit',
    zh: 'Overload limit',
    valueType: 'number',
    unitFamily: 'measurement',
    allowedUnits: ['pa', 'kpa', 'mpa', 'bar', 'mbar', 'psi', 'mh2o', 'mm', 'm', 'c', 'f', 'k', 'custom'],
    appliesToCategoryIds: measurementCategories,
    facet: { enabled: false },
    comparison: { enabled: true, priority: 30, normalize: true },
    datasheet: { section: 'measurement', priority: 30 },
    geo: { claimType: 'limitation', includeInFactTable: true },
  }),
  definition({
    key: 'output_signal',
    en: 'Output signal',
    zh: 'Output signal',
    valueType: 'string',
    appliesToCategoryIds: electricalCategories,
    facet: { enabled: true, mode: 'multi-select', priority: 20 },
    comparison: { enabled: true, priority: 40, normalize: false },
    datasheet: { section: 'electrical', priority: 10 },
    geo: { claimType: 'capability', includeInFactTable: true },
  }),
  definition({
    key: 'output',
    en: 'Output',
    zh: 'Output',
    valueType: 'string',
    appliesToCategoryIds: electricalCategories,
    facet: { enabled: true, mode: 'multi-select', priority: 20 },
    comparison: { enabled: true, priority: 40, normalize: false },
    datasheet: { section: 'electrical', priority: 10 },
    geo: { claimType: 'capability', includeInFactTable: true },
  }),
  definition({
    key: 'supply_voltage',
    en: 'Supply voltage',
    zh: 'Supply voltage',
    valueType: 'string',
    unitFamily: 'voltage',
    allowedUnits: ['v'],
    appliesToCategoryIds: electricalCategories,
    facet: { enabled: true, mode: 'multi-select', priority: 70 },
    comparison: { enabled: true, priority: 50, normalize: false },
    datasheet: { section: 'electrical', priority: 20 },
    geo: { claimType: 'capability', includeInFactTable: false },
  }),
  definition({
    key: 'process_connection',
    en: 'Process connection',
    zh: 'Process connection',
    valueType: 'string',
    appliesToCategoryIds: allIndustrialSensorCategories,
    facet: { enabled: true, mode: 'multi-select', priority: 40 },
    comparison: { enabled: true, priority: 60, normalize: false },
    datasheet: { section: 'mechanical', priority: 10 },
    geo: { claimType: 'installation', includeInFactTable: true },
  }),
  definition({
    key: 'electrical_connection',
    en: 'Electrical connection',
    zh: 'Electrical connection',
    valueType: 'string',
    appliesToCategoryIds: allIndustrialSensorCategories,
    facet: { enabled: true, mode: 'multi-select', priority: 50 },
    comparison: { enabled: true, priority: 70, normalize: false },
    datasheet: { section: 'mechanical', priority: 20 },
    geo: { claimType: 'installation', includeInFactTable: true },
  }),
  definition({
    key: 'ingress_protection',
    en: 'Ingress protection',
    zh: 'Ingress protection',
    valueType: 'string',
    appliesToCategoryIds: allIndustrialSensorCategories,
    facet: { enabled: true, mode: 'multi-select', priority: 60 },
    comparison: { enabled: true, priority: 80, normalize: false },
    datasheet: { section: 'environmental', priority: 10 },
    geo: { claimType: 'limitation', includeInFactTable: true },
  }),
  definition({
    key: 'wetted_materials',
    en: 'Wetted materials',
    zh: 'Wetted materials',
    valueType: 'multi-enum',
    appliesToCategoryIds: allIndustrialSensorCategories,
    facet: { enabled: true, mode: 'multi-select', priority: 90 },
    comparison: { enabled: true, priority: 90, normalize: false },
    datasheet: { section: 'environmental', priority: 20 },
    geo: { claimType: 'compatibility', includeInFactTable: true },
  }),
  definition({
    key: 'compatible_media',
    en: 'Compatible media',
    zh: 'Compatible media',
    valueType: 'multi-enum',
    appliesToCategoryIds: allIndustrialSensorCategories,
    facet: { enabled: true, mode: 'multi-select', priority: 80 },
    comparison: { enabled: true, priority: 100, normalize: false },
    datasheet: { section: 'environmental', priority: 30 },
    geo: { claimType: 'compatibility', includeInFactTable: true },
  }),
  definition({
    key: 'ambient_temperature',
    en: 'Ambient temperature',
    zh: 'Ambient temperature',
    valueType: 'string',
    unitFamily: 'temperature',
    allowedUnits: ['c', 'f', 'k'],
    appliesToCategoryIds: allIndustrialSensorCategories,
    facet: { enabled: false },
    comparison: { enabled: true, priority: 110, normalize: true },
    datasheet: { section: 'environmental', priority: 40 },
    geo: { claimType: 'compatibility', includeInFactTable: true },
  }),
  definition({
    key: 'media_temperature',
    en: 'Media temperature',
    zh: 'Media temperature',
    valueType: 'string',
    unitFamily: 'temperature',
    allowedUnits: ['c', 'f', 'k'],
    appliesToCategoryIds: allIndustrialSensorCategories,
    facet: { enabled: false },
    comparison: { enabled: true, priority: 120, normalize: true },
    datasheet: { section: 'environmental', priority: 50 },
    geo: { claimType: 'compatibility', includeInFactTable: true },
  }),
  definition({
    key: 'feature',
    en: 'Feature',
    zh: 'Feature',
    valueType: 'string',
    appliesToCategoryIds: allIndustrialSensorCategories,
    facet: { enabled: false },
    comparison: { enabled: true, priority: 200, normalize: false },
    datasheet: { section: 'measurement', priority: 200 },
    geo: { claimType: 'capability', includeInFactTable: false },
  }),
] as const satisfies readonly SpecificationDefinition[]

export const defaultSpecificationRegistry = {
  version: 'specification-definition-registry-v1',
  definitions: defaultSpecificationDefinitions,
} as const satisfies SpecificationDefinitionRegistry

export function createSpecificationDefinitionMap(registry: SpecificationDefinitionRegistry = defaultSpecificationRegistry) {
  return new Map(registry.definitions.map((definition) => [definition.key, definition]))
}

export function getSpecificationDefinition(
  key: string,
  registry: SpecificationDefinitionRegistry = defaultSpecificationRegistry,
): SpecificationDefinition | undefined {
  return createSpecificationDefinitionMap(registry).get(key as SpecificationKey)
}

export function isKnownSpecificationKey(
  key: string,
  registry: SpecificationDefinitionRegistry = defaultSpecificationRegistry,
): key is SpecificationKey {
  return Boolean(getSpecificationDefinition(key, registry))
}

export function normalizeSpecificationRegistry(
  registry: SpecificationDefinitionRegistry | readonly SpecificationDefinition[] = defaultSpecificationRegistry,
): SpecificationDefinitionRegistry {
  if (!('definitions' in registry)) {
    return {
      version: 'specification-definition-registry-v1',
      definitions: registry,
    }
  }

  return registry
}

export function validateSpecificationDefinitionRegistry(
  registry: SpecificationDefinitionRegistry = defaultSpecificationRegistry,
): readonly string[] {
  const errors: string[] = []
  const keys = new Set<string>()

  for (const definition of registry.definitions) {
    if (keys.has(definition.key)) {
      errors.push(`duplicate specification definition key '${definition.key}'`)
    }

    keys.add(definition.key)

    if (!definition.label.en || !definition.label.zh) {
      errors.push(`${definition.key}: label must include en and zh`)
    }

    if (definition.allowedUnits?.length && !definition.unitFamily) {
      errors.push(`${definition.key}: allowedUnits requires unitFamily`)
    }

    if (definition.unitFamily && definition.allowedUnits?.length) {
      const familyUnits: readonly UnitCode[] = specificationUnitFamilyUnits[definition.unitFamily]

      for (const unit of definition.allowedUnits) {
        if (!familyUnits.includes(unit)) {
          errors.push(`${definition.key}: unit '${unit}' is not in unit family '${definition.unitFamily}'`)
        }
      }
    }

    if (definition.valueType === 'enum' && !definition.allowedValues?.length) {
      errors.push(`${definition.key}: enum valueType requires allowedValues`)
    }

    if (!definition.appliesToCategoryIds.length) {
      errors.push(`${definition.key}: appliesToCategoryIds must not be empty`)
    }

    if (definition.facet.enabled && !definition.facet.mode) {
      errors.push(`${definition.key}: enabled facet policy requires mode`)
    }
  }

  return errors
}

export function validateSpecificationValueAgainstRegistry(
  value: SpecificationValueLike,
  registry: SpecificationDefinitionRegistry = defaultSpecificationRegistry,
): readonly string[] {
  const definition = getSpecificationDefinition(value.key, registry)

  if (!definition) {
    return [`unknown specification key '${value.key}'`]
  }

  return validateSpecificationValueAgainstDefinition(value, definition)
}

export function validateSpecificationValueAgainstDefinition(
  value: SpecificationValueLike,
  definition: SpecificationDefinition,
): readonly string[] {
  const errors: string[] = []

  if (!value.display.trim()) {
    errors.push(`${definition.key}: display must not be empty`)
  }

  if (definition.allowedUnits?.length && value.unit && !definition.allowedUnits.includes(value.unit)) {
    errors.push(`${definition.key}: unit '${value.unit}' is not allowed`)
  }

  if (definition.allowedValues?.length && typeof value.value === 'string' && !definition.allowedValues.includes(value.value)) {
    errors.push(`${definition.key}: value '${value.value}' is not an allowed enum value`)
  }

  if (definition.valueType === 'number' && typeof value.value !== 'number') {
    errors.push(`${definition.key}: value must be a number`)
  }

  if (definition.valueType === 'boolean' && typeof value.value !== 'boolean') {
    errors.push(`${definition.key}: value must be a boolean`)
  }

  if ((definition.valueType === 'string' || definition.valueType === 'enum' || definition.valueType === 'multi-enum' || definition.valueType === 'range') && typeof value.value === 'boolean') {
    errors.push(`${definition.key}: value must not be boolean`)
  }

  return errors
}

function definition(input: {
  readonly key: SpecificationKey
  readonly en: string
  readonly zh: string
  readonly valueType: SpecificationValueType
  readonly unitFamily?: SpecificationUnitFamily
  readonly allowedUnits?: readonly UnitCode[]
  readonly allowedValues?: readonly string[]
  readonly appliesToCategoryIds: readonly CategoryId[]
  readonly facet: SpecificationFacetPolicy
  readonly comparison: SpecificationComparisonPolicy
  readonly datasheet: SpecificationDatasheetPolicy
  readonly geo: SpecificationGeoPolicy
}): SpecificationDefinition {
  return {
    key: input.key,
    label: { en: input.en, zh: input.zh },
    valueType: input.valueType,
    unitFamily: input.unitFamily,
    allowedUnits: input.allowedUnits,
    allowedValues: input.allowedValues,
    appliesToCategoryIds: input.appliesToCategoryIds,
    facet: input.facet,
    comparison: input.comparison,
    datasheet: input.datasheet,
    geo: input.geo,
  }
}
