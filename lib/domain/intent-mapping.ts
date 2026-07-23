import type { GeoAiClaimType } from './geo-ai'
import type {
  ApplicationId,
  IndustryId,
  LocaleCode,
  NonEmptyReadonlyArray,
  ProductId,
} from './primitives'
import type {
  CertificationCode,
  MeasurementKind,
  ProductAvailabilityStatus,
  ProductConnectionSet,
  ProductDocument,
  ProductEnvironmentalLimits,
  ProductFamily,
  ProductMeasurement,
  ProductRecord,
  ProductSignalOutput,
  ProductSpecificationGroup,
  ValveProfile,
} from './product'
import type { SearchIntent } from './seo'

export type FutureIntentLocale = 'ru' | 'es'
export type IntentTargetType = 'industry' | 'ecosystem' | 'product' | 'case' | 'blog' | 'manual'
export type EcosystemTargetId = 'ecosystem:sensor-valve-pairing' | 'ecosystem:pump-loop' | 'ecosystem:oem-integration'
export type ManualTargetId = 'manual:datasheet' | 'manual:product-catalog'
export type CaseTargetId = 'case:application-reference'
export type BlogTargetId = 'blog:selection-guide'
export type IntentTargetId =
  | IndustryId
  | ApplicationId
  | ProductId
  | `family:${ProductFamily}`
  | EcosystemTargetId
  | ManualTargetId
  | CaseTargetId
  | BlogTargetId

export interface IntentPhrasebookEntry {
  readonly intentKey: string
  readonly locale: LocaleCode
  readonly keywords: NonEmptyReadonlyArray<string>
  readonly synonyms: readonly string[]
  readonly targetType: IntentTargetType
  readonly targetId: IntentTargetId
  readonly recommendedProducts: readonly ProductId[]
  readonly priority: number
}

export interface ProductIntentStrategySource {
  readonly core?: { readonly family?: ProductFamily }
  readonly identity?: {
    readonly family?: ProductFamily
    readonly availability?: ProductAvailabilityStatus
  }
  readonly family?: ProductFamily
  readonly availability?: ProductAvailabilityStatus
  readonly classification?: {
    readonly industryIds?: readonly IndustryId[]
    readonly applicationIds?: readonly ApplicationId[]
    readonly measurementKinds?: readonly MeasurementKind[]
  }
  readonly industryIds?: readonly IndustryId[]
  readonly applicationIds?: readonly ApplicationId[]
  readonly measurementKinds?: readonly MeasurementKind[]
  readonly sensorProfile?: {
    readonly measurements?: readonly ProductMeasurement[]
    readonly outputs?: readonly ProductSignalOutput[]
    readonly connections?: ProductConnectionSet
    readonly environmentalLimits?: ProductEnvironmentalLimits
  }
  readonly valveProfile?: ValveProfile
  readonly measurements?: readonly ProductMeasurement[]
  readonly outputs?: readonly ProductSignalOutput[]
  readonly connections?: ProductConnectionSet
  readonly environmentalLimits?: ProductEnvironmentalLimits
  readonly specificationGroups?: readonly ProductSpecificationGroup[]
  readonly certifications?: readonly CertificationCode[]
  readonly documents?: readonly ProductDocument[]
  readonly commercialTerms?: {
    readonly oemCustomizable: boolean
    readonly privateLabelAvailable: boolean
  }
}

export interface ProductSearchProjection {
  readonly locale: LocaleCode
  readonly title: string
  readonly summary: string
  readonly categoryLabel: string
  readonly categoryPathLabels: readonly string[]
  readonly keySpecs: readonly {
    readonly label: string
    readonly value: string
  }[]
}

export const searchRoutePriority = ['industry', 'ecosystem', 'product', 'case', 'blog', 'manual'] as const satisfies readonly IntentTargetType[]
export const publicIntentLocales = ['zh', 'en'] as const satisfies readonly LocaleCode[]
export const reservedFutureIntentLocales = ['ru', 'es'] as const satisfies readonly FutureIntentLocale[]

export const searchIntentMappingContract = {
  version: 'search-intent-mapping-v1',
  sourcePolicy: 'controlled-phrasebook-domain-aliases-product-facts',
  aiPolicy: 'no-ai-generated-intents',
  publicLocales: publicIntentLocales,
  reservedFutureLocales: reservedFutureIntentLocales,
  routePriority: searchRoutePriority,
  productFactSignals: ['industry', 'application', 'compatibleMedia', 'family', 'model', 'specification'] as const,
  optionalEvidencePolicy: 'documents-assets-certifications-are-optional-use-when-present-do-not-fabricate',
} as const

export const intentPhrasebook = [
  entry('industry_water_treatment', 'en', ['water treatment'], ['wastewater', 'municipal water', 'pump station', 'filtration', 'tank level', 'water system'], 'industry', 'ind_water', 100),
  entry('industry_water_treatment', 'zh', ['水处理'], ['污水', '市政供水', '泵站', '过滤', '水箱液位', '水系统', 'water treatment'], 'industry', 'ind_water', 100),
  entry('industry_oil_gas', 'en', ['oil and gas'], ['oil gas', 'pipeline', 'skid', 'process pressure', 'safety loop'], 'industry', 'ind_oil_gas', 94),
  entry('industry_oil_gas', 'zh', ['石油天然气'], ['油气', '管线', '撬装', '过程压力', '安全回路', 'oil and gas'], 'industry', 'ind_oil_gas', 94),
  entry('industry_energy', 'en', ['energy'], ['boiler', 'heat exchanger', 'utility', 'power plant', 'storage tank'], 'industry', 'ind_energy', 90),
  entry('industry_energy', 'zh', ['能源'], ['锅炉', '换热器', '公用工程', '电厂', '储罐', 'energy'], 'industry', 'ind_energy', 90),
  entry('industry_automation', 'en', ['industrial automation'], ['plc', 'dcs', 'interlock', 'equipment protection', 'machine automation'], 'industry', 'ind_automation', 90),
  entry('industry_automation', 'zh', ['工业自动化'], ['plc', 'dcs', '联锁', '设备保护', '机器自动化', 'industrial automation'], 'industry', 'ind_automation', 90),
  entry('industry_manufacturing', 'en', ['manufacturing'], ['machine tool', 'compressor', 'hydraulic equipment', 'production line'], 'industry', 'ind_manufacturing', 88),
  entry('industry_manufacturing', 'zh', ['制造业'], ['机床', '压缩机', '液压设备', '产线', 'manufacturing'], 'industry', 'ind_manufacturing', 88),
  entry('industry_oem', 'en', ['oem'], ['private label', 'batch delivery', 'repeatable machine build', 'custom sensor'], 'industry', 'ind_oem', 86),
  entry('industry_oem', 'zh', ['oem'], ['贴牌', '批量交付', '设备配套', '定制传感器', 'private label'], 'industry', 'ind_oem', 86),

  entry('application_high_pressure_measurement', 'en', ['high pressure measurement'], ['hydraulic pressure', 'test bench pressure', '0-600 bar', 'pump pressure'], 'ecosystem', 'app_high_pressure', 96),
  entry('application_high_pressure_measurement', 'zh', ['高压测量'], ['液压压力', '测试台压力', '0-600 bar', '泵压', 'high pressure measurement'], 'ecosystem', 'app_high_pressure', 96),
  entry('application_pipeline_monitoring', 'en', ['pipeline monitoring'], ['process piping', 'pipe pressure', 'differential pressure pipeline', 'utility line'], 'ecosystem', 'app_pipeline_monitoring', 92),
  entry('application_pipeline_monitoring', 'zh', ['管线监测'], ['工艺管道', '管道压力', '管道差压', '公用工程管路', 'pipeline monitoring'], 'ecosystem', 'app_pipeline_monitoring', 92),
  entry('application_oem_sensor_integration', 'en', ['oem sensor integration'], ['connector customization', 'signal matching', 'private label sensor', 'batch sensor supply'], 'ecosystem', 'app_oem_sensor_integration', 90),
  entry('application_oem_sensor_integration', 'zh', ['oem 传感器集成'], ['接口定制', '信号匹配', '贴牌传感器', '批量传感器供货', 'oem sensor integration'], 'ecosystem', 'app_oem_sensor_integration', 90),
  entry('application_pump_monitoring', 'en', ['pump monitoring'], ['pump protection', 'pump interlock', 'pump station pressure', 'pump loop'], 'ecosystem', 'app_pump_monitoring', 88),
  entry('application_pump_monitoring', 'zh', ['泵监测'], ['泵保护', '泵联锁', '泵站压力', '泵回路', 'pump monitoring'], 'ecosystem', 'app_pump_monitoring', 88),
  entry('ecosystem_sensor_valve_pairing', 'en', ['sensor valve pairing'], ['sensor and valve', 'valve with pressure sensor', 'pump valve sensor loop', 'control loop pairing'], 'ecosystem', 'ecosystem:sensor-valve-pairing', 84),
  entry('ecosystem_sensor_valve_pairing', 'zh', ['传感器阀门搭配'], ['传感器和阀门', '阀门配压力传感器', '泵阀传感器回路', '控制回路搭配', 'sensor valve pairing'], 'ecosystem', 'ecosystem:sensor-valve-pairing', 84),

  entry('product_sensor_family', 'en', ['industrial sensor'], ['pressure sensor', 'pressure transmitter', 'level sensor', 'temperature transmitter', 'pressure switch', '4-20ma sensor'], 'product', 'family:sensor', 82),
  entry('product_sensor_family', 'zh', ['工业传感器'], ['压力传感器', '压力变送器', '液位传感器', '温度变送器', '压力开关', '4-20ma 传感器', 'industrial sensor'], 'product', 'family:sensor', 82),
  entry('product_valve_family', 'en', ['industrial valve'], ['valve', 'solenoid valve', 'control valve', 'shutoff valve', 'ball valve', 'pn16 valve'], 'product', 'family:valve', 82),
  entry('product_valve_family', 'zh', ['工业阀门'], ['阀门', '电磁阀', '控制阀', '截止阀', '球阀', 'pn16 阀门', 'industrial valve'], 'product', 'family:valve', 82),

  entry('manual_datasheet', 'en', ['datasheet'], ['product manual', 'technical sheet', 'download manual', 'certificate download'], 'manual', 'manual:datasheet', 40),
  entry('manual_datasheet', 'zh', ['数据手册'], ['产品手册', '技术资料', '下载手册', '证书下载', 'datasheet'], 'manual', 'manual:datasheet', 40),
] as const satisfies readonly IntentPhrasebookEntry[]

const industryIntentAliases = {
  en: {
    ind_water: ['water treatment', 'wastewater', 'municipal water', 'pump station', 'groundwater', 'tank', 'reservoir'],
    ind_energy: ['energy', 'boiler', 'heat exchanger', 'utility', 'power', 'fuel tank', 'high temperature'],
    ind_hvac: ['hvac', 'air handling', 'duct pressure', 'building automation', 'clean room', 'filter monitoring'],
    ind_machine: ['machine tool', 'machinery', 'hydraulic equipment', 'compressor', 'production line'],
    ind_manufacturing: ['manufacturing', 'machine tool', 'compressor', 'hydraulic equipment', 'production line'],
    ind_hydraulics: ['hydraulic power unit', 'high pressure', 'pump station', 'oil pressure'],
    ind_process: ['process skid', 'pipeline', 'chemical fluid', 'filtration', 'heat exchanger'],
    ind_oil_gas: ['oil and gas', 'pipeline', 'skid', 'process pressure', 'safety loop'],
    ind_oem: ['oem', 'sensor integration', 'private label', 'repeatable machine build'],
    ind_automation: ['industrial automation', 'plc', 'dcs', 'interlock', 'equipment protection'],
    ind_chemical: ['chemical process', 'corrosive media', 'tank pressure'],
    ind_food: ['food process', 'flush diaphragm', 'sanitary media'],
    ind_environmental: ['environmental water', 'groundwater', 'borehole', 'open channel level'],
  },
  zh: {
    ind_water: ['水处理', '污水', '市政供水', '泵站', '地下水', '水箱', '水库'],
    ind_energy: ['能源', '锅炉', '换热器', '公用工程', '电力', '燃油罐', '高温'],
    ind_hvac: ['暖通', '空调箱', '风管压力', '楼宇自控', '洁净室', '过滤监测'],
    ind_machine: ['机床', '机械设备', '液压设备', '压缩机', '产线'],
    ind_manufacturing: ['制造业', '机床', '压缩机', '液压设备', '生产线'],
    ind_hydraulics: ['液压站', '高压', '泵站', '油压'],
    ind_process: ['过程撬装', '管线', '化工流体', '过滤', '换热器'],
    ind_oil_gas: ['石油天然气', '油气', '管线', '撬装', '过程压力', '安全回路'],
    ind_oem: ['oem', '传感器集成', '贴牌', '批量设备'],
    ind_automation: ['工业自动化', 'plc', 'dcs', '联锁', '设备保护'],
    ind_chemical: ['化工过程', '腐蚀介质', '罐体压力'],
    ind_food: ['食品工艺', '齐平膜片', '卫生介质'],
    ind_environmental: ['环保水务', '地下水', '井下', '明渠液位'],
  },
} as const satisfies Record<LocaleCode, Readonly<Record<string, readonly string[]>>>

const applicationIntentAliases = {
  en: {
    app_high_pressure: ['high pressure measurement', 'hydraulic pressure', 'test bench pressure', 'pump pressure'],
    app_pipeline_monitoring: ['pipeline monitoring', 'process piping', 'pipe pressure', 'differential pressure pipeline'],
    app_oem_sensor_integration: ['oem sensor integration', 'connector customization', 'signal matching', 'private label sensor'],
    app_pump_monitoring: ['pump monitoring', 'pump protection', 'pump station', 'pump pressure'],
    app_pump: ['pump pressure', 'pump station', 'water treatment'],
    app_pump_interlock: ['pump protection', 'pump interlock', 'switch state'],
    app_hydraulic_power_unit: ['hydraulic power unit', 'high pressure measurement'],
    app_machine_tool: ['machine tool', 'oem sensor integration'],
    app_oem_module: ['oem module', 'private label', 'batch delivery'],
    app_test_bench: ['test bench', 'high pressure measurement', 'calibration'],
    app_process_skid: ['process skid', 'pipeline monitoring'],
    app_filter_monitoring: ['filter monitoring', 'differential pressure'],
    app_heat_exchanger: ['heat exchanger', 'differential pressure', 'temperature'],
    app_tank_level: ['tank level', 'level monitoring', 'water treatment'],
    app_groundwater: ['groundwater', 'submersible level monitoring'],
    app_process_temperature: ['process temperature', 'temperature control'],
    app_hvac_temperature: ['hvac temperature', 'building automation'],
    app_compressor_protection: ['compressor protection', 'pressure switch'],
    app_clean_room: ['clean room', 'low differential pressure'],
  },
  zh: {
    app_high_pressure: ['高压测量', '液压压力', '测试台压力', '泵压'],
    app_pipeline_monitoring: ['管线监测', '工艺管道', '管道压力', '管道差压'],
    app_oem_sensor_integration: ['oem 传感器集成', '接口定制', '信号匹配', '贴牌传感器'],
    app_pump_monitoring: ['泵监测', '泵保护', '泵站', '泵压'],
    app_pump: ['泵压', '泵站', '水处理'],
    app_pump_interlock: ['泵保护', '泵联锁', '开关量'],
    app_hydraulic_power_unit: ['液压站', '高压测量'],
    app_machine_tool: ['机床', 'oem 传感器集成'],
    app_oem_module: ['oem 模块', '贴牌', '批量交付'],
    app_test_bench: ['测试台', '高压测量', '校准'],
    app_process_skid: ['过程撬装', '管线监测'],
    app_filter_monitoring: ['过滤监测', '差压'],
    app_heat_exchanger: ['换热器', '差压', '温度'],
    app_tank_level: ['水箱液位', '液位监测', '水处理'],
    app_groundwater: ['地下水', '投入式液位监测'],
    app_process_temperature: ['过程温度', '温度控制'],
    app_hvac_temperature: ['暖通温度', '楼宇自控'],
    app_compressor_protection: ['压缩机保护', '压力开关'],
    app_clean_room: ['洁净室', '低差压'],
  },
} as const satisfies Record<LocaleCode, Readonly<Record<string, readonly string[]>>>

const familyIntentAliases = {
  en: {
    sensor: ['sensor', 'sensors', 'transmitter', 'pressure sensor', 'pressure transmitter', 'level sensor', 'temperature transmitter', 'pressure switch', '4-20ma sensor'],
    valve: ['valve', 'valves', 'industrial valve', 'solenoid valve', 'control valve', 'shutoff valve', 'ball valve', 'pn16 valve'],
  },
  zh: {
    sensor: ['传感器', '变送器', '压力传感器', '压力变送器', '液位传感器', '温度变送器', '压力开关', '4-20ma 传感器'],
    valve: ['阀门', '工业阀门', '电磁阀', '控制阀', '截止阀', '球阀', 'pn16 阀门'],
  },
} as const satisfies Record<LocaleCode, Record<ProductFamily, readonly string[]>>

export function matchIntentPhrasebook(locale: LocaleCode, query: string): readonly IntentPhrasebookEntry[] {
  const normalizedQuery = normalizeIntentText(query)

  if (!normalizedQuery) {
    return []
  }

  return intentPhrasebook
    .filter((entry) => entry.locale === locale)
    .map((entry) => ({ entry, score: scoreIntentEntry(entry, normalizedQuery) }))
    .filter((match) => match.score > 0)
    .sort((left, right) => compareIntentMatches(left.entry, right.entry) || right.score - left.score)
    .map((match) => match.entry)
}

export function selectProductSearchIntents(source: ProductIntentStrategySource): NonEmptyReadonlyArray<SearchIntent> {
  const intents: SearchIntent[] = ['model-lookup', 'technical-comparison']
  const applicationIds = getApplicationIds(source)
  const industryIds = getIndustryIds(source)
  const availability = source.identity?.availability ?? source.availability

  if (applicationIds.length || industryIds.length || hasCompatibilityFacts(source) || getFamily(source) === 'valve') {
    intents.push('application-selection')
  }

  if (source.documents?.some((document) => ['datasheet', 'manual', 'catalog'].includes(document.kind))) {
    intents.push('datasheet-download')
  }

  if (source.commercialTerms?.oemCustomizable || source.commercialTerms?.privateLabelAvailable || industryIds.includes('ind_oem' as IndustryId)) {
    intents.push('oem-customization')
  }

  if (availability !== 'not-available') {
    intents.push('quote-request')
  }

  return toNonEmptyUnique(intents, 'model-lookup')
}

export function selectProductClaimTypes(source: ProductIntentStrategySource): NonEmptyReadonlyArray<GeoAiClaimType> {
  const claimTypes: GeoAiClaimType[] = ['identity']
  const measurements = getMeasurements(source)
  const outputs = getOutputs(source)
  const valveProfile = source.valveProfile

  if (measurements.length) {
    claimTypes.push('measurement-range')
  }

  if (outputs.length || measurements.some((measurement) => Boolean(measurement.accuracy))) {
    claimTypes.push('capability')
  }

  if (hasCompatibilityFacts(source)) {
    claimTypes.push('compatibility')
  }

  if (source.connections || source.sensorProfile?.connections || valveProfile) {
    claimTypes.push('installation')
  }

  if (
    valveProfile?.pressureRating
    || measurements.some((measurement) => Boolean(measurement.overloadLimit))
    || getEnvironmentalLimits(source)?.ingressProtection
  ) {
    claimTypes.push('limitation')
  }

  if (source.certifications?.length) {
    claimTypes.push('compliance')
  }

  claimTypes.push('selection-guidance')
  return toNonEmptyUnique(claimTypes, 'identity')
}

export function buildControlledProductSearchTerms(product: ProductRecord, projection: ProductSearchProjection): readonly string[] {
  const locale = projection.locale
  const measurements = product.measurements.length ? product.measurements : product.sensorProfile?.measurements ?? []
  const outputs = product.outputs.length ? product.outputs : product.sensorProfile?.outputs ?? []
  const connections = product.connections ?? product.sensorProfile?.connections
  const environmentalLimits = product.environmentalLimits ?? product.sensorProfile?.environmentalLimits
  const valveProfile = product.valveProfile

  return uniqueStrings([
    product.identity.id,
    product.identity.sku,
    product.identity.model,
    product.identity.brand,
    product.identity.manufacturer ?? '',
    product.core.family,
    ...getFamilyIntentAliases(product.core.family, locale),
    projection.title,
    projection.summary,
    projection.categoryLabel,
    ...projection.categoryPathLabels,
    ...product.classification.industryIds.flatMap((industryId) => getIndustryIntentAliases(industryId, locale)),
    ...product.classification.applicationIds.flatMap((applicationId) => getApplicationIntentAliases(applicationId, locale)),
    ...product.content.applications.flatMap((application) => [application.en, application.zh]),
    ...product.content.highlights.flatMap((highlight) => [highlight.en, highlight.zh]),
    ...product.classification.measurementKinds,
    ...measurements.flatMap((measurement) => [
      measurement.kind,
      measurement.range.display,
      measurement.range.unit,
      measurement.accuracy ?? '',
      measurement.overloadLimit?.display ?? '',
    ]),
    ...outputs.flatMap((output) => [output.kind, output.value, output.protocol ?? '', output.wiring ?? '']),
    ...(connections ? [
      connections.process.kind,
      connections.process.value,
      connections.process.material ?? '',
      connections.electrical.kind,
      connections.electrical.value,
    ] : []),
    ...(environmentalLimits ? [
      environmentalLimits.ingressProtection ?? '',
      environmentalLimits.mediaTemperature?.display ?? '',
      environmentalLimits.ambientTemperature?.display ?? '',
      ...environmentalLimits.wettedMaterials,
      ...(environmentalLimits.compatibleMedia ?? []),
    ] : []),
    ...(valveProfile ? [
      valveProfile.pressureRating,
      valveProfile.connection,
      valveProfile.material,
      valveProfile.mode,
      valveProfile.size,
      ...valveProfile.compatibleMedia,
    ] : []),
    ...projection.keySpecs.flatMap((spec) => [spec.label, spec.value]),
    ...product.specificationGroups.flatMap((group) => [
      group.key,
      group.label,
      ...group.values.flatMap((value) => [value.key, value.label, String(value.value), value.display, value.unit ?? '']),
    ]),
    ...(product.certifications ?? []),
    ...(product.documents ?? []).flatMap((document) => [document.kind, document.title, document.revision ?? '']),
    ...(product.assets ?? []).flatMap((asset) => [asset.kind, asset.alt]),
  ])
}

export function getIndustryIntentAliases(industryId: IndustryId, locale: LocaleCode): readonly string[] {
  return getDomainAliasTerms(industryIntentAliases, industryId, locale)
}

export function getApplicationIntentAliases(applicationId: ApplicationId, locale: LocaleCode): readonly string[] {
  return getDomainAliasTerms(applicationIntentAliases, applicationId, locale)
}

export function getFamilyIntentAliases(family: ProductFamily, locale: LocaleCode): readonly string[] {
  return uniqueStrings([
    ...familyIntentAliases.en[family],
    ...familyIntentAliases.zh[family],
    ...familyIntentAliases[locale][family],
  ])
}

export function validateIntentPhrasebook(entries: readonly IntentPhrasebookEntry[] = intentPhrasebook): readonly string[] {
  const errors: string[] = []
  const seen = new Set<string>()
  const publicLocales = new Set<string>(publicIntentLocales)
  const targetTypes = new Set<string>(searchRoutePriority)

  for (const [index, entry] of entries.entries()) {
    const label = `intentPhrasebook[${index}] ${entry.intentKey}:${entry.locale}`
    const duplicateKey = `${entry.intentKey}:${entry.locale}`

    if (seen.has(duplicateKey)) {
      errors.push(`${label}: duplicate intentKey + locale`)
    }

    seen.add(duplicateKey)

    if (!publicLocales.has(entry.locale)) {
      errors.push(`${label}: locale must be one of public locales ${publicIntentLocales.join(', ')}`)
    }

    if (reservedFutureIntentLocales.includes(entry.locale as FutureIntentLocale)) {
      errors.push(`${label}: reserved future locale must not be published in phrasebook yet`)
    }

    if (!entry.keywords.length || entry.keywords.some((keyword) => !keyword.trim())) {
      errors.push(`${label}: keywords must be non-empty controlled phrases`)
    }

    if (!targetTypes.has(entry.targetType)) {
      errors.push(`${label}: unsupported targetType ${entry.targetType}`)
    }

    if (!String(entry.targetId).trim()) {
      errors.push(`${label}: targetId must be non-empty`)
    }

    if (!Number.isInteger(entry.priority) || entry.priority <= 0) {
      errors.push(`${label}: priority must be a positive integer`)
    }
  }

  for (const locale of publicIntentLocales) {
    if (!entries.some((entry) => entry.locale === locale && entry.targetId === 'family:sensor')) {
      errors.push(`${locale}: phrasebook missing sensor family intent`)
    }

    if (!entries.some((entry) => entry.locale === locale && entry.targetId === 'family:valve')) {
      errors.push(`${locale}: phrasebook missing valve family intent`)
    }

    for (const targetType of ['industry', 'ecosystem', 'product', 'manual'] as const) {
      if (!entries.some((entry) => entry.locale === locale && entry.targetType === targetType)) {
        errors.push(`${locale}: phrasebook missing ${targetType} target coverage`)
      }
    }
  }

  return errors
}

export function normalizeIntentText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function entry(
  intentKey: string,
  locale: LocaleCode,
  keywords: NonEmptyReadonlyArray<string>,
  synonyms: readonly string[],
  targetType: IntentTargetType,
  targetId: IntentTargetId,
  priority: number,
  recommendedProducts: readonly ProductId[] = [],
): IntentPhrasebookEntry {
  return {
    intentKey,
    locale,
    keywords,
    synonyms,
    targetType,
    targetId,
    recommendedProducts,
    priority,
  }
}

function compareIntentMatches(left: IntentPhrasebookEntry, right: IntentPhrasebookEntry) {
  const leftRoutePriority = searchRoutePriority.indexOf(left.targetType)
  const rightRoutePriority = searchRoutePriority.indexOf(right.targetType)

  return leftRoutePriority - rightRoutePriority || right.priority - left.priority
}

function scoreIntentEntry(entry: IntentPhrasebookEntry, normalizedQuery: string) {
  let score = 0

  for (const phrase of [...entry.keywords, ...entry.synonyms]) {
    const normalizedPhrase = normalizeIntentText(phrase)

    if (!normalizedPhrase) {
      continue
    }

    if (normalizedQuery === normalizedPhrase) {
      score = Math.max(score, 100)
      continue
    }

    if (normalizedQuery.includes(normalizedPhrase)) {
      score = Math.max(score, 80)
      continue
    }

    const phraseTokens = normalizedPhrase.split(' ').filter(Boolean)

    if (phraseTokens.length > 1 && phraseTokens.every((token) => normalizedQuery.includes(token))) {
      score = Math.max(score, 50 + Math.min(phraseTokens.length, 5))
    }
  }

  return score
}

function getDomainAliasTerms(
  aliases: Record<LocaleCode, Readonly<Record<string, readonly string[]>>>,
  id: string,
  locale: LocaleCode,
) {
  return uniqueStrings([
    formatDomainId(id),
    ...(aliases.en[id] ?? []),
    ...(aliases.zh[id] ?? []),
    ...(aliases[locale][id] ?? []),
  ])
}

function getFamily(source: ProductIntentStrategySource): ProductFamily | undefined {
  return source.core?.family ?? source.identity?.family ?? source.family
}

function getIndustryIds(source: ProductIntentStrategySource): readonly IndustryId[] {
  return source.classification?.industryIds ?? source.industryIds ?? []
}

function getApplicationIds(source: ProductIntentStrategySource): readonly ApplicationId[] {
  return source.classification?.applicationIds ?? source.applicationIds ?? []
}

function getMeasurements(source: ProductIntentStrategySource): readonly ProductMeasurement[] {
  return source.measurements?.length ? source.measurements : source.sensorProfile?.measurements ?? []
}

function getOutputs(source: ProductIntentStrategySource): readonly ProductSignalOutput[] {
  return source.outputs?.length ? source.outputs : source.sensorProfile?.outputs ?? []
}

function getEnvironmentalLimits(source: ProductIntentStrategySource) {
  return source.environmentalLimits ?? source.sensorProfile?.environmentalLimits
}

function hasCompatibilityFacts(source: ProductIntentStrategySource) {
  const environmentalLimits = getEnvironmentalLimits(source)

  return Boolean(
    environmentalLimits?.compatibleMedia?.length
    || environmentalLimits?.wettedMaterials?.length
    || source.valveProfile?.compatibleMedia.length,
  )
}

function toNonEmptyUnique<TValue extends string>(values: readonly TValue[], fallback: TValue): NonEmptyReadonlyArray<TValue> {
  const unique = uniqueStrings(values)
  return (unique.length ? unique : [fallback]) as unknown as NonEmptyReadonlyArray<TValue>
}

function uniqueStrings<TValue extends string>(values: readonly TValue[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))] as TValue[]
}

function formatDomainId(value: string) {
  return value.replace(/^(ind|app|cat)_/, '').replace(/[-_]+/g, ' ')
}
