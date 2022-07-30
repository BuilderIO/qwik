import type { NormalizedQwikPluginOptions } from './plugins/plugin';
import type {
  GeneratedOutputBundle,
  GlobalInjections,
  HookAnalysis,
  Path,
  QwikBundle,
  QwikManifest,
  QwikSymbol,
} from './types';

// This is just the initial prioritization of the symbols and entries
// at build time so there's less work during each SSR. However, SSR should
// still further optimize the priorities depending on the user/document.
// This also helps ensure a stable q-manifest.json file.

function prioritorizeSymbolNames(manifest: QwikManifest) {
  const symbols = manifest.symbols;

  return Object.keys(symbols).sort((symbolNameA, symbolNameB) => {
    const a = symbols[symbolNameA];
    const b = symbols[symbolNameB];

    // events should sort highest
    if (a.ctxKind === 'event' && b.ctxKind !== 'event') {
      return -1;
    }
    if (a.ctxKind !== 'event' && b.ctxKind === 'event') {
      return 1;
    }

    if (a.ctxKind === 'event' && b.ctxKind === 'event') {
      // both are an event
      const aIndex = EVENT_PRIORITY.indexOf(a.ctxName.toLowerCase());
      const bIndex = EVENT_PRIORITY.indexOf(b.ctxName.toLowerCase());

      if (aIndex > -1 && bIndex > -1) {
        // both symbols have an event with a prioritory
        if (aIndex < bIndex) {
          return -1;
        }
        if (aIndex > bIndex) {
          return 1;
        }
      } else {
        if (aIndex > -1) {
          // just symbol "a" has an event with a priority
          return -1;
        }
        if (bIndex > -1) {
          // just symbol "b" has an event with a priority
          return 1;
        }
      }
    } else if (a.ctxKind === 'function' && b.ctxKind === 'function') {
      // both are a function
      const aIndex = FUNCTION_PRIORITY.indexOf(a.ctxName.toLowerCase());
      const bIndex = FUNCTION_PRIORITY.indexOf(b.ctxName.toLowerCase());

      if (aIndex > -1 && bIndex > -1) {
        // both symbols have a function with a prioritory
        if (aIndex < bIndex) {
          return -1;
        }
        if (aIndex > bIndex) {
          return 1;
        }
      } else {
        if (aIndex > -1) {
          // just symbol "a" has a function with a priority
          return -1;
        }
        if (bIndex > -1) {
          // just symbol "b" has a function with a priority
          return 1;
        }
      }
    }

    // symbols with no "parent" have a higher priority
    if (!a.parent && b.parent) {
      return -1;
    }
    if (a.parent && !b.parent) {
      return 1;
    }

    // idk, they're pretty darn similar, just sort by the symbol name
    if (a.hash < b.hash) {
      return -1;
    }
    if (a.hash > b.hash) {
      return 1;
    }
    return 0;
  });
}

// User triggered events should have priority
const EVENT_PRIORITY = [
  // Click Events
  'onClick$',
  'onDblClick$',
  'onContextMenu$',
  'onAuxClick$',

  // Pointer Events
  'onPointerDown$',
  'onPointerUp$',
  'onPointerMove$',
  'onPointerOver$',
  'onPointerEnter$',
  'onPointerLeave$',
  'onPointerOut$',
  'onPointerCancel$',
  'onGotPointerCapture$',
  'onLostPointerCapture$',

  // Touch Events
  'onTouchStart$',
  'onTouchEnd$',
  'onTouchMove$',
  'onTouchCancel$',

  // Mouse Events
  'onMouseDown$',
  'onMouseUp$',
  'onMouseMove$',
  'onMouseEnter$',
  'onMouseLeave$',
  'onMouseOver$',
  'onMouseOut$',
  'onWheel$',

  // Gesture Events
  'onGestureStart$',
  'onGestureChange$',
  'onGestureEnd$',

  // Keyboard Events
  'onKeyDown$',
  'onKeyUp$',
  'onKeyPress$',

  // Input/Change Events
  'onInput$',
  'onChange$',
  'onSearch$',
  'onInvalid$',
  'onBeforeInput$',
  'onSelect$',

  // Focus/Blur Events
  'onFocusIn$',
  'onFocusOut$',
  'onFocus$',
  'onBlur$',

  // Form Events
  'onSubmit$',
  'onReset$',

  // Scroll Events
  'onScroll$',
].map((n) => n.toLowerCase());

const FUNCTION_PRIORITY = [
  'useClientEffect$',
  'useEffect$',
  'component$',
  'useStyles$',
  'useStyles$',
].map((n) => n.toLowerCase());

function sortBundleNames(manifest: QwikManifest) {
  // this doesn't really matter at build time
  // but standardizing the order helps make this file stable
  return Object.keys(manifest.bundles).sort(sortAlphabetical);
}

function updateSortAndPriorities(manifest: QwikManifest) {
  const prioritorizedSymbolNames = prioritorizeSymbolNames(manifest);
  const prioritorizedSymbols: { [symbolName: string]: QwikSymbol } = {};
  const prioritorizedMapping: { [symbolName: string]: string } = {};

  for (const symbolName of prioritorizedSymbolNames) {
    prioritorizedSymbols[symbolName] = manifest.symbols[symbolName];
    prioritorizedMapping[symbolName] = manifest.mapping[symbolName];
  }

  const sortedBundleNames = sortBundleNames(manifest);
  const sortedBundles: { [fileName: string]: QwikBundle } = {};
  for (const bundleName of sortedBundleNames) {
    sortedBundles[bundleName] = manifest.bundles[bundleName];
    const bundle = manifest.bundles[bundleName];
    if (Array.isArray(bundle.imports)) {
      bundle.imports.sort(sortAlphabetical);
    }
    if (Array.isArray(bundle.dynamicImports)) {
      bundle.dynamicImports.sort(sortAlphabetical);
    }
    for (const symbolName of prioritorizedSymbolNames) {
      if (bundleName === prioritorizedMapping[symbolName]) {
        bundle.symbols.push(symbolName);
      }
    }
    bundle.symbols.sort(sortAlphabetical);
  }

  manifest.symbols = prioritorizedSymbols;
  manifest.mapping = prioritorizedMapping;
  manifest.bundles = sortedBundles;

  return manifest;
}

function sortAlphabetical(a: string, b: string) {
  a = a.toLocaleLowerCase();
  b = b.toLocaleLowerCase();
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function getValidManifest(manifest: QwikManifest | undefined | null) {
  if (
    manifest != null &&
    manifest.mapping != null &&
    typeof manifest.mapping === 'object' &&
    manifest.symbols != null &&
    typeof manifest.symbols === 'object' &&
    manifest.bundles != null &&
    typeof manifest.bundles === 'object'
  ) {
    return manifest;
  }
  return undefined;
}

export function generateManifestFromBundles(
  path: Path,
  hooks: HookAnalysis[],
  injections: GlobalInjections[],
  outputBundles: GeneratedOutputBundle[],
  opts: NormalizedQwikPluginOptions
) {
  const manifest: QwikManifest = {
    symbols: {},
    mapping: {},
    bundles: {},
    injections,
    version: '1',
    options: {
      target: opts.target,
      buildMode: opts.buildMode,
      forceFullBuild: opts.forceFullBuild,
      entryStrategy: opts.entryStrategy,
    },
  };

  for (const hook of hooks) {
    const buildFilePath = `${hook.canonicalFilename}.${hook.extension}`;

    const outputBundle = outputBundles.find((b) => {
      return Object.keys(b.modules).find((f) => f.endsWith(buildFilePath));
    });

    if (outputBundle) {
      const symbolName = hook.name;
      const bundleFileName = path.basename(outputBundle.fileName);

      manifest.mapping[symbolName] = bundleFileName;

      manifest.symbols[symbolName] = {
        origin: hook.origin,
        displayName: hook.displayName,
        canonicalFilename: hook.canonicalFilename,
        hash: hook.hash,
        ctxKind: hook.ctxKind,
        ctxName: hook.ctxName,
        captures: hook.captures,
        parent: hook.parent,
      };

      addBundleToManifest(path, manifest, outputBundle, bundleFileName);
    }
  }

  for (const outputBundle of outputBundles) {
    const bundleFileName = path.basename(outputBundle.fileName);
    addBundleToManifest(path, manifest, outputBundle, bundleFileName);
  }

  return updateSortAndPriorities(manifest);
}

function addBundleToManifest(
  path: Path,
  manifest: QwikManifest,
  outputBundle: GeneratedOutputBundle,
  bundleFileName: string
) {
  if (!manifest.bundles[bundleFileName]) {
    const buildDirName = path.dirname(outputBundle.fileName);
    const bundle: QwikBundle = {
      size: outputBundle.size,
      symbols: [],
    };

    const bundleImports = outputBundle.imports
      .filter((i) => path.dirname(i) === buildDirName)
      .map((i) => path.relative(buildDirName, i));
    if (bundleImports.length > 0) {
      bundle.imports = bundleImports;
    }

    const bundleDynamicImports = outputBundle.dynamicImports
      .filter((i) => path.dirname(i) === buildDirName)
      .map((i) => path.relative(buildDirName, i));
    if (bundleDynamicImports.length > 0) {
      bundle.dynamicImports = bundleDynamicImports;
    }

    manifest.bundles[bundleFileName] = bundle;
  }
}
