import type { OutputBundle } from 'rollup';
import { QWIK_ENTRIES_ID, type NormalizedQwikPluginOptions } from './plugins/plugin';
import type {
  GlobalInjections,
  HookAnalysis,
  Path,
  QwikBundle,
  QwikManifest,
  TransformModule,
} from './types';

// This is just the initial prioritization of the symbols and entries
// at build time so there's less work during each SSR. However, SSR should
// still further optimize the priorities depending on the user/document.
// This also helps ensure a stable q-manifest.json file.

function prioritizeSymbolNames(manifest: QwikManifest) {
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
        // both symbols have an event with a priority
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
        // both symbols have a function with a priority
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
const EVENT_PRIORITY = /*#__PURE__*/ (() =>
  [
    // Click Events
    'click',
    'dblclick',
    'contextmenu',
    'auxclick',

    // Pointer Events
    'pointerdown',
    'pointerup',
    'pointermove',
    'pointerover',
    'pointerenter',
    'pointerleave',
    'pointerout',
    'pointercancel',
    'gotpointercapture',
    'lostpointercapture',

    // Touch Events
    'touchstart',
    'touchend',
    'touchmove',
    'touchcancel',

    // Mouse Events
    'mousedown',
    'mouseup',
    'mousemove',
    'mouseenter',
    'mouseleave',
    'mouseover',
    'mouseout',
    'wheel',

    // Gesture Events
    'gesturestart',
    'gesturechange',
    'gestureend',

    // Keyboard Events
    'keydown',
    'keyup',
    'keypress',

    // Input/Change Events
    'input',
    'change',
    'search',
    'invalid',
    'beforeinput',
    'select',

    // Focus/Blur Events
    'focusin',
    'focusout',
    'focus',
    'blur',

    // Form Events
    'submit',
    'reset',

    // Scroll Events
    'scroll',
  ].map((n) => `on${n.toLowerCase()}$`))();

const FUNCTION_PRIORITY = /*#__PURE__*/ (() =>
  ['useTask$', 'useVisibleTask$', 'component$', 'useStyles$', 'useStylesScoped$'].map((n) =>
    n.toLowerCase()
  ))();

function sortBundleNames(manifest: QwikManifest) {
  // this doesn't really matter at build time
  // but standardizing the order helps make this file stable
  return Object.keys(manifest.bundles).sort(sortAlphabetical);
}

function updateSortAndPriorities(manifest: QwikManifest) {
  const prioritizedSymbolNames = prioritizeSymbolNames(manifest);
  const prioritizedSymbols: QwikManifest['symbols'] = {};
  const prioritizedMapping: QwikManifest['mapping'] = {};

  for (const symbolName of prioritizedSymbolNames) {
    prioritizedSymbols[symbolName] = manifest.symbols[symbolName];
    prioritizedMapping[symbolName] = manifest.mapping[symbolName];
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
    const symbols: string[] = [];
    for (const symbolName of prioritizedSymbolNames) {
      if (bundleName === prioritizedMapping[symbolName]) {
        symbols.push(symbolName);
      }
    }
    if (symbols.length > 0) {
      symbols.sort(sortAlphabetical);
      bundle.symbols = symbols;
    }
  }

  manifest.symbols = prioritizedSymbols;
  manifest.mapping = prioritizedMapping;
  manifest.bundles = sortedBundles;

  return manifest;
}

function sortAlphabetical(a: string, b: string) {
  a = a.toLocaleLowerCase();
  b = b.toLocaleLowerCase();
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}

export function generateQwikEntries(transformedOutputs: Map<string, [TransformModule, string]>) {
  // Capture all hooks
  return `
        // Roundabout way to get import info for hooks
        export default {
          "begin-imports": true,
          ${[...transformedOutputs.entries()]
            .filter(([_, [mod]]) => mod.hook)
            .map(([sym, [mod]]) => `"${mod.hook!.name}": () => import("${sym}"),`)
            .join('\n')}
          "end-imports": true,
        }
      `;
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
  outputBundles: OutputBundle,
  opts: NormalizedQwikPluginOptions
) {
  const manifest: QwikManifest = {
    manifestHash: '',
    symbols: {},
    mapping: {},
    bundles: {},
    injections,
    version: '1',
    options: {
      target: opts.target,
      buildMode: opts.buildMode,
      entryStrategy: opts.entryStrategy,
    },
  };

  for (const [fileName, outputBundle] of Object.entries(outputBundles)) {
    if (outputBundle.type !== 'chunk') {
      continue;
    }
    const bundleFileName = path.basename(fileName);

    // Rollup doesn't provide the moduleIds in the outputBundle but Vite does
    outputBundle.moduleIds ||= Object.keys(outputBundle.modules);

    // Our special @qwik-entries chunk
    // We need to parse this to get the minified locations of the js packets
    if (outputBundle.moduleIds.some((id) => id.endsWith(QWIK_ENTRIES_ID))) {
      const { code } = outputBundle;
      const match =
        /^(?<left>.*){\s*['"]begin-imports[^:]*:[^,}]*,?(?<entries>[^}]*)['"]end-imports['"]\s*:[^}]*}(?<right>.*)/m.exec(
          code
        );
      if (!match) {
        console.error(
          `Could not parse @qwik-entries chunk ${bundleFileName}, please open an issue and provide this code: `,
          code
        );
        throw new Error(`Could not parse @qwik-entries chunk ${bundleFileName}`);
      }
      // the chunk contains a JSON object with the entry points
      // individual entries look like this:
      // "s_2y2nxB87G0c": __vitePreload(() => import("./q-Bi49h4Yp.js").then((n) => n.ba), true ? [] : void 0),
      // or minified:
      // s_17zcY0gsYE4:t(()=>import("./q-Co_1fcGT.js").then(_=>_.cO),[]),

      // locally embedded qrls look like
      // o=_=>{},E=Object.freeze(Object.defineProperty({__proto__:null,s_H7LftCVcX8A:o},Symbol.toStringTag,{value:"Module"}));
      // and then referenced as
      // s_H7LftCVcX8A:t(()=>Promise.resolve().then(()=>E),void 0)
      const parts = match.groups!.entries.split(',');
      for (const part of parts) {
        const info =
          /\s*['"]?(?<symbol>[a-zA-Z0-9_]+)['"]?:(.*import\(['"]\.\/(?<path>[^'"]+))?(.*then\(.*=>.*\.(?<attr>\w+))?/.exec(
            part
          );
        if (info) {
          const { symbol } = info.groups!;
          let { path, attr } = info.groups!;
          if (!path) {
            // Sadly rollup decided to move the chunk into our @qwik-entries chunk, and we have to keep it
            const match = /Promise.resolve.*then\(.*=>(?<internal>[^)])/.exec(part);
            if (!match) {
              console.error(
                `Could not parse entry ${part} in the following code. Please open an issue.`,
                code
              );
              throw new Error(`Could not parse entry symbol ${symbol}`);
            }
            const { internal } = match.groups!;
            // Now we have to find the export of the internal symbol
            // ;export{e as _,E as s};
            const findExport = new RegExp(
              `\\bexport\\s*{[^}]*\\b${internal}( as (?<exported>[^}]+))?\\b`
            ).exec(code);
            if (!findExport) {
              console.error(
                `Could not find export for ${symbol} in the following code. Please open an issue.`,
                code
              );
              throw new Error(`Could not find export for ${symbol}`);
            }
            attr = findExport.groups?.exported || internal;

            path = bundleFileName;
          }
          manifest.mapping[symbol] = `${path}${attr ? `#${attr}` : ''}`;
        }
      }
      // Successfully parsed, remove the entries
      outputBundle.code = `${match.groups!.left}0;${match.groups!.right}`;
    }

    const buildDirName = path.dirname(outputBundle.fileName);
    const bundle: QwikBundle = {
      size: outputBundle.code.length,
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

    const modulePaths = outputBundle.moduleIds.filter((m) => !m.startsWith(`\u0000`));
    if (modulePaths.length > 0) {
      bundle.origins = modulePaths;
    }

    manifest.bundles[bundleFileName] = bundle;
  }

  for (const hook of hooks) {
    const symbol = hook.name;
    const bundle = manifest.mapping[symbol];
    if (!bundle) {
      console.error(`Unable to find bundle for hook: ${hook.name}`, manifest);
      throw new Error(`Unable to find bundle for hook: ${hook.hash}`);
    }
    const key = bundle.split('#')[0];
    (manifest.bundles[key].symbols ||= []).push(symbol);
    manifest.symbols[symbol] = {
      origin: hook.origin,
      displayName: hook.displayName,
      canonicalFilename: hook.canonicalFilename,
      hash: hook.hash,
      ctxKind: hook.ctxKind,
      ctxName: hook.ctxName,
      captures: hook.captures,
      parent: hook.parent,
      loc: hook.loc,
    };
  }

  return updateSortAndPriorities(manifest);
}
