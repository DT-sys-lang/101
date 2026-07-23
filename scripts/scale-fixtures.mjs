export function generateCmsFacts(productCount = 300) {
  const leaves = [
    { family: 'sensor', categoryId: 'cat_pressure_transmitters', kind: 'pressure', unit: 'bar', modelPrefix: 'PT', rangeMax: 16, label: 'Pressure Sensor' },
    { family: 'sensor', categoryId: 'cat_level_sensors', kind: 'level', unit: 'm', modelPrefix: 'LT', rangeMax: 10, label: 'Level Sensor' },
    { family: 'sensor', categoryId: 'cat_temperature_transmitters', kind: 'temperature', unit: 'c', modelPrefix: 'TT', rangeMax: 200, label: 'Temperature Sensor' },
    { family: 'sensor', categoryId: 'cat_pressure_switches', kind: 'switch-state', unit: 'bar', modelPrefix: 'PS', rangeMax: 12, label: 'Pressure Switch' },
    { family: 'valve', categoryId: 'cat_solenoid_valves', modelPrefix: 'SV', pressureRating: 'PN16', connection: 'G1/2', material: '316L stainless steel', mode: 'normally closed', size: 'DN15', label: 'Solenoid Valve', compatibleMedia: ['Water', 'Air'] },
    { family: 'valve', categoryId: 'cat_control_valves', modelPrefix: 'CV', pressureRating: 'PN25', connection: 'flange DN25', material: 'CF8M stainless steel', mode: 'modulating', size: 'DN25', label: 'Control Valve', compatibleMedia: ['Water', 'Steam'] },
  ]

  return {
    categoryFacts: [
      category('cat_industrial_sensors', null, 'Industrial Products'),
      category('cat_pressure_sensors', 'cat_industrial_sensors', 'Pressure Sensors'),
      category('cat_pressure_transmitters', 'cat_pressure_sensors', 'Pressure Transmitters'),
      category('cat_level_sensors', 'cat_industrial_sensors', 'Level Sensors'),
      category('cat_temperature_transmitters', 'cat_industrial_sensors', 'Temperature Transmitters'),
      category('cat_pressure_switches', 'cat_pressure_sensors', 'Pressure Switches'),
      category('cat_industrial_valves', 'cat_industrial_sensors', 'Industrial Valves'),
      category('cat_solenoid_valves', 'cat_industrial_valves', 'Solenoid Valves'),
      category('cat_control_valves', 'cat_industrial_valves', 'Control Valves'),
    ],
    productFacts: Array.from({ length: productCount }, (_, index) => {
      const sequence = index + 1
      const leaf = leaves[index % leaves.length]
      return product(sequence, leaf)
    }),
  }
}

function category(id, parentId, enName) {
  return {
    id,
    parentId,
    name: localized(enName),
  }
}

function product(sequence, leaf) {
  return leaf.family === 'valve' ? valveProduct(sequence, leaf) : sensorProduct(sequence, leaf)
}

function baseProduct(sequence, leaf, code, summary) {
  const padded = sequence.toString().padStart(4, '0')

  return {
    id: `prd_scale_${padded}`,
    family: leaf.family,
    core: {
      family: leaf.family,
      sku: `SCALE-${padded}`,
      model: `HY-${code}`,
      brand: 'YUFAVOR',
      primaryCategory: leaf.categoryId,
      name: localized(`${code} ${leaf.label}`),
      shortName: localized(`${code} ${leaf.label}`),
      summary: localized(summary),
    },
    sku: `SCALE-${padded}`,
    model: `HY-${code}`,
    seriesId: `ser_scale_${leaf.modelPrefix.toLowerCase()}`,
    brand: 'YUFAVOR',
    manufacturer: 'YUFAVOR',
    lifecycle: 'active',
    availability: sequence % 7 === 0 ? 'made-to-order' : 'configurable',
    releasedAt: '2026-01-01',
    revisedAt: '2026-06-22',
    primaryCategoryId: leaf.categoryId,
    additionalCategoryIds: [],
    industryIds: ['ind_water', 'ind_oem'],
    applicationIds: ['app_pump_monitoring'],
    name: localized(`${code} ${leaf.label}`),
    shortName: localized(`${code} ${leaf.label}`),
    summary: localized(summary),
    highlights: [localized('Source-backed generated fact'), localized('Adapter-derived SEO and GEO only')],
    applications: [localized('Pump monitoring'), localized('OEM equipment integration')],
    variants: [],
    commercialTerms: {
      minimumOrderQuantity: 1,
      standardLeadTime: sequence % 7 === 0 ? '4-6 weeks' : '2-3 weeks',
      warranty: '12 months',
      oemCustomizable: true,
      privateLabelAvailable: sequence % 5 === 0,
    },
  }
}

function sensorProduct(sequence, leaf) {
  const code = `${leaf.modelPrefix}-${sequence.toString().padStart(4, '0')}`
  const rangeMax = leaf.rangeMax + (sequence % 5)
  const rangeDisplay = leaf.kind === 'switch-state' ? `0...${rangeMax} ${leaf.unit} setpoint` : `0...${rangeMax} ${leaf.unit}`
  const outputValue = leaf.kind === 'switch-state' ? 'SPDT relay' : '4-20 mA'
  const measurement = {
    kind: leaf.kind,
    range: { min: 0, max: rangeMax, unit: leaf.unit, display: rangeDisplay },
    accuracy: leaf.kind === 'switch-state' ? 'setpoint configurable' : '0.5% FS',
    overloadLimit: { value: rangeMax * 1.5, unit: leaf.unit, display: `${rangeMax * 1.5} ${leaf.unit}` },
  }
  const output = { kind: leaf.kind === 'switch-state' ? 'relay' : 'analog-current', value: outputValue, wiring: '2-wire' }
  const connections = {
    process: { kind: 'thread', value: 'G1/4', material: '316L stainless steel' },
    electrical: { kind: 'm12', value: 'M12x1 connector' },
  }
  const environmentalLimits = {
    ingressProtection: 'IP65',
    mediaTemperature: { min: -20, max: 85, unit: 'c', display: '-20...85 C' },
    ambientTemperature: { min: -20, max: 70, unit: 'c', display: '-20...70 C' },
    wettedMaterials: ['316L stainless steel', 'FKM'],
    compatibleMedia: ['Water', 'Air', 'Hydraulic oil'],
  }

  return {
    ...baseProduct(sequence, leaf, code, `${code} is an industrial sensor fact generated for adapter scale validation.`),
    measurementKinds: [leaf.kind],
    sensorProfile: {
      measurements: [measurement],
      outputs: [output],
      connections,
      environmentalLimits,
    },
    measurements: [measurement],
    outputs: [output],
    connections,
    environmentalLimits,
    specificationGroups: [
      {
        key: 'measurement',
        label: 'Measurement',
        values: [
          { key: 'measurement_range', label: 'Measurement range', value: rangeDisplay, unit: leaf.unit, display: rangeDisplay },
          { key: 'overload_limit', label: 'Overload limit', value: rangeMax * 1.5, unit: leaf.unit, display: `${rangeMax * 1.5} ${leaf.unit}` },
        ],
      },
      {
        key: 'electrical',
        label: 'Electrical',
        values: [
          { key: 'output_signal', label: 'Output signal', value: outputValue, display: outputValue },
        ],
      },
    ],
    certifications: ['ce', 'rohs'],
    documents: [
      { id: `doc_scale_${sequence.toString().padStart(4, '0')}_datasheet`, title: `${code} Datasheet`, kind: 'datasheet', href: `/documents/scale/${code.toLowerCase()}-datasheet.pdf`, contentLocale: 'en', revision: 'v1' },
    ],
    assets: [
      { id: `asset_scale_${sequence.toString().padStart(4, '0')}_primary`, kind: 'primary-image', href: `/images/scale/${code.toLowerCase()}.jpg`, alt: `${code} industrial sensor` },
    ],
  }
}

function valveProduct(sequence, leaf) {
  const code = `${leaf.modelPrefix}-${sequence.toString().padStart(4, '0')}`
  const valveProfile = {
    pressureRating: leaf.pressureRating,
    connection: leaf.connection,
    material: leaf.material,
    mode: leaf.mode,
    compatibleMedia: leaf.compatibleMedia,
    size: leaf.size,
  }

  return {
    ...baseProduct(sequence, leaf, code, `${code} is an industrial valve fact generated for optional-field validation.`),
    valveProfile,
    measurementKinds: [],
    specificationGroups: [
      {
        key: 'valve',
        label: 'Valve',
        values: [
          { key: 'feature', label: 'Pressure rating', value: leaf.pressureRating, display: leaf.pressureRating },
          { key: 'process_connection', label: 'Valve connection', value: leaf.connection, display: leaf.connection },
          { key: 'wetted_materials', label: 'Wetted materials', value: leaf.material, display: leaf.material },
          { key: 'compatible_media', label: 'Compatible media', value: leaf.compatibleMedia.join(', '), display: leaf.compatibleMedia.join(', ') },
          { key: 'feature', label: 'Valve size', value: leaf.size, display: leaf.size },
        ],
      },
    ],
  }
}

function localized(en) {
  return {
    en,
    zh: en,
  }
}
