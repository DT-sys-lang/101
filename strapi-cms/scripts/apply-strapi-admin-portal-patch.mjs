import { access, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const cmsDirectory = path.resolve(scriptDirectory, '..');
const adminDirectory = path.join(cmsDirectory, 'node_modules', '@strapi', 'admin');
const contentTypeBuilderDirectory = path.join(cmsDirectory, 'node_modules', '@strapi', 'content-type-builder');
const expectedVersion = '5.50.2';

const navBurgerTargets = [
  path.join(adminDirectory, 'dist', 'admin', 'admin', 'src', 'components', 'MainNav', 'NavBurgerMenu.mjs'),
  path.join(adminDirectory, 'dist', 'admin', 'admin', 'src', 'components', 'MainNav', 'NavBurgerMenu.js'),
];

const autoReloadTargets = [
  {
    path: path.join(contentTypeBuilderDirectory, 'dist', 'admin', 'components', 'AutoReloadOverlayBlocker.mjs'),
    reactNamespace: 'React',
    formatMessageCall: 'useIntl()',
    portalCall: 'createPortal',
  },
  {
    path: path.join(contentTypeBuilderDirectory, 'dist', 'admin', 'components', 'AutoReloadOverlayBlocker.js'),
    reactNamespace: 'React__namespace',
    formatMessageCall: 'reactIntl.useIntl()',
    portalCall: 'reactDom.createPortal',
  },
];

const navBurgerReplacements = [
  {
    before: `return /*#__PURE__*/ jsx(Portal, {
        children: /*#__PURE__*/ jsx(AnimatePresence, {
            children: isShown && /*#__PURE__*/ jsx(FocusTrap, {`,
    after: `return /*#__PURE__*/ jsx(AnimatePresence, {
        children: isShown === true && /*#__PURE__*/ jsx(Portal, {
            children: /*#__PURE__*/ jsx(FocusTrap, {`,
  },
  {
    before: `                }, "burger")
            })
        })
    });`,
    after: `                }, "burger")
            })
        }, "burger")
    });`,
  },
  {
    before: `return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Portal, {
        children: /*#__PURE__*/ jsxRuntime.jsx(react.AnimatePresence, {
            children: isShown && /*#__PURE__*/ jsxRuntime.jsx(designSystem.FocusTrap, {`,
    after: `return /*#__PURE__*/ jsxRuntime.jsx(react.AnimatePresence, {
        children: isShown === true && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Portal, {
            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.FocusTrap, {`,
  },
  {
    before: `                }, "burger")
            })
        })
    });`,
    after: `                }, "burger")
            })
        }, "burger")
    });`,
  },
];

async function pathExists(target) {
  try {
    await access(target, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function readPackageVersion(directory) {
  const packagePath = path.join(directory, 'package.json');
  const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));

  if (packageJson.version !== expectedVersion) {
    throw new Error(
      `[strapi-admin-portal-patch] Expected ${path.basename(directory)} ${expectedVersion}, found ${packageJson.version}. Review this patch before using a different Strapi version.`,
    );
  }
}

async function patchNavBurgerMenu(target) {
  const source = await readFile(target, 'utf8');

  if (source.includes('children: isShown === true &&')) {
    return 'already patched';
  }

  let patched = source;
  let replacementsApplied = 0;

  for (const { before, after } of navBurgerReplacements) {
    if (patched.includes(before)) {
      patched = patched.replace(before, after);
      replacementsApplied += 1;
    }
  }

  if (replacementsApplied !== 2) {
    throw new Error(
      `The expected Strapi NavBurgerMenu source shape was not found in ${path.relative(cmsDirectory, target)}.`,
    );
  }

  await writeFile(target, patched, 'utf8');
  return 'patched';
}

async function patchAutoReloadOverlayBlocker(target) {
  const source = await readFile(target.path, 'utf8');
  const patchMarker = `const containerRef = ${target.reactNamespace}.useRef(null);`;

  if (source.includes(patchMarker)) {
    return 'already patched';
  }

  const header = `const { formatMessage } = ${target.formatMessageCall};
    // eslint-disable-next-line no-undef
    return isOpen && globalThis?.document?.body ? /*#__PURE__*/ ${target.portalCall}(`;
  const patchedHeader = `const { formatMessage } = ${target.formatMessageCall};
    const containerRef = ${target.reactNamespace}.useRef(null);
    ${target.reactNamespace}.useEffect(()=>{
        const container = globalThis.document?.createElement('div');
        if (!container || !globalThis.document?.body) {
            return undefined;
        }
        globalThis.document.body.appendChild(container);
        containerRef.current = container;
        return ()=>{
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
            containerRef.current = null;
        };
    }, []);
    if (isOpen === false || containerRef.current === null) {
        return null;
    }
    return /*#__PURE__*/ ${target.portalCall}(`;
  const footer = `    }), // eslint-disable-next-line no-undef
    globalThis.document.body) : null;
};`;
  const patchedFooter = `    }), containerRef.current);
};`;

  if (!source.includes(header) || !source.includes(footer)) {
    throw new Error(
      `The expected Strapi AutoReloadOverlayBlocker source shape was not found in ${path.relative(cmsDirectory, target.path)}.`,
    );
  }

  const patched = source.replace(header, patchedHeader).replace(footer, patchedFooter);
  await writeFile(target.path, patched, 'utf8');
  return 'patched';
}

async function main() {
  if (!(await pathExists(path.join(adminDirectory, 'package.json')))) {
    console.log('[strapi-admin-portal-patch] @strapi/admin is not installed; skipping.');
    return;
  }

  await Promise.all([readPackageVersion(adminDirectory), readPackageVersion(contentTypeBuilderDirectory)]);
  const navResults = await Promise.all(navBurgerTargets.map(patchNavBurgerMenu));
  const autoReloadResults = await Promise.all(autoReloadTargets.map(patchAutoReloadOverlayBlocker));

  console.log(
    `[strapi-admin-portal-patch] NavBurgerMenu: ${navResults.join(', ')}. AutoReloadOverlayBlocker: ${autoReloadResults.join(', ')}.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
