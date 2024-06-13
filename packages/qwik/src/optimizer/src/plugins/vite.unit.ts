import path, { resolve } from 'node:path';
import { convertManifestToBundleGraph, qwikVite } from './vite';
import type { OptimizerOptions, QwikBundle, QwikManifest } from '../types';
import type { Rollup } from 'vite';
import { normalizePath } from '../../../testing/util';
import { assert, test, suite, expect } from 'vitest';

const cwd = process.cwd();

function mockOptimizerOptions(): OptimizerOptions {
  return {
    sys: {
      cwd: () => process.cwd(),
      env: 'node',
      os: process.platform,
      dynamicImport: async (path) => import(path),
      strictDynamicImport: async (path) => import(path),
      path: path as any,
    },
    binding: { mockBinding: true },
  };
}

const includeDeps = undefined;
const noExternal = [
  '@builder.io/qwik',
  '@builder.io/qwik/server',
  '@builder.io/qwik/build',
  '@builder.io/qwik-city',
];

const excludeDeps = [
  '@vite/client',
  '@vite/env',
  'node-fetch',
  'undici',
  '@builder.io/qwik',
  '@builder.io/qwik/server',
  '@builder.io/qwik/jsx-runtime',
  '@builder.io/qwik/jsx-dev-runtime',
  '@builder.io/qwik/build',
  '@qwik-client-manifest',
  '@builder.io/qwik-city',
];

test('command: serve, mode: development', async () => {
  const initOpts = {
    optimizerOptions: mockOptimizerOptions(),
  };
  const plugin = qwikVite(initOpts);
  const c = (await plugin.config({}, { command: 'serve', mode: 'development' }))!;
  const opts = await plugin.api?.getOptions();
  const build = c.build!;
  const rollupOptions = build!.rollupOptions!;
  const outputOptions = rollupOptions.output as Rollup.OutputOptions;

  assert.deepEqual(opts.target, 'client');
  assert.deepEqual(opts.buildMode, 'development');
  assert.deepEqual(opts.entryStrategy, { type: 'hook' });
  assert.deepEqual(opts.debug, false);

  assert.deepEqual(build.outDir, normalizePath(resolve(cwd, 'dist')));
  assert.deepEqual(rollupOptions.input, normalizePath(resolve(cwd, 'src', 'entry.dev')));
  assert.deepEqual(outputOptions.assetFileNames, 'assets/[hash]-[name].[ext]');
  assert.deepEqual(outputOptions.chunkFileNames, 'build/[name].js');
  assert.deepEqual(outputOptions.entryFileNames, 'build/[name].js');
  assert.deepEqual(outputOptions.format, 'es');
  assert.deepEqual(build.dynamicImportVarsOptions?.exclude, [/./]);
  assert.deepEqual(build.ssr, undefined);
  assert.deepEqual(c.optimizeDeps?.include, includeDeps);
  assert.deepEqual(c.optimizeDeps?.exclude, excludeDeps);

  assert.deepEqual(c.esbuild, false);
  assert.deepEqual(c.ssr, {
    noExternal,
  });
});

test('command: serve, mode: production', async () => {
  const initOpts = {
    optimizerOptions: mockOptimizerOptions(),
  };
  const plugin = qwikVite(initOpts);
  const c = (await plugin.config({}, { command: 'serve', mode: 'production' }))!;
  const opts = await plugin.api?.getOptions();
  const build = c.build!;
  const rollupOptions = build!.rollupOptions!;
  const outputOptions = rollupOptions.output as Rollup.OutputOptions;

  assert.deepEqual(opts.target, 'client');
  assert.deepEqual(opts.buildMode, 'production');
  assert.deepEqual(opts.entryStrategy, { type: 'hook' });
  assert.deepEqual(opts.debug, false);
  assert.deepEqual(opts.resolveQwikBuild, true);

  assert.deepEqual(build.outDir, normalizePath(resolve(cwd, 'dist')));
  assert.deepEqual(build.emptyOutDir, undefined);
  assert.deepEqual(rollupOptions.input, normalizePath(resolve(cwd, 'src', 'entry.dev')));
  assert.deepEqual(outputOptions.assetFileNames, 'assets/[hash]-[name].[ext]');
  assert.deepEqual(outputOptions.chunkFileNames, 'build/q-[hash].js');
  assert.deepEqual(outputOptions.entryFileNames, 'build/q-[hash].js');
  assert.deepEqual(outputOptions.format, 'es');
  assert.deepEqual(build.dynamicImportVarsOptions?.exclude, [/./]);
  assert.deepEqual(build.ssr, undefined);
  assert.deepEqual(c.optimizeDeps?.include, includeDeps);
  assert.deepEqual(c.optimizeDeps?.exclude, excludeDeps);
  assert.deepEqual(c.esbuild, false);
  assert.deepEqual(c.ssr, {
    noExternal,
  });
});

test('command: build, mode: development', async () => {
  const initOpts = {
    optimizerOptions: mockOptimizerOptions(),
  };
  const plugin = qwikVite(initOpts);
  const c = (await plugin.config({}, { command: 'build', mode: 'development' }))!;
  const opts = await plugin.api?.getOptions();
  const build = c.build!;
  const rollupOptions = build!.rollupOptions!;
  const outputOptions = rollupOptions.output as Rollup.OutputOptions;

  assert.deepEqual(opts.target, 'client');
  assert.deepEqual(opts.buildMode, 'development');
  assert.deepEqual(opts.entryStrategy, { type: 'hook' });
  assert.deepEqual(opts.debug, false);
  assert.deepEqual(opts.resolveQwikBuild, true);

  assert.deepEqual(plugin.enforce, 'pre');
  assert.deepEqual(build.outDir, normalizePath(resolve(cwd, 'dist')));
  assert.deepEqual(build.emptyOutDir, undefined);
  assert.deepEqual(rollupOptions.input, [normalizePath(resolve(cwd, 'src', 'root'))]);
  assert.deepEqual(outputOptions.assetFileNames, 'assets/[hash]-[name].[ext]');
  assert.deepEqual(outputOptions.chunkFileNames, 'build/[name].js');
  assert.deepEqual(outputOptions.entryFileNames, 'build/[name].js');
  assert.deepEqual(build.dynamicImportVarsOptions?.exclude, [/./]);
  assert.deepEqual(build.ssr, undefined);
  assert.deepEqual(c.optimizeDeps?.include, includeDeps);
  assert.deepEqual(c.optimizeDeps?.exclude, excludeDeps);
  assert.deepEqual(c.esbuild, {
    logLevel: 'error',
    jsx: 'automatic',
  });
  assert.deepEqual(c.ssr, {
    noExternal,
  });
});

test('command: build, mode: production', async () => {
  const initOpts = {
    optimizerOptions: mockOptimizerOptions(),
  };
  const plugin = qwikVite(initOpts);
  const c = (await plugin.config({}, { command: 'build', mode: 'production' }))!;
  const opts = await plugin.api?.getOptions();
  const build = c.build!;
  const rollupOptions = build!.rollupOptions!;
  const outputOptions = rollupOptions.output as Rollup.OutputOptions;

  assert.deepEqual(opts.target, 'client');
  assert.deepEqual(opts.buildMode, 'production');
  assert.deepEqual(opts.entryStrategy, { type: 'smart' });
  assert.deepEqual(opts.debug, false);
  assert.deepEqual(opts.resolveQwikBuild, true);

  assert.deepEqual(plugin.enforce, 'pre');
  assert.deepEqual(build.outDir, normalizePath(resolve(cwd, 'dist')));
  assert.deepEqual(build.emptyOutDir, undefined);
  assert.deepEqual(rollupOptions.input, [normalizePath(resolve(cwd, 'src', 'root'))]);
  assert.deepEqual(outputOptions.assetFileNames, 'assets/[hash]-[name].[ext]');
  assert.deepEqual(outputOptions.chunkFileNames, 'build/q-[hash].js');
  assert.deepEqual(outputOptions.entryFileNames, 'build/q-[hash].js');
  assert.deepEqual(build.outDir, normalizePath(resolve(cwd, 'dist')));
  assert.deepEqual(build.dynamicImportVarsOptions?.exclude, [/./]);
  assert.deepEqual(build.ssr, undefined);
  assert.deepEqual(c.optimizeDeps?.include, includeDeps);
  assert.deepEqual(c.optimizeDeps?.exclude, excludeDeps);
  assert.deepEqual(c.esbuild, {
    logLevel: 'error',
    jsx: 'automatic',
  });
  assert.deepEqual(c.ssr, {
    noExternal,
  });
});

test('command: build, --mode production (client)', async () => {
  const initOpts = {
    optimizerOptions: mockOptimizerOptions(),
    client: {
      devInput: resolve(cwd, 'src', 'dev.entry.tsx'),
      outDir: resolve(cwd, 'client-dist'),
    },
  };

  const plugin = qwikVite(initOpts);
  const c: any = (await plugin.config({}, { command: 'build', mode: 'production' }))!;
  const opts = await plugin.api?.getOptions();
  const build = c.build!;
  const rollupOptions = build!.rollupOptions!;
  assert.deepEqual(opts.resolveQwikBuild, true);

  assert.deepEqual(opts.target, 'client');
  assert.deepEqual(opts.buildMode, 'production');
  assert.deepEqual(rollupOptions.input, [normalizePath(resolve(cwd, 'src', 'root'))]);
  assert.deepEqual(build.outDir, normalizePath(resolve(cwd, 'client-dist')));
  assert.deepEqual(build.emptyOutDir, undefined);
});

test('command: build, --ssr entry.server.tsx', async () => {
  const initOpts = {
    optimizerOptions: mockOptimizerOptions(),
  };
  const plugin = qwikVite(initOpts);
  const c = (await plugin.config(
    { build: { ssr: resolve(cwd, 'src', 'entry.server.tsx') } },
    { command: 'build', mode: '' }
  ))!;
  const opts = await plugin.api?.getOptions();
  const build = c.build!;
  const rollupOptions = build!.rollupOptions!;
  const outputOptions = rollupOptions.output as Rollup.OutputOptions;

  assert.deepEqual(opts.target, 'ssr');
  assert.deepEqual(opts.buildMode, 'development');
  assert.deepEqual(opts.entryStrategy, { type: 'hoist' });
  assert.deepEqual(opts.debug, false);
  assert.deepEqual(opts.resolveQwikBuild, true);

  assert.deepEqual(plugin.enforce, 'pre');
  assert.deepEqual(build.outDir, normalizePath(resolve(cwd, 'server')));
  assert.deepEqual(build.emptyOutDir, undefined);
  assert.deepEqual(rollupOptions.input, [normalizePath(resolve(cwd, 'src', 'entry.server.tsx'))]);
  assert.deepEqual(outputOptions.assetFileNames, 'assets/[hash]-[name].[ext]');
  assert.deepEqual(outputOptions.chunkFileNames, undefined);
  assert.deepEqual(outputOptions.entryFileNames, undefined);
  assert.deepEqual(build.outDir, normalizePath(resolve(cwd, 'server')));
  assert.deepEqual(build.dynamicImportVarsOptions?.exclude, [/./]);
  assert.deepEqual(build.ssr, true);
  assert.deepEqual(c.optimizeDeps?.include, includeDeps);
  assert.deepEqual(c.optimizeDeps?.exclude, excludeDeps);
  assert.deepEqual(c.esbuild, {
    logLevel: 'error',
    jsx: 'automatic',
  });
  assert.deepEqual(c.publicDir, false);
});

test('command: serve, --mode ssr', async () => {
  const initOpts = {
    optimizerOptions: mockOptimizerOptions(),
    ssr: {
      input: resolve(cwd, 'src', 'renderz.tsx'),
      outDir: resolve(cwd, 'ssr-dist'),
    },
  };
  const plugin = qwikVite(initOpts);
  const c: any = (await plugin.config(
    { build: { emptyOutDir: true } },
    { command: 'serve', mode: 'ssr' }
  ))!;
  const opts = await plugin.api?.getOptions();
  const build = c.build!;
  const rollupOptions = build!.rollupOptions!;

  assert.deepEqual(opts.target, 'ssr');
  assert.deepEqual(opts.buildMode, 'development');
  assert.deepEqual(build.minify, undefined);
  assert.deepEqual(build.ssr, undefined);
  assert.deepEqual(rollupOptions.input, [normalizePath(resolve(cwd, 'src', 'renderz.tsx'))]);
  assert.deepEqual(c.build.outDir, normalizePath(resolve(cwd, 'ssr-dist')));
  assert.deepEqual(build.emptyOutDir, undefined);
  assert.deepEqual(c.publicDir, undefined);
  assert.deepEqual(opts.resolveQwikBuild, true);
});

test('command: serve, --mode ssr with build.assetsDir', async () => {
  const initOpts = {
    optimizerOptions: mockOptimizerOptions(),
    ssr: {
      input: resolve(cwd, 'src', 'renderz.tsx'),
      outDir: resolve(cwd, 'ssr-dist'),
    },
  };
  const plugin = qwikVite(initOpts);
  const c: any = (await plugin.config(
    { build: { emptyOutDir: true, assetsDir: 'my-assets-dir' } },
    { command: 'serve', mode: 'ssr' }
  ))!;
  const opts = await plugin.api?.getOptions();
  const build = c.build!;
  const rollupOptions = build!.rollupOptions!;

  assert.deepEqual(opts.target, 'ssr');
  assert.deepEqual(opts.buildMode, 'development');
  assert.deepEqual(build.minify, undefined);
  assert.deepEqual(build.ssr, undefined);
  assert.deepEqual(rollupOptions.input, [normalizePath(resolve(cwd, 'src', 'renderz.tsx'))]);
  assert.deepEqual(c.build.outDir, normalizePath(resolve(cwd, 'ssr-dist')));
  assert.deepEqual(build.emptyOutDir, undefined);
  assert.deepEqual(c.publicDir, undefined);
  assert.deepEqual(opts.resolveQwikBuild, true);
});

test('should use build.assetsDir config with dist/ fallback', async () => {
  const initOpts = {
    optimizerOptions: mockOptimizerOptions(),
  };
  const plugin = qwikVite(initOpts);
  const c: any = (await plugin.config(
    { build: { assetsDir: 'my-assets-dir/' } },
    { command: 'serve', mode: 'ssr' }
  ))!;

  assert.equal(c.build.outDir, normalizePath(resolve(cwd, `dist/my-assets-dir`)));
});

test('should use build.outDir and build.assetsDir config ', async () => {
  const initOpts = {
    optimizerOptions: mockOptimizerOptions(),
  };
  const plugin = qwikVite(initOpts);
  const c: any = (await plugin.config(
    { build: { outDir: 'my-dist/', assetsDir: 'my-assets-dir' } },
    { command: 'serve', mode: 'ssr' }
  ))!;

  assert.equal(c.build.outDir, normalizePath(resolve(cwd, `my-dist/my-assets-dir`)));
});

test('command: build, --mode lib', async () => {
  const initOpts = {
    optimizerOptions: mockOptimizerOptions(),
  };
  const plugin = qwikVite(initOpts);
  const c: any = (await plugin.config(
    {
      build: {
        lib: {
          entry: './src/index.ts',
          formats: ['es', 'cjs'],
        },
      },
    },
    { command: 'build', mode: 'lib' }
  ))!;
  const opts = await plugin.api?.getOptions();
  const build = c.build!;
  const rollupOptions = build!.rollupOptions!;

  assert.deepEqual(opts.target, 'lib');
  assert.deepEqual(opts.buildMode, 'development');
  assert.deepEqual(build.minify, false);
  assert.deepEqual(build.ssr, undefined);
  assert.deepEqual(rollupOptions.input, [normalizePath(resolve(cwd, 'src', 'index.ts'))]);
  assert.deepEqual(c.build.outDir, normalizePath(resolve(cwd, 'lib')));
  assert.deepEqual(build.emptyOutDir, undefined);
  assert.deepEqual(opts.resolveQwikBuild, true);
});

suite('convertManifestToBundleGraph', () => {
  test('empty', () => {
    expect(convertManifestToBundleGraph({} as any)).toEqual([]);
  });

  test('simple file set', () => {
    const manifest = {
      bundles: {
        'a.js': {
          size: 0,
          imports: ['b.js'],
          dynamicImports: ['c.js'],
        },
        'b.js': {
          size: 0,
          dynamicImports: ['c.js'],
        },
        'c.js': {
          size: 0,
        },
      } as Record<string, QwikBundle>,
    } as QwikManifest;
    expect(convertManifestToBundleGraph(manifest)).toEqual(['a.js', 3, 5, 'b.js', 5, 'c.js']);
  });
});
