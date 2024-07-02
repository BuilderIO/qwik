import { build, type Plugin, transform } from 'esbuild';
import { execa } from 'execa';
import { copyFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { rollup } from 'rollup';
import { readPackageJson, writePackageJson } from './package-json';
import {
  type BuildConfig,
  emptyDir,
  importPath,
  nodeTarget,
  panic,
  type PackageJSON,
  recursiveChangePrefix,
} from './util';

export async function buildQwikCity(config: BuildConfig) {
  if (!config.dev) {
    emptyDir(config.distQwikCityPkgDir);
  }

  await Promise.all([
    buildServiceWorker(config),
    buildVite(config),
    buildAdapterAzureSwaVite(config),
    buildAdapterCloudflarePagesVite(config),
    buildAdapterCloudRunVite(config),
    buildAdapterDenoVite(config),
    buildAdapterBunVite(config),
    buildAdapterNodeServerVite(config),
    buildAdapterNetlifyEdgeVite(config),
    buildAdapterSharedVite(config),
    buildAdapterStaticVite(config),
    buildAdapterVercelEdgeVite(config),
    buildAdapterVercelServerlessVite(config),
    buildMiddlewareCloudflarePages(config),
    buildMiddlewareNetlifyEdge(config),
    buildMiddlewareAzureSwa(config),
    buildMiddlewareAwsLambda(config),
    buildMiddlewareDeno(config),
    buildMiddlewareBun(config),
    buildMiddlewareNode(config),
    buildMiddlewareRequestHandler(config),
    buildMiddlewareVercelEdge(config),
    buildMiddlewareVercelServerless(config),
    buildMiddlewareFirebase(config),
    buildStatic(config),
    buildStaticNode(config),
    buildStaticDeno(config),
  ]);

  await buildRuntime(config);

  let srcQwikCityPkg = await readPackageJson(config.srcQwikCityDir);

  const diskQwikCityPkg: PackageJSON = {
    ...srcQwikCityPkg,
    version: config.distVersion,
    main: './index.qwik.mjs',
    qwik: './index.qwik.mjs',
    types: './index.d.ts',
    type: 'module',
    exports: recursiveChangePrefix(srcQwikCityPkg.exports!, './lib/', './'),
    files: [
      'adapters',
      'index.d.ts',
      'index.qwik.mjs',
      'index.qwik.cjs',
      'service-worker.mjs',
      'service-worker.cjs',
      'service-worker.d.ts',
      'modules.d.ts',
      'middleware',
      'static',
      'vite',
    ],
    publishConfig: {
      access: 'public',
    },
    private: undefined,
    devDependencies: undefined,
    scripts: undefined,
  };
  await writePackageJson(config.distQwikCityPkgDir, diskQwikCityPkg);

  const srcReadmePath = join(config.srcQwikCityDir, 'README.md');
  const distReadmePath = join(config.distQwikCityPkgDir, 'README.md');
  await copyFile(srcReadmePath, distReadmePath);

  console.log(`🏙  qwik-city`);
}

async function buildRuntime(config: BuildConfig) {
  const execOptions = {
    win: {
      manager: 'npm',
      command: ['run', 'build'],
    },
    other: {
      manager: 'pnpm',
      command: ['build'],
    },
  };
  const isWindows = process.platform.includes('win32');
  const runOptions = isWindows ? execOptions.win : execOptions.other;

  const result = await execa(runOptions.manager, runOptions.command, {
    stdout: 'inherit',
    cwd: config.srcQwikCityDir,
  });
  if (result.failed) {
    panic(`tsc failed`);
  }
}

async function buildVite(config: BuildConfig) {
  const entryPoints = [join(config.srcQwikCityDir, 'buildtime', 'vite', 'index.ts')];

  const external = [
    'fs',
    'path',
    'url',
    'vite',
    'source-map',
    'vfile',
    '@mdx-js/mdx',
    'node-fetch',
    'undici',
    'typescript',
    'vite-imagetools',
    'svgo',
  ];

  const swRegisterPath = join(config.srcQwikCityDir, 'runtime', 'src', 'sw-register.ts');
  let swRegisterCode = await readFile(swRegisterPath, 'utf-8');

  const swResult = await transform(swRegisterCode, { loader: 'ts', minify: true });
  swRegisterCode = swResult.code.trim();
  if (swRegisterCode.endsWith(';')) {
    swRegisterCode = swRegisterCode.slice(0, swRegisterCode.length - 1);
  }

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'vite', 'index.mjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'esm',
    external,
    alias: {
      '@builder.io/qwik': 'noop',
      '@builder.io/qwik/optimizer': 'noop',
    },
    plugins: [serviceWorkerRegisterBuild(swRegisterCode)],
  });

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'vite', 'index.cjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'cjs',
    external,
    plugins: [serviceWorkerRegisterBuild(swRegisterCode)],
  });
}

function serviceWorkerRegisterBuild(swRegisterCode: string) {
  const filter = /\@qwik-city-sw-register-build/;

  const plugin: Plugin = {
    name: 'serviceWorkerRegisterBuild',
    setup(build) {
      build.onResolve({ filter }, (args) => ({
        path: args.path,
        namespace: 'sw-reg',
      }));
      build.onLoad({ filter: /.*/, namespace: 'sw-reg' }, () => ({
        contents: swRegisterCode,
        loader: 'text',
      }));
    },
  };
  return plugin;
}

async function buildServiceWorker(config: BuildConfig) {
  const build = await rollup({
    input: join(
      config.tscDir,
      'packages',
      'qwik-city',
      'runtime',
      'src',
      'service-worker',
      'index.js'
    ),
  });

  await build.write({
    file: join(config.distQwikCityPkgDir, 'service-worker.mjs'),
    format: 'es',
  });

  await build.write({
    file: join(config.distQwikCityPkgDir, 'service-worker.cjs'),
    format: 'cjs',
  });
}

async function buildAdapterAzureSwaVite(config: BuildConfig) {
  const entryPoints = [join(config.srcQwikCityDir, 'adapters', 'azure-swa', 'vite', 'index.ts')];

  const external = ['vite', 'fs', 'path', '@builder.io/qwik-city/static'];

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'adapters', 'azure-swa', 'vite', 'index.mjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'esm',
    external,
    plugins: [resolveAdapterShared('../../shared/vite/index.mjs')],
  });

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'adapters', 'azure-swa', 'vite', 'index.cjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'cjs',
    external,
    plugins: [resolveAdapterShared('../../shared/vite/index.cjs')],
  });
}

async function buildAdapterCloudflarePagesVite(config: BuildConfig) {
  const entryPoints = [
    join(config.srcQwikCityDir, 'adapters', 'cloudflare-pages', 'vite', 'index.ts'),
  ];

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'adapters', 'cloudflare-pages', 'vite', 'index.mjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'esm',
    external: ADAPTER_EXTERNALS,
    plugins: [resolveAdapterShared('../../shared/vite/index.mjs')],
  });

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'adapters', 'cloudflare-pages', 'vite', 'index.cjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'cjs',
    external: ADAPTER_EXTERNALS,
    plugins: [resolveAdapterShared('../../shared/vite/index.cjs')],
  });
}

async function buildAdapterCloudRunVite(config: BuildConfig) {
  const entryPoints = [join(config.srcQwikCityDir, 'adapters', 'cloud-run', 'vite', 'index.ts')];

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'adapters', 'cloud-run', 'vite', 'index.mjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'esm',
    external: ADAPTER_EXTERNALS,
    plugins: [resolveAdapterShared('../../shared/vite/index.mjs')],
  });

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'adapters', 'cloud-run', 'vite', 'index.cjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'cjs',
    external: ADAPTER_EXTERNALS,
    plugins: [resolveAdapterShared('../../shared/vite/index.cjs')],
  });
}

async function buildAdapterBunVite(config: BuildConfig) {
  const entryPoints = [join(config.srcQwikCityDir, 'adapters', 'bun-server', 'vite', 'index.ts')];

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'adapters', 'bun-server', 'vite', 'index.mjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'esm',
    external: ADAPTER_EXTERNALS,
    plugins: [resolveAdapterShared('../../shared/vite/index.mjs')],
  });

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'adapters', 'bun-server', 'vite', 'index.cjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'cjs',
    external: ADAPTER_EXTERNALS,
    plugins: [
      resolveAdapterShared('../../shared/vite/index.cjs'),
      resolveRequestHandler('../../../middleware/request-handler/index.cjs'),
    ],
  });
}

async function buildAdapterDenoVite(config: BuildConfig) {
  const entryPoints = [join(config.srcQwikCityDir, 'adapters', 'deno-server', 'vite', 'index.ts')];

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'adapters', 'deno-server', 'vite', 'index.mjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'esm',
    external: ADAPTER_EXTERNALS,
    plugins: [resolveAdapterShared('../../shared/vite/index.mjs')],
  });

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'adapters', 'deno-server', 'vite', 'index.cjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'cjs',
    external: ADAPTER_EXTERNALS,
    plugins: [
      resolveAdapterShared('../../shared/vite/index.cjs'),
      resolveRequestHandler('../../../middleware/request-handler/index.cjs'),
    ],
  });
}

async function buildAdapterNodeServerVite(config: BuildConfig) {
  const entryPoints = [join(config.srcQwikCityDir, 'adapters', 'node-server', 'vite', 'index.ts')];

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'adapters', 'node-server', 'vite', 'index.mjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'esm',
    external: ADAPTER_EXTERNALS,
    plugins: [resolveAdapterShared('../../shared/vite/index.mjs')],
  });

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'adapters', 'node-server', 'vite', 'index.cjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'cjs',
    external: ADAPTER_EXTERNALS,
    plugins: [resolveAdapterShared('../../shared/vite/index.cjs')],
  });
}

async function buildAdapterNetlifyEdgeVite(config: BuildConfig) {
  const entryPoints = [join(config.srcQwikCityDir, 'adapters', 'netlify-edge', 'vite', 'index.ts')];

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'adapters', 'netlify-edge', 'vite', 'index.mjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'esm',
    external: ADAPTER_EXTERNALS,
    plugins: [resolveAdapterShared('../../shared/vite/index.mjs')],
  });

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'adapters', 'netlify-edge', 'vite', 'index.cjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'cjs',
    external: ADAPTER_EXTERNALS,
    plugins: [
      resolveAdapterShared('../../shared/vite/index.cjs'),
      resolveRequestHandler('../../../middleware/request-handler/index.cjs'),
    ],
  });
}

async function buildAdapterSharedVite(config: BuildConfig) {
  const entryPoints = [join(config.srcQwikCityDir, 'adapters', 'shared', 'vite', 'index.ts')];

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'adapters', 'shared', 'vite', 'index.mjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'esm',
    external: ADAPTER_EXTERNALS,
    plugins: [
      resolveStatic('../../../static/index.mjs'),
      resolveRequestHandler('../../../middleware/request-handler/index.mjs'),
    ],
  });

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'adapters', 'shared', 'vite', 'index.cjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'cjs',
    external: ADAPTER_EXTERNALS,
    plugins: [
      resolveStatic('../../../static/index.cjs'),
      resolveRequestHandler('../../../middleware/request-handler/index.cjs'),
    ],
  });
}

async function buildAdapterStaticVite(config: BuildConfig) {
  const entryPoints = [join(config.srcQwikCityDir, 'adapters', 'static', 'vite', 'index.ts')];

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'adapters', 'static', 'vite', 'index.mjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'esm',
    external: ADAPTER_EXTERNALS,
    plugins: [resolveStatic('../../../static/index.mjs')],
  });

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'adapters', 'static', 'vite', 'index.cjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'cjs',
    external: ADAPTER_EXTERNALS,
    plugins: [resolveStatic('../../../static/index.cjs')],
  });
}

async function buildAdapterVercelEdgeVite(config: BuildConfig) {
  const entryPoints = [join(config.srcQwikCityDir, 'adapters', 'vercel', 'edge', 'index.ts')];

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'adapters', 'vercel', 'edge', 'index.mjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'esm',
    external: ADAPTER_EXTERNALS,
    plugins: [resolveAdapterShared('../../vercel/edge/index.mjs')],
  });

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'adapters', 'vercel', 'edge', 'index.cjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'cjs',
    external: ADAPTER_EXTERNALS,
    plugins: [resolveAdapterShared('../../vercel/edge/index.cjs')],
  });
}

async function buildAdapterVercelServerlessVite(config: BuildConfig) {
  const entryPoints = [join(config.srcQwikCityDir, 'adapters', 'vercel', 'serverless', 'index.ts')];

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'adapters', 'vercel', 'serverless', 'index.mjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'esm',
    external: ADAPTER_EXTERNALS,
    plugins: [resolveAdapterShared('../../vercel/serverless/index.mjs')],
  });

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'adapters', 'vercel', 'serverless', 'index.cjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'cjs',
    external: ADAPTER_EXTERNALS,
    plugins: [resolveAdapterShared('../../vercel/serverless/index.cjs')],
  });
}

async function buildMiddlewareAzureSwa(config: BuildConfig) {
  const entryPoints = [join(config.srcQwikCityDir, 'middleware', 'azure-swa', 'index.ts')];

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'middleware', 'azure-swa', 'index.mjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'esm',
    external: MIDDLEWARE_EXTERNALS,
    plugins: [resolveRequestHandler('../request-handler/index.mjs')],
  });
}

async function buildMiddlewareAwsLambda(config: BuildConfig) {
  const entryPoints = [join(config.srcQwikCityDir, 'middleware', 'aws-lambda', 'index.ts')];

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'middleware', 'aws-lambda', 'index.mjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'esm',
    external: MIDDLEWARE_EXTERNALS,
    plugins: [resolveRequestHandler('../request-handler/index.mjs')],
  });
}

async function buildMiddlewareCloudflarePages(config: BuildConfig) {
  const entryPoints = [join(config.srcQwikCityDir, 'middleware', 'cloudflare-pages', 'index.ts')];

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'middleware', 'cloudflare-pages', 'index.mjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'esm',
    external: MIDDLEWARE_EXTERNALS,
    plugins: [resolveRequestHandler('../request-handler/index.mjs')],
  });
}

async function buildMiddlewareBun(config: BuildConfig) {
  const entryPoints = [join(config.srcQwikCityDir, 'middleware', 'bun', 'index.ts')];

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'middleware', 'bun', 'index.mjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'esm',
    external: MIDDLEWARE_EXTERNALS,
    plugins: [resolveRequestHandler('../request-handler/index.mjs')],
  });
}

async function buildMiddlewareDeno(config: BuildConfig) {
  const entryPoints = [join(config.srcQwikCityDir, 'middleware', 'deno', 'index.ts')];

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'middleware', 'deno', 'index.mjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'esm',
    external: MIDDLEWARE_EXTERNALS,
    plugins: [resolveRequestHandler('../request-handler/index.mjs')],
  });
}

async function buildMiddlewareNetlifyEdge(config: BuildConfig) {
  const entryPoints = [join(config.srcQwikCityDir, 'middleware', 'netlify-edge', 'index.ts')];

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'middleware', 'netlify-edge', 'index.mjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'esm',
    external: MIDDLEWARE_EXTERNALS,
    plugins: [resolveRequestHandler('../request-handler/index.mjs')],
  });
}

async function buildMiddlewareNode(config: BuildConfig) {
  const entryPoints = [join(config.srcQwikCityDir, 'middleware', 'node', 'index.ts')];

  const external = ['node-fetch', 'undici', 'path', 'os', 'fs', 'url', ...MIDDLEWARE_EXTERNALS];

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'middleware', 'node', 'index.mjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'esm',
    external,
    plugins: [resolveRequestHandler('../request-handler/index.mjs')],
  });

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'middleware', 'node', 'index.cjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'cjs',
    external,
    plugins: [resolveRequestHandler('../request-handler/index.cjs')],
  });
}

async function buildMiddlewareRequestHandler(config: BuildConfig) {
  const entryPoints = [join(config.srcQwikCityDir, 'middleware', 'request-handler', 'index.ts')];

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'middleware', 'request-handler', 'index.mjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'esm',
    external: MIDDLEWARE_EXTERNALS,
  });

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'middleware', 'request-handler', 'index.cjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'cjs',
    external: MIDDLEWARE_EXTERNALS,
  });
}

async function buildMiddlewareVercelEdge(config: BuildConfig) {
  const entryPoints = [join(config.srcQwikCityDir, 'middleware', 'vercel', 'edge', 'index.ts')];

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'middleware', 'vercel', 'edge', 'index.mjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'esm',
    external: MIDDLEWARE_EXTERNALS,
    plugins: [resolveRequestHandler('../request-handler/index.mjs')],
  });
}

async function buildMiddlewareVercelServerless(config: BuildConfig) {
  const entryPoints = [
    join(config.srcQwikCityDir, 'middleware', 'vercel', 'serverless', 'index.ts'),
  ];

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'middleware', 'vercel', 'serverless', 'index.mjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'esm',
    external: MIDDLEWARE_EXTERNALS,
    plugins: [resolveRequestHandler('../request-handler/index.mjs')],
  });

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'middleware', 'vercel', 'serverless', 'index.cjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'cjs',
    external: MIDDLEWARE_EXTERNALS,
    plugins: [resolveRequestHandler('../request-handler/index.cjs')],
  });
}

async function buildMiddlewareFirebase(config: BuildConfig) {
  const entryPoints = [join(config.srcQwikCityDir, 'middleware', 'firebase', 'index.ts')];

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'middleware', 'firebase', 'index.mjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'esm',
    external: MIDDLEWARE_EXTERNALS,
    plugins: [resolveRequestHandler('../request-handler/index.mjs')],
  });
}

async function buildStatic(config: BuildConfig) {
  const entryPoints = [join(config.srcQwikCityDir, 'static', 'index.ts')];

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'static', 'index.mjs'),
    bundle: true,
    platform: 'neutral',
    format: 'esm',
  });

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'static', 'index.cjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'cjs',
  });
}

async function buildStaticDeno(config: BuildConfig) {
  const entryPoints = [join(config.srcQwikCityDir, 'static', 'deno', 'index.ts')];

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'static', 'deno.mjs'),
    bundle: true,
    platform: 'neutral',
    format: 'esm',
    plugins: [resolveRequestHandler('../middleware/request-handler/index.mjs')],
  });
}

async function buildStaticNode(config: BuildConfig) {
  const entryPoints = [join(config.srcQwikCityDir, 'static', 'node', 'index.ts')];

  const external = [
    '@builder.io/qwik',
    '@builder.io/qwik/optimizer',
    '@builder.io/qwik-city',
    'fs',
    'http',
    'https',
    'node-fetch',
    'undici',
    'os',
    'path',
    'stream/web',
    'url',
    'worker_threads',
    'vite',
  ];

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'static', 'node.mjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'esm',
    external,
    plugins: [resolveRequestHandler('../middleware/request-handler/index.mjs')],
  });

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'static', 'node.cjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'cjs',
    external,
    plugins: [resolveRequestHandler('../middleware/request-handler/index.cjs')],
  });
}

function resolveRequestHandler(path: string) {
  return importPath(/middleware\/request-handler/, path);
}

function resolveStatic(path: string) {
  return importPath(/static$/, path);
}

function resolveAdapterShared(path: string) {
  return importPath(/shared\/vite$/, path);
}

const ADAPTER_EXTERNALS = [
  'vite',
  'fs',
  'path',
  '@builder.io/qwik',
  '@builder.io/qwik/server',
  '@builder.io/qwik/optimizer',
  '@builder.io/qwik-city',
  '@builder.io/qwik-city/static',
  '@builder.io/qwik-city/middleware/request-handler',
];

const MIDDLEWARE_EXTERNALS = [
  '@builder.io/qwik',
  '@builder.io/qwik/optimizer',
  '@builder.io/qwik/server',
  '@builder.io/qwik-city',
  '@builder.io/qwik-city/static',
  '@qwik-city-plan',
  '@qwik-city-not-found-paths',
  '@qwik-city-static-paths',
];
