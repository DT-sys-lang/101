import type { CmsFactInput } from './validation'

const text = (value: string) => ({ en: value, zh: value })

export const sensorValveCmsFactInput = {
  categoryFacts: [
    { id: 'cat_family_fixture_root', parentId: null, name: text('Family Fixture Root') },
    { id: 'cat_family_fixture_sensor', parentId: 'cat_family_fixture_root', name: text('Sensor Products') },
    { id: 'cat_family_fixture_valve', parentId: 'cat_family_fixture_root', name: text('Valve Products') },
  ],
  productFacts: [
    {
      id: 'prd_family_fixture_sensor',
      family: 'sensor',
      core: {
        family: 'sensor',
        sku: 'FIX-SENSOR-001',
        model: 'FIX-SENSOR-001',
        brand: 'Fixture Labs',
        primaryCategory: 'cat_family_fixture_sensor',
        name: text('Fixture Pressure Sensor'),
        shortName: text('Fixture Sensor'),
        summary: text('Sensor fixture for two-family CMS fact validation.'),
      },
      sensorProfile: {
        measurements: [
          {
            kind: 'pressure',
            range: { min: 0, max: 10, unit: 'bar', display: '0-10 bar' },
            overloadLimit: { value: 16, unit: 'bar', display: '16 bar' },
            accuracy: '0.5% FS',
          },
        ],
        outputs: [
          { kind: 'analog-current', value: '4-20 mA', wiring: '2-wire' },
        ],
        connections: {
          process: { kind: 'thread', value: 'G1/4', material: '316L' },
          electrical: { kind: 'm12', value: 'M12' },
        },
        environmentalLimits: {
          mediaTemperature: { min: -20, max: 80, unit: 'c', display: '-20-80 C' },
          ambientTemperature: { min: -10, max: 60, unit: 'c', display: '-10-60 C' },
          wettedMaterials: ['316L'],
          compatibleMedia: ['water'],
        },
      },
      sku: 'FIX-SENSOR-001',
      model: 'FIX-SENSOR-001',
      seriesId: 'ser_fixture_sensor',
      brand: 'Fixture Labs',
      manufacturer: 'Fixture Labs',
      availability: 'configurable',
      releasedAt: '2026-01-01',
      revisedAt: '2026-06-25',
      primaryCategoryId: 'cat_family_fixture_sensor',
      additionalCategoryIds: [],
      industryIds: [],
      applicationIds: [],
      measurementKinds: ['pressure'],
      name: text('Fixture Pressure Sensor'),
      shortName: text('Fixture Sensor'),
      summary: text('Sensor fixture for two-family CMS fact validation.'),
      highlights: [text('Sensor family fixture')],
      applications: [text('CMS fact validation')],
      specificationGroups: [
        {
          key: 'measurement',
          label: 'Measurement',
          values: [
            {
              key: 'measurement_range',
              label: 'Measurement range',
              value: '0-10 bar',
              display: '0-10 bar',
              unit: 'bar',
              sourceRefs: [
                {
                  id: 'doc_family_fixture_sensor_datasheet',
                  label: 'Sensor datasheet',
                  href: '/docs/family-fixture-sensor.pdf',
                  confidence: 'source-backed',
                },
              ],
            },
          ],
        },
      ],
      variants: [],
      certifications: ['ce'],
      documents: [
        {
          id: 'doc_family_fixture_sensor_datasheet',
          title: 'Sensor Datasheet',
          kind: 'datasheet',
          href: '/docs/family-fixture-sensor.pdf',
          revision: 'v1',
        },
      ],
    },
    {
      id: 'prd_family_fixture_valve',
      family: 'valve',
      core: {
        family: 'valve',
        sku: 'FIX-VALVE-001',
        model: 'FIX-VALVE-001',
        brand: 'Fixture Labs',
        primaryCategory: 'cat_family_fixture_valve',
        name: text('Fixture Solenoid Valve'),
        shortName: text('Fixture Valve'),
        summary: text('Valve fixture for two-family CMS fact validation without evidence documents.'),
      },
      valveProfile: {
        pressureRating: 'PN16',
        connection: 'G1/2',
        material: '316L',
        mode: 'normally closed',
        compatibleMedia: ['water', 'air'],
        size: 'DN15',
      },
      sku: 'FIX-VALVE-001',
      model: 'FIX-VALVE-001',
      seriesId: 'ser_fixture_valve',
      brand: 'Fixture Labs',
      manufacturer: 'Fixture Labs',
      availability: 'made-to-order',
      releasedAt: '2026-01-01',
      revisedAt: '2026-06-25',
      primaryCategoryId: 'cat_family_fixture_valve',
      additionalCategoryIds: [],
      industryIds: [],
      applicationIds: [],
      measurementKinds: [],
      name: text('Fixture Solenoid Valve'),
      shortName: text('Fixture Valve'),
      summary: text('Valve fixture for two-family CMS fact validation without evidence documents.'),
      highlights: [text('Valve family fixture')],
      applications: [text('CMS fact validation')],
      specificationGroups: [
        {
          key: 'valve',
          label: 'Valve',
          values: [
            {
              key: 'feature',
              label: 'Pressure rating',
              value: 'PN16',
              display: 'PN16',
            },
            {
              key: 'process_connection',
              label: 'Valve connection',
              value: 'G1/2',
              display: 'G1/2',
            },
            {
              key: 'feature',
              label: 'Valve size',
              value: 'DN15',
              display: 'DN15',
            },
          ],
        },
      ],
      variants: [],
    },
  ],
} as const satisfies CmsFactInput
