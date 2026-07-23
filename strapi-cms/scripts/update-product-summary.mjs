import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cmsRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(join(cmsRoot, 'package.json'));
const { createStrapi } = require('@strapi/core');

const [, , factId, locale, expectedValue] = process.argv;

if (!factId || !locale || expectedValue === undefined) {
  console.error('Usage: node scripts/update-product-summary.mjs <factId> <locale> <summaryValue>');
  process.exit(1);
}

process.chdir(cmsRoot);
const app = await createStrapi({ appDir: cmsRoot, distDir: join(cmsRoot, 'dist') }).load();

try {
  const rows = await strapi.entityService.findMany('api::product-fact.product-fact', {
    filters: { factId: { $eq: factId } },
    publicationState: 'preview',
    populate: { summary: true },
    limit: 1,
  });
  const product = Array.isArray(rows) ? rows[0] : rows;

  if (!product) {
    throw new Error(`Product not found: ${factId}`);
  }

  const previousValue = product.summary?.[locale];
  const summary = {
    en: product.summary?.en || previousValue || expectedValue,
    zh: product.summary?.zh || previousValue || expectedValue,
    ru: product.summary?.ru,
    es: product.summary?.es,
    [locale]: expectedValue,
  };

  await strapi.entityService.update('api::product-fact.product-fact', product.id, {
    data: {
      summary,
      publishedAt: new Date().toISOString(),
    },
  });

  console.log(JSON.stringify({ factId, locale, previousValue, nextValue: expectedValue }, null, 2));
} finally {
  await destroyStrapiApp(app);
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
