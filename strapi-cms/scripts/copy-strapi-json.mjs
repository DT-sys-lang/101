import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceRoots = [join(root, 'src'), join(root, 'config')];
const distRoot = join(root, 'dist');

for (const sourceRoot of sourceRoots) {
  if (!existsSync(sourceRoot)) {
    continue;
  }

  copyJsonFiles(sourceRoot);
}

function copyJsonFiles(currentPath) {
  for (const entry of readdirSync(currentPath)) {
    const sourcePath = join(currentPath, entry);
    const stats = statSync(sourcePath);

    if (stats.isDirectory()) {
      copyJsonFiles(sourcePath);
      continue;
    }

    if (!entry.endsWith('.json')) {
      continue;
    }

    const targetPath = join(distRoot, relative(root, sourcePath));
    mkdirSync(dirname(targetPath), { recursive: true });
    cpSync(sourcePath, targetPath);
  }
}
