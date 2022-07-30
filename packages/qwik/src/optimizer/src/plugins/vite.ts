import type { Plugin as VitePlugin, UserConfig, ViteDevServer } from 'vite';
import type {
  EntryStrategy,
  GlobalInjections,
  OptimizerOptions,
  OptimizerSystem,
  QwikManifest,
  TransformModule,
} from '../types';
import type { Render, RenderToStreamOptions } from '../../../server';
import {
  createPlugin,
  NormalizedQwikPluginOptions,
  parseId,
  QwikBuildMode,
  QwikPluginOptions,
  QwikBuildTarget,
  QWIK_CORE_ID,
  Q_MANIFEST_FILENAME,
  QWIK_CLIENT_MANIFEST_ID,
  QWIK_BUILD_ID,
  QwikPackages,
  QWIK_JSX_RUNTIME_ID,
} from './plugin';
import { createRollupError, normalizeRollupOutputOptions } from './rollup';
import { QWIK_LOADER_DEFAULT_DEBUG, QWIK_LOADER_DEFAULT_MINIFIED } from '../scripts';
import { versions } from '../versions';

const DEDUPE = [QWIK_CORE_ID, QWIK_JSX_RUNTIME_ID];

/**
 * @alpha
 */
export function qwikVite(qwikViteOpts: QwikVitePluginOptions = {}): any {
  let isClientDevOnly = false;
  let clientDevInput: undefined | string = undefined;
  let tmpClientManifestPath: undefined | string = undefined;
  let viteCommand: 'build' | 'serve' = 'serve';
  const injections: GlobalInjections[] = [];
  const qwikPlugin = createPlugin(qwikViteOpts.optimizerOptions);

  const vitePlugin: VitePlugin = {
    name: 'vite-plugin-qwik',

    enforce: 'pre',

    api: {
      getOptimizer: () => qwikPlugin.getOptimizer(),
      getOptions: () => qwikPlugin.getOptions(),
    },

    async config(viteConfig, viteEnv) {
      await qwikPlugin.init();

      const sys = qwikPlugin.getSys();
      const path = qwikPlugin.getPath();

      qwikPlugin.log(`vite config(), command: ${viteEnv.command}, env.mode: ${viteEnv.mode}`);

      isClientDevOnly = viteEnv.command === 'serve' && viteEnv.mode !== 'ssr';
      viteCommand = viteEnv.command;

      let target: QwikBuildTarget;
      if (viteConfig.build?.ssr || viteEnv.mode === 'ssr') {
        target = 'ssr';
      } else if (viteEnv.mode === 'lib') {
        target = 'lib';
      } else {
        target = 'client';
      }

      let buildMode: QwikBuildMode;
      if (viteEnv.mode === 'production') {
        buildMode = 'production';
      } else if (viteEnv.mode === 'development') {
        buildMode = 'development';
      } else if (viteEnv.command === 'build' && target === 'client') {
        // build (production)
        buildMode = 'production';
      } else {
        // serve (development)
        buildMode = 'development';
      }

      let forceFullBuild = true;
      if (viteEnv.command === 'serve') {
        qwikViteOpts.entryStrategy = { type: 'hook' };
        forceFullBuild = false;
      } else {
        forceFullBuild = true;
      }

      const shouldFindVendors = target === 'client' || viteCommand === 'serve';
      const vendorRoots = shouldFindVendors
        ? await findQwikRoots(sys, path.join(sys.cwd(), 'package.json'))
        : [];
      const pluginOpts: QwikPluginOptions = {
        target,
        buildMode,
        debug: qwikViteOpts.debug,
        entryStrategy: qwikViteOpts.entryStrategy,
        rootDir: viteConfig.root,
        resolveQwikBuild: viteEnv.command === 'build',
        transformedModuleOutput: qwikViteOpts.transformedModuleOutput,
        forceFullBuild,
        vendorRoots: vendorRoots.map((v) => v.path),
      };

      if (viteEnv.command === 'serve') {
        qwikViteOpts.entryStrategy = { type: 'hook' };
      }
      if (target === 'ssr') {
        // ssr
        if (typeof viteConfig.build?.ssr === 'string') {
          // from --ssr flag user config
          // entry.server.tsx (express/cloudflare/netlify)
          pluginOpts.input = viteConfig.build.ssr;
        } else {
          // entry.ssr.tsx input (exports render())
          pluginOpts.input = qwikViteOpts.ssr?.input;
        }

        pluginOpts.outDir = qwikViteOpts.ssr?.outDir;
        pluginOpts.manifestInput = qwikViteOpts.ssr?.manifestInput;
      } else if (target === 'client') {
        // client
        pluginOpts.input = qwikViteOpts.client?.input;
        pluginOpts.outDir = qwikViteOpts.client?.outDir;
        pluginOpts.manifestOutput = qwikViteOpts.client?.manifestOutput;
      } else {
        if (typeof viteConfig.build?.lib === 'object') {
          pluginOpts.input = viteConfig.build?.lib.entry;
        }
        pluginOpts.outDir = viteConfig.build?.outDir;
      }

      if (sys.env === 'node') {
        const fs: typeof import('fs') = await sys.dynamicImport('fs');

        try {
          const rootDir = pluginOpts.rootDir ?? sys.cwd();
          const packageJsonPath = sys.path.join(rootDir, 'package.json');
          const pkgString = await fs.promises.readFile(packageJsonPath, 'utf-8');

          try {
            const data = JSON.parse(pkgString);

            if (typeof data.name === 'string') {
              pluginOpts.scope = data.name;
            }
          } catch (e) {
            console.error(e);
          }
        } catch (e) {
          // error reading package.json from nodejs fs, ok to ignore
        }

        // In a NodeJs environment, create a path to a q-manifest.json file within the
        // OS tmp directory. This path should always be the same for both client and ssr.
        // Client build will write to this path, and SSR will read from it. For this reason,
        // the Client build should always start and finish before the SSR build.
        const nodeOs: typeof import('os') = await sys.dynamicImport('os');
        tmpClientManifestPath = path.join(nodeOs.tmpdir(), `vite-plugin-qwik-q-manifest.json`);

        if (target === 'ssr' && !pluginOpts.manifestInput) {
          // This is a SSR build so we should load the client build's manifest
          // so it can be used as the manifestInput of the SSR build
          try {
            const clientManifestStr = await fs.promises.readFile(tmpClientManifestPath, 'utf-8');
            pluginOpts.manifestInput = JSON.parse(clientManifestStr);
          } catch (e) {
            /**/
          }
        }
      }

      const opts = qwikPlugin.normalizeOptions(pluginOpts);

      if (typeof qwikViteOpts.client?.devInput === 'string') {
        clientDevInput = path.resolve(opts.rootDir, qwikViteOpts.client.devInput);
      } else {
        if (opts.srcDir) {
          clientDevInput = path.resolve(opts.srcDir, CLIENT_DEV_INPUT);
        } else {
          clientDevInput = path.resolve(opts.rootDir, 'src', CLIENT_DEV_INPUT);
        }
      }
      clientDevInput = qwikPlugin.normalizePath(clientDevInput);

      const vendorIds = vendorRoots.map((v) => v.id);
      const updatedViteConfig: UserConfig = {
        resolve: {
          dedupe: [...DEDUPE, ...vendorIds],
          conditions: [],
        },
        optimizeDeps: {
          exclude: [
            '@vite/client',
            '@vite/env',
            QWIK_CORE_ID,
            QWIK_JSX_RUNTIME_ID,
            QWIK_BUILD_ID,
            QWIK_CLIENT_MANIFEST_ID,
            ...vendorIds,
          ],
        },
        build: {
          outDir: opts.outDir,
          rollupOptions: {
            input: opts.input,
            preserveEntrySignatures: 'exports-only',
            output: normalizeRollupOutputOptions(path, opts, {}),
            treeshake: {
              moduleSideEffects: false,
            },
            onwarn: (warning, warn) => {
              if (
                warning.plugin === 'typescript' &&
                warning.message.includes('outputToFilesystem')
              ) {
                return;
              }
              warn(warning);
            },
          },
          polyfillModulePreload: false,
          dynamicImportVarsOptions: {
            exclude: [/./],
          },
        },
      };

      if (opts.target === 'ssr') {
        // SSR Build
        if (viteCommand === 'serve') {
          updatedViteConfig.ssr = {
            noExternal: vendorIds,
          };
        } else {
          updatedViteConfig.publicDir = false;
          updatedViteConfig.build!.ssr = true;
        }
      } else if (opts.target === 'client') {
        if (buildMode === 'production') {
          updatedViteConfig.resolve!.conditions = ['min'];
        }
        // Client Build
        if (isClientDevOnly) {
          updatedViteConfig.build!.rollupOptions!.input = clientDevInput;
        }
      }

      return updatedViteConfig;
    },

    async buildStart() {
      await qwikPlugin.validateSource();

      qwikPlugin.onAddWatchFile((ctx, path) => {
        ctx.addWatchFile(path);
      });

      qwikPlugin.onDiagnostics((diagnostics, optimizer) => {
        diagnostics.forEach((d) => {
          if (d.category === 'error') {
            this.error(createRollupError(optimizer, d));
          } else {
            this.warn(createRollupError(optimizer, d));
          }
        });
      });

      await qwikPlugin.buildStart(this);
    },

    resolveId(id, importer, resolveIdOpts) {
      if (id.startsWith('\0')) {
        return null;
      }
      if (isClientDevOnly && id === VITE_CLIENT_MODULE) {
        return id;
      }
      return qwikPlugin.resolveId(this, id, importer, resolveIdOpts);
    },

    load(id, loadOpts) {
      if (id.startsWith('\0')) {
        return null;
      }

      id = qwikPlugin.normalizePath(id);
      const opts = qwikPlugin.getOptions();

      if (isClientDevOnly && id === VITE_CLIENT_MODULE) {
        return getViteDevModule(opts);
      }
      if (viteCommand === 'serve' && id.endsWith(QWIK_CLIENT_MANIFEST_ID)) {
        return {
          code: 'export const manifest = undefined;',
        };
      }
      return qwikPlugin.load(this, id, loadOpts);
    },

    transform(code, id) {
      if (id.startsWith('\0')) {
        return null;
      }
      if (isClientDevOnly) {
        const parsedId = parseId(id);
        if (parsedId.params.has(VITE_DEV_CLIENT_QS)) {
          code = updateEntryDev(code);
        }
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
          } else {
            if (fileName.endsWith('.css')) {
              injections.push({
                tag: 'link',
                location: 'head',
                attributes: {
                  rel: 'stylesheet',
                  href: `/${fileName}`,
                },
              });
            }
          }
        }

        for (const i of injections) {
          outputAnalyzer.addInjection(i);
        }

        const optimizer = qwikPlugin.getOptimizer();
        const manifest = await outputAnalyzer.generateManifest();
        manifest.platform = {
          ...versions,
          vite: '',
          rollup: this.meta?.rollupVersion || '',
          env: optimizer.sys.env,
          os: optimizer.sys.os,
        };
        if (optimizer.sys.env === 'node') {
          manifest.platform.node = process.versions.node;
        }

        const clientManifestStr = JSON.stringify(manifest, null, 2);
        this.emitFile({
          type: 'asset',
          fileName: Q_MANIFEST_FILENAME,
          source: clientManifestStr,
        });

        if (typeof opts.manifestOutput === 'function') {
          await opts.manifestOutput(manifest);
        }

        if (typeof opts.transformedModuleOutput === 'function') {
          await opts.transformedModuleOutput(qwikPlugin.getTransformedOutputs());
        }

        const sys = qwikPlugin.getSys();
        if (tmpClientManifestPath && sys.env === 'node') {
          // Client build should write the manifest to a tmp dir
          const fs: typeof import('fs') = await sys.dynamicImport('fs');
          await fs.promises.writeFile(tmpClientManifestPath, clientManifestStr);
        }
      }
    },

    async configureServer(server: ViteDevServer) {
      const opts = qwikPlugin.getOptions();
      const sys = qwikPlugin.getSys();
      const path = qwikPlugin.getPath();

      qwikPlugin.log(`configureServer(), entry module: ${clientDevInput}`);

      if (typeof fetch !== 'function' && sys.env === 'node') {
        // polyfill fetch() when not available in NodeJS
        qwikPlugin.log(`configureServer(), patch fetch()`);

        try {
          if (!globalThis.fetch) {
            const nodeFetch = await sys.strictDynamicImport('node-fetch');
            global.fetch = nodeFetch;
            global.Headers = nodeFetch.Headers;
            global.Request = nodeFetch.Request;
            global.Response = nodeFetch.Response;
          }
        } catch {
          console.warn('Global fetch() was not installed');
          // Nothing
        }
      }

      server.middlewares.use(async (req, res, next) => {
        const domain = 'http://' + (req.headers.host ?? 'localhost');
        const url = new URL(req.originalUrl!, domain);
        const pathname = url.pathname;

        const hasExtension = /\.[\w?=&]+$/.test(pathname);
        const isViteMod = pathname.startsWith('/@') || url.href.includes('?html-proxy');
        const isVitePing = url.href.includes('__vite_ping');
        const skipSSR = url.href.includes('ssr=false');

        if (hasExtension || isViteMod || isVitePing || skipSSR) {
          next();
          return;
        }

        try {
          if (req.headers.accept && req.headers.accept.includes('text/html')) {
            const userContext: Record<string, any> = {
              ...(res as QwikViteDevResponse)._qwikUserCtx,
            };

            const status = typeof res.statusCode === 'number' ? res.statusCode : 200;
            if (isClientDevOnly) {
              qwikPlugin.log(`handleClientEntry("${url}")`);

              const relPath = path.relative(opts.rootDir, clientDevInput!);
              const entryUrl = '/' + qwikPlugin.normalizePath(relPath);

              let html = getViteDevIndexHtml(entryUrl, userContext);
              html = await server.transformIndexHtml(pathname, html);

              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.setHeader('Cache-Control', 'no-cache, no-store, max-age=0');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('X-Powered-By', 'Qwik Vite Dev Server');
              res.writeHead(status);

              res.end(html);
              return;
            }

            qwikPlugin.log(`handleSSR("${url}"), ssr input: ${opts.input[0]}`);

            const ssrModule = await server.ssrLoadModule(opts.input[0], {
              fixStacktrace: true,
            });

            const render: Render = ssrModule.default ?? ssrModule.render;

            if (typeof render === 'function') {
              const manifest: QwikManifest = {
                symbols: {},
                mapping: {},
                bundles: {},
                injections: [],
                version: '1',
              };

              Array.from(server.moduleGraph.fileToModulesMap.entries()).forEach((entry) => {
                entry[1].forEach((v) => {
                  const hook = v.info?.meta?.hook;
                  let url = v.url;
                  if (v.lastHMRTimestamp) {
                    url += `?t=${v.lastHMRTimestamp}`;
                  }
                  if (hook) {
                    manifest.mapping[hook.name] = url;
                  }

                  const { pathId, query } = parseId(v.url);
                  if (query === '' && pathId.endsWith('.css')) {
                    manifest.injections!.push({
                      tag: 'link',
                      location: 'head',
                      attributes: {
                        rel: 'stylesheet',
                        href: url,
                      },
                    });
                  }
                });
              });

              qwikPlugin.log(`handleSSR()`, 'symbols', manifest);

              const renderOpts: RenderToStreamOptions = {
                url: url.href,
                debug: true,
                stream: res,
                snapshot: !isClientDevOnly,
                manifest: isClientDevOnly ? undefined : manifest,
                symbolMapper: isClientDevOnly
                  ? undefined
                  : (symbolName, mapper) => {
                      if (mapper) {
                        const hash = getSymbolHash(symbolName);
                        return mapper[hash];
                      }
                    },
                prefetchStrategy: null,
                userContext,
              };

              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.setHeader('Cache-Control', 'no-cache, no-store, max-age=0');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('X-Powered-By', 'Qwik Vite Dev Server');
              res.writeHead(status);

              const result = await render(renderOpts);
              if ('html' in result) {
                res.end((result as any).html);
              } else {
                res.end();
              }
            } else {
              next();
            }
          } else {
            next();
          }
        } catch (e: any) {
          next(e);
        }
      });
    },

    handleHotUpdate(ctx) {
      qwikPlugin.log('handleHotUpdate()', ctx);

      if (ctx.file.endsWith('.css')) {
        qwikPlugin.log('handleHotUpdate()', 'force css reload');

        ctx.server.ws.send({
          type: 'full-reload',
        });
        return [];
      }
    },
  };

  return vitePlugin;
}

function getViteDevIndexHtml(entryUrl: string, userContext: Record<string, any>) {
  return `<!DOCTYPE html>
<html>
  <head>
  </head>
  <body>
    <script type="module">
    async function main() {
      const mod = await import("${entryUrl}?${VITE_DEV_CLIENT_QS}=");
      if (mod.default) {
        const userContext = JSON.parse(${JSON.stringify(JSON.stringify(userContext))})
        mod.default({
          userContext,
        });
      }
    }
    main();
    </script>
  </body>
</html>`;
}

function updateEntryDev(code: string) {
  code = code.replace(/("|')@builder.io\/qwik("|')/g, `'${VITE_CLIENT_MODULE}'`);
  return code;
}

function getViteDevModule(opts: NormalizedQwikPluginOptions) {
  const qwikLoader = JSON.stringify(
    opts.debug ? QWIK_LOADER_DEFAULT_DEBUG : QWIK_LOADER_DEFAULT_MINIFIED
  );

  return `// Qwik Vite Dev Module
import { render as qwikRender } from '@builder.io/qwik';

export async function render(document, rootNode, opts) {

  await qwikRender(document, rootNode, opts);

  let qwikLoader = document.getElementById('qwikloader');
  if (!qwikLoader) {
    qwikLoader = document.createElement('script');
    qwikLoader.id = 'qwikloader';
    qwikLoader.innerHTML = ${qwikLoader};
    document.head.appendChild(qwikLoader);
  }

  if (!window.__qwikViteLog) {
    window.__qwikViteLog = true;
    console.debug("%c⭐️ Qwik Dev Mode","background: #0c75d2; color: white; padding: 2px 3px; border-radius: 2px; font-size: 0.8em;","Do not use this mode in production!\\n - No portion of the application is pre-rendered on the server\\n - All of the application is running eagerly in the browser\\n - Optimizer/Serialization/Deserialization code is not exercised!");
  }
}`;
}

const getSymbolHash = (symbolName: string) => {
  const index = symbolName.lastIndexOf('_');
  if (index > -1) {
    return symbolName.slice(index + 1);
  }
  return symbolName;
};

const findQwikRoots = async (
  sys: OptimizerSystem,
  packageJsonPath: string
): Promise<QwikPackages[]> => {
  if (sys.env === 'node') {
    const fs: typeof import('fs') = await sys.dynamicImport('fs');
    const { resolvePackageData }: typeof import('vite') = await sys.strictDynamicImport('vite');

    try {
      const data = await fs.promises.readFile(packageJsonPath, { encoding: 'utf-8' });

      try {
        const packageJson = JSON.parse(data);
        const dependencies = packageJson['dependencies'];
        const devDependencies = packageJson['devDependencies'];

        const packages: string[] = [];
        if (typeof dependencies === 'object') {
          packages.push(...Object.keys(dependencies));
        }
        if (typeof devDependencies === 'object') {
          packages.push(...Object.keys(devDependencies));
        }

        const basedir = sys.cwd();
        const qwikDirs = packages
          .map((id) => {
            const pkgData = resolvePackageData(id, basedir);
            if (pkgData) {
              const qwikPath = pkgData.data['qwik'];
              if (qwikPath) {
                return {
                  id,
                  path: sys.path.resolve(pkgData.dir, qwikPath),
                };
              }
            }
          })
          .filter(isNotNullable);
        return qwikDirs;
      } catch (e) {
        console.error(e);
      }
    } catch (e) {
      // ignore errors if root package.json not found
    }
  }
  return [];
};

export const isNotNullable = <T>(v: T): v is NonNullable<T> => {
  return v != null;
};

const VITE_CLIENT_MODULE = `@builder.io/qwik/vite-client`;
const VITE_DEV_CLIENT_QS = `qwik-vite-dev-client`;
const CLIENT_DEV_INPUT = 'entry.dev.tsx';

/**
 * @alpha
 */
export interface QwikVitePluginOptions {
  /**
   * Prints verbose Qwik plugin debug logs.
   * Default `false`
   */
  debug?: boolean;
  /**
   * The Qwik entry strategy to use while bunding for production.
   * During development the type is always `hook`.
   * Default `{ type: "smart" }`)
   */
  entryStrategy?: EntryStrategy;
  /**
   * The source directory to find all the Qwik components. Since Qwik
   * does not have a single input, the `srcDir` is use to recursively
   * find Qwik files.
   * Default `src`
   */
  srcDir?: string;
  client?: {
    /**
     * The entry point for the client builds. Typically this would be
     * the application's main component.
     * Default `src/components/app/app.tsx`
     */
    input?: string[] | string;
    /**
     * Entry input for client-side only development with hot-module reloading.
     * This is for Vite development only and does not use SSR.
     * Default `src/entry.dev.tsx`
     */
    devInput?: string;
    /**
     * Output directory for the client build.
     * Default `dist`
     */
    outDir?: string;
    /**
     * The client build will create a manifest and this hook
     * is called with the generated build data.
     * Default `undefined`
     */
    manifestOutput?: (manifest: QwikManifest) => Promise<void> | void;
  };
  ssr?: {
    /**
     * The entry point for the SSR renderer. This file should export
     * a `render()` function. This entry point and `render()` export
     * function is also used for Vite's SSR development and Nodejs
     * debug mode.
     * Default `src/entry.ssr.tsx`
     */
    input?: string;
    /**
     * Output directory for the server build.
     * Default `dist`
     */
    outDir?: string;
    /**
     * The SSR build requires the manifest generated during the client build.
     * By default, this plugin will wire the client manifest to the ssr build.
     * However, the `manifestInput` option can be used to manually provide a manifest.
     * Default `undefined`
     */
    manifestInput?: QwikManifest;
  };
  optimizerOptions?: OptimizerOptions;
  /**
   * Hook that's called after the build and provides all of the transformed
   * modules that were used before bundling.
   */
  transformedModuleOutput?:
    | ((transformedModules: TransformModule[]) => Promise<void> | void)
    | null;
}

export interface QwikViteDevResponse {
  _qwikUserCtx?: Record<string, any>;
}
