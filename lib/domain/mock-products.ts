import type { ProductGeoAiProfile } from './geo-ai'
import type {
  ApplicationId,
  AssetId,
  CategoryCanonicalPath,
  CategoryId,
  DocumentId,
  EvidenceId,
  IndustryId,
  LocaleCode,
  LocalizedText,
  NonEmptyReadonlyArray,
  ProductCanonicalPath,
  ProductId,
  ProductVariantId,
  QuantityRange,
  QuantityValue,
  RevisionString,
  SeriesId,
  SlugSegment,
  SourceRef,
  UnitCode,
} from './primitives'
import type {
  CertificationCode,
  ElectricalConnectionKind,
  MeasurementKind,
  ProcessConnectionKind,
  ProductAvailabilityStatus,
  ProductRecord,
  ProductSpecificationValue,
  SignalOutputKind,
} from './product'
import type { ProductSeoFields, SearchIntent, SeoBreadcrumbItem } from './seo'
import type { SpecificationKey } from './specification'

const brandName = 'YUFAVOR'
const productReviewDate = '2026-06-17'
const documentRevision: RevisionString = 'v1'

type KnownCategoryId =
  | 'cat_industrial_sensors'
  | 'cat_pressure_sensors'
  | 'cat_pressure_transmitters'
  | 'cat_differential_pressure'
  | 'cat_level_sensors'
  | 'cat_submersible_level'
  | 'cat_temperature_measurement'
  | 'cat_temperature_transmitters'
  | 'cat_industrial_switches'
  | 'cat_pressure_switches'

type MockPrimaryCategoryId = Exclude<KnownCategoryId, 'cat_industrial_sensors'>

type SeoSeed = {
  readonly slug: SlugSegment
  readonly canonicalPath: ProductCanonicalPath
  readonly title: LocalizedText
  readonly metaDescription: LocalizedText
  readonly h1: LocalizedText
  readonly searchIntent: NonEmptyReadonlyArray<SearchIntent>
}

type MockSpecSeed = {
  readonly key: SpecificationKey
  readonly label: LocalizedText
  readonly value: string | number | boolean
  readonly display: string
  readonly unit?: UnitCode
}

type MockProductSeed = {
  readonly key: string
  readonly id: ProductId
  readonly variantId: ProductVariantId
  readonly sku: string
  readonly model: string
  readonly seriesId: SeriesId
  readonly primaryCategoryId: MockPrimaryCategoryId
  readonly measurementKinds: NonEmptyReadonlyArray<MeasurementKind>
  readonly availability: ProductAvailabilityStatus
  readonly name: LocalizedText
  readonly shortName: LocalizedText
  readonly summary: LocalizedText
  readonly highlights: NonEmptyReadonlyArray<LocalizedText>
  readonly applications: NonEmptyReadonlyArray<LocalizedText>
  readonly industryIds: NonEmptyReadonlyArray<IndustryId>
  readonly applicationIds: NonEmptyReadonlyArray<ApplicationId>
  readonly measurement: {
    readonly kind: MeasurementKind
    readonly range: QuantityRange
    readonly overloadLimit: QuantityValue
    readonly accuracy?: string
  }
  readonly output: {
    readonly kind: SignalOutputKind
    readonly value: string
    readonly protocol?: string
    readonly wiring?: string
  }
  readonly processConnection: {
    readonly kind: ProcessConnectionKind
    readonly value: string
    readonly material?: string
  }
  readonly electricalConnection: {
    readonly kind: ElectricalConnectionKind
    readonly value: string
  }
  readonly ingressProtection: `IP${number}${number}`
  readonly wettedMaterials: NonEmptyReadonlyArray<string>
  readonly compatibleMedia: NonEmptyReadonlyArray<string>
  readonly specs: NonEmptyReadonlyArray<MockSpecSeed>
  readonly certifications: NonEmptyReadonlyArray<CertificationCode>
  readonly seo: SeoSeed
  readonly geo: {
    readonly oneSentence: LocalizedText
    readonly shortParagraph: LocalizedText
    readonly technicalAbstract: LocalizedText
    readonly bestFor: NonEmptyReadonlyArray<LocalizedText>
    readonly decisionCriteria: NonEmptyReadonlyArray<LocalizedText>
    readonly faqQuestion: LocalizedText
    readonly faqAnswer: LocalizedText
  }
}

const categoryMetadata = {
  cat_industrial_sensors: {
    label: text('Industrial Sensors', '工业传感器'),
    canonicalPath: '/products/industrial-sensors',
    slugPath: ['industrial-sensors'],
  },
  cat_pressure_sensors: {
    label: text('Pressure Sensors', '压力传感器'),
    canonicalPath: '/products/industrial-sensors/pressure-sensors',
    slugPath: ['industrial-sensors', 'pressure-sensors'],
  },
  cat_pressure_transmitters: {
    label: text('Pressure Transmitters', '压力变送器'),
    canonicalPath: '/products/industrial-sensors/pressure-sensors/pressure-transmitters',
    slugPath: ['industrial-sensors', 'pressure-sensors', 'pressure-transmitters'],
  },
  cat_differential_pressure: {
    label: text('Differential Pressure', '差压传感器'),
    canonicalPath: '/products/industrial-sensors/pressure-sensors/differential-pressure',
    slugPath: ['industrial-sensors', 'pressure-sensors', 'differential-pressure'],
  },
  cat_level_sensors: {
    label: text('Level Sensors', '液位传感器'),
    canonicalPath: '/products/industrial-sensors/level-sensors',
    slugPath: ['industrial-sensors', 'level-sensors'],
  },
  cat_submersible_level: {
    label: text('Submersible Level Sensors', '投入式液位传感器'),
    canonicalPath: '/products/industrial-sensors/level-sensors/submersible-level-sensors',
    slugPath: ['industrial-sensors', 'level-sensors', 'submersible-level-sensors'],
  },
  cat_temperature_measurement: {
    label: text('Temperature Measurement', '温度测量'),
    canonicalPath: '/products/industrial-sensors/temperature-measurement',
    slugPath: ['industrial-sensors', 'temperature-measurement'],
  },
  cat_temperature_transmitters: {
    label: text('Temperature Transmitters', '温度变送器'),
    canonicalPath: '/products/industrial-sensors/temperature-measurement/temperature-transmitters',
    slugPath: ['industrial-sensors', 'temperature-measurement', 'temperature-transmitters'],
  },
  cat_industrial_switches: {
    label: text('Industrial Switches', '工业开关'),
    canonicalPath: '/products/industrial-sensors/industrial-switches',
    slugPath: ['industrial-sensors', 'industrial-switches'],
  },
  cat_pressure_switches: {
    label: text('Pressure Switches', '压力开关'),
    canonicalPath: '/products/industrial-sensors/industrial-switches/pressure-switches',
    slugPath: ['industrial-sensors', 'industrial-switches', 'pressure-switches'],
  },
} as const satisfies Record<KnownCategoryId, {
  readonly label: LocalizedText
  readonly canonicalPath: CategoryCanonicalPath
  readonly slugPath: NonEmptyReadonlyArray<SlugSegment>
}>

const categoryPaths = {
  cat_pressure_sensors: ['cat_industrial_sensors', 'cat_pressure_sensors'],
  cat_pressure_transmitters: ['cat_industrial_sensors', 'cat_pressure_sensors', 'cat_pressure_transmitters'],
  cat_differential_pressure: ['cat_industrial_sensors', 'cat_pressure_sensors', 'cat_differential_pressure'],
  cat_level_sensors: ['cat_industrial_sensors', 'cat_level_sensors'],
  cat_submersible_level: ['cat_industrial_sensors', 'cat_level_sensors', 'cat_submersible_level'],
  cat_temperature_measurement: ['cat_industrial_sensors', 'cat_temperature_measurement'],
  cat_temperature_transmitters: ['cat_industrial_sensors', 'cat_temperature_measurement', 'cat_temperature_transmitters'],
  cat_industrial_switches: ['cat_industrial_sensors', 'cat_industrial_switches'],
  cat_pressure_switches: ['cat_industrial_sensors', 'cat_industrial_switches', 'cat_pressure_switches'],
} as const satisfies Record<MockPrimaryCategoryId, NonEmptyReadonlyArray<CategoryId>>

const mockProductSeeds = [
  productSeed({
    key: 'yf-p100',
    id: 'prd_yf_p100',
    variantId: 'var_yf_p100_default',
    sku: 'YF-P100-420MA-G14-M12',
    model: 'YF-P100',
    seriesId: 'ser_pressure',
    primaryCategoryId: 'cat_pressure_transmitters',
    measurementKinds: ['pressure'],
    availability: 'standard-lead-time',
    enName: 'P100 Industrial Pressure Transmitter',
    zhName: 'P100 工业压力变送器',
    enSummary: 'Compact transmitter for pump stations, hydraulic power units, and process pressure monitoring.',
    zhSummary: '适用于泵站、液压站和过程压力监测的紧凑型压力变送器。',
    measurementRange: range(0, 600, 'bar', '0-600 bar'),
    accuracy: '0.5% FS',
    outputValue: output('analog-current', '4-20mA', '2-wire'),
    processConnection: process('thread', 'G1/4 male', '316L stainless steel'),
    electricalConnection: electrical('m12', 'M12 4-pin'),
    ingressProtection: 'IP67',
    wettedMaterials: ['316L stainless steel', 'FKM'],
    compatibleMedia: ['water', 'hydraulic oil', 'compressed air'],
    industryIds: ['ind_water', 'ind_hydraulics'],
    applicationIds: ['app_pump', 'app_hydraulic_power_unit'],
    specValues: specs('0-600 bar', '4-20mA', 'IP67'),
    certifications: certs('ce', 'rohs', 'iso9001'),
  }),
  productSeed({
    key: 'yf-p200',
    id: 'prd_yf_p200',
    variantId: 'var_yf_p200_default',
    sku: 'YF-P200-010V-G14-M12',
    model: 'YF-P200',
    seriesId: 'ser_pressure',
    primaryCategoryId: 'cat_pressure_transmitters',
    measurementKinds: ['pressure'],
    availability: 'stock-model',
    enName: 'P200 Compact Pressure Transducer',
    zhName: 'P200 紧凑型压力传感器',
    enSummary: 'Voltage-output transducer for OEM machines and compact hydraulic equipment.',
    zhSummary: '面向 OEM 设备和紧凑液压设备的电压输出压力传感器。',
    measurementRange: range(0, 100, 'bar', '0-100 bar'),
    accuracy: '0.5% FS',
    outputValue: output('analog-voltage', '0-10V', '3-wire'),
    processConnection: process('thread', 'G1/4 male', '316L stainless steel'),
    electricalConnection: electrical('m12', 'M12 4-pin'),
    ingressProtection: 'IP67',
    wettedMaterials: ['316L stainless steel', 'FKM'],
    compatibleMedia: ['water', 'oil', 'air'],
    industryIds: ['ind_machine', 'ind_oem'],
    applicationIds: ['app_machine_tool', 'app_oem_module'],
    specValues: specs('0-100 bar', '0-10V', 'IP67'),
    certifications: certs('ce', 'rohs'),
  }),
  productSeed({
    key: 'yf-p310',
    id: 'prd_yf_p310',
    variantId: 'var_yf_p310_default',
    sku: 'YF-P310-420MA-NPT-DIN',
    model: 'YF-P310',
    seriesId: 'ser_pressure',
    primaryCategoryId: 'cat_pressure_transmitters',
    measurementKinds: ['pressure'],
    availability: 'configurable',
    enName: 'P310 High Accuracy Pressure Transmitter',
    zhName: 'P310 高精度压力变送器',
    enSummary: 'High accuracy pressure transmitter for process skids, calibration loops, and test benches.',
    zhSummary: '用于过程撬装、校准回路和测试台的高精度压力变送器。',
    measurementRange: range(0, 40, 'bar', '0-40 bar'),
    accuracy: '0.25% FS',
    outputValue: output('analog-current', '4-20mA', '2-wire'),
    processConnection: process('thread', '1/4 NPT male', '316L stainless steel'),
    electricalConnection: electrical('din43650', 'DIN 43650A'),
    ingressProtection: 'IP65',
    wettedMaterials: ['316L stainless steel', 'FKM'],
    compatibleMedia: ['water', 'oil', 'gas'],
    industryIds: ['ind_process', 'ind_quality'],
    applicationIds: ['app_test_bench', 'app_process_skid'],
    specValues: specs('0-40 bar', '4-20mA', '0.25% FS'),
    certifications: certs('ce', 'rohs', 'iso9001'),
  }),
  productSeed({
    key: 'yf-dp20',
    id: 'prd_yf_dp20',
    variantId: 'var_yf_dp20_default',
    sku: 'YF-DP20-010V-KPA',
    model: 'YF-DP20',
    seriesId: 'ser_dp',
    primaryCategoryId: 'cat_differential_pressure',
    measurementKinds: ['differential-pressure'],
    availability: 'standard-lead-time',
    enName: 'DP20 Industrial Differential Pressure Sensor',
    zhName: 'DP20 工业差压传感器',
    enSummary: 'Differential pressure sensor for liquid filters, heat exchangers, and pump differential monitoring.',
    zhSummary: '用于液体过滤器、换热器和泵差压监测的工业差压传感器。',
    measurementRange: range(0, 10, 'kpa', '0-10 kPa'),
    accuracy: '0.5% FS',
    outputValue: output('analog-voltage', '0-10V', '3-wire'),
    processConnection: process('thread', 'dual G1/4 female', '316L stainless steel'),
    electricalConnection: electrical('m12', 'M12 5-pin'),
    ingressProtection: 'IP67',
    wettedMaterials: ['316L stainless steel', 'FKM'],
    compatibleMedia: ['water', 'glycol', 'oil'],
    industryIds: ['ind_energy', 'ind_water'],
    applicationIds: ['app_heat_exchanger', 'app_filter_monitoring'],
    specValues: specs('0-10 kPa', '0-10V', 'dual G1/4'),
    certifications: certs('ce', 'rohs', 'iso9001'),
  }),
  productSeed({
    key: 'yf-lt80',
    id: 'prd_yf_lt80',
    variantId: 'var_yf_lt80_default',
    sku: 'YF-LT80-420MA-200M',
    model: 'YF-LT80',
    seriesId: 'ser_level',
    primaryCategoryId: 'cat_submersible_level',
    measurementKinds: ['level'],
    availability: 'configurable',
    enName: 'LT80 Submersible Level Sensor',
    zhName: 'LT80 投入式液位传感器',
    enSummary: 'Submersible hydrostatic level sensor for tanks, wells, reservoirs, and wastewater stations.',
    zhSummary: '用于水箱、水井、水库和污水站的投入式静压液位传感器。',
    measurementRange: range(0, 200, 'mh2o', '0-200 mH2O'),
    accuracy: '0.5% FS',
    outputValue: output('analog-current', '4-20mA', '2-wire'),
    processConnection: process('submersible-cable', 'PUR vented cable', '316L stainless steel'),
    electricalConnection: electrical('cable', 'PUR vented cable'),
    ingressProtection: 'IP68',
    wettedMaterials: ['316L stainless steel', 'PUR', 'FKM'],
    compatibleMedia: ['water', 'wastewater', 'groundwater'],
    industryIds: ['ind_water', 'ind_environmental'],
    applicationIds: ['app_tank_level', 'app_groundwater'],
    specValues: specs('0-200 mH2O', '4-20mA', 'IP68'),
    certifications: certs('ce', 'rohs', 'iso9001'),
  }),
  productSeed({
    key: 'yf-ul60',
    id: 'prd_yf_ul60',
    variantId: 'var_yf_ul60_default',
    sku: 'YF-UL60-420MA-10M',
    model: 'YF-UL60',
    seriesId: 'ser_level',
    primaryCategoryId: 'cat_level_sensors',
    measurementKinds: ['level'],
    availability: 'standard-lead-time',
    enName: 'UL60 Ultrasonic Level Transmitter',
    zhName: 'UL60 超声波液位变送器',
    enSummary: 'Non-contact ultrasonic level transmitter for tanks, sumps, and open channel monitoring.',
    zhSummary: '用于罐体、集水井和明渠监测的非接触式超声波液位变送器。',
    measurementRange: range(0, 10, 'm', '0-10 m'),
    accuracy: '0.25% FS',
    outputValue: output('analog-current', '4-20mA', '2-wire'),
    processConnection: process('none', 'top mount bracket', 'PVDF'),
    electricalConnection: electrical('cable', '2m shielded cable'),
    ingressProtection: 'IP67',
    wettedMaterials: ['PVDF', 'PC'],
    compatibleMedia: ['water', 'wastewater', 'chemical tank vapor'],
    industryIds: ['ind_water', 'ind_environmental'],
    applicationIds: ['app_open_channel', 'app_tank_level'],
    specValues: specs('0-10 m', '4-20mA', 'non-contact'),
    certifications: certs('ce', 'rohs'),
  }),
  productSeed({
    key: 'yf-t20',
    id: 'prd_yf_t20',
    variantId: 'var_yf_t20_default',
    sku: 'YF-T20-420MA-PT100',
    model: 'YF-T20',
    seriesId: 'ser_temperature',
    primaryCategoryId: 'cat_temperature_transmitters',
    measurementKinds: ['temperature'],
    availability: 'standard-lead-time',
    enName: 'T20 Temperature Transmitter',
    zhName: 'T20 温度变送器',
    enSummary: 'Temperature transmitter for PT100 and thermocouple input in industrial process loops.',
    zhSummary: '用于工业过程回路中 PT100 和热电偶输入的温度变送器。',
    measurementRange: range(-50, 200, 'c', '-50-200 C'),
    accuracy: '0.2% FS',
    outputValue: output('analog-current', '4-20mA', '2-wire'),
    processConnection: process('probe', '6mm probe assembly', '316L stainless steel'),
    electricalConnection: electrical('terminal-head', 'DIN head terminal'),
    ingressProtection: 'IP65',
    wettedMaterials: ['316L stainless steel', 'ceramic terminal'],
    compatibleMedia: ['air', 'water', 'process media'],
    industryIds: ['ind_hvac', 'ind_process'],
    applicationIds: ['app_process_temperature', 'app_hvac_temperature'],
    specValues: specs('-50-200 C', '4-20mA', 'PT100 / TC'),
    certifications: certs('ce', 'rohs', 'iso9001'),
  }),
  productSeed({
    key: 'yf-rtd100',
    id: 'prd_yf_rtd100',
    variantId: 'var_yf_rtd100_default',
    sku: 'YF-RTD100-PT100-G12',
    model: 'YF-RTD100',
    seriesId: 'ser_temperature',
    primaryCategoryId: 'cat_temperature_measurement',
    measurementKinds: ['temperature'],
    availability: 'standard-lead-time',
    enName: 'RTD100 PT100 Probe Assembly',
    zhName: 'RTD100 PT100 温度探头组件',
    enSummary: 'PT100 probe assembly for machinery, HVAC piping, and utility temperature measurement.',
    zhSummary: '用于机械设备、暖通管路和公用工程温度测量的 PT100 探头组件。',
    measurementRange: range(-50, 400, 'c', '-50-400 C'),
    accuracy: 'Class A',
    outputValue: output('analog-current', '4-20mA', 'with transmitter option'),
    processConnection: process('thread', 'G1/2 compression fitting', '316L stainless steel'),
    electricalConnection: electrical('connector', 'M12 or head terminal'),
    ingressProtection: 'IP65',
    wettedMaterials: ['316L stainless steel', 'ceramic'],
    compatibleMedia: ['air', 'water', 'oil'],
    industryIds: ['ind_machine', 'ind_hvac'],
    applicationIds: ['app_pipe_temperature', 'app_machine_temperature'],
    specValues: specs('-50-400 C', 'PT100 Class A', 'G1/2'),
    certifications: certs('ce', 'rohs'),
  }),
  productSeed({
    key: 'yf-ps30',
    id: 'prd_yf_ps30',
    variantId: 'var_yf_ps30_default',
    sku: 'YF-PS30-SPDT-40B',
    model: 'YF-PS30',
    seriesId: 'ser_switch',
    primaryCategoryId: 'cat_pressure_switches',
    measurementKinds: ['pressure'],
    availability: 'stock-model',
    enName: 'PS30 Adjustable Pressure Switch',
    zhName: 'PS30 可调压力开关',
    enSummary: 'Adjustable pressure switch for compressors, pumps, and equipment protection circuits.',
    zhSummary: '用于压缩机、泵和设备保护回路的可调压力开关。',
    measurementRange: range(0.1, 40, 'bar', '0.1-40 bar'),
    accuracy: 'adjustable setpoint',
    outputValue: output('relay', 'SPDT', 'mechanical contact'),
    processConnection: process('thread', 'G1/4 male', 'brass or stainless steel'),
    electricalConnection: electrical('din43650', 'DIN 43650A'),
    ingressProtection: 'IP65',
    wettedMaterials: ['brass', '316L stainless steel', 'NBR'],
    compatibleMedia: ['air', 'water', 'oil'],
    industryIds: ['ind_machine', 'ind_compressor'],
    applicationIds: ['app_compressor_protection', 'app_pump_interlock'],
    specValues: specs('0.1-40 bar', 'SPDT', '1M cycles'),
    certifications: certs('ce', 'rohs'),
  }),
  productSeed({
    key: 'yf-ps50',
    id: 'prd_yf_ps50',
    variantId: 'var_yf_ps50_default',
    sku: 'YF-PS50-PNP-100B',
    model: 'YF-PS50',
    seriesId: 'ser_switch',
    primaryCategoryId: 'cat_pressure_switches',
    measurementKinds: ['pressure'],
    availability: 'configurable',
    enName: 'PS50 Electronic Pressure Switch',
    zhName: 'PS50 电子压力开关',
    enSummary: 'Electronic pressure switch with display and transistor output for automation systems.',
    zhSummary: '带显示和晶体管输出的电子压力开关，适用于自动化系统。',
    measurementRange: range(0, 100, 'bar', '0-100 bar'),
    accuracy: '0.5% FS',
    outputValue: output('switch', 'PNP / NPN', 'transistor output'),
    processConnection: process('thread', 'G1/4 male', '316L stainless steel'),
    electricalConnection: electrical('m12', 'M12 4-pin'),
    ingressProtection: 'IP67',
    wettedMaterials: ['316L stainless steel', 'FKM'],
    compatibleMedia: ['water', 'oil', 'compressed air'],
    industryIds: ['ind_machine', 'ind_hydraulics'],
    applicationIds: ['app_plc_pressure', 'app_machine_protection'],
    specValues: specs('0-100 bar', 'PNP / NPN', 'LED display'),
    certifications: certs('ce', 'rohs'),
  }),
  productSeed({
    key: 'yf-p520',
    id: 'prd_yf_p520',
    variantId: 'var_yf_p520_default',
    sku: 'YF-P520-420MA-G12-CER',
    model: 'YF-P520',
    seriesId: 'ser_pressure',
    primaryCategoryId: 'cat_pressure_transmitters',
    measurementKinds: ['pressure'],
    availability: 'made-to-order',
    enName: 'P520 Ceramic Pressure Sensor',
    zhName: 'P520 陶瓷压力传感器',
    enSummary: 'Ceramic-cell pressure sensor for corrosive water, wastewater, and light chemical media.',
    zhSummary: '适用于腐蚀性水、污水和轻化工介质的陶瓷芯体压力传感器。',
    measurementRange: range(0, 16, 'bar', '0-16 bar'),
    accuracy: '0.5% FS',
    outputValue: output('analog-current', '4-20mA', '2-wire'),
    processConnection: process('thread', 'G1/2 male', 'ceramic diaphragm'),
    electricalConnection: electrical('cable', '2m PUR cable'),
    ingressProtection: 'IP68',
    wettedMaterials: ['ceramic', 'FKM', 'PVDF'],
    compatibleMedia: ['wastewater', 'mild chemicals', 'water'],
    industryIds: ['ind_water', 'ind_chemical'],
    applicationIds: ['app_wastewater', 'app_tank_pressure'],
    specValues: specs('0-16 bar', '4-20mA', 'ceramic diaphragm'),
    certifications: certs('ce', 'rohs'),
  }),
  productSeed({
    key: 'yf-p900',
    id: 'prd_yf_p900',
    variantId: 'var_yf_p900_default',
    sku: 'YF-P900-420MA-FLANGE',
    model: 'YF-P900',
    seriesId: 'ser_pressure',
    primaryCategoryId: 'cat_pressure_transmitters',
    measurementKinds: ['pressure'],
    availability: 'quote-required',
    enName: 'P900 Flush Diaphragm Pressure Transmitter',
    zhName: 'P900 平膜压力变送器',
    enSummary: 'Flush diaphragm transmitter for viscous media, food processing, and clog-prone process lines.',
    zhSummary: '用于粘稠介质、食品加工和易堵过程管线的平膜压力变送器。',
    measurementRange: range(0, 25, 'bar', '0-25 bar'),
    accuracy: '0.5% FS',
    outputValue: output('analog-current', '4-20mA', '2-wire'),
    processConnection: process('flange', 'DN25 flush flange', '316L stainless steel'),
    electricalConnection: electrical('m12', 'M12 4-pin'),
    ingressProtection: 'IP69',
    wettedMaterials: ['316L stainless steel', 'EPDM'],
    compatibleMedia: ['viscous liquid', 'food slurry', 'process water'],
    industryIds: ['ind_food', 'ind_process'],
    applicationIds: ['app_food_process', 'app_flush_diaphragm'],
    specValues: specs('0-25 bar', '4-20mA', 'flush diaphragm'),
    certifications: certs('ce', 'rohs', 'food-grade'),
  }),
  productSeed({
    key: 'yf-dp10',
    id: 'prd_yf_dp10',
    variantId: 'var_yf_dp10_default',
    sku: 'YF-DP10-420MA-PA',
    model: 'YF-DP10',
    seriesId: 'ser_dp',
    primaryCategoryId: 'cat_differential_pressure',
    measurementKinds: ['differential-pressure'],
    availability: 'stock-model',
    enName: 'DP10 Low Differential Pressure Transmitter',
    zhName: 'DP10 微差压变送器',
    enSummary: 'Low range differential pressure transmitter for filters, clean rooms, and air handling units.',
    zhSummary: '用于过滤器、洁净室和空气处理机组的微差压变送器。',
    measurementRange: range(0, 1000, 'pa', '0-1000 Pa'),
    accuracy: '1.0% FS',
    outputValue: output('analog-current', '4-20mA', '2-wire'),
    processConnection: process('remote', 'barbed hose ports', 'ABS'),
    electricalConnection: electrical('terminal-head', 'screw terminal'),
    ingressProtection: 'IP65',
    wettedMaterials: ['ABS', 'silicone'],
    compatibleMedia: ['air', 'non-corrosive gas'],
    industryIds: ['ind_hvac', 'ind_cleanroom'],
    applicationIds: ['app_filter_monitoring', 'app_clean_room'],
    specValues: specs('0-1000 Pa', '4-20mA', 'IP65'),
    certifications: certs('ce', 'rohs'),
  }),
  productSeed({
    key: 'yf-dp40',
    id: 'prd_yf_dp40',
    variantId: 'var_yf_dp40_default',
    sku: 'YF-DP40-420MA-HVAC',
    model: 'YF-DP40',
    seriesId: 'ser_dp',
    primaryCategoryId: 'cat_differential_pressure',
    measurementKinds: ['differential-pressure'],
    availability: 'configurable',
    enName: 'DP40 HVAC Differential Pressure Transmitter',
    zhName: 'DP40 暖通差压变送器',
    enSummary: 'HVAC differential pressure transmitter for duct pressure, fan control, and building automation.',
    zhSummary: '用于风管压力、风机控制和楼宇自控的暖通差压变送器。',
    measurementRange: range(0, 500, 'pa', '0-500 Pa'),
    accuracy: '1.0% FS',
    outputValue: output('analog-current', '4-20mA', '2-wire'),
    processConnection: process('none', 'duct pressure ports', 'ABS'),
    electricalConnection: electrical('terminal-head', 'spring terminal'),
    ingressProtection: 'IP54',
    wettedMaterials: ['ABS', 'silicone'],
    compatibleMedia: ['air'],
    industryIds: ['ind_hvac', 'ind_building'],
    applicationIds: ['app_fan_control', 'app_duct_pressure'],
    specValues: specs('0-500 Pa', '4-20mA', 'duct mount'),
    certifications: certs('ce', 'rohs'),
  }),
  productSeed({
    key: 'yf-lt90',
    id: 'prd_yf_lt90',
    variantId: 'var_yf_lt90_default',
    sku: 'YF-LT90-420MA-100M',
    model: 'YF-LT90',
    seriesId: 'ser_level',
    primaryCategoryId: 'cat_submersible_level',
    measurementKinds: ['level'],
    availability: 'standard-lead-time',
    enName: 'LT90 Stainless Level Transmitter',
    zhName: 'LT90 不锈钢液位变送器',
    enSummary: 'Rugged stainless level transmitter for reservoirs, lift stations, and industrial tanks.',
    zhSummary: '用于水库、提升泵站和工业罐体的坚固型不锈钢液位变送器。',
    measurementRange: range(0, 100, 'mh2o', '0-100 mH2O'),
    accuracy: '0.25% FS',
    outputValue: output('analog-current', '4-20mA', '2-wire'),
    processConnection: process('submersible-cable', 'PTFE vented cable', '316L stainless steel'),
    electricalConnection: electrical('cable', 'PTFE vented cable'),
    ingressProtection: 'IP68',
    wettedMaterials: ['316L stainless steel', 'PTFE', 'FKM'],
    compatibleMedia: ['water', 'diesel', 'light oil'],
    industryIds: ['ind_water', 'ind_energy'],
    applicationIds: ['app_reservoir_level', 'app_fuel_tank'],
    specValues: specs('0-100 mH2O', '4-20mA', 'PTFE cable'),
    certifications: certs('ce', 'rohs'),
  }),
  productSeed({
    key: 'yf-lt120',
    id: 'prd_yf_lt120',
    variantId: 'var_yf_lt120_default',
    sku: 'YF-LT120-SLIM-30M',
    model: 'YF-LT120',
    seriesId: 'ser_level',
    primaryCategoryId: 'cat_submersible_level',
    measurementKinds: ['level'],
    availability: 'made-to-order',
    enName: 'LT120 Slim Level Probe',
    zhName: 'LT120 细径液位探头',
    enSummary: 'Slim hydrostatic probe for narrow wells, boreholes, and compact tank level measurement.',
    zhSummary: '用于窄井、钻孔和紧凑罐体液位测量的细径静压探头。',
    measurementRange: range(0, 30, 'mh2o', '0-30 mH2O'),
    accuracy: '0.5% FS',
    outputValue: output('analog-current', '4-20mA', '2-wire'),
    processConnection: process('submersible-cable', 'slim PUR cable', '316L stainless steel'),
    electricalConnection: electrical('cable', 'PUR vented cable'),
    ingressProtection: 'IP68',
    wettedMaterials: ['316L stainless steel', 'PUR'],
    compatibleMedia: ['water', 'groundwater'],
    industryIds: ['ind_environmental', 'ind_water'],
    applicationIds: ['app_borehole_level', 'app_groundwater'],
    specValues: specs('0-30 mH2O', '4-20mA', 'slim probe'),
    certifications: certs('ce', 'rohs'),
  }),
  productSeed({
    key: 'yf-fl20',
    id: 'prd_yf_fl20',
    variantId: 'var_yf_fl20_default',
    sku: 'YF-FL20-SWITCH',
    model: 'YF-FL20',
    seriesId: 'ser_level',
    primaryCategoryId: 'cat_level_sensors',
    measurementKinds: ['level'],
    availability: 'stock-model',
    enName: 'FL20 Float Level Switch',
    zhName: 'FL20 浮球液位开关',
    enSummary: 'Float level switch for simple tank high and low level protection circuits.',
    zhSummary: '用于简单罐体高低液位保护回路的浮球液位开关。',
    measurementRange: range(0, 1, 'custom', 'point level'),
    accuracy: 'switch point',
    outputValue: output('switch', 'reed switch', 'dry contact'),
    processConnection: process('probe', 'vertical float stem', '316L stainless steel'),
    electricalConnection: electrical('cable', '2m PVC cable'),
    ingressProtection: 'IP65',
    wettedMaterials: ['316L stainless steel', 'PVC'],
    compatibleMedia: ['water', 'light oil'],
    industryIds: ['ind_machine', 'ind_water'],
    applicationIds: ['app_tank_protection', 'app_pump_interlock'],
    specValues: specs('point level', 'reed switch', 'IP65'),
    certifications: certs('ce', 'rohs'),
  }),
  productSeed({
    key: 'yf-t50',
    id: 'prd_yf_t50',
    variantId: 'var_yf_t50_default',
    sku: 'YF-T50-HEAD-600C',
    model: 'YF-T50',
    seriesId: 'ser_temperature',
    primaryCategoryId: 'cat_temperature_transmitters',
    measurementKinds: ['temperature'],
    availability: 'configurable',
    enName: 'T50 Head Mounted Temperature Transmitter',
    zhName: 'T50 头部安装温度变送器',
    enSummary: 'Head mounted transmitter for RTD and thermocouple assemblies up to 600 C.',
    zhSummary: '适用于 600 C 以内 RTD 和热电偶组件的头部安装温度变送器。',
    measurementRange: range(-50, 600, 'c', '-50-600 C'),
    accuracy: '0.2% FS',
    outputValue: output('analog-current', '4-20mA', '2-wire'),
    processConnection: process('probe', 'DIN B head assembly', '316L stainless steel'),
    electricalConnection: electrical('terminal-head', 'DIN B head'),
    ingressProtection: 'IP65',
    wettedMaterials: ['316L stainless steel', 'ceramic'],
    compatibleMedia: ['air', 'steam', 'process gas'],
    industryIds: ['ind_energy', 'ind_process'],
    applicationIds: ['app_boiler_temperature', 'app_process_temperature'],
    specValues: specs('-50-600 C', '4-20mA', 'DIN B head'),
    certifications: certs('ce', 'rohs'),
  }),
  productSeed({
    key: 'yf-tc200',
    id: 'prd_yf_tc200',
    variantId: 'var_yf_tc200_default',
    sku: 'YF-TC200-K-600C',
    model: 'YF-TC200',
    seriesId: 'ser_temperature',
    primaryCategoryId: 'cat_temperature_measurement',
    measurementKinds: ['temperature'],
    availability: 'made-to-order',
    enName: 'TC200 Thermocouple Assembly',
    zhName: 'TC200 热电偶组件',
    enSummary: 'Thermocouple assembly for ovens, thermal equipment, and high temperature process points.',
    zhSummary: '用于烘箱、热工设备和高温过程点的热电偶组件。',
    measurementRange: range(-50, 600, 'c', '-50-600 C'),
    accuracy: 'Class 1',
    outputValue: output('analog-current', '4-20mA', 'with transmitter option'),
    processConnection: process('thread', 'M20x1.5 fitting', 'Inconel sheath'),
    electricalConnection: electrical('terminal-head', 'ceramic terminal head'),
    ingressProtection: 'IP65',
    wettedMaterials: ['Inconel', 'ceramic'],
    compatibleMedia: ['air', 'flue gas', 'dry process gas'],
    industryIds: ['ind_energy', 'ind_process'],
    applicationIds: ['app_oven_temperature', 'app_high_temperature'],
    specValues: specs('-50-600 C', 'Type K', 'Inconel sheath'),
    certifications: certs('ce', 'rohs'),
  }),
  productSeed({
    key: 'yf-ts10',
    id: 'prd_yf_ts10',
    variantId: 'var_yf_ts10_default',
    sku: 'YF-TS10-RELAY-120C',
    model: 'YF-TS10',
    seriesId: 'ser_switch',
    primaryCategoryId: 'cat_industrial_switches',
    measurementKinds: ['temperature'],
    availability: 'standard-lead-time',
    enName: 'TS10 Temperature Switch',
    zhName: 'TS10 温度开关',
    enSummary: 'Compact temperature switch for thermal protection, coolant systems, and machine safety loops.',
    zhSummary: '用于热保护、冷却系统和设备安全回路的紧凑型温度开关。',
    measurementRange: range(-20, 120, 'c', '-20-120 C'),
    accuracy: 'switch point',
    outputValue: output('relay', 'SPST relay', 'dry contact'),
    processConnection: process('thread', 'G1/2 probe', '316L stainless steel'),
    electricalConnection: electrical('m12', 'M12 4-pin'),
    ingressProtection: 'IP67',
    wettedMaterials: ['316L stainless steel', 'silicone'],
    compatibleMedia: ['water', 'coolant', 'oil'],
    industryIds: ['ind_machine', 'ind_hvac'],
    applicationIds: ['app_thermal_protection', 'app_coolant_monitoring'],
    specValues: specs('-20-120 C', 'SPST relay', 'IP67'),
    certifications: certs('ce', 'rohs'),
  }),
] as const satisfies readonly MockProductSeed[]

export const mockProducts = mockProductSeeds.map(toProductRecord) satisfies readonly ProductRecord[]

export const mockProductSource = {
  version: 'mock-products-v1',
  intendedScale: '1000-plus-products',
  productCount: mockProducts.length,
  products: mockProducts,
} as const

function productSeed(input: {
  readonly key: string
  readonly id: ProductId
  readonly variantId: ProductVariantId
  readonly sku: string
  readonly model: string
  readonly seriesId: SeriesId
  readonly primaryCategoryId: MockPrimaryCategoryId
  readonly measurementKinds: NonEmptyReadonlyArray<MeasurementKind>
  readonly availability: ProductAvailabilityStatus
  readonly enName: string
  readonly zhName: string
  readonly enSummary: string
  readonly zhSummary: string
  readonly measurementRange: QuantityRange
  readonly accuracy: string
  readonly outputValue: MockProductSeed['output']
  readonly processConnection: MockProductSeed['processConnection']
  readonly electricalConnection: MockProductSeed['electricalConnection']
  readonly ingressProtection: MockProductSeed['ingressProtection']
  readonly wettedMaterials: NonEmptyReadonlyArray<string>
  readonly compatibleMedia: NonEmptyReadonlyArray<string>
  readonly industryIds: NonEmptyReadonlyArray<IndustryId>
  readonly applicationIds: NonEmptyReadonlyArray<ApplicationId>
  readonly specValues: NonEmptyReadonlyArray<MockSpecSeed>
  readonly certifications: NonEmptyReadonlyArray<CertificationCode>
}): MockProductSeed {
  const canonicalPath = `${categoryMetadata[input.primaryCategoryId].canonicalPath}/${input.key}` as ProductCanonicalPath
  const title = text(`${input.enName} | ${brandName}`, `${input.zhName} | ${brandName}`)

  return {
    key: input.key,
    id: input.id,
    variantId: input.variantId,
    sku: input.sku,
    model: input.model,
    seriesId: input.seriesId,
    primaryCategoryId: input.primaryCategoryId,
    measurementKinds: input.measurementKinds,
    availability: input.availability,
    name: text(input.enName, input.zhName),
    shortName: text(input.enName, input.zhName),
    summary: text(input.enSummary, input.zhSummary),
    highlights: [
      text(`Measurement range ${input.measurementRange.display}`, `量程 ${input.measurementRange.display}`),
      text(`Output ${input.outputValue.value}`, `输出 ${input.outputValue.value}`),
      text(`Protection ${input.ingressProtection}`, `防护 ${input.ingressProtection}`),
    ],
    applications: [text(input.enSummary, input.zhSummary)],
    industryIds: input.industryIds,
    applicationIds: input.applicationIds,
    measurement: {
      kind: input.measurementKinds[0],
      range: input.measurementRange,
      overloadLimit: overloadLimit(input.measurementRange),
      accuracy: input.accuracy,
    },
    output: input.outputValue,
    processConnection: input.processConnection,
    electricalConnection: input.electricalConnection,
    ingressProtection: input.ingressProtection,
    wettedMaterials: input.wettedMaterials,
    compatibleMedia: input.compatibleMedia,
    specs: input.specValues,
    certifications: input.certifications,
    seo: {
      slug: input.key as SlugSegment,
      canonicalPath,
      title,
      metaDescription: text(input.enSummary, input.zhSummary),
      h1: text(input.enName, input.zhName),
      searchIntent: ['model-lookup', 'technical-comparison', 'quote-request'],
    },
    geo: {
      oneSentence: text(
        `${input.enName} is an industrial sensor for ${input.measurementRange.display} measurement with ${input.outputValue.value} output.`,
        `${input.zhName} 是一款用于 ${input.measurementRange.display} 量程、${input.outputValue.value} 输出的工业传感器。`,
      ),
      shortParagraph: text(input.enSummary, input.zhSummary),
      technicalAbstract: text(
        `${input.enName} belongs to the ${categoryMetadata[input.primaryCategoryId].label.en} family and is specified with ${input.measurementRange.display}, ${input.accuracy}, ${input.outputValue.value}, ${input.processConnection.value}, and ${input.ingressProtection} protection.`,
        `${input.zhName} 属于${categoryMetadata[input.primaryCategoryId].label.zh}，规格包含 ${input.measurementRange.display}、${input.accuracy}、${input.outputValue.value}、${input.processConnection.value} 和 ${input.ingressProtection} 防护。`,
      ),
      bestFor: [text(input.enSummary, input.zhSummary)],
      decisionCriteria: [
        text(`Select when the required range is ${input.measurementRange.display}.`, `当所需量程为 ${input.measurementRange.display} 时选择。`),
        text(`Confirm output compatibility with ${input.outputValue.value}.`, `确认输出信号兼容 ${input.outputValue.value}。`),
      ],
      faqQuestion: text(`What is ${input.model} used for?`, `${input.model} 用于什么场景？`),
      faqAnswer: text(input.enSummary, input.zhSummary),
    },
  }
}

function toProductRecord(seed: MockProductSeed): ProductRecord {
  const seoEn = toProductSeo(seed, 'en')
  const seoZh = toProductSeo(seed, 'zh')
  const geoEn = toProductGeo(seed, 'en', seoEn)
  const geoZh = toProductGeo(seed, 'zh', seoZh)

  return {
    id: seed.id,
    core: {
      family: 'sensor',
      sku: seed.sku,
      model: seed.model,
      brand: brandName,
      primaryCategory: seed.primaryCategoryId,
      name: seed.name,
      shortName: seed.shortName,
      summary: seed.summary,
    },
    sensorProfile: {
      measurements: [seed.measurement],
      outputs: [seed.output],
      connections: {
        process: seed.processConnection,
        electrical: seed.electricalConnection,
      },
      environmentalLimits: {
        ingressProtection: seed.ingressProtection,
        ambientTemperature: range(-20, 85, 'c', '-20-85 C'),
        mediaTemperature: range(-20, 120, 'c', '-20-120 C'),
        wettedMaterials: seed.wettedMaterials,
        compatibleMedia: seed.compatibleMedia,
      },
    },
    identity: {
      id: seed.id,
      sku: seed.sku,
      model: seed.model,
      family: 'sensor',
      seriesId: seed.seriesId,
      brand: brandName,
      manufacturer: brandName,
      availability: seed.availability,
      releasedAt: '2026-01-10',
      revisedAt: '2026-06-17',
    },
    classification: {
      primaryCategoryId: seed.primaryCategoryId,
      categoryPath: categoryPaths[seed.primaryCategoryId],
      industryIds: seed.industryIds,
      applicationIds: seed.applicationIds,
      measurementKinds: seed.measurementKinds,
    },
    content: {
      name: seed.name,
      shortName: seed.shortName,
      summary: seed.summary,
      highlights: seed.highlights,
      applications: seed.applications,
    },
    measurements: [seed.measurement],
    outputs: [seed.output],
    connections: {
      process: seed.processConnection,
      electrical: seed.electricalConnection,
    },
    environmentalLimits: {
      ingressProtection: seed.ingressProtection,
      ambientTemperature: range(-20, 85, 'c', '-20-85 C'),
      mediaTemperature: range(-20, 120, 'c', '-20-120 C'),
      wettedMaterials: seed.wettedMaterials,
      compatibleMedia: seed.compatibleMedia,
    },
    specificationGroups: [
      {
        key: 'technical',
        label: 'Technical specifications',
        values: nonEmpty(seed.specs.map((spec) => toSpecificationValue(seed, spec))),
      },
    ],
    variants: [
      {
        id: seed.variantId,
        orderCode: seed.sku,
        optionValues: [
          { optionKey: 'range', label: 'Range', value: seed.measurement.range.display },
          { optionKey: 'output', label: 'Output', value: seed.output.value },
        ],
        measurements: [seed.measurement],
        outputs: [seed.output],
        availability: seed.availability,
      },
    ],
    certifications: seed.certifications,
    documents: undefined,
    assets: [
      {
        id: assetId(seed),
        kind: 'primary-image',
        href: '/images/hero/industrial-instrumentation.png',
        alt: seed.name.en,
      },
    ],
    commercialTerms: {
      minimumOrderQuantity: seed.availability === 'stock-model' ? 1 : 10,
      standardLeadTime: seed.availability === 'stock-model' ? '3-7 days' : '2-4 weeks',
      warranty: '18 months',
      oemCustomizable: true,
      privateLabelAvailable: true,
    },
    seo: seoEn,
    localizedSeo: {
      en: seoEn,
      zh: seoZh,
    },
    geoAi: geoEn,
    localizedGeoAi: {
      en: geoEn,
      zh: geoZh,
    },
  }
}

function toProductSeo(seed: MockProductSeed, locale: LocaleCode): ProductSeoFields {
  const categoryPath = categoryPaths[seed.primaryCategoryId]
  const categorySlugPath = categoryMetadata[seed.primaryCategoryId].slugPath
  const categoryLabel = localize(categoryMetadata[seed.primaryCategoryId].label, locale)
  const breadcrumb = nonEmpty<SeoBreadcrumbItem>([
    ...categoryPath.map((categoryId) => ({
      label: localize(categoryMetadata[categoryId as KnownCategoryId].label, locale),
      canonicalPath: categoryMetadata[categoryId as KnownCategoryId].canonicalPath,
      categoryId,
    })),
    {
      label: localize(seed.name, locale),
      canonicalPath: seed.seo.canonicalPath,
    },
  ])

  return {
    locale,
    slug: {
      segment: seed.seo.slug,
      categoryPath: categorySlugPath,
      canonicalPath: seed.seo.canonicalPath,
    },
    title: localize(seed.seo.title, locale),
    metaDescription: localize(seed.seo.metaDescription, locale),
    h1: localize(seed.seo.h1, locale),
    indexingPolicy: 'index-follow',
    searchIntent: seed.seo.searchIntent,
    breadcrumb,
    alternates: [
      { locale: 'en', canonicalPath: seed.seo.canonicalPath },
      { locale: 'zh', canonicalPath: seed.seo.canonicalPath },
    ],
    openGraph: {
      title: localize(seed.seo.title, locale),
      description: localize(seed.seo.metaDescription, locale),
      imageUrl: `/images/products/${seed.key}.png`,
      imageAlt: localize(seed.name, locale),
      type: 'product',
    },
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: localize(seed.name, locale),
      sku: seed.sku,
      mpn: seed.model,
      brand: {
        '@type': 'Brand',
        name: brandName,
      },
      category: categoryLabel,
      description: localize(seed.summary, locale),
      url: seed.seo.canonicalPath,
      image: [`/images/products/${seed.key}.png`],
      additionalProperty: seed.specs.map((spec) => ({
        '@type': 'PropertyValue',
        name: localize(spec.label, locale),
        value: spec.display,
        unitText: spec.unit,
      })),
      offers: {
        '@type': 'Offer',
        availability: seed.availability,
        url: seed.seo.canonicalPath,
      },
    },
  }
}

function toProductGeo(seed: MockProductSeed, locale: LocaleCode, seo: ProductSeoFields): ProductGeoAiProfile {
  const evidence = evidenceId(seed)
  const sourceRef: SourceRef = {
    id: evidence,
    label: locale === 'zh' ? `${seed.model} 回退工程记录` : `${seed.model} fallback engineering record`,
    confidence: 'unverified',
  }

  return {
    governance: {
      schemaVersion: 'product-geo-ai-profile-v1',
      locale,
      lastReviewedAt: productReviewDate,
      reviewedBy: 'product-engineering',
      allowedForAiExtraction: false,
    },
    entity: {
      productId: seed.id,
      canonicalName: localize(seed.name, locale),
      model: seed.model,
      brand: brandName,
      canonicalPath: seed.seo.canonicalPath,
      categoryIds: categoryPaths[seed.primaryCategoryId],
    },
    answerSummary: {
      oneSentence: localize(seed.geo.oneSentence, locale),
      shortParagraph: localize(seed.geo.shortParagraph, locale),
      technicalAbstract: localize(seed.geo.technicalAbstract, locale),
      primaryUseCases: nonEmpty(seed.geo.bestFor.map((item) => localize(item, locale))),
      notRecommendedFor: [locale === 'zh' ? '未经单独认证的安全仪表系统' : 'safety instrumented systems without separate approval'],
    },
    factTable: [
      {
        id: factId(seed, 'identity'),
        claimType: 'identity',
        label: locale === 'zh' ? '型号' : 'Model',
        value: seed.model,
        sourceRefs: [sourceRef],
      },
      {
        id: factId(seed, 'range'),
        claimType: 'measurement-range',
        label: locale === 'zh' ? '测量量程' : 'Measurement range',
        value: seed.measurement.range.display,
        sourceRefs: [sourceRef],
      },
      {
        id: factId(seed, 'output'),
        claimType: 'capability',
        label: locale === 'zh' ? '输出信号' : 'Output signal',
        value: seed.output.value,
        sourceRefs: [sourceRef],
      },
      {
        id: factId(seed, 'protection'),
        claimType: 'installation',
        label: locale === 'zh' ? '防护等级' : 'Ingress protection',
        value: seed.ingressProtection,
        sourceRefs: [sourceRef],
      },
    ],
    selectionGuidance: {
      bestFor: nonEmpty(seed.geo.bestFor.map((item) => localize(item, locale))),
      decisionCriteria: nonEmpty(seed.geo.decisionCriteria.map((item) => localize(item, locale))),
      compatibleMedia: seed.compatibleMedia,
      installationNotes: [seed.processConnection.value, seed.electricalConnection.value],
      requiredOptions: [seed.measurement.range.display, seed.output.value],
    },
    evidence: [
      {
        id: evidence,
        title: locale === 'zh' ? `${seed.model} 回退工程记录` : `${seed.model} fallback engineering record`,
        sourceType: 'engineering-note',
        revision: documentRevision,
        updatedAt: productReviewDate,
      },
    ],
    faq: [
      {
        question: localize(seed.geo.faqQuestion, locale),
        answer: localize(seed.geo.faqAnswer, locale),
        audience: 'engineer',
        sourceRefs: [sourceRef],
      },
    ],
  }
}

function toSpecificationValue(seed: MockProductSeed, spec: MockSpecSeed): ProductSpecificationValue {
  return {
    key: spec.key,
    label: spec.label.en,
    value: spec.value,
    unit: spec.unit,
    display: spec.display,
    sourceRefs: [
      {
        id: evidenceId(seed),
        label: `${seed.model} datasheet`,
        href: `/documents/${seed.key}-datasheet.pdf`,
        confidence: 'source-backed',
      },
    ],
  }
}

function text(en: string, zh: string): LocalizedText {
  return { en, zh }
}

function range(min: number, max: number, unit: UnitCode, display: string): QuantityRange {
  return { min, max, unit, display }
}

function overloadLimit(measurementRange: QuantityRange): QuantityValue {
  const value = measurementRange.max * 1.5
  return {
    value,
    unit: measurementRange.unit,
    display: `${formatNumber(value)} ${measurementRange.unit}`,
  }
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1)
}

function output(kind: SignalOutputKind, value: string, wiring?: string): MockProductSeed['output'] {
  return { kind, value, wiring }
}

function process(kind: ProcessConnectionKind, value: string, material?: string): MockProductSeed['processConnection'] {
  return { kind, value, material }
}

function electrical(kind: ElectricalConnectionKind, value: string): MockProductSeed['electricalConnection'] {
  return { kind, value }
}

function specs(rangeDisplay: string, outputDisplay: string, thirdDisplay: string): NonEmptyReadonlyArray<MockSpecSeed> {
  return [
    { key: 'range', label: text('Range', '量程'), value: rangeDisplay, display: rangeDisplay },
    { key: 'output', label: text('Output', '输出'), value: outputDisplay, display: outputDisplay },
    { key: 'feature', label: text('Feature', '特性'), value: thirdDisplay, display: thirdDisplay },
  ]
}

function certs(...values: NonEmptyReadonlyArray<CertificationCode>): NonEmptyReadonlyArray<CertificationCode> {
  return values
}

function assetId(seed: MockProductSeed): AssetId {
  return `asset_${seed.key.replace(/-/g, '_')}_primary` as AssetId
}

function evidenceId(seed: MockProductSeed): EvidenceId {
  return `evidence_${seed.key.replace(/-/g, '_')}_datasheet` as EvidenceId
}

function factId(seed: MockProductSeed, factKey: string): EvidenceId {
  return `evidence_${seed.key.replace(/-/g, '_')}_${factKey}` as EvidenceId
}

function localize(textValue: LocalizedText, locale: LocaleCode) {
  return textValue[locale] ?? textValue.en
}

function nonEmpty<T>(values: readonly T[]): NonEmptyReadonlyArray<T> {
  if (values.length === 0) {
    throw new Error('Domain mock data expected a non-empty array.')
  }

  return values as NonEmptyReadonlyArray<T>
}
