import type { Plugin } from 'vite';
import type { QwikCityPlugin } from '@builder.io/qwik-city/vite';
import type { QwikVitePlugin } from '@builder.io/qwik/optimizer';
import type { StaticGenerateOptions, StaticGenerateRenderOptions } from '../../../static';
import { join } from 'node:path';
import fs from 'node:fs';

/**
 * @alpha
 */
export function expressAdaptor(opts: NetlifyEdgeAdaptorOptions = {}): any {
  let qwikCityPlugin: QwikCityPlugin | null = null;
  let qwikVitePlugin: QwikVitePlugin | null = null;
  let serverOutDir: string | null = null;
  let renderModulePath: string | null = null;
  let qwikCityPlanModulePath: string | null = null;

  async function generateBundles() {
    const qwikVitePluginApi = qwikVitePlugin!.api;
    const clientOutDir = qwikVitePluginApi.getClientOutDir()!;

    const serverPackageJsonPath = join(serverOutDir!, 'package.json');
    const serverPackageJsonCode = `{"type":"module"}`;
    await fs.promises.mkdir(serverOutDir!, { recursive: true });
    await fs.promises.writeFile(serverPackageJsonPath, serverPackageJsonCode);

    if (opts.staticGenerate) {
      const staticGenerate = await import('../../../static');
      let generateOpts: StaticGenerateOptions = {
        outDir: clientOutDir,
        origin: process?.env?.URL || 'https://yoursitename.example.com',
        renderModulePath: renderModulePath!,
        qwikCityPlanModulePath: qwikCityPlanModulePath!,
        basePathname: qwikCityPlugin!.api.getBasePathname(),
      };

      if (typeof opts.staticGenerate === 'object') {
        generateOpts = {
          ...generateOpts,
          ...opts.staticGenerate,
        };
      }

      await staticGenerate.generate(generateOpts);
    }
  }

  const plugin: Plugin = {
    name: 'vite-plugin-qwik-city-express',
    enforce: 'post',
    apply: 'build',

    configResolved({ build, plugins }) {
      qwikCityPlugin = plugins.find((p) => p.name === 'vite-plugin-qwik-city') as QwikCityPlugin;
      if (!qwikCityPlugin) {
        throw new Error('Missing vite-plugin-qwik-city');
      }
      qwikVitePlugin = plugins.find((p) => p.name === 'vite-plugin-qwik') as QwikVitePlugin;
      if (!qwikVitePlugin) {
        throw new Error('Missing vite-plugin-qwik');
      }

      serverOutDir = build.outDir;

      if (build?.ssr !== true) {
        throw new Error('"build.ssr" must be set to `true` in order to use the Express adaptor.');
      }

      if (!build?.rollupOptions?.input) {
        throw new Error(
          '"build.rollupOptions.input" must be set in order to use the Express adaptor.'
        );
      }
    },

    generateBundle(_, bundles) {
      for (const fileName in bundles) {
        const chunk = bundles[fileName];
        if (chunk.type === 'chunk' && chunk.isEntry) {
          if (chunk.name === 'entry.ssr') {
            renderModulePath = join(serverOutDir!, fileName);
          } else if (chunk.name === '@qwik-city-plan') {
            qwikCityPlanModulePath = join(serverOutDir!, fileName);
          }
        }
      }

      if (!renderModulePath) {
        throw new Error(
          'Unable to find "entry.ssr" entry point. Did you forget to add it to "build.rollupOptions.input"?'
        );
      }
      if (!qwikCityPlanModulePath) {
        throw new Error(
          'Unable to find "@qwik-city-plan" entry point. Did you forget to add it to "build.rollupOptions.input"?'
        );
      }
    },

    async closeBundle() {
      await generateBundles();
    },
  };
  return plugin;
}

/**
 * @alpha
 */
export interface NetlifyEdgeAdaptorOptions {
  staticGenerate?: StaticGenerateRenderOptions | true;
}
