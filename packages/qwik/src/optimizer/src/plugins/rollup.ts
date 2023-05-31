import type { Rollup } from 'vite';

import type {
  Diagnostic,
  EntryStrategy,
  OptimizerOptions,
  QwikManifest,
  TransformModuleInput,
  Path,
  TransformModule,
} from '../types';
import {
  createPlugin,
  type NormalizedQwikPluginOptions,
  type QwikBuildMode,
  type QwikBuildTarget,
  type QwikPluginOptions,
  Q_MANIFEST_FILENAME,
} from './plugin';
import { versions } from '../versions';

/**
 * @public
 */
export function qwikRollup(qwikRollupOpts: QwikRollupPluginOptions = {}): any {
  const qwikPlugin = createPlugin(qwikRollupOpts.optimizerOptions);

  const rollupPlugin: QwikRollupPlugin = {
    name: 'rollup-plugin-qwik',

    api: {
      getOptimizer: () => qwikPlugin.getOptimizer(),
      getOptions: () => qwikPlugin.getOptions(),
    },

    async options(inputOpts) {
      await qwikPlugin.init();

      inputOpts.onwarn = (warning, warn) => {
        if (warning.plugin === 'typescript' && warning.message.includes('outputToFilesystem')) {
          return;
        }
        warn(warning);
      };

      const pluginOpts: QwikPluginOptions = {
        target: qwikRollupOpts.target,
        buildMode: qwikRollupOpts.buildMode,
        debug: qwikRollupOpts.debug,
        forceFullBuild: qwikRollupOpts.forceFullBuild ?? true,
        entryStrategy: qwikRollupOpts.entryStrategy,
        rootDir: qwikRollupOpts.rootDir,
        srcDir: qwikRollupOpts.srcDir,
        srcInputs: qwikRollupOpts.srcInputs,
        input: inputOpts.input as string,
        resolveQwikBuild: true,
        manifestOutput: qwikRollupOpts.manifestOutput,
        manifestInput: qwikRollupOpts.manifestInput,
        transformedModuleOutput: qwikRollupOpts.transformedModuleOutput,
      };

      const opts = await qwikPlugin.normalizeOptions(pluginOpts);

      if (!inputOpts.input) {
        inputOpts.input = opts.input;
      }

      return inputOpts;
    },

    outputOptions(rollupOutputOpts) {
      return normalizeRollupOutputOptions(
        qwikPlugin.getPath(),
        qwikPlugin.getOptions(),
        rollupOutputOpts
      );
    },

    async buildStart() {
      qwikPlugin.onDiagnostics((diagnostics, optimizer, srcDir) => {
        diagnostics.forEach((d) => {
          const id = qwikPlugin.normalizePath(optimizer.sys.path.join(srcDir, d.file));
          if (d.category === 'error') {
            this.error(createRollupError(id, d));
          } else {
            this.warn(createRollupError(id, d));
          }
        });
      });

      await qwikPlugin.buildStart(this);
    },

    resolveId(id, importer) {
      if (id.startsWith('\0')) {
        return null;
      }
      return qwikPlugin.resolveId(this, id, importer);
    },

    load(id) {
      if (id.startsWith('\0')) {
        return null;
      }
      return qwikPlugin.load(this, id);
    },

    transform(code, id) {
      if (id.startsWith('\0')) {
        return null;
      }
      return qwikPlugin.transform(this, code, id);
    },

    async generateBundle(_, rollupBundle) {
      const opts = qwikPlugin.getOptions();

      if (opts.target === 'client') {
        // client build
        const outputAnalyzer = qwikPlugin.createOutputAnalyzer();

        for (const fileName in rollupBundle) {
          const b = rollupBundle[fileName];
          if (b.type === 'chunk') {
            outputAnalyzer.addBundle({
              fileName,
              modules: b.modules,
              imports: b.imports,
              dynamicImports: b.dynamicImports,
              size: b.code.length,
            });
          }
        }

        const optimizer = qwikPlugin.getOptimizer();
        const manifest = await outputAnalyzer.generateManifest();
        manifest.platform = {
          ...versions,
          rollup: this.meta?.rollupVersion || '',
          env: optimizer.sys.env,
          os: optimizer.sys.os,
        };
        if (optimizer.sys.env === 'node') {
          manifest.platform.node = process.versions.node;
        }

        if (typeof opts.manifestOutput === 'function') {
          await opts.manifestOutput(manifest);
        }

        if (typeof opts.transformedModuleOutput === 'function') {
          await opts.transformedModuleOutput(qwikPlugin.getTransformedOutputs());
        }

        this.emitFile({
          type: 'asset',
          fileName: Q_MANIFEST_FILENAME,
          source: JSON.stringify(manifest, null, 2),
        });
      }
    },
  };

  return rollupPlugin;
}

export function normalizeRollupOutputOptions(
  path: Path,
  opts: NormalizedQwikPluginOptions,
  rollupOutputOpts: Rollup.OutputOptions | Rollup.OutputOptions[] | undefined
) {
  const outputOpts: Rollup.OutputOptions = {};
  if (rollupOutputOpts && !Array.isArray(rollupOutputOpts)) {
    Object.assign(outputOpts, rollupOutputOpts);
  }
  if (opts.target === 'ssr') {
    // ssr output
    if (opts.buildMode === 'production') {
      if (!outputOpts.assetFileNames) {
        outputOpts.assetFileNames = 'build/q-[hash].[ext]';
      }
    }
  } else if (opts.target === 'client') {
    // client output

    if (opts.buildMode === 'production') {
      // client production output
      if (!outputOpts.entryFileNames) {
        outputOpts.entryFileNames = 'build/q-[hash].js';
      }
      if (!outputOpts.assetFileNames) {
        outputOpts.assetFileNames = 'build/q-[hash].[ext]';
      }
      if (!outputOpts.chunkFileNames) {
        outputOpts.chunkFileNames = 'build/q-[hash].js';
      }
    } else {
      // client development output
      if (!outputOpts.entryFileNames) {
        outputOpts.entryFileNames = 'build/[name].js';
      }
      if (!outputOpts.assetFileNames) {
        outputOpts.assetFileNames = 'build/[name].[ext]';
      }
      if (!outputOpts.chunkFileNames) {
        outputOpts.chunkFileNames = 'build/[name].js';
      }
    }
  }

  if (opts.target === 'client') {
    // client should always be es
    outputOpts.format = 'es';
  }

  if (!outputOpts.dir) {
    outputOpts.dir = opts.outDir;
  }

  if (outputOpts.format === 'cjs' && typeof outputOpts.exports !== 'string') {
    outputOpts.exports = 'auto';
  }

  return outputOpts;
}

export function createRollupError(id: string, diagnostic: Diagnostic) {
  const loc = diagnostic.highlights[0] ?? {};
  const err: Rollup.RollupError = Object.assign(new Error(diagnostic.message), {
    id,
    plugin: 'qwik',
    loc: {
      column: loc.startCol,
      line: loc.startLine,
    },
    stack: '',
  });
  return err;
}

/**
 * @public
 */
export interface QwikRollupPluginOptions {
  /**
   * Build `production` or `development`.
   * Default `development`
   */
  buildMode?: QwikBuildMode;
  /**
   * Target `client` or `ssr`.
   * Default `client`
   */
  target?: QwikBuildTarget;
  /**
   * Prints verbose Qwik plugin debug logs.
   * Default `false`
   */
  debug?: boolean;
  /**
   * The Qwik entry strategy to use while building for production.
   * During development the type is always `hook`.
   * Default `{ type: "smart" }`)
   */
  entryStrategy?: EntryStrategy;
  forceFullBuild?: boolean;
  /**
   * The source directory to find all the Qwik components. Since Qwik
   * does not have a single input, the `srcDir` is used to recursively
   * find Qwik files.
   * Default `src`
   */
  srcDir?: string;
  /**
   * Alternative to `srcDir`, where `srcInputs` is able to provide the
   * files manually. This option is useful for an environment without
   * a file system, such as a webworker.
   * Default: `null`
   */
  srcInputs?: TransformModuleInput[] | null;
  /**
   * The root of the application, which is commonly the same
   * directory as `package.json` and `rollup.config.js`.
   * Default `process.cwd()`
   */
  rootDir?: string;
  /**
   * The client build will create a manifest and this hook
   * is called with the generated build data.
   * Default `undefined`
   */
  manifestOutput?: (manifest: QwikManifest) => Promise<void> | void;
  /**
   * The SSR build requires the manifest generated during the client build.
   * The `manifestInput` option can be used to manually provide a manifest.
   * Default `undefined`
   */
  manifestInput?: QwikManifest;
  optimizerOptions?: OptimizerOptions;
  /**
   * Hook that's called after the build and provides all of the transformed
   * modules that were used before bundling.
   */
  transformedModuleOutput?:
    | ((transformedModules: TransformModule[]) => Promise<void> | void)
    | null;
}

export interface QwikRollupPlugin extends Rollup.Plugin {}
