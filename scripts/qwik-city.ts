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
    buildAdapterFastlyVite(config),
    buildAdapterCloudRunVite(config),
    buildAdapterDenoVite(config),
    buildAdapterBunVite(config),
    buildAdapterNodeServerVite(config),
    buildAdapterNetlifyEdgeVite(config),
    buildAdapterSharedVite(config),
    buildAdapterStaticVite(config),
    buildAdapterVercelEdgeVite(config),
    buildMiddlewareCloudflarePages(config),
    buildMiddlewareFastly(config),
    buildMiddlewareNetlifyEdge(config),
    buildMiddlewareAzureSwa(config),
    buildMiddlewareDeno(config),
    buildMiddlewareBun(config),
    buildMiddlewareNode(config),
    buildMiddlewareRequestHandler(config),
    buildMiddlewareVercelEdge(config),
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
    exports: {
      '.': {
        types: './index.d.ts',
        import: './index.qwik.mjs',
        require: './index.qwik.cjs',
      },
      './adapters/azure-swa/vite': {
        types: './adapters/azure-swa/vite/index.d.ts',
        import: './adapters/azure-swa/vite/index.mjs',
        require: './adapters/azure-swa/vite/index.cjs',
      },
      './adapters/cloudflare-pages/vite': {
        types: './adapters/cloudflare-pages/vite/index.d.ts',
        import: './adapters/cloudflare-pages/vite/index.mjs',
        require: './adapters/cloudflare-pages/vite/index.cjs',
      },
      './adapters/fastly/vite': {
        types: './adapters/fastly/vite/index.d.ts',
        import: './adapters/fastly/vite/index.mjs',
        require: './adapters/fastly/vite/index.cjs',
      },
      './adapters/cloud-run/vite': {
        types: './adapters/cloud-run/vite/index.d.ts',
        import: './adapters/cloud-run/vite/index.mjs',
        require: './adapters/cloud-run/vite/index.cjs',
      },
      './adapters/bun-server/vite': {
        types: './adapters/bun-server/vite/index.d.ts',
        import: './adapters/bun-server/vite/index.mjs',
        require: './adapters/bun-server/vite/index.cjs',
      },
      './adapters/deno-server/vite': {
        types: './adapters/deno-server/vite/index.d.ts',
        import: './adapters/deno-server/vite/index.mjs',
        require: './adapters/deno-server/vite/index.cjs',
      },
      './adapters/node-server/vite': {
        types: './adapters/node-server/vite/index.d.ts',
        import: './adapters/node-server/vite/index.mjs',
        require: './adapters/node-server/vite/index.cjs',
      },
      './adapters/netlify-edge/vite': {
        types: './adapters/netlify-edge/vite/index.d.ts',
        import: './adapters/netlify-edge/vite/index.mjs',
        require: './adapters/netlify-edge/vite/index.cjs',
      },
      './adapters/shared/vite': {
        types: './adapters/shared/vite/index.d.ts',
        import: './adapters/shared/vite/index.mjs',
        require: './adapters/shared/vite/index.cjs',
      },
      './adapters/static/vite': {
        types: './adapters/static/vite/index.d.ts',
        import: './adapters/static/vite/index.mjs',
        require: './adapters/static/vite/index.cjs',
      },
      './adapters/vercel-edge/vite': {
        types: './adapters/vercel-edge/vite/index.d.ts',
        import: './adapters/vercel-edge/vite/index.mjs',
        require: './adapters/vercel-edge/vite/index.cjs',
      },
      './middleware/azure-swa': {
        types: './middleware/azure-swa/index.d.ts',
        import: './middleware/azure-swa/index.mjs',
      },
      './middleware/cloudflare-pages': {
        types: './middleware/cloudflare-pages/index.d.ts',
        import: './middleware/cloudflare-pages/index.mjs',
      },
      './middleware/fastly': {
        types: './middleware/fastly/index.d.ts',
        import: './middleware/fastly/index.mjs',
      },
      './middleware/firebase': {
        types: './middleware/firebase/index.d.ts',
        import: './middleware/firebase/index.mjs',
      },
      './middleware/deno': {
        types: './middleware/deno/index.d.ts',
        import: './middleware/deno/index.mjs',
      },
      './middleware/bun': {
        types: './middleware/bun/index.d.ts',
        import: './middleware/bun/index.mjs',
      },
      './middleware/netlify-edge': {
        types: './middleware/netlify-edge/index.d.ts',
        import: './middleware/netlify-edge/index.mjs',
      },
      './middleware/node': {
        types: './middleware/node/index.d.ts',
        import: './middleware/node/index.mjs',
        require: './middleware/node/index.cjs',
      },
      './middleware/request-handler': {
        types: './middleware/request-handler/index.d.ts',
        import: './middleware/request-handler/index.mjs',
        require: './middleware/request-handler/index.cjs',
      },
      './middleware/vercel-edge': {
        types: './middleware/vercel-edge/index.d.ts',
        import: './middleware/vercel-edge/index.mjs',
      },
      './static': {
        types: './static/index.d.ts',
        import: './static/index.mjs',
        require: './static/index.cjs',
      },
      './vite': {
        types: './vite/index.d.ts',
        import: './vite/index.mjs',
        require: './vite/index.cjs',
      },
      './service-worker': {
        types: './service-worker.d.ts',
        import: './service-worker.mjs',
        require: './service-worker.cjs',
      },
    },
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

async function buildAdapterFastlyVite(config: BuildConfig) {
  const entryPoints = [join(config.srcQwikCityDir, 'adapters', 'fastly', 'vite', 'index.ts')];

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'adapters', 'fastly', 'vite', 'index.mjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'esm',
    external: ADAPTER_EXTERNALS,
    plugins: [resolveAdapterShared('../../shared/vite/index.mjs')],
  });

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'adapters', 'fastly', 'vite', 'index.cjs'),
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
  const entryPoints = [join(config.srcQwikCityDir, 'adapters', 'vercel-edge', 'vite', 'index.ts')];

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'adapters', 'vercel-edge', 'vite', 'index.mjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'esm',
    external: ADAPTER_EXTERNALS,
    plugins: [resolveAdapterShared('../../shared/vite/index.mjs')],
  });

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'adapters', 'vercel-edge', 'vite', 'index.cjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'cjs',
    external: ADAPTER_EXTERNALS,
    plugins: [resolveAdapterShared('../../shared/vite/index.cjs')],
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

async function buildMiddlewareFastly(config: BuildConfig) {
  const entryPoints = [join(config.srcQwikCityDir, 'middleware', 'fastly', 'index.ts')];

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'middleware', 'fastly', 'index.mjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'esm',
    external: [...MIDDLEWARE_EXTERNALS, 'fastly:*'],
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
  const entryPoints = [join(config.srcQwikCityDir, 'middleware', 'vercel-edge', 'index.ts')];

  await build({
    entryPoints,
    outfile: join(config.distQwikCityPkgDir, 'middleware', 'vercel-edge', 'index.mjs'),
    bundle: true,
    platform: 'node',
    target: nodeTarget,
    format: 'esm',
    external: MIDDLEWARE_EXTERNALS,
    plugins: [resolveRequestHandler('../request-handler/index.mjs')],
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
