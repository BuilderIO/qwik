import path, { resolve } from 'node:path';
import { suite } from 'uvu';
import type { QwikManifest } from '../types';
import { createPlugin } from './plugin';
import { equal } from 'uvu/assert';
import { normalizePath } from '../../../testing/util';

const cwd = process.cwd();
const test = suite('normalizeOptions');

test('defaults', async () => {
  const plugin = await mockPlugin();
  const opts = await plugin.normalizeOptions();
  equal(opts.target, 'client');
  equal(opts.buildMode, 'development');
  equal(opts.entryStrategy, { type: 'hook' });
  equal(opts.forceFullBuild, false);
  equal(opts.debug, false);
  equal(opts.rootDir, normalizePath(cwd));
  equal(opts.input, [normalizePath(resolve(cwd, 'src', 'root.tsx'))]);
  equal(opts.outDir, normalizePath(resolve(cwd, 'dist')));
  equal(opts.manifestInput, null);
  equal(opts.manifestOutput, null);
  equal(opts.srcDir, normalizePath(resolve(cwd, 'src')));
  equal(opts.srcInputs, null);
});

test('defaults (buildMode: production)', async () => {
  const plugin = await mockPlugin();
  const opts = await plugin.normalizeOptions({ buildMode: 'production' });
  equal(opts.target, 'client');
  equal(opts.buildMode, 'production');
  equal(opts.entryStrategy, { type: 'smart' });
  equal(opts.forceFullBuild, true);
  equal(opts.resolveQwikBuild, true);
  equal(opts.debug, false);
  equal(opts.rootDir, normalizePath(cwd));
  equal(opts.input, [normalizePath(resolve(cwd, 'src', 'root.tsx'))]);
  equal(opts.outDir, normalizePath(resolve(cwd, 'dist')));
  equal(opts.manifestInput, null);
  equal(opts.manifestOutput, null);
  equal(opts.srcDir, normalizePath(resolve(cwd, 'src')));
  equal(opts.srcInputs, null);
  equal(opts.entryStrategy, { type: 'smart' });
});

test('defaults (target: ssr)', async () => {
  const plugin = await mockPlugin();
  const opts = await plugin.normalizeOptions({ target: 'ssr' });
  equal(opts.target, 'ssr');
  equal(opts.buildMode, 'development');
  equal(opts.entryStrategy, { type: 'hoist' });
  equal(opts.forceFullBuild, false);
  equal(opts.resolveQwikBuild, true);
  equal(opts.debug, false);
  equal(opts.rootDir, normalizePath(cwd));
  equal(opts.input, [normalizePath(resolve(cwd, 'src', 'entry.ssr.tsx'))]);
  equal(opts.outDir, normalizePath(resolve(cwd, 'server')));
  equal(opts.manifestInput, null);
  equal(opts.manifestOutput, null);
  equal(opts.srcDir, normalizePath(resolve(cwd, 'src')));
  equal(opts.srcInputs, null);
});

test('defaults (buildMode: production, target: ssr)', async () => {
  const plugin = await mockPlugin();
  const opts = await plugin.normalizeOptions({ buildMode: 'production', target: 'ssr' });
  equal(opts.target, 'ssr');
  equal(opts.buildMode, 'production');
  equal(opts.entryStrategy, { type: 'hoist' });
  equal(opts.forceFullBuild, false);
  equal(opts.resolveQwikBuild, true);
  equal(opts.debug, false);
  equal(opts.rootDir, normalizePath(cwd));
  equal(opts.input, [normalizePath(resolve(cwd, 'src', 'entry.ssr.tsx'))]);
  equal(opts.outDir, normalizePath(resolve(cwd, 'server')));
  equal(opts.manifestInput, null);
  equal(opts.manifestOutput, null);
  equal(opts.srcDir, normalizePath(resolve(cwd, 'src')));
  equal(opts.srcInputs, null);
});

test('debug true', async () => {
  const plugin = await mockPlugin();
  const opts = await plugin.normalizeOptions({ debug: true });
  equal(opts.debug, true);
});

test('override entryStrategy', async () => {
  const plugin = await mockPlugin();
  const opts = await plugin.normalizeOptions({
    entryStrategy: { type: 'component' },
    buildMode: 'production',
  });
  equal(opts.entryStrategy.type, 'component');
});

test('entryStrategy, smart', async () => {
  const plugin = await mockPlugin();
  const opts = await plugin.normalizeOptions({
    entryStrategy: { type: 'smart' },
    forceFullBuild: false,
  });
  equal(opts.entryStrategy.type, 'smart');
  equal(opts.forceFullBuild, true);
});

test('entryStrategy, hook no forceFullBuild', async () => {
  const plugin = await mockPlugin();
  const opts = await plugin.normalizeOptions({ entryStrategy: { type: 'hook' } });
  equal(opts.entryStrategy.type, 'hook');
  equal(opts.forceFullBuild, false);
});

test('entryStrategy, hook and srcInputs', async () => {
  const plugin = await mockPlugin();
  const opts = await plugin.normalizeOptions({
    entryStrategy: { type: 'hook' },
    srcInputs: [],
  });
  equal(opts.entryStrategy.type, 'hook');
  equal(opts.forceFullBuild, true);
});

test('entryStrategy, forceFullBuild false', async () => {
  const plugin = await mockPlugin();
  const opts = await plugin.normalizeOptions({ forceFullBuild: false });
  equal(opts.forceFullBuild, false);
});

test('entryStrategy, forceFullBuild true', async () => {
  const plugin = await mockPlugin();
  const opts = await plugin.normalizeOptions({ forceFullBuild: true });
  equal(opts.forceFullBuild, true);
});

test('rootDir, abs path', async () => {
  const plugin = await mockPlugin();
  const customRoot = normalizePath(resolve(cwd, 'abs-path'));
  const opts = await plugin.normalizeOptions({ rootDir: customRoot });
  equal(opts.rootDir, customRoot);
});

test('rootDir, rel path', async () => {
  const plugin = await mockPlugin();
  const customRoot = 'rel-path';
  const opts = await plugin.normalizeOptions({ rootDir: customRoot });
  equal(opts.rootDir, normalizePath(resolve(cwd, customRoot)));
});

test('input string', async () => {
  const plugin = await mockPlugin();
  const opts = await plugin.normalizeOptions({ input: 'src/cmps/main.tsx' });
  equal(opts.input, [normalizePath(resolve(cwd, 'src', 'cmps', 'main.tsx'))]);
});

test('input array', async () => {
  const plugin = await mockPlugin();
  const opts = await plugin.normalizeOptions({
    input: ['src/cmps/a.tsx', 'src/cmps/b.tsx'],
  });
  equal(opts.input, [
    normalizePath(resolve(cwd, 'src', 'cmps', 'a.tsx')),
    normalizePath(resolve(cwd, 'src', 'cmps', 'b.tsx')),
  ]);
});

test('outDir', async () => {
  const plugin = await mockPlugin();
  const opts = await plugin.normalizeOptions({ outDir: 'out' });
  equal(opts.outDir, normalizePath(resolve(cwd, 'out')));
});

test('manifestOutput', async () => {
  const plugin = await mockPlugin();
  const manifestOutput = () => {};
  const opts = await plugin.normalizeOptions({ manifestOutput });
  equal(opts.manifestOutput, manifestOutput);
});

test('manifestInput', async () => {
  const plugin = await mockPlugin();
  const manifestInput: QwikManifest = { mapping: {}, symbols: {}, bundles: {}, version: '1' };
  const opts = await plugin.normalizeOptions({ manifestInput });
  equal(opts.manifestInput, manifestInput);
});

test('resolveQwikBuild true', async () => {
  const plugin = await mockPlugin();
  const opts = await plugin.normalizeOptions({ resolveQwikBuild: true });
  equal(opts.resolveQwikBuild, true);
});

test('resolveQwikBuild false', async () => {
  const plugin = await mockPlugin();
  const opts = await plugin.normalizeOptions({ resolveQwikBuild: false });
  equal(opts.resolveQwikBuild, false);
});

async function mockPlugin() {
  const plugin = createPlugin({
    sys: {
      cwd: () => process.cwd(),
      env: 'node',
      os: process.platform,
      dynamicImport: async (path) => import(path),
      strictDynamicImport: async (path) => import(path),
      path: path as any,
    },
    binding: { mockBinding: true },
  });
  await plugin.init();
  return plugin;
}

test.run();
