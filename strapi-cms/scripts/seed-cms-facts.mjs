import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const cmsRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const workspaceRoot = dirname(cmsRoot);
const require = createRequire(join(cmsRoot, 'package.json'));
const { createStrapi } = require('@strapi/core');
const args = readArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const inputPath = args.file
  ? resolve(process.cwd(), args.file)
  : join(workspaceRoot, 'outputs', 'cms-facts.json');
const dryRun = Boolean(args.dryRun);

const cmsFacts = JSON.parse(readFileSync(inputPath, 'utf8'));
const now = new Date().toISOString();
const operationStats = {};

const lookupLabels = {
  ind_water: { en: 'Water treatment', zh: 'Water treatment' },
  ind_oem: { en: 'OEM', zh: 'OEM' },
  app_fluid_control: { en: 'Fluid control', zh: 'Fluid control' },
};

const certificationLabels = {
  ce: { en: 'CE', zh: 'CE' },
  rohs: { en: 'RoHS', zh: 'RoHS' },
  atex: { en: 'ATEX', zh: 'ATEX' },
  iecex: { en: 'IECEx', zh: 'IECEx' },
  sil: { en: 'SIL', zh: 'SIL' },
  iso9001: { en: 'ISO 9001', zh: 'ISO 9001' },
  'food-grade': { en: 'Food grade', zh: 'Food grade' },
  marine: { en: 'Marine', zh: 'Marine' },
  custom: { en: 'Custom', zh: 'Custom' },
};

const inputDiagnostics = diagnoseInput(cmsFacts);

if (!inputDiagnostics.ok) {
  console.error(JSON.stringify({
    ok: false,
    input: inputPath,
    dryRun,
    diagnostics: inputDiagnostics,
  }, null, 2));
  process.exit(1);
}

if (dryRun) {
  console.log(JSON.stringify({
    ok: true,
    input: inputPath,
    dryRun: true,
    diagnostics: inputDiagnostics,
  }, null, 2));
  process.exit(0);
}

process.chdir(cmsRoot);
const app = await createStrapi({ appDir: cmsRoot, distDir: join(cmsRoot, 'dist') }).load();

try {
  const imported = await seed();
  console.log(JSON.stringify(imported, null, 2));
} finally {
  await destroyStrapiApp(app);
}

async function seed() {
  const categoryIds = new Map();
  const industryIds = new Map();
  const applicationIds = new Map();
  const documentIds = new Map();
  const assetIds = new Map();
  const certificationIds = new Map();

  for (const category of cmsFacts.categoryFacts) {
    const entity = await upsert('api::category-fact.category-fact', 'factId', category.id, {
      factId: category.id,
      name: toLocalizedText(category.name),
      publishedAt: now,
    });
    categoryIds.set(category.id, entity.id);
  }

  for (const category of cmsFacts.categoryFacts) {
    if (!category.parentId) {
      continue;
    }

    await updateByStableId('api::category-fact.category-fact', 'factId', category.id, {
      parent: requireMappedId(categoryIds, category.parentId, 'category parent'),
      publishedAt: now,
    });
  }

  await syncPublishedCategoryParentLinks();

  const products = ensureArray(cmsFacts.productFacts);
  const industryKeys = collectUnique(products, 'industryIds');
  const applicationKeys = collectUnique(products, 'applicationIds');
  const certificationKeys = [...new Set(products.flatMap((product) => ensureArray(product.certifications)))];
  const documents = uniqueBy(products.flatMap((product) => ensureArray(product.documents)), 'id');
  const assets = uniqueBy(products.flatMap((product) => ensureArray(product.assets)), 'id');

  for (const industryId of industryKeys) {
    const entity = await upsert('api::industry-fact.industry-fact', 'factId', industryId, {
      factId: industryId,
      name: toLocalizedText(lookupLabels[industryId] || fallbackLabel(industryId)),
      publishedAt: now,
    });
    industryIds.set(industryId, entity.id);
  }

  for (const applicationId of applicationKeys) {
    const entity = await upsert('api::application-fact.application-fact', 'factId', applicationId, {
      factId: applicationId,
      name: toLocalizedText(lookupLabels[applicationId] || fallbackLabel(applicationId)),
      publishedAt: now,
    });
    applicationIds.set(applicationId, entity.id);
  }

  for (const code of certificationKeys) {
    const entity = await upsert('api::certification.certification', 'code', code, {
      code,
      label: toLocalizedText(certificationLabels[code] || fallbackLabel(code)),
      publishedAt: now,
    });
    certificationIds.set(code, entity.id);
  }

  for (const document of documents) {
    const entity = await upsert('api::document-asset.document-asset', 'factId', document.id, {
      factId: document.id,
      assetClass: 'document',
      title: document.title,
      documentKind: document.kind,
      hrefOverride: document.href,
      contentLocale: document.contentLocale,
      revision: document.revision,
      publishedAt: now,
    });
    documentIds.set(document.id, entity.id);
  }

  for (const asset of assets) {
    const entity = await upsert('api::document-asset.document-asset', 'factId', asset.id, {
      factId: asset.id,
      assetClass: 'media',
      assetKind: asset.kind,
      hrefOverride: asset.href,
      alt: asset.alt,
      publishedAt: now,
    });
    assetIds.set(asset.id, entity.id);
  }

  for (const product of products) {
    await upsert('api::product-fact.product-fact', 'factId', product.id, toProductData(product, {
      categoryIds,
      industryIds,
      applicationIds,
      documentIds,
      assetIds,
      certificationIds,
    }));
  }

  return {
    ok: true,
    input: inputPath,
    dryRun: false,
    categoryFacts: cmsFacts.categoryFacts.length,
    industryFacts: industryKeys.length,
    applicationFacts: applicationKeys.length,
    documents: documents.length,
    assets: assets.length,
    certifications: certificationKeys.length,
    productFacts: products.length,
    operations: operationStats,
  };
}

function toProductData(product, indexes) {
  return withoutUndefined({
    factId: product.id,
    family: product.family || 'sensor',
    sku: product.sku || product.core?.sku,
    model: product.model || product.core?.model,
    seriesId: product.seriesId,
    brand: product.brand || product.core?.brand,
    manufacturer: product.manufacturer,
    availability: product.availability || 'standard-lead-time',
    releasedAt: product.releasedAt,
    revisedAt: product.revisedAt || now.slice(0, 10),
    primaryCategory: requireMappedId(indexes.categoryIds, product.primaryCategoryId || product.core?.primaryCategory, 'primary category'),
    additionalCategories: mapIds(indexes.categoryIds, product.additionalCategoryIds, 'additional category'),
    industries: mapIds(indexes.industryIds, product.industryIds, 'industry'),
    applications: mapIds(indexes.applicationIds, product.applicationIds, 'application'),
    measurementKinds: ensureArray(product.measurementKinds),
    name: toLocalizedText(product.name || product.core?.name),
    shortName: toLocalizedText(product.shortName || product.core?.shortName),
    summary: toLocalizedText(product.summary || product.core?.summary),
    highlights: ensureArray(product.highlights).map(toLocalizedText),
    applicationCopy: ensureArray(product.applications).map(toLocalizedText),
    measurements: ensureArray(product.measurements).map(toMeasurement),
    outputs: ensureArray(product.outputs).map(toOutput),
    connections: product.connections ? toConnections(product.connections) : undefined,
    environmentalLimits: product.environmentalLimits ? toEnvironmentalLimits(product.environmentalLimits) : undefined,
    valveProfile: product.valveProfile ? toValveProfile(product.valveProfile) : undefined,
    specificationGroups: ensureArray(product.specificationGroups).map(toSpecificationGroup),
    variants: ensureArray(product.variants).map(toVariant),
    documents: mapIds(indexes.documentIds, ensureArray(product.documents).map((document) => document.id), 'document'),
    assets: mapIds(indexes.assetIds, ensureArray(product.assets).map((asset) => asset.id), 'asset'),
    certifications: mapIds(indexes.certificationIds, product.certifications, 'certification'),
    commercialTerms: product.commercialTerms ? toCommercialTerms(product.commercialTerms) : undefined,
    publishedAt: now,
  });
}

function toMeasurement(measurement) {
  return withoutUndefined({
    kind: measurement.kind,
    range: measurement.range,
    accuracy: measurement.accuracy,
    overloadLimit: measurement.overloadLimit,
  });
}

function toOutput(output) {
  return withoutUndefined({
    kind: output.kind,
    value: output.value,
    protocol: output.protocol,
    wiring: output.wiring,
  });
}

function toConnections(connections) {
  return withoutUndefined({
    processKind: connections.process?.kind,
    processValue: connections.process?.value,
    processMaterial: connections.process?.material,
    electricalKind: connections.electrical?.kind,
    electricalValue: connections.electrical?.value,
  });
}

function toEnvironmentalLimits(limits) {
  return withoutUndefined({
    ingressProtection: limits.ingressProtection,
    mediaTemperature: limits.mediaTemperature,
    ambientTemperature: limits.ambientTemperature,
    wettedMaterials: ensureArray(limits.wettedMaterials),
    compatibleMedia: ensureArray(limits.compatibleMedia),
  });
}

function toValveProfile(profile) {
  return withoutUndefined({
    pressureRating: profile.pressureRating,
    connection: profile.connection,
    material: profile.material,
    mode: profile.mode,
    compatibleMedia: ensureArray(profile.compatibleMedia),
    size: profile.size,
  });
}

function toSpecificationGroup(group) {
  return {
    key: group.key,
    label: group.label,
    values: ensureArray(group.values).map(toSpecificationValue),
  };
}

function toSpecificationValue(value) {
  return withoutUndefined({
    key: value.key,
    label: value.label,
    value: toJsonFieldValue(value.value),
    unit: value.unit,
    display: value.display,
    sourceRefs: ensureArray(value.sourceRefs).map(toSourceRef),
  });
}

function toJsonFieldValue(value) {
  return value;
}

function toSourceRef(sourceRef) {
  return withoutUndefined({
    sourceId: sourceRef.sourceId || sourceRef.id,
    label: sourceRef.label,
    href: sourceRef.href,
    page: sourceRef.page,
    confidence: sourceRef.confidence || 'unverified',
  });
}

function toVariant(variant) {
  return withoutUndefined({
    factId: variant.factId || variant.id,
    orderCode: variant.orderCode,
    optionValues: ensureArray(variant.optionValues),
    availability: variant.availability || 'standard-lead-time',
  });
}

function toCommercialTerms(terms) {
  return withoutUndefined({
    minimumOrderQuantity: terms.minimumOrderQuantity,
    standardLeadTime: terms.standardLeadTime,
    warranty: terms.warranty,
    oemCustomizable: Boolean(terms.oemCustomizable),
    privateLabelAvailable: Boolean(terms.privateLabelAvailable),
  });
}

async function upsert(uid, uniqueField, uniqueValue, data) {
  const existing = await findOneBy(uid, uniqueField, uniqueValue);
  const bucket = uid.split('::')[1] || uid;

  if (existing) {
    trackOperation(bucket, 'updated');
    return strapi.entityService.update(uid, existing.id, { data });
  }

  trackOperation(bucket, 'created');
  return strapi.entityService.create(uid, { data });
}

async function updateByStableId(uid, uniqueField, uniqueValue, data) {
  const existing = await findOneBy(uid, uniqueField, uniqueValue);

  if (!existing) {
    throw new Error(`${uid}.${uniqueField}=${uniqueValue} was not found.`);
  }

  trackOperation(uid.split('::')[1] || uid, 'updated');
  return strapi.entityService.update(uid, existing.id, { data });
}

async function findOneBy(uid, field, value) {
  const rows = await strapi.entityService.findMany(uid, {
    filters: { [field]: { $eq: value } },
    publicationState: 'preview',
    limit: 1,
  });

  return ensureArray(rows)[0];
}

async function syncPublishedCategoryParentLinks() {
  await strapi.db.connection.raw(`
    insert into category_facts_parent_lnk (category_fact_id, inv_category_fact_id)
    select child_published.id, parent_published.id
    from category_facts_parent_lnk draft_link
    join category_facts child_draft on child_draft.id = draft_link.category_fact_id
    join category_facts parent_draft on parent_draft.id = draft_link.inv_category_fact_id
    join category_facts child_published
      on child_published.document_id = child_draft.document_id
      and child_published.published_at is not null
    join category_facts parent_published
      on parent_published.document_id = parent_draft.document_id
      and parent_published.published_at is not null
    where child_draft.published_at is null
      and parent_draft.published_at is null
      and not exists (
        select 1
        from category_facts_parent_lnk existing_link
        where existing_link.category_fact_id = child_published.id
          and existing_link.inv_category_fact_id = parent_published.id
      )
  `);
}

function collectUnique(products, field) {
  return [...new Set(products.flatMap((product) => ensureArray(product[field])))];
}

function uniqueBy(rows, field) {
  const map = new Map();
  for (const row of rows) {
    if (row && row[field]) {
      map.set(row[field], row);
    }
  }
  return [...map.values()];
}

function diagnoseInput(input) {
  const errors = [];
  const warnings = [];

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      ok: false,
      errors: ['Input must be a CMS facts object.'],
      warnings,
    };
  }

  if (!Array.isArray(input.categoryFacts)) {
    errors.push('categoryFacts must be an array.');
  }

  if (!Array.isArray(input.productFacts)) {
    errors.push('productFacts must be an array.');
  }

  if (errors.length) {
    return {
      ok: false,
      errors,
      warnings,
    };
  }

  const categoryFacts = input.categoryFacts;
  const productFacts = input.productFacts;
  const categoryIds = new Set();
  const productIds = new Set();
  const rootCategories = categoryFacts.filter((category) => !category.parentId);

  if (categoryFacts.length === 0) {
    errors.push('At least one category fact is required.');
  }

  if (rootCategories.length !== 1) {
    errors.push(`Exactly one root category is required; found ${rootCategories.length}.`);
  }

  for (const category of categoryFacts) {
    if (!category?.id || !String(category.id).startsWith('cat_')) {
      errors.push(`Invalid category id '${category?.id}'. Category ids must start with cat_.`);
      continue;
    }

    if (categoryIds.has(category.id)) {
      errors.push(`Duplicate category id '${category.id}'.`);
    }

    categoryIds.add(category.id);
  }

  for (const category of categoryFacts) {
    if (category?.parentId && !categoryIds.has(category.parentId)) {
      errors.push(`Category '${category.id}' references unknown parent '${category.parentId}'.`);
    }
  }

  for (const product of productFacts) {
    if (!product?.id || !String(product.id).startsWith('prd_')) {
      errors.push(`Invalid product id '${product?.id}'. Product ids must start with prd_.`);
      continue;
    }

    if (productIds.has(product.id)) {
      errors.push(`Duplicate product id '${product.id}'.`);
    }

    productIds.add(product.id);

    const primaryCategoryId = product.primaryCategoryId || product.core?.primaryCategory;
    if (!primaryCategoryId || !categoryIds.has(primaryCategoryId)) {
      errors.push(`Product '${product.id}' references unknown primary category '${primaryCategoryId}'.`);
    }

    const family = product.family || product.core?.family || 'sensor';
    if (family === 'sensor' && (!ensureArray(product.measurements).length || !ensureArray(product.outputs).length)) {
      errors.push(`Sensor product '${product.id}' must include at least one measurement and one output.`);
    }

    if (family === 'valve' && !product.valveProfile) {
      errors.push(`Valve product '${product.id}' must include valveProfile.`);
    }

    if (!ensureArray(product.specificationGroups).length) {
      errors.push(`Product '${product.id}' must include at least one specification group.`);
    }
  }

  if (productFacts.length === 0) {
    warnings.push('No product facts found. The frontend will not have product records after import.');
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    counts: {
      categoryFacts: categoryFacts.length,
      productFacts: productFacts.length,
      rootCategoryFacts: rootCategories.length,
    },
    samples: {
      categoryIds: categoryFacts.map((category) => category.id).filter(Boolean).slice(0, 5),
      productIds: productFacts.map((product) => product.id).filter(Boolean).slice(0, 5),
    },
  };
}

function mapIds(index, ids, label) {
  return ensureArray(ids).map((id) => requireMappedId(index, id, label));
}

function requireMappedId(index, stableId, label) {
  if (!stableId || !index.has(stableId)) {
    throw new Error(`Unknown ${label}: ${stableId}`);
  }
  return index.get(stableId);
}

function toLocalizedText(value) {
  const fallback = fallbackLabel('unknown');
  const source = value || fallback;
  return withoutUndefined({
    en: source.en || source.zh || fallback.en,
    zh: source.zh || source.en || fallback.zh,
    ru: source.ru,
    es: source.es,
  });
}

function fallbackLabel(id) {
  const label = String(id).replace(/^(ind|app|cat|prd|doc|asset)_/, '').replace(/_/g, ' ');
  return { en: label, zh: label };
}

function ensureArray(value) {
  if (value === undefined || value === null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function withoutUndefined(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}

function trackOperation(bucket, action) {
  operationStats[bucket] ??= { created: 0, updated: 0 };
  operationStats[bucket][action] += 1;
}

function readArgs(argv) {
  const parsed = {
    file: undefined,
    dryRun: false,
    help: false,
  };
  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      parsed.help = true;
      continue;
    }

    if (arg === '--dry-run') {
      parsed.dryRun = true;
      continue;
    }

    if (arg === '--file') {
      parsed.file = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith('--')) {
      throw new Error(`Unknown argument '${arg}'.`);
    }

    positional.push(arg);
  }

  if (!parsed.file && positional.length) {
    parsed.file = positional[0];
  }

  return parsed;
}

function printHelp() {
  console.log(`Usage:
  npm run import:cms-facts -- --file /tmp/cms-facts.json --dry-run
  npm run import:cms-facts -- --file /tmp/cms-facts.json

Options:
  --file <path>   CmsFactInput JSON file to import. Defaults to ../outputs/cms-facts.json.
  --dry-run       Validate and summarize the JSON without starting Strapi or writing data.
  --help          Show this help.
`);
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
