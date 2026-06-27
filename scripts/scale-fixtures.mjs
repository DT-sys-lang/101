export function generateCmsFacts(productCount = 300) {
  const leaves = [
    { categoryId: 'cat_pressure_transmitters', kind: 'pressure', unit: 'bar', modelPrefix: 'PT', rangeMax: 16 },
    { categoryId: 'cat_level_sensors', kind: 'level', unit: 'm', modelPrefix: 'LT', rangeMax: 10 },
    { categoryId: 'cat_temperature_transmitters', kind: 'temperature', unit: 'c', modelPrefix: 'TT', rangeMax: 200 },
    { categoryId: 'cat_pressure_switches', kind: 'switch-state', unit: 'bar', modelPrefix: 'PS', rangeMax: 12 },
  ]

  return {
    categoryFacts: [
      category('cat_industrial_sensors', null, 'Industrial Sensors'),
      category('cat_pressure_sensors', 'cat_industrial_sensors', 'Pressure Sensors'),
      category('cat_pressure_transmitters', 'cat_pressure_sensors', 'Pressure Transmitters'),
      category('cat_level_sensors', 'cat_industrial_sensors', 'Level Sensors'),
      category('cat_temperature_transmitters', 'cat_industrial_sensors', 'Temperature Transmitters'),
      category('cat_pressure_switches', 'cat_pressure_sensors', 'Pressure Switches'),
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
  const code = `${leaf.modelPrefix}-${sequence.toString().padStart(4, '0')}`
  const rangeMax = leaf.rangeMax + (sequence % 5)
  const rangeDisplay = leaf.kind === 'switch-state' ? `0...${rangeMax} ${leaf.unit} setpoint` : `0...${rangeMax} ${leaf.unit}`

  return {
    id: `prd_scale_${sequence.toString().padStart(4, '0')}`,
    sku: `SCALE-${sequence.toString().padStart(4, '0')}`,
    model: `HY-${code}`,
    seriesId: `ser_scale_${leaf.modelPrefix.toLowerCase()}`,
    brand: 'HEIYU Industrial',
    manufacturer: 'HEIYU Industrial',
    lifecycle: 'active',
    availability: sequence % 7 === 0 ? 'made-to-order' : 'configurable',
    releasedAt: '2026-01-01',
    revisedAt: '2026-06-22',
    primaryCategoryId: leaf.categoryId,
    additionalCategoryIds: [],
    industryIds: ['ind_water', 'ind_oem'],
    applicationIds: ['app_pump_monitoring'],
    measurementKinds: [leaf.kind],
    name: localized(`${code} ${titleCase(leaf.kind)} Sensor`),
    shortName: localized(`${code} Sensor`),
    summary: localized(`${code} is an industrial sensor fact generated for adapter scale validation.`),
    highlights: [localized('Source-backed generated fact'), localized('Adapter-derived SEO and GEO only')],
    applications: [localized('Pump monitoring'), localized('OEM equipment integration')],
    measurements: [
      {
        kind: leaf.kind,
        range: { min: 0, max: rangeMax, unit: leaf.unit, display: rangeDisplay },
        accuracy: leaf.kind === 'switch-state' ? 'setpoint configurable' : '0.5% FS',
        overloadLimit: { value: rangeMax * 1.5, unit: leaf.unit, display: `${rangeMax * 1.5} ${leaf.unit}` },
      },
    ],
    outputs: [
      { kind: leaf.kind === 'switch-state' ? 'relay' : 'analog-current', value: leaf.kind === 'switch-state' ? 'SPDT relay' : '4-20 mA', wiring: '2-wire' },
    ],
    connections: {
      process: { kind: 'thread', value: 'G1/4', material: '316L stainless steel' },
      electrical: { kind: 'm12', value: 'M12x1 connector' },
    },
    environmentalLimits: {
      ingressProtection: 'IP65',
      mediaTemperature: { min: -20, max: 85, unit: 'c', display: '-20...85 C' },
      ambientTemperature: { min: -20, max: 70, unit: 'c', display: '-20...70 C' },
      wettedMaterials: ['316L stainless steel', 'FKM'],
      compatibleMedia: ['Water', 'Air', 'Hydraulic oil'],
    },
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
          { key: 'output_signal', label: 'Output signal', value: leaf.kind === 'switch-state' ? 'SPDT relay' : '4-20 mA', display: leaf.kind === 'switch-state' ? 'SPDT relay' : '4-20 mA' },
        ],
      },
    ],
    variants: [],
    certifications: ['ce', 'rohs'],
    documents: [
      { id: `doc_scale_${sequence.toString().padStart(4, '0')}_datasheet`, title: `${code} Datasheet`, kind: 'datasheet', href: `/documents/scale/${code.toLowerCase()}-datasheet.pdf`, locale: 'en', revision: 'v1' },
    ],
    assets: [
      { id: `asset_scale_${sequence.toString().padStart(4, '0')}_primary`, kind: 'primary-image', href: `/images/scale/${code.toLowerCase()}.jpg`, alt: `${code} industrial sensor` },
    ],
    commercialTerms: {
      minimumOrderQuantity: 1,
      standardLeadTime: sequence % 7 === 0 ? '4-6 weeks' : '2-3 weeks',
      warranty: '12 months',
      oemCustomizable: true,
      privateLabelAvailable: sequence % 5 === 0,
    },
  }
}

function localized(en) {
  return {
    en,
    zh: en,
  }
}

function titleCase(value) {
  return value.split('-').map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`).join(' ')
}
