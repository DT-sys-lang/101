import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cmsRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(join(cmsRoot, 'package.json'));
const { createStrapi } = require('@strapi/core');

const now = new Date().toISOString();
const today = now.slice(0, 10);

const productFactIds = {
  p10: 'prd_yf_p10',
  p10c: 'prd_yf_p10c',
  p11: 'prd_yf_p11',
  p12: 'prd_yf_p12',
  p13: 'prd_yf_p13',
  f1: 'prd_yf_f1',
  f2: 'prd_yf_f2',
};

const documentAssets = [
  {
    factId: 'doc_yf_p10_datasheet',
    title: 'YF-P10 Datasheet',
    hrefOverride: '/documents/products/p10-datasheet.pdf',
    contentLocale: 'multi',
    revision: 'Rev. A',
    productKey: 'p10',
  },
  {
    factId: 'doc_yf_p10c_datasheet',
    title: 'YF-P10C Datasheet',
    hrefOverride: '/documents/products/p10C-datasheet.pdf',
    contentLocale: 'multi',
    revision: 'Rev. A',
    productKey: 'p10c',
  },
  {
    factId: 'doc_yf_p11_datasheet',
    title: 'YF-P11 Datasheet',
    hrefOverride: '/documents/products/p11-datasheet.pdf',
    contentLocale: 'multi',
    revision: 'Rev. A',
    productKey: 'p11',
  },
  {
    factId: 'doc_yf_p12_datasheet',
    title: 'YF-P12 Datasheet',
    hrefOverride: '/documents/products/p12-datasheet.pdf',
    contentLocale: 'multi',
    revision: 'Rev. A',
    productKey: 'p12',
  },
  {
    factId: 'doc_yf_p13_datasheet',
    title: 'YF-P13 Datasheet',
    hrefOverride: '/documents/products/p13-datasheet.pdf',
    contentLocale: 'multi',
    revision: 'Rev. A',
    productKey: 'p13',
  },
];

const intentPhrases = [
  {
    phraseId: 'intent_launch_mock_pressure_sensor_water_pump',
    phrase: 'pressure sensor for water pump',
    contentLocale: 'en',
    intentType: 'commercial',
    usageSurfaces: ['search', 'seo', 'geo', 'product-list'],
    priority: 20,
    source: 'editorial',
    products: ['p10', 'p11', 'p12', 'p13'],
    categories: ['cat_pressure_transmitters'],
    industries: ['ind_water'],
    applications: ['app_fluid_control'],
    notes: 'Launch mock phrase. Replace with real search-intent data after launch.',
  },
  {
    phraseId: 'intent_launch_mock_oem_fluid_control',
    phrase: 'OEM fluid control sensor and valve solution',
    contentLocale: 'en',
    intentType: 'commercial',
    usageSurfaces: ['search', 'seo', 'geo', 'industry'],
    priority: 30,
    source: 'editorial',
    products: ['p10', 'p11', 'f1', 'f2'],
    categories: ['cat_industrial_valves', 'cat_pressure_transmitters'],
    industries: ['ind_oem'],
    applications: ['app_fluid_control'],
    notes: 'Launch mock phrase. Replace with real search-intent data after launch.',
  },
  {
    phraseId: 'intent_launch_mock_pressure_sensor_selection_zh',
    phrase: '工业压力传感器选型',
    contentLocale: 'zh',
    intentType: 'commercial',
    usageSurfaces: ['search', 'seo', 'geo', 'blog'],
    priority: 20,
    source: 'editorial',
    products: ['p10', 'p11', 'p12', 'p13'],
    categories: ['cat_pressure_transmitters'],
    industries: ['ind_water'],
    applications: ['app_fluid_control'],
    notes: '上线测试意图词，后续替换为真实搜索词。',
  },
  {
    phraseId: 'intent_launch_mock_oem_pairing_zh',
    phrase: 'OEM流体控制传感器阀门组合',
    contentLocale: 'zh',
    intentType: 'commercial',
    usageSurfaces: ['search', 'seo', 'geo', 'industry'],
    priority: 30,
    source: 'editorial',
    products: ['p10', 'p11', 'f1', 'f2'],
    categories: ['cat_industrial_valves', 'cat_pressure_transmitters'],
    industries: ['ind_oem'],
    applications: ['app_fluid_control'],
    notes: '上线测试意图词，后续替换为真实搜索词。',
  },
];

const blogPosts = [
  {
    postId: 'blog_launch_mock_pressure_sensor_selection',
    title: {
      en: 'Pressure sensor selection for compact fluid systems',
      zh: '小型流体系统压力传感器选型要点',
      ru: 'Выбор датчика давления для компактных жидкостных систем',
      es: 'Selección de sensores de presión para sistemas de fluido compactos',
    },
    excerpt: {
      en: 'A launch-stage article used to verify blog routing, product relations, and multilingual resource rendering.',
      zh: '用于上线前验证博客路由、产品关联和多语言资料展示的测试文章。',
      ru: 'Тестовая статья для проверки маршрутов блога и связей с продуктами.',
      es: 'Artículo de prueba para verificar rutas de blog y relaciones de productos.',
    },
    body: {
      en: 'For compact fluid equipment, pressure range, output signal, connector type, medium compatibility, and protection rating should be checked together. This launch mock article is safe to replace with real editorial content later.',
      zh: '在小型流体设备中，压力范围、输出信号、连接方式、介质兼容性和防护等级需要一起判断。本文是上线测试内容，后续可以直接替换为真实文章。',
      ru: 'Тестовый материал для проверки структуры контента перед запуском.',
      es: 'Contenido de prueba para comprobar la estructura editorial antes del lanzamiento.',
    },
    topic: 'selection-guide',
    authorName: 'Yufavor Editorial',
    publishedOn: today,
    relatedProducts: ['p10', 'p11', 'p12', 'p13'],
    relatedCategories: ['cat_pressure_transmitters'],
    relatedIndustries: ['ind_water', 'ind_oem'],
    relatedApplications: ['app_fluid_control'],
    intentPhrases: ['intent_launch_mock_pressure_sensor_water_pump', 'intent_launch_mock_pressure_sensor_selection_zh'],
  },
  {
    postId: 'blog_launch_mock_valve_sensor_pairing',
    title: {
      en: 'How sensors and valves work together in OEM fluid control',
      zh: '传感器与阀门在OEM流体控制中的组合方式',
      ru: 'Совместная работа датчиков и клапанов в OEM-системах',
      es: 'Cómo sensores y válvulas trabajan juntos en control de fluidos OEM',
    },
    excerpt: {
      en: 'A mock pairing article to verify product family navigation and ecosystem content paths.',
      zh: '用于验证产品族导航和生态搭配内容路径的测试文章。',
      ru: 'Тестовая статья для проверки семейства продуктов и экосистемных связей.',
      es: 'Artículo de prueba para verificar familias de productos y relaciones de ecosistema.',
    },
    body: {
      en: 'A practical OEM fluid-control page should connect the sensing point, pressure control point, medium, and maintenance needs. This mock entry proves that sensor and valve content can be managed through the backend without changing the product facts model.',
      zh: '一个实用的OEM流体控制页面，需要把检测点、压力控制点、介质和维护需求连接起来。该测试内容用于证明传感器和阀门内容可以通过后台维护，而不需要改动产品事实模型。',
      ru: 'Тестовая запись для проверки связей между датчиками и клапанами.',
      es: 'Entrada de prueba para verificar la relación entre sensores y válvulas.',
    },
    topic: 'application',
    authorName: 'Yufavor Editorial',
    publishedOn: today,
    relatedProducts: ['p10', 'p11', 'f1', 'f2'],
    relatedCategories: ['cat_industrial_valves', 'cat_pressure_transmitters'],
    relatedIndustries: ['ind_oem'],
    relatedApplications: ['app_fluid_control'],
    intentPhrases: ['intent_launch_mock_oem_fluid_control', 'intent_launch_mock_oem_pairing_zh'],
  },
];

const caseStudies = [
  {
    caseId: 'case_launch_mock_oem_fluid_control',
    title: {
      en: 'OEM fluid-control module with pressure sensing and gas regulation',
      zh: 'OEM流体控制模块的压力检测与气体稳压组合',
      ru: 'OEM-модуль управления потоком с контролем давления',
      es: 'Módulo OEM de control de fluidos con detección de presión',
    },
    summary: {
      en: 'A public mock case used to validate case listing, detail routing, product relations, and industry context.',
      zh: '用于验证案例列表、详情路由、产品关联和行业上下文的公开测试案例。',
      ru: 'Тестовый кейс для проверки связей продуктов и отраслевого контекста.',
      es: 'Caso de prueba para verificar relaciones de productos y contexto industrial.',
    },
    challenge: {
      en: 'The equipment needed stable pressure feedback and controlled gas regulation in a compact OEM layout.',
      zh: '设备需要在紧凑OEM结构中实现稳定压力反馈和气体稳压控制。',
    },
    solution: {
      en: 'The mock solution combines a pressure transmitter with a pressure regulating valve and links both families in one content workflow.',
      zh: '测试方案将压力变送器与稳压阀组合，并在一个内容流程中关联两个产品族。',
    },
    outcome: {
      en: 'The website can now verify case content, related products, and resource routing before real customer stories are available.',
      zh: '官网可以在真实客户案例完善前，先验证案例内容、关联产品和资料路由。',
    },
    body: {
      en: 'This is launch mock content. It should be replaced with a real customer-approved application story before long-term SEO publication.',
      zh: '这是上线测试内容。长期SEO发布前，应替换为经过确认的真实客户应用案例。',
    },
    region: 'Launch mock / overseas market',
    projectYear: 2026,
    products: ['p10', 'p11', 'f1', 'f2'],
    industries: ['ind_oem'],
    applications: ['app_fluid_control'],
    supportingDocuments: ['doc_yf_p10_datasheet', 'doc_yf_p11_datasheet'],
    intentPhrases: ['intent_launch_mock_oem_fluid_control', 'intent_launch_mock_oem_pairing_zh'],
  },
];

const ecosystems = [
  {
    recommendationId: 'eco_launch_mock_oem_pressure_valve_pairing',
    title: {
      en: 'OEM fluid-control pairing: pressure transmitter + regulating valve',
      zh: 'OEM流体控制组合：压力变送器 + 稳压阀',
      ru: 'OEM-комбинация: преобразователь давления + регулирующий клапан',
      es: 'Combinación OEM: transmisor de presión + válvula reguladora',
    },
    rationale: {
      en: 'Use a pressure transmitter for feedback and a regulating valve for stable flow or gas pressure control. This is a mock recommendation for launch testing.',
      zh: '用压力变送器做反馈，用稳压阀做流体或气体压力稳定控制。这是上线前链路测试用的模拟推荐。',
      ru: 'Тестовая рекомендация для проверки связей между продуктами.',
      es: 'Recomendación de prueba para verificar relaciones entre productos.',
    },
    industry: 'ind_oem',
    applications: ['app_fluid_control'],
    anchorProduct: 'p10',
    recommendedProducts: ['p10', 'p11', 'f1', 'f2'],
    recommendationOrder: [
      { productFactId: productFactIds.p10, rank: 1, role: 'pressure feedback' },
      { productFactId: productFactIds.p11, rank: 2, role: 'alternate sensor option' },
      { productFactId: productFactIds.f1, rank: 3, role: 'gas pressure regulation' },
      { productFactId: productFactIds.f2, rank: 4, role: 'valve alternative' },
    ],
    curationNotes: {
      en: 'Launch mock content. Replace with a manually verified pairing after product strategy is confirmed.',
      zh: '上线测试内容。产品搭配策略确认后，应替换为人工确认的真实组合。',
    },
    curatedBy: 'Codex launch seed',
    intentPhrases: ['intent_launch_mock_oem_fluid_control', 'intent_launch_mock_oem_pairing_zh'],
  },
];

process.chdir(cmsRoot);
const app = await createStrapi({ appDir: cmsRoot, distDir: join(cmsRoot, 'dist') }).load();

try {
  const result = await seedLaunchMockContent();
  console.log(JSON.stringify(result, null, 2));
} finally {
  await destroyStrapiApp(app);
}

async function seedLaunchMockContent() {
  await unpublishLegacySmokeContent();
  const productIds = await mapStableIds('api::product-fact.product-fact', 'factId', Object.values(productFactIds));
  const categoryIds = await mapStableIds('api::category-fact.category-fact', 'factId', [
    'cat_industrial_valves',
    'cat_pressure_transmitters',
  ]);
  const industryIds = await mapStableIds('api::industry-fact.industry-fact', 'factId', ['ind_oem', 'ind_water']);
  const applicationIds = await mapStableIds('api::application-fact.application-fact', 'factId', ['app_fluid_control']);
  const documentIds = new Map();

  for (const document of documentAssets) {
    const entity = await upsert('api::document-asset.document-asset', 'factId', document.factId, {
      factId: document.factId,
      assetClass: 'document',
      title: document.title,
      documentKind: 'datasheet',
      hrefOverride: document.hrefOverride,
      contentLocale: document.contentLocale,
      revision: document.revision,
      publishedAt: now,
    });
    documentIds.set(document.factId, entity.id);
  }

  const intentIds = new Map();
  for (const phrase of intentPhrases) {
    const entity = await upsert('api::intent-phrase.intent-phrase', 'phraseId', phrase.phraseId, {
      phraseId: phrase.phraseId,
      phrase: phrase.phrase,
      contentLocale: phrase.contentLocale,
      intentType: phrase.intentType,
      usageSurfaces: phrase.usageSurfaces,
      priority: phrase.priority,
      source: phrase.source,
      phraseStatus: 'active',
      products: mapRelation(productIds, phrase.products.map((key) => productFactIds[key]).filter(Boolean)),
      categories: mapRelation(categoryIds, phrase.categories),
      industries: mapRelation(industryIds, phrase.industries),
      applications: mapRelation(applicationIds, phrase.applications),
      notes: phrase.notes,
      publishedAt: now,
    });
    intentIds.set(phrase.phraseId, entity.id);
  }

  for (const post of blogPosts) {
    await upsert('api::blog-post.blog-post', 'postId', post.postId, {
      postId: post.postId,
      title: post.title,
      excerpt: post.excerpt,
      body: post.body,
      topic: post.topic,
      authorName: post.authorName,
      publishedOn: post.publishedOn,
      relatedProducts: mapProductKeys(productIds, post.relatedProducts),
      relatedCategories: mapRelation(categoryIds, post.relatedCategories),
      relatedIndustries: mapRelation(industryIds, post.relatedIndustries),
      relatedApplications: mapRelation(applicationIds, post.relatedApplications),
      intentPhrases: mapRelation(intentIds, post.intentPhrases),
      publishedAt: now,
    });
  }

  for (const study of caseStudies) {
    await upsert('api::case-study.case-study', 'caseId', study.caseId, {
      caseId: study.caseId,
      title: study.title,
      summary: study.summary,
      challenge: study.challenge,
      solution: study.solution,
      outcome: study.outcome,
      body: study.body,
      region: study.region,
      projectYear: study.projectYear,
      isPublic: true,
      products: mapProductKeys(productIds, study.products),
      industries: mapRelation(industryIds, study.industries),
      applications: mapRelation(applicationIds, study.applications),
      supportingDocuments: mapRelation(documentIds, study.supportingDocuments),
      intentPhrases: mapRelation(intentIds, study.intentPhrases),
      publishedAt: now,
    });
  }

  for (const document of documentAssets) {
    const productFactId = productFactIds[document.productKey];
    const productId = productIds.get(productFactId);
    const documentId = documentIds.get(document.factId);
    if (!productId || !documentId) {
      continue;
    }

    await upsert('api::product-manual.product-manual', 'manualId', `manual_${document.productKey}_launch_mock_datasheet`, {
      manualId: `manual_${document.productKey}_launch_mock_datasheet`,
      title: {
        en: `${document.title} download`,
        zh: `${document.title} 下载`,
        ru: `${document.title} загрузка`,
        es: `${document.title} descarga`,
      },
      manualKind: 'custom',
      contentLocale: 'multi',
      revision: document.revision,
      effectiveDate: today,
      document: documentId,
      products: [productId],
      relatedCategories: mapRelation(categoryIds, ['cat_pressure_transmitters']),
      intentPhrases: mapRelation(intentIds, [
        'intent_launch_mock_pressure_sensor_water_pump',
        'intent_launch_mock_pressure_sensor_selection_zh',
      ]),
      notes: {
        en: 'Launch mock manual entry linked to an existing public PDF path.',
        zh: '上线测试手册条目，关联现有公开PDF路径。',
        ru: 'Тестовая запись руководства перед запуском.',
        es: 'Entrada de manual de prueba antes del lanzamiento.',
      },
      publishedAt: now,
    });
  }

  for (const ecosystem of ecosystems) {
    await upsert('api::industry-ecosystem-recommendation.industry-ecosystem-recommendation', 'recommendationId', ecosystem.recommendationId, {
      recommendationId: ecosystem.recommendationId,
      title: ecosystem.title,
      rationale: ecosystem.rationale,
      industry: industryIds.get(ecosystem.industry),
      applications: mapRelation(applicationIds, ecosystem.applications),
      anchorProduct: productIds.get(productFactIds[ecosystem.anchorProduct]),
      recommendedProducts: mapProductKeys(productIds, ecosystem.recommendedProducts),
      recommendationOrder: ecosystem.recommendationOrder,
      curationNotes: ecosystem.curationNotes,
      curatedBy: ecosystem.curatedBy,
      reviewedAt: now,
      intentPhrases: mapRelation(intentIds, ecosystem.intentPhrases),
      publishedAt: now,
    });
  }

  return {
    seededAt: now,
    productsFound: productIds.size,
    documentAssets: documentAssets.length,
    intentPhrases: intentPhrases.length,
    blogPosts: blogPosts.length,
    caseStudies: caseStudies.length,
    productManuals: documentAssets.length,
    industryEcosystemRecommendations: ecosystems.length,
  };
}

async function unpublishLegacySmokeContent() {
  const legacyRows = [
    ['api::blog-post.blog-post', 'postId', 'blog_resource_smoke'],
    ['api::case-study.case-study', 'caseId', 'case_resource_smoke'],
    ['api::product-manual.product-manual', 'manualId', 'manual_resource_smoke'],
    ['api::industry-ecosystem-recommendation.industry-ecosystem-recommendation', 'recommendationId', 'eco_smoke_sensor_valve_pairing'],
  ];

  for (const [uid, uniqueField, uniqueValue] of legacyRows) {
    const existing = await findOneBy(uid, uniqueField, uniqueValue);
    if (!existing?.publishedAt) {
      continue;
    }

    await strapi.entityService.update(uid, existing.id, { data: { publishedAt: null } });
  }
}

async function mapStableIds(uid, field, values) {
  const map = new Map();
  for (const value of values) {
    const entity = await findOneBy(uid, field, value);
    if (entity) {
      map.set(value, entity.id);
    }
  }
  return map;
}

function mapProductKeys(index, keys) {
  return mapRelation(index, keys.map((key) => productFactIds[key]).filter(Boolean));
}

function mapRelation(index, stableIds) {
  return stableIds.map((id) => index.get(id)).filter((id) => Number.isInteger(id));
}

async function upsert(uid, uniqueField, uniqueValue, data) {
  const existing = await findOneBy(uid, uniqueField, uniqueValue);

  if (existing) {
    return strapi.entityService.update(uid, existing.id, { data });
  }

  return strapi.entityService.create(uid, { data });
}

async function findOneBy(uid, field, value) {
  const rows = await strapi.entityService.findMany(uid, {
    filters: { [field]: { $eq: value } },
    publicationState: 'preview',
    limit: 1,
  });

  return Array.isArray(rows) ? rows[0] : rows;
}

async function destroyStrapiApp(app) {
  try {
    await app.destroy();
  } catch (error) {
    if (!(error instanceof Error) || (error.message !== 'aborted' && error.name !== 'KnexTimeoutError')) {
      throw error;
    }
  }
}
