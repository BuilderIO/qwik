import { build, BuildOptions, Plugin } from 'esbuild';
import { join } from 'path';
import {
  BuildConfig,
  banner,
  importPath,
  injectGlobalThisPoly,
  nodeBuiltIns,
  nodeTarget,
  PackageJSON,
  target,
  watcher,
  injectGlobalPoly,
} from './util';
import { inlineQwikScriptsEsBuild } from './submodule-qwikloader';
import { readPackageJson, writePackageJson } from './package-json';

/**
 * Builds @builder.io/server
 *
 * This is submodule for helping to generate server-side rendered pages,
 * along with providing utilities for prerendering and unit testing.
 */
export async function submoduleServer(config: BuildConfig) {
  const submodule = 'server';

  const dominoPlugin = await bundleDomino(config);

  const opts: BuildOptions = {
    entryPoints: [join(config.srcDir, submodule, 'index.ts')],
    outdir: join(config.distPkgDir, submodule),
    sourcemap: config.dev,
    bundle: true,
    target,
    banner,
    external: [...nodeBuiltIns, 'domino'],
    define: {
      ...(await inlineQwikScriptsEsBuild(config)),
      'globalThis.QWIK_VERSION': JSON.stringify(config.distVersion),
      'globalThis.DOMINO_VERSION': JSON.stringify(await getDominoVersion()),
    },
  };

  const esm = build({
    ...opts,
    format: 'esm',
    outExtension: { '.js': '.mjs' },
    plugins: [
      importPath(/^@builder\.io\/qwik$/, '../core.mjs'),
      importPath(/^@builder\.io\/qwik\/optimizer$/, '../optimizer.mjs'),
      dominoPlugin,
    ],
    watch: watcher(config, submodule),
    inject: [injectGlobalPoly(config)],
  });

  const cjs = build({
    ...opts,
    format: 'cjs',
    outExtension: { '.js': '.cjs' },
    plugins: [
      importPath(/^@builder\.io\/qwik$/, '../core.cjs'),
      importPath(/^@builder\.io\/qwik\/optimizer$/, '../optimizer.cjs'),
      dominoPlugin,
    ],
    watch: watcher(config),
    platform: 'node',
    target: nodeTarget,
    inject: [injectGlobalThisPoly(config), injectGlobalPoly(config)],
  });

  await Promise.all([esm, cjs]);
  await generateServerPackageJson(config);

  console.log('🐰', submodule);
}

async function generateServerPackageJson(config: BuildConfig) {
  const pkg: PackageJSON = {
    name: '@builder.io/qwik/server',
    version: config.distVersion,
    main: 'index.cjs',
    module: 'index.mjs',
    types: 'index.d.ts',
    private: true,
  };
  const serverDistDir = join(config.distPkgDir, 'server');
  await writePackageJson(serverDistDir, pkg);
}

async function bundleDomino(config: BuildConfig) {
  const outfile = join(config.distDir, 'domino.mjs');

  const opts: BuildOptions = {
    entryPoints: [require.resolve('domino')],
    sourcemap: false,
    minify: true,
    bundle: true,
    target,
    outfile,
    format: 'esm',
    plugins: [
      {
        name: 'sloppyDomino',
        setup(build) {
          build.onLoad({ filter: /.*sloppy\.js/ }, (args) => {
            return {
              // esm modules cannot use `with` statement
              // and questionable if this feature is needed for ssr
              contents: `
              module.exports={
                Window_run:function _run(){},
                EventHandlerBuilder_build:function build(){}
              };`,
            };
          });
        },
      },
    ],
  };

  await build(opts);

  const dominoPlugin: Plugin = {
    name: 'dominoPlugin',
    setup(build) {
      build.onResolve({ filter: /domino/ }, () => {
        return {
          path: outfile,
        };
      });
    },
  };

  return dominoPlugin;
}

async function getDominoVersion() {
  const indexPath = require.resolve('domino');
  const pkgJsonPath = join(indexPath, '..', '..');
  const pkgJson = await readPackageJson(pkgJsonPath);
  return pkgJson.version;
}
