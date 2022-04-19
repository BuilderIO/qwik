import { resolve } from 'path';
import { qwikVite, QwikViteOptions } from './vite';
import type { Plugin as VitePlugin } from 'vite';
import type { OptimizerOptions } from '../types';
import type { OutputOptions } from 'rollup';

describe('vite  plugin', () => {
  const cwd = process.cwd();
  let inputOpts: QwikViteOptions = {};

  beforeEach(() => {
    inputOpts = {
      optimizerOptions: mockOptimizerOptions(),
    };
  });

  describe('config', () => {
    it('command: serve, mode: client - defaults', async () => {
      const plugin: VitePlugin = qwikVite(inputOpts);
      const c = (await plugin.config!({}, { command: 'serve', mode: 'client' }))!;
      const opts = await plugin.api?.getOptions();
      const build = c.build!;
      const rollupOptions = build!.rollupOptions!;
      const outputOptions = rollupOptions.output as OutputOptions;

      expect(build.outDir).toBe(resolve(cwd, 'dist'));
      expect(rollupOptions.input).toEqual(resolve(cwd, 'src', 'main.tsx'));
      expect(outputOptions.assetFileNames).toBe('build/q-[hash].[ext]');
      expect(outputOptions.chunkFileNames).toBe('build/q-[hash].js');
      expect(build.polyfillModulePreload).toBe(false);
      expect(build.dynamicImportVarsOptions?.exclude).toEqual([/./]);
      expect(build.ssr).toBe(undefined);
      expect(build.emptyOutDir).toBe(undefined);
      expect(c.optimizeDeps?.include).toEqual(['@builder.io/qwik', '@builder.io/qwik/jsx-runtime']);
      expect(c.esbuild).toEqual({ include: /\.js$/ });
      expect((c as any).ssr).toBeUndefined();

      expect(opts.debug).toBe(false);
      expect(opts.isDevBuild).toBe(true);
      expect(opts.isClientOnly).toBe(true);
      expect(opts.isSSRBuild).toBe(false);
      expect(opts.entryStrategy).toEqual({ type: 'hook' });
    });

    it('command: build, mode: client - defaults', async () => {
      const plugin: VitePlugin = qwikVite(inputOpts);
      const c = (await plugin.config!({}, { command: 'build', mode: 'client' }))!;
      const opts = await plugin.api?.getOptions();
      const build = c.build!;
      const rollupOptions = build!.rollupOptions!;
      const outputOptions = rollupOptions.output as OutputOptions;

      expect(build.outDir).toBe(resolve(cwd, 'dist'));
      expect(rollupOptions.input).toEqual(resolve(cwd, 'src', 'main.tsx'));
      expect(outputOptions.assetFileNames).toBe('build/q-[hash].[ext]');
      expect(outputOptions.chunkFileNames).toBe('build/q-[hash].js');
      expect(build.polyfillModulePreload).toBe(false);
      expect(build.dynamicImportVarsOptions?.exclude).toEqual([/./]);
      expect(build.ssr).toBe(undefined);
      expect(build.emptyOutDir).toBe(undefined);
      expect(c.optimizeDeps?.include).toEqual(['@builder.io/qwik', '@builder.io/qwik/jsx-runtime']);
      expect(c.esbuild).toEqual({ include: /\.js$/ });
      expect((c as any).ssr).toBeUndefined();

      expect(opts.debug).toBe(false);
      expect(opts.isDevBuild).toBe(false);
      expect(opts.isSSRBuild).toBe(false);
      expect(opts.entryStrategy).toEqual({ type: 'single' });
    });

    it('command: build, mode: server - defaults', async () => {
      const plugin: VitePlugin = qwikVite(inputOpts);
      const c = (await plugin.config!({}, { command: 'build', mode: 'server' }))!;
      const opts = await plugin.api?.getOptions();
      const build = c.build!;
      const rollupOptions = build!.rollupOptions!;
      const outputOptions = rollupOptions.output as OutputOptions;

      expect(build.outDir).toBe(resolve(cwd, 'server'));
      expect(rollupOptions.input).toEqual(resolve(cwd, 'src', 'entry.server.tsx'));
      expect(outputOptions.assetFileNames).toBe('build/q-[hash].[ext]');
      expect(outputOptions.chunkFileNames).toBe('build/q-[hash].js');
      expect(build.polyfillModulePreload).toBe(false);
      expect(build.dynamicImportVarsOptions?.exclude).toEqual([/./]);
      expect(build.ssr).toBe(true);
      expect(build.emptyOutDir).toBe(false);
      expect(c.optimizeDeps?.include).toEqual(['@builder.io/qwik', '@builder.io/qwik/jsx-runtime']);
      expect(c.esbuild).toEqual({ include: /\.js$/ });
      expect((c as any).ssr).toEqual({ noExternal: true });

      expect(opts.debug).toBe(false);
      expect(opts.isDevBuild).toBe(false);
      expect(opts.isSSRBuild).toBe(true);
      expect(opts.entryStrategy).toEqual({ type: 'single' });
    });
  });

  function mockOptimizerOptions(): OptimizerOptions {
    return {
      sys: {
        cwd: () => process.cwd(),
        env: () => 'node',
        dynamicImport: async (path) => require(path),
        path: require('path'),
      },
      binding: { mockBinding: true },
    };
  }
});
