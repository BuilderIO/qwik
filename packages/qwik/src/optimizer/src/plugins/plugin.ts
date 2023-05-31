import { createOptimizer } from '../optimizer';
import { generateManifestFromBundles, getValidManifest } from '../manifest';
import type {
  Diagnostic,
  EntryStrategy,
  GeneratedOutputBundle,
  GlobalInjections,
  HookAnalysis,
  Optimizer,
  OptimizerOptions,
  QwikManifest,
  TransformFsOptions,
  TransformModule,
  TransformModuleInput,
  TransformModulesOptions,
  TransformOutput,
} from '../types';
import { createLinter, type QwikLinter } from './eslint-plugin';
import type { Rollup } from 'vite';

const REG_CTX_NAME = ['server'];

const SERVER_STRIP_EXPORTS = [
  'onGet',
  'onPost',
  'onPut',
  'onRequest',
  'onDelete',
  'onHead',
  'onOptions',
  'onPatch',
  'onStaticGenerate',
];

const SERVER_STRIP_CTX_NAME = [
  'useServer',
  'route',
  'server',
  'action$',
  'loader$',
  'zod$',
  'validator$',
  'globalAction$',
];
const CLIENT_STRIP_CTX_NAME = [
  'useClient',
  'useBrowser',
  'useVisibleTask',
  'client',
  'browser',
  'event$',
];
export interface QwikPackages {
  id: string;
  path: string;
}

export function createPlugin(optimizerOptions: OptimizerOptions = {}) {
  const id = `${Math.round(Math.random() * 899) + 100}`;

  const results = new Map<string, TransformOutput>();
  const transformedOutputs = new Map<string, [TransformModule, string]>();

  const ssrResults = new Map<string, TransformOutput>();
  const ssrTransformedOutputs = new Map<string, [TransformModule, string]>();

  let internalOptimizer: Optimizer | null = null;
  let linter: QwikLinter | undefined = undefined;
  let diagnosticsCallback: (
    d: Diagnostic[],
    optimizer: Optimizer,
    srcDir: string
  ) => void = () => {};

  const opts: NormalizedQwikPluginOptions = {
    target: 'client',
    buildMode: 'development',
    debug: false,
    rootDir: null as any,
    tsconfigFileNames: ['./tsconfig.json'],
    input: null as any,
    outDir: null as any,
    resolveQwikBuild: true,
    forceFullBuild: false,
    entryStrategy: null as any,
    srcDir: null as any,
    srcInputs: null as any,
    manifestInput: null,
    manifestOutput: null,
    transformedModuleOutput: null,
    vendorRoots: [],
    scope: null,
    devTools: {
      clickToSource: ['Alt'],
    },
  };

  const init = async () => {
    if (!internalOptimizer) {
      internalOptimizer = await createOptimizer(optimizerOptions);
    }
  };

  const getOptimizer = () => {
    if (!internalOptimizer) {
      throw new Error(`Qwik plugin has not been initialized`);
    }
    return internalOptimizer;
  };

  const getSys = () => {
    const optimizer = getOptimizer();
    return optimizer.sys;
  };

  const getPath = () => {
    const optimizer = getOptimizer();
    return optimizer.sys.path;
  };

  const normalizeOptions = async (inputOpts?: QwikPluginOptions) => {
    const updatedOpts: QwikPluginOptions = Object.assign({}, inputOpts);

    const optimizer = getOptimizer();
    const path = optimizer.sys.path;

    opts.debug = !!updatedOpts.debug;

    updatedOpts.target === 'test';
    if (
      updatedOpts.target === 'ssr' ||
      updatedOpts.target === 'client' ||
      updatedOpts.target === 'lib' ||
      updatedOpts.target === 'test'
    ) {
      opts.target = updatedOpts.target;
    } else {
      opts.target = 'client';
    }

    if (opts.target === 'lib') {
      opts.buildMode = 'development';
    } else if (updatedOpts.buildMode === 'production' || updatedOpts.buildMode === 'development') {
      opts.buildMode = updatedOpts.buildMode;
    } else {
      opts.buildMode = 'development';
    }

    if (updatedOpts.entryStrategy && typeof updatedOpts.entryStrategy === 'object') {
      opts.entryStrategy = { ...updatedOpts.entryStrategy };
    }
    if (!opts.entryStrategy) {
      if (opts.target === 'ssr' || opts.target === 'test') {
        opts.entryStrategy = { type: 'hoist' };
      } else if (opts.target === 'lib') {
        opts.entryStrategy = { type: 'inline' };
      } else {
        if (opts.buildMode === 'production') {
          opts.entryStrategy = { type: 'smart' };
        } else {
          opts.entryStrategy = { type: 'hook' };
        }
      }
    }

    if (typeof updatedOpts.rootDir === 'string') {
      opts.rootDir = updatedOpts.rootDir;
    }
    if (typeof opts.rootDir !== 'string') {
      opts.rootDir = optimizer.sys.cwd();
    }
    opts.rootDir = normalizePath(path.resolve(optimizer.sys.cwd(), opts.rootDir));
    let srcDir = normalizePath(path.resolve(opts.rootDir, SRC_DIR_DEFAULT));
    if (typeof updatedOpts.srcDir === 'string') {
      opts.srcDir = normalizePath(path.resolve(opts.rootDir, updatedOpts.srcDir));
      srcDir = opts.srcDir;
      opts.srcInputs = null;
    } else if (Array.isArray(updatedOpts.srcInputs)) {
      opts.srcInputs = [...updatedOpts.srcInputs];
      opts.srcDir = null;
    } else {
      opts.srcDir = srcDir;
    }

    if (typeof updatedOpts.forceFullBuild === 'boolean') {
      opts.forceFullBuild = updatedOpts.forceFullBuild;
    } else {
      opts.forceFullBuild =
        (opts.entryStrategy.type !== 'hook' &&
          opts.entryStrategy.type !== 'inline' &&
          opts.entryStrategy.type !== 'hoist') ||
        !!updatedOpts.srcInputs;
    }

    if (
      opts.forceFullBuild === false &&
      opts.entryStrategy.type !== 'hook' &&
      opts.entryStrategy.type !== 'inline' &&
      opts.entryStrategy.type !== 'hoist'
    ) {
      console.error(`forceFullBuild cannot be false with entryStrategy ${opts.entryStrategy.type}`);
      opts.forceFullBuild = true;
    }

    if (opts.forceFullBuild === false && !!updatedOpts.srcInputs) {
      console.error(`forceFullBuild reassigned to "true" since "srcInputs" have been provided`);
      opts.forceFullBuild = true;
    }

    if (Array.isArray(opts.srcInputs)) {
      opts.srcInputs.forEach((i) => {
        i.path = normalizePath(path.resolve(opts.rootDir, i.path));
      });
    } else if (typeof opts.srcDir === 'string') {
      opts.srcDir = normalizePath(path.resolve(opts.rootDir, normalizePath(opts.srcDir)));
    }

    if (Array.isArray(updatedOpts.input)) {
      opts.input = [...updatedOpts.input];
    } else if (typeof updatedOpts.input === 'string') {
      opts.input = [updatedOpts.input];
    } else {
      if (opts.target === 'ssr') {
        // ssr input default
        opts.input = [path.resolve(srcDir, 'entry.ssr.tsx')];
      } else if (opts.target === 'client') {
        // client input default
        const rootTsxLocation = path.resolve(srcDir, 'root.tsx');
        if (await isPathExist(rootTsxLocation)) {
          opts.input = [rootTsxLocation];
        }
      } else if (opts.target === 'lib') {
        // lib input default
        opts.input = [path.resolve(srcDir, 'index.ts')];
      } else {
        opts.input = [];
      }
    }
    opts.input = opts.input.reduce((inputs, i) => {
      let input = i;
      if (!i.startsWith('@') && !i.startsWith('~')) {
        input = normalizePath(path.resolve(opts.rootDir, i));
      }
      if (!inputs.includes(input)) {
        inputs.push(input);
      }
      return inputs;
    }, [] as string[]);

    if (typeof updatedOpts.outDir === 'string') {
      opts.outDir = normalizePath(path.resolve(opts.rootDir, normalizePath(updatedOpts.outDir)));
    } else {
      if (opts.target === 'ssr') {
        opts.outDir = normalizePath(path.resolve(opts.rootDir, SSR_OUT_DIR));
      } else if (opts.target === 'lib') {
        opts.outDir = normalizePath(path.resolve(opts.rootDir, LIB_OUT_DIR));
      } else {
        opts.outDir = normalizePath(path.resolve(opts.rootDir, CLIENT_OUT_DIR));
      }
    }

    if (typeof updatedOpts.manifestOutput === 'function') {
      opts.manifestOutput = updatedOpts.manifestOutput;
    }

    const clientManifest = getValidManifest(updatedOpts.manifestInput);
    if (clientManifest) {
      opts.manifestInput = clientManifest;
    }

    if (typeof updatedOpts.transformedModuleOutput === 'function') {
      opts.transformedModuleOutput = updatedOpts.transformedModuleOutput;
    }

    opts.vendorRoots = updatedOpts.vendorRoots ? updatedOpts.vendorRoots : [];
    opts.scope = updatedOpts.scope ?? null;

    if (typeof updatedOpts.resolveQwikBuild === 'boolean') {
      opts.resolveQwikBuild = updatedOpts.resolveQwikBuild;
    }

    if (typeof updatedOpts.devTools === 'object') {
      if ('clickToSource' in updatedOpts.devTools) {
        opts.devTools.clickToSource = updatedOpts.devTools.clickToSource;
      }
    }

    return { ...opts };
  };

  let hasValidatedSource = false;

  const validateSource = async (resolver: (id: string) => Promise<unknown | undefined>) => {
    if (!hasValidatedSource) {
      hasValidatedSource = true;

      if (!(await isPathExist(opts.rootDir))) {
        throw new Error(`Qwik rootDir "${opts.rootDir}" not found.`);
      }

      if (typeof opts.srcDir === 'string' && !(await isPathExist(opts.srcDir))) {
        throw new Error(`Qwik srcDir "${opts.srcDir}" not found.`);
      }

      for (const alias in opts.input) {
        const input = opts.input[alias];
        const resolved = await resolver(input);
        if (!resolved) {
          throw new Error(`Qwik input "${input}" not found.`);
        }
      }
    }
  };

  const buildStart = async (ctx: any) => {
    log(
      `buildStart()`,
      opts.buildMode,
      opts.forceFullBuild ? 'full build' : 'isolated build',
      opts.scope
    );
    const optimizer = getOptimizer();

    if (optimizer.sys.env === 'node' && opts.target !== 'ssr') {
      try {
        linter = await createLinter(optimizer.sys, opts.rootDir, opts.tsconfigFileNames);
      } catch (err) {
        // Nothing
      }
    }

    if (opts.forceFullBuild) {
      const path = getPath();

      let srcDir = '/';
      if (typeof opts.srcDir === 'string') {
        srcDir = normalizePath(opts.srcDir);
        log(`buildStart() srcDir`, opts.srcDir);
      } else if (Array.isArray(opts.srcInputs)) {
        optimizer.sys.getInputFiles = async (rootDir) =>
          opts.srcInputs!.map((i) => {
            const relInput: TransformModuleInput = {
              path: normalizePath(path.relative(rootDir, i.path)),
              code: i.code,
            };
            return relInput;
          });
        log(`buildStart() opts.srcInputs (${opts.srcInputs.length})`);
      }
      const vendorRoots = opts.vendorRoots;
      if (vendorRoots.length > 0) {
        log(`vendorRoots`, vendorRoots);
      }

      log(`transformedOutput.clear()`);
      transformedOutputs.clear();

      const mode =
        opts.target === 'lib' ? 'lib' : opts.buildMode === 'development' ? 'dev' : 'prod';
      const transformOpts: TransformFsOptions = {
        srcDir,
        rootDir: opts.rootDir,
        vendorRoots,
        entryStrategy: opts.entryStrategy,
        minify: 'simplify',
        transpileTs: true,
        transpileJsx: true,
        explicitExtensions: true,
        preserveFilenames: true,
        mode,
        scope: opts.scope ? opts.scope : undefined,
      };

      if (opts.target === 'client') {
        transformOpts.stripCtxName = SERVER_STRIP_CTX_NAME;
        transformOpts.stripExports = SERVER_STRIP_EXPORTS;
        transformOpts.isServer = false;
      } else if (opts.target === 'ssr') {
        transformOpts.stripCtxName = CLIENT_STRIP_CTX_NAME;
        transformOpts.stripEventHandlers = true;
        transformOpts.isServer = true;
        transformOpts.regCtxName = REG_CTX_NAME;
      }

      const result = await optimizer.transformFs(transformOpts);
      for (const output of result.modules) {
        const key = normalizePath(path.join(srcDir, output.path)!);
        log(`buildStart() add transformedOutput`, key, output.hook?.displayName);
        transformedOutputs.set(key, [output, key]);
        ssrTransformedOutputs.set(key, [output, key]);
        if (output.isEntry) {
          ctx.emitFile({
            id: key,
            type: 'chunk',
          });
        }
      }

      diagnosticsCallback(result.diagnostics, optimizer, srcDir);

      results.set('@buildStart', result);
      ssrResults.set('@buildStart', result);
    }
  };

  const resolveId = async (
    _ctx: Rollup.PluginContext,
    id: string,
    importer: string | undefined,
    resolveIdOpts?: { ssr?: boolean }
  ) => {
    log(`resolveId()`, 'Start', id, importer);

    if (id.startsWith('\0')) {
      return;
    }
    if (id.startsWith('/@fs')) {
      return;
    }
    if (opts.target === 'lib' && id.startsWith(QWIK_CORE_ID)) {
      return {
        external: true,
        id,
      };
    }

    if (opts.resolveQwikBuild && id === QWIK_BUILD_ID) {
      log(`resolveId()`, 'Resolved', QWIK_BUILD_ID);
      return {
        id: normalizePath(getPath().resolve(opts.rootDir, QWIK_BUILD_ID)),
        moduleSideEffects: false,
      };
    }

    if (id.endsWith(QWIK_CLIENT_MANIFEST_ID)) {
      log(`resolveId()`, 'Resolved', QWIK_CLIENT_MANIFEST_ID);
      if (opts.target === 'lib') {
        return {
          id: id,
          external: true,
          moduleSideEffects: false,
        };
      }
      return {
        id: normalizePath(getPath().resolve(opts.input[0], QWIK_CLIENT_MANIFEST_ID)),
        moduleSideEffects: false,
      };
    }

    const path = getPath();

    if (importer) {
      // Only process relative links
      if (!id.startsWith('.') && !path.isAbsolute(id)) {
        return;
      }
      const parsedId = parseId(id);
      let importeePathId = normalizePath(parsedId.pathId);
      const ext = path.extname(importeePathId);
      if (RESOLVE_EXTS[ext]) {
        importer = normalizePath(importer);
        log(`resolveId("${importeePathId}", "${importer}")`);
        const parsedImporterId = parseId(importer);
        const dir = path.dirname(parsedImporterId.pathId);
        if (parsedImporterId.pathId.endsWith('.html') && !importeePathId.endsWith('.html')) {
          importeePathId = normalizePath(path.join(dir, importeePathId));
        } else {
          importeePathId = normalizePath(path.resolve(dir, importeePathId));
        }
        const transformedOutput = resolveIdOpts?.ssr
          ? ssrTransformedOutputs.get(importeePathId)
          : transformedOutputs.get(importeePathId);

        if (transformedOutput) {
          log(`resolveId() Resolved ${importeePathId} from transformedOutputs`);
          return {
            id: importeePathId + parsedId.query,
          };
        }
      }
    } else if (path.isAbsolute(id)) {
      const parsedId = parseId(id);
      const importeePathId = normalizePath(parsedId.pathId);
      const ext = path.extname(importeePathId);
      if (RESOLVE_EXTS[ext]) {
        log(`resolveId("${importeePathId}", "${importer}")`);
        const transformedOutput = resolveIdOpts?.ssr
          ? ssrTransformedOutputs.get(importeePathId)
          : transformedOutputs.get(importeePathId);

        if (transformedOutput) {
          log(`resolveId() Resolved ${importeePathId} from transformedOutputs`);
          return {
            id: importeePathId + parsedId.query,
          };
        }
      }
    }
    return null;
  };

  const load = async (_ctx: any, id: string, loadOpts: { ssr?: boolean } = {}) => {
    if (id.startsWith('\0') || id.startsWith('/@fs/')) {
      return;
    }
    if (opts.resolveQwikBuild && id.endsWith(QWIK_BUILD_ID)) {
      log(`load()`, QWIK_BUILD_ID, opts.buildMode);
      return {
        moduleSideEffects: false,
        code: getQwikBuildModule(loadOpts, opts.target),
      };
    }

    if (id.endsWith(QWIK_CLIENT_MANIFEST_ID)) {
      log(`load()`, QWIK_CLIENT_MANIFEST_ID, opts.buildMode);
      return {
        moduleSideEffects: false,
        code: await getQwikServerManifestModule(loadOpts),
      };
    }
    const parsedId = parseId(id);
    const path = getPath();
    id = normalizePath(parsedId.pathId);

    const transformedModule = loadOpts?.ssr
      ? ssrTransformedOutputs.get(id)
      : transformedOutputs.get(id);
    if (transformedModule) {
      log(`load()`, 'Found', id);

      let code = transformedModule[0].code;
      if (opts.target === 'ssr') {
        // doing this because vite will not use resolveId() when "noExternal" is false
        // so we need to turn the @qwik-client-manifest import into a relative import
        code = code.replace(
          /@qwik-client-manifest/g,
          normalizePath(path.resolve(opts.input[0], QWIK_CLIENT_MANIFEST_ID))
        );
      }
      return {
        code,
        map: transformedModule[0].map,
        meta: {
          hook: transformedModule[0].hook,
        },
      };
    }

    return null;
  };

  const transform = async function (
    ctx: Rollup.PluginContext,
    code: string,
    id: string,
    ssrOpts: { ssr?: boolean } = {}
  ) {
    if (opts.forceFullBuild) {
      // Only run when moduleIsolated === true
      return null;
    }

    const optimizer = getOptimizer();
    const path = getPath();

    const { pathId } = parseId(id);
    const { ext, dir, base } = path.parse(pathId);

    if (
      TRANSFORM_EXTS[ext] ||
      TRANSFORM_REGEX.test(pathId) ||
      insideRoots(ext, dir, opts.srcDir, opts.vendorRoots)
    ) {
      const strip = opts.target === 'client' || opts.target === 'ssr';
      const normalizedID = normalizePath(pathId);
      log(`transform()`, 'Transforming', pathId);

      let filePath = base;
      if (opts.srcDir) {
        filePath = path.relative(opts.srcDir, pathId);
      }
      filePath = normalizePath(filePath);
      const srcDir = opts.srcDir ? opts.srcDir : normalizePath(dir);
      const mode = opts.buildMode === 'development' ? 'dev' : 'prod';
      const transformOpts: TransformModulesOptions = {
        input: [
          {
            code: code,
            path: filePath,
          },
        ],
        entryStrategy: opts.entryStrategy,
        minify: 'simplify',
        sourceMaps: 'development' === opts.buildMode,
        transpileTs: true,
        transpileJsx: true,
        explicitExtensions: true,
        preserveFilenames: true,
        srcDir: srcDir,
        rootDir: opts.rootDir,
        mode: mode,
        scope: opts.scope ? opts.scope : void 0,
      };
      const isSSR = !!ssrOpts.ssr;
      if (strip) {
        if (isSSR) {
          transformOpts.stripCtxName = CLIENT_STRIP_CTX_NAME;
          transformOpts.stripEventHandlers = true;
          transformOpts.entryStrategy = { type: 'hoist' };
          transformOpts.regCtxName = REG_CTX_NAME;
          transformOpts.isServer = true;
        } else {
          transformOpts.stripCtxName = SERVER_STRIP_CTX_NAME;
          transformOpts.stripExports = SERVER_STRIP_EXPORTS;
          transformOpts.isServer = false;
        }
      }

      const newOutput = optimizer.transformModulesSync(transformOpts);

      diagnosticsCallback(newOutput.diagnostics, optimizer, srcDir);

      if (isSSR) {
        if (newOutput.diagnostics.length === 0 && linter) {
          await linter.lint(ctx, code, id);
        }
        ssrResults.set(normalizedID, newOutput);
      } else {
        results.set(normalizedID, newOutput);
      }
      const deps = new Set();
      for (const mod of newOutput.modules) {
        if (mod.isEntry) {
          const key = normalizePath(path.join(srcDir, mod.path));
          if (isSSR) {
            ssrTransformedOutputs.set(key, [mod, id]);
          } else {
            transformedOutputs.set(key, [mod, id]);
          }
          deps.add(key);
        }
      }
      if (isSSR && strip) {
        const clientTransformOpts: TransformModulesOptions = {
          input: [
            {
              code: code,
              path: filePath,
            },
          ],
          entryStrategy: opts.entryStrategy,
          minify: 'simplify',
          sourceMaps: 'development' === opts.buildMode,
          transpileTs: true,
          transpileJsx: true,
          explicitExtensions: true,
          preserveFilenames: true,
          srcDir: srcDir,
          rootDir: opts.rootDir,
          mode: mode,
          scope: opts.scope ? opts.scope : void 0,
        };
        clientTransformOpts.stripCtxName = SERVER_STRIP_CTX_NAME;
        clientTransformOpts.stripExports = SERVER_STRIP_EXPORTS;
        clientTransformOpts.isServer = false;
        const clientNewOutput = optimizer.transformModulesSync(clientTransformOpts);

        diagnosticsCallback(clientNewOutput.diagnostics, optimizer, srcDir);

        results.set(normalizedID, clientNewOutput);
        for (const mod of clientNewOutput.modules) {
          if (mod.isEntry) {
            const key = normalizePath(path.join(srcDir, mod.path));
            ctx.addWatchFile(key);
            transformedOutputs.set(key, [mod, id]);
            deps.add(key);
          }
        }
      }

      const module = newOutput.modules.find((m) => !m.isEntry)!;
      return {
        code: module.code,
        map: module.map,
        meta: {
          hook: module.hook,
          qwikdeps: Array.from(deps),
        },
      };
    }

    log(`transform()`, 'No Transforming', id);

    return null;
  };

  const createOutputAnalyzer = () => {
    const outputBundles: GeneratedOutputBundle[] = [];
    const injections: GlobalInjections[] = [];

    const addBundle = (b: GeneratedOutputBundle) => outputBundles.push(b);
    const addInjection = (b: GlobalInjections) => injections.push(b);
    const generateManifest = async () => {
      const optimizer = getOptimizer();
      const path = optimizer.sys.path;

      const hooks = Array.from(results.values())
        .flatMap((r) => r.modules)
        .map((mod) => mod.hook)
        .filter((h) => !!h) as HookAnalysis[];

      const manifest = generateManifestFromBundles(path, hooks, injections, outputBundles, opts);

      for (const symbol of Object.values(manifest.symbols)) {
        if (symbol.origin) {
          symbol.origin = normalizePath(symbol.origin);
        }
      }

      for (const bundle of Object.values(manifest.bundles)) {
        if (bundle.origins) {
          bundle.origins = bundle.origins
            .map((abs) => {
              const relPath = path.relative(opts.rootDir, abs);
              return normalizePath(relPath);
            })
            .sort();
        }
      }

      return manifest;
    };

    return { addBundle, addInjection, generateManifest };
  };

  const getOptions = () => opts;

  const getTransformedOutputs = () => {
    return Array.from(transformedOutputs.values()).map((t) => {
      return t[0];
    });
  };

  const log = (...str: any[]) => {
    if (opts.debug) {
      // eslint-disable-next-line no-console
      console.debug(`[QWIK PLUGIN: ${id}]`, ...str);
    }
  };

  const onDiagnostics = (cb: (d: Diagnostic[], optimizer: Optimizer, srcDir: string) => void) => {
    diagnosticsCallback = cb;
  };

  const normalizePath = (id: string) => {
    if (typeof id === 'string') {
      const sys = getSys();
      if (sys.os === 'win32') {
        // MIT https://github.com/sindresorhus/slash/blob/main/license
        // Convert Windows backslash paths to slash paths: foo\\bar ➔ foo/bar
        const isExtendedLengthPath = /^\\\\\?\\/.test(id);
        if (!isExtendedLengthPath) {
          const hasNonAscii = /[^\u0000-\u0080]+/.test(id); // eslint-disable-line no-control-regex
          if (!hasNonAscii) {
            id = id.replace(/\\/g, '/');
          }
        }
        // windows normalize
        return sys.path.posix.normalize(id);
      }
      // posix normalize
      return sys.path.normalize(id);
    }
    return id;
  };

  function getQwikBuildModule(loadOpts: { ssr?: boolean }, target: QwikBuildTarget) {
    const isServer = !!loadOpts.ssr || target === 'test';
    const isDev = opts.buildMode === 'development';
    return `// @builder.io/qwik/build
export const isServer = ${JSON.stringify(isServer)};
export const isBrowser = ${JSON.stringify(!isServer)};
export const isDev = ${JSON.stringify(isDev)};
`;
  }

  async function getQwikServerManifestModule(loadOpts: { ssr?: boolean }) {
    const isServer = opts.target === 'ssr' || !!loadOpts.ssr;
    const manifest = isServer ? opts.manifestInput : null;
    return `// @qwik-client-manifest
export const manifest = ${JSON.stringify(manifest)};\n`;
  }

  async function isPathExist(path: string) {
    const sys = getSys();
    if (sys.env === 'node') {
      const fs: typeof import('fs') = await sys.dynamicImport('node:fs');

      return fs.existsSync(path);
    }
    return false;
  }

  return {
    buildStart,
    createOutputAnalyzer,
    getQwikBuildModule,
    getOptimizer,
    getOptions,
    getPath,
    getSys,
    getTransformedOutputs,
    init,
    load,
    log,
    normalizeOptions,
    normalizePath,
    onDiagnostics,
    resolveId,
    transform,
    validateSource,
  };
}

const insideRoots = (ext: string, dir: string, srcDir: string | null, vendorRoots: string[]) => {
  if (ext !== '.js') {
    return false;
  }
  if (srcDir != null && dir.startsWith(srcDir)) {
    return true;
  }
  for (const root of vendorRoots) {
    if (dir.startsWith(root)) {
      return true;
    }
  }
  return false;
};

export function parseId(originalId: string) {
  const [pathId, query] = originalId.split('?');
  const queryStr = query || '';
  return {
    originalId,
    pathId,
    query: queryStr ? `?${query}` : '',
    params: new URLSearchParams(queryStr),
  };
}

const TRANSFORM_EXTS: { [ext: string]: boolean } = {
  '.jsx': true,
  '.ts': true,
  '.tsx': true,
};

const RESOLVE_EXTS: { [ext: string]: boolean } = {
  '.tsx': true,
  '.ts': true,
  '.jsx': true,
  '.js': true,
  '.mjs': true,
  '.cjs': true,
};

const TRANSFORM_REGEX = /\.qwik\.[mc]?js$/;

export const QWIK_CORE_ID = '@builder.io/qwik';

export const QWIK_BUILD_ID = '@builder.io/qwik/build';

export const QWIK_JSX_RUNTIME_ID = '@builder.io/qwik/jsx-runtime';

export const QWIK_JSX_DEV_RUNTIME_ID = '@builder.io/qwik/jsx-dev-runtime';

export const QWIK_CORE_SERVER = '@builder.io/qwik/server';

export const QWIK_CLIENT_MANIFEST_ID = '@qwik-client-manifest';

export const SRC_DIR_DEFAULT = 'src';

export const CLIENT_OUT_DIR = 'dist';

export const SSR_OUT_DIR = 'server';

const LIB_OUT_DIR = 'lib';

export const Q_MANIFEST_FILENAME = 'q-manifest.json';

export interface QwikPluginOptions {
  buildMode?: QwikBuildMode;
  debug?: boolean;
  entryStrategy?: EntryStrategy;
  forceFullBuild?: boolean;
  rootDir?: string;
  tsconfigFileNames?: string[];
  vendorRoots?: string[];
  manifestOutput?: ((manifest: QwikManifest) => Promise<void> | void) | null;
  manifestInput?: QwikManifest | null;
  input?: string[] | string | { [entry: string]: string };
  outDir?: string;
  srcDir?: string | null;
  scope?: string | null;
  srcInputs?: TransformModuleInput[] | null;
  resolveQwikBuild?: boolean;
  target?: QwikBuildTarget;
  transformedModuleOutput?:
    | ((transformedModules: TransformModule[]) => Promise<void> | void)
    | null;
  devTools?: {
    clickToSource?: string[] | false;
  };
}

export interface NormalizedQwikPluginOptions extends Required<QwikPluginOptions> {
  input: string[];
}

/**
 * @public
 */
export type QwikBuildTarget = 'client' | 'ssr' | 'lib' | 'test';

/**
 * @public
 */
export type QwikBuildMode = 'production' | 'development';
