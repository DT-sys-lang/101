import type {
  AssetId,
  CategoryCanonicalPath,
  CategoryId,
  LocalizedText,
  NonEmptyReadonlyArray,
  SeoSlugPath,
  SlugSegment,
} from './primitives'

export type CategoryDepth = 0 | 1 | 2 | 3 | 4

export type CategoryKind =
  | 'catalog-root'
  | 'measurement-family'
  | 'measurement-principle'
  | 'product-function'
  | 'series-group'
  | 'accessory-group'

export type CategoryFacetKey =
  | 'measurementRange'
  | 'outputSignal'
  | 'processConnection'
  | 'electricalConnection'
  | 'accuracyClass'
  | 'ingressProtection'
  | 'mediaCompatibility'
  | 'certification'
  | 'industry'
  | 'availability'

export interface CategorySeoInput {
  readonly titlePattern: string
  readonly descriptionPattern: string
  readonly indexable: boolean
  readonly canonicalPath: CategoryCanonicalPath
}

export interface CategoryNode {
  readonly id: CategoryId
  readonly parentId: CategoryId | null
  readonly depth: CategoryDepth
  readonly kind: CategoryKind
  readonly slug: SlugSegment
  readonly slugPath: SeoSlugPath
  readonly canonicalPath: CategoryCanonicalPath
  readonly name: LocalizedText
  readonly description: LocalizedText
  readonly iconAssetId?: AssetId
  readonly sortOrder: number
  readonly facetKeys: readonly CategoryFacetKey[]
  readonly seo: CategorySeoInput
  readonly children?: readonly CategoryNode[]
}

export interface CategoryTree {
  readonly version: 'category-tree-v1'
  readonly root: CategoryNode
  readonly indexKeys: readonly CategoryFacetKey[]
  readonly maxDepth: CategoryDepth
}

export const industrialSensorCategoryTree = {
  version: 'category-tree-v1',
  maxDepth: 4,
  indexKeys: [
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
  ],
  root: {
    id: 'cat_industrial_sensors',
    parentId: null,
    depth: 0,
    kind: 'catalog-root',
    slug: 'industrial-sensors',
    slugPath: 'industrial-sensors',
    canonicalPath: '/products/industrial-sensors',
    name: { en: 'Industrial Sensors', zh: 'Industrial Sensors' },
    description: {
      en: 'Industrial measurement sensors organized by measured variable, function, and series.',
      zh: 'Industrial measurement sensors organized by measured variable, function, and series.',
    },
    sortOrder: 0,
    facetKeys: ['industry', 'availability', 'certification'],
    seo: {
      indexable: true,
      canonicalPath: '/products/industrial-sensors',
      titlePattern: '{category} for industrial measurement | {brand}',
      descriptionPattern: 'Browse {category} by measurement type, signal output, connection, and industrial application.',
    },
    children: [
      {
        id: 'cat_pressure_sensors',
        parentId: 'cat_industrial_sensors',
        depth: 1,
        kind: 'measurement-family',
        slug: 'pressure-sensors',
        slugPath: 'industrial-sensors/pressure-sensors',
        canonicalPath: '/products/industrial-sensors/pressure-sensors',
        name: { en: 'Pressure Sensors', zh: 'Pressure Sensors' },
        description: {
          en: 'Transmitters, transducers, and switches for gauge, absolute, and differential pressure.',
          zh: 'Transmitters, transducers, and switches for gauge, absolute, and differential pressure.',
        },
        sortOrder: 10,
        facetKeys: ['measurementRange', 'outputSignal', 'processConnection', 'accuracyClass', 'ingressProtection'],
        seo: {
          indexable: true,
          canonicalPath: '/products/industrial-sensors/pressure-sensors',
          titlePattern: '{category} by pressure range and signal output | {brand}',
          descriptionPattern: 'Compare {category} for pumps, hydraulics, compressors, water systems, and process equipment.',
        },
        children: [
          {
            id: 'cat_pressure_transmitters',
            parentId: 'cat_pressure_sensors',
            depth: 2,
            kind: 'product-function',
            slug: 'pressure-transmitters',
            slugPath: 'industrial-sensors/pressure-sensors/pressure-transmitters',
            canonicalPath: '/products/industrial-sensors/pressure-sensors/pressure-transmitters',
            name: { en: 'Pressure Transmitters', zh: 'Pressure Transmitters' },
            description: {
              en: 'Continuous pressure measurement with analog, voltage, or digital output.',
              zh: 'Continuous pressure measurement with analog, voltage, or digital output.',
            },
            sortOrder: 10,
            facetKeys: ['measurementRange', 'outputSignal', 'processConnection', 'electricalConnection', 'accuracyClass'],
            seo: {
              indexable: true,
              canonicalPath: '/products/industrial-sensors/pressure-sensors/pressure-transmitters',
              titlePattern: '{category} for OEM and process systems | {brand}',
              descriptionPattern: 'Select {category} by range, output, connector, thread, accuracy, and media compatibility.',
            },
          },
          {
            id: 'cat_differential_pressure',
            parentId: 'cat_pressure_sensors',
            depth: 2,
            kind: 'measurement-principle',
            slug: 'differential-pressure',
            slugPath: 'industrial-sensors/pressure-sensors/differential-pressure',
            canonicalPath: '/products/industrial-sensors/pressure-sensors/differential-pressure',
            name: { en: 'Differential Pressure', zh: 'Differential Pressure' },
            description: {
              en: 'Differential pressure sensors for filters, HVAC, flow elements, and clean rooms.',
              zh: 'Differential pressure sensors for filters, HVAC, flow elements, and clean rooms.',
            },
            sortOrder: 20,
            facetKeys: ['measurementRange', 'outputSignal', 'accuracyClass', 'ingressProtection'],
            seo: {
              indexable: true,
              canonicalPath: '/products/industrial-sensors/pressure-sensors/differential-pressure',
              titlePattern: '{category} sensors and transmitters | {brand}',
              descriptionPattern: 'Find {category} models for air, liquid, filtration, and building automation systems.',
            },
          },
        ],
      },
      {
        id: 'cat_level_sensors',
        parentId: 'cat_industrial_sensors',
        depth: 1,
        kind: 'measurement-family',
        slug: 'level-sensors',
        slugPath: 'industrial-sensors/level-sensors',
        canonicalPath: '/products/industrial-sensors/level-sensors',
        name: { en: 'Level Sensors', zh: 'Level Sensors' },
        description: {
          en: 'Continuous and point-level sensors for tanks, wells, reservoirs, and process vessels.',
          zh: 'Continuous and point-level sensors for tanks, wells, reservoirs, and process vessels.',
        },
        sortOrder: 20,
        facetKeys: ['measurementRange', 'outputSignal', 'mediaCompatibility', 'ingressProtection', 'certification'],
        seo: {
          indexable: true,
          canonicalPath: '/products/industrial-sensors/level-sensors',
          titlePattern: '{category} for tanks and water systems | {brand}',
          descriptionPattern: 'Browse {category} by level range, medium, cable, housing material, and output signal.',
        },
        children: [
          {
            id: 'cat_submersible_level',
            parentId: 'cat_level_sensors',
            depth: 2,
            kind: 'measurement-principle',
            slug: 'submersible-level-sensors',
            slugPath: 'industrial-sensors/level-sensors/submersible-level-sensors',
            canonicalPath: '/products/industrial-sensors/level-sensors/submersible-level-sensors',
            name: { en: 'Submersible Level Sensors', zh: 'Submersible Level Sensors' },
            description: {
              en: 'Hydrostatic level probes for water treatment, groundwater, tanks, and reservoirs.',
              zh: 'Hydrostatic level probes for water treatment, groundwater, tanks, and reservoirs.',
            },
            sortOrder: 10,
            facetKeys: ['measurementRange', 'outputSignal', 'mediaCompatibility', 'ingressProtection'],
            seo: {
              indexable: true,
              canonicalPath: '/products/industrial-sensors/level-sensors/submersible-level-sensors',
              titlePattern: '{category} by range and cable material | {brand}',
              descriptionPattern: 'Compare {category} for water, wastewater, tanks, and groundwater monitoring.',
            },
          },
        ],
      },
      {
        id: 'cat_temperature_measurement',
        parentId: 'cat_industrial_sensors',
        depth: 1,
        kind: 'measurement-family',
        slug: 'temperature-measurement',
        slugPath: 'industrial-sensors/temperature-measurement',
        canonicalPath: '/products/industrial-sensors/temperature-measurement',
        name: { en: 'Temperature Measurement', zh: 'Temperature Measurement' },
        description: {
          en: 'Temperature transmitters, RTDs, thermocouples, and process assemblies.',
          zh: 'Temperature transmitters, RTDs, thermocouples, and process assemblies.',
        },
        sortOrder: 30,
        facetKeys: ['measurementRange', 'outputSignal', 'processConnection', 'certification'],
        seo: {
          indexable: true,
          canonicalPath: '/products/industrial-sensors/temperature-measurement',
          titlePattern: '{category} for process and OEM systems | {brand}',
          descriptionPattern: 'Select {category} by sensor input, range, process connection, housing, and signal output.',
        },
        children: [
          {
            id: 'cat_temperature_transmitters',
            parentId: 'cat_temperature_measurement',
            depth: 2,
            kind: 'product-function',
            slug: 'temperature-transmitters',
            slugPath: 'industrial-sensors/temperature-measurement/temperature-transmitters',
            canonicalPath: '/products/industrial-sensors/temperature-measurement/temperature-transmitters',
            name: { en: 'Temperature Transmitters', zh: 'Temperature Transmitters' },
            description: {
              en: 'Signal conditioners and transmitters for RTD and thermocouple inputs.',
              zh: 'Signal conditioners and transmitters for RTD and thermocouple inputs.',
            },
            sortOrder: 10,
            facetKeys: ['outputSignal', 'accuracyClass', 'certification'],
            seo: {
              indexable: true,
              canonicalPath: '/products/industrial-sensors/temperature-measurement/temperature-transmitters',
              titlePattern: '{category} for RTD and thermocouple input | {brand}',
              descriptionPattern: 'Browse {category} with 4-20mA, voltage, and digital output options.',
            },
          },
        ],
      },
      {
        id: 'cat_industrial_switches',
        parentId: 'cat_industrial_sensors',
        depth: 1,
        kind: 'measurement-family',
        slug: 'industrial-switches',
        slugPath: 'industrial-sensors/industrial-switches',
        canonicalPath: '/products/industrial-sensors/industrial-switches',
        name: { en: 'Industrial Switches', zh: 'Industrial Switches' },
        description: {
          en: 'Pressure, temperature, flow, and level switches for equipment protection and automation.',
          zh: 'Pressure, temperature, flow, and level switches for equipment protection and automation.',
        },
        sortOrder: 40,
        facetKeys: ['measurementRange', 'processConnection', 'electricalConnection', 'ingressProtection'],
        seo: {
          indexable: true,
          canonicalPath: '/products/industrial-sensors/industrial-switches',
          titlePattern: '{category} for equipment protection | {brand}',
          descriptionPattern: 'Find {category} by setpoint, contact type, connection, media, and protection rating.',
        },
        children: [
          {
            id: 'cat_pressure_switches',
            parentId: 'cat_industrial_switches',
            depth: 2,
            kind: 'product-function',
            slug: 'pressure-switches',
            slugPath: 'industrial-sensors/industrial-switches/pressure-switches',
            canonicalPath: '/products/industrial-sensors/industrial-switches/pressure-switches',
            name: { en: 'Pressure Switches', zh: 'Pressure Switches' },
            description: {
              en: 'Adjustable and fixed pressure switches for pumps, compressors, and hydraulic equipment.',
              zh: 'Adjustable and fixed pressure switches for pumps, compressors, and hydraulic equipment.',
            },
            sortOrder: 10,
            facetKeys: ['measurementRange', 'processConnection', 'electricalConnection', 'ingressProtection'],
            seo: {
              indexable: true,
              canonicalPath: '/products/industrial-sensors/industrial-switches/pressure-switches',
              titlePattern: '{category} by setpoint and contact type | {brand}',
              descriptionPattern: 'Compare {category} for pumps, compressors, hydraulics, and safety interlock circuits.',
            },
          },
        ],
      },
    ],
  },
} as const satisfies CategoryTree

export type CategoryPath = NonEmptyReadonlyArray<CategoryId>
