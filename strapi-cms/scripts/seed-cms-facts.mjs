import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const cmsRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const workspaceRoot = dirname(cmsRoot);
const require = createRequire(join(cmsRoot, 'package.json'));
const { createStrapi } = require('@strapi/core');
const { importCmsFactsIntoStrapi } = require(join(cmsRoot, 'src', 'utils', 'cms-facts-importer.js'));
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

if (dryRun) {
  const result = await importCmsFactsIntoStrapi(null, cmsFacts, { input: inputPath, dryRun: true });
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

process.chdir(cmsRoot);
const app = await createStrapi({ appDir: cmsRoot, distDir: join(cmsRoot, 'dist') }).load();

try {
  const imported = await importCmsFactsIntoStrapi(strapi, cmsFacts, { input: inputPath });
  console.log(JSON.stringify(imported, null, 2));
} finally {
  await destroyStrapiApp(app);
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
