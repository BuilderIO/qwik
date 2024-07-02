import type { StaticGenerateRenderOptions } from '@builder.io/qwik-city/static';
import { getParentDir, type ServerAdapterOptions, viteAdapter } from '../../shared/vite';
import fs from 'node:fs';
import { dirname, join } from 'node:path';

/** @public */
export const FUNCTION_DIRECTORY = '_qwik-city-edge';

/** @public */
export function vercelEdgeAdapter(opts: VercelEdgeAdapterOptions = {}): any {
  return viteAdapter({
    name: 'vercel-edge',
    origin: process?.env?.VERCEL_URL || 'https://yoursitename.vercel.app',
    ssg: opts.ssg,
    staticPaths: opts.staticPaths,
    cleanStaticGenerated: true,

    config(config) {
      const outDir =
        config.build?.outDir ||
        join('.vercel', 'output', 'functions', `${FUNCTION_DIRECTORY}.func`);
      return {
        resolve: {
          conditions:
            opts.target === 'node'
              ? ['node', 'import', 'module', 'browser', 'default']
              : ['edge-light', 'webworker', 'worker', 'browser', 'module', 'main'],
        },
        ssr: {
          target: opts.target === 'node' ? 'node' : 'webworker',
          noExternal: true,
        },
        build: {
          ssr: true,
          outDir,
          rollupOptions: {
            output: {
              format: 'es',
              hoistTransitiveImports: false,
            },
          },
        },
        publicDir: false,
      };
    },

    async generate({ clientPublicOutDir, serverOutDir, basePathname, outputEntries }) {
      const vercelOutputDir = getParentDir(serverOutDir, 'output');

      if (opts.outputConfig !== false) {
        // https://vercel.com/docs/build-output-api/v3#features/edge-middleware
        const vercelOutputConfig = {
          routes: [
            { handle: 'filesystem' },
            {
              src: basePathname + '.*',
              dest: `/${FUNCTION_DIRECTORY}`,
            },
          ],
          version: 3,
        };

        await fs.promises.writeFile(
          join(vercelOutputDir, 'config.json'),
          JSON.stringify(vercelOutputConfig, null, 2)
        );
      }

      let entrypoint = opts.vcConfigEntryPoint;
      if (!entrypoint) {
        if (outputEntries.some((n) => n === 'entry.vercel-edge.mjs')) {
          entrypoint = 'entry.vercel-edge.mjs';
        } else {
          entrypoint = 'entry.vercel-edge.js';
        }
      }

      // https://vercel.com/docs/build-output-api/v3#vercel-primitives/edge-functions/configuration
      const vcConfigPath = join(serverOutDir, '.vc-config.json');
      const vcConfig = {
        runtime: 'edge',
        entrypoint,
        envVarsInUse: opts.vcConfigEnvVarsInUse,
      };
      await fs.promises.writeFile(vcConfigPath, JSON.stringify(vcConfig, null, 2));

      // vercel places all of the static files into the .vercel/output/static directory
      // move from the dist directory to vercel's output static directory
      let vercelStaticDir = join(vercelOutputDir, 'static');

      const basePathnameParts = basePathname.split('/').filter((p) => p.length > 0);
      if (basePathnameParts.length > 0) {
        // for vercel we need to add the base path to the static dir
        vercelStaticDir = join(vercelStaticDir, ...basePathnameParts);
      }

      // ensure we remove any existing static dir
      await fs.promises.rm(vercelStaticDir, { recursive: true, force: true });

      // ensure the containing directory exists we're moving the static dir to exists
      await fs.promises.mkdir(dirname(vercelStaticDir), { recursive: true });

      // move the dist directory to the vercel output static directory location
      await fs.promises.rename(clientPublicOutDir, vercelStaticDir);
    },
  });
}

/** @public */
export interface VercelEdgeAdapterOptions extends ServerAdapterOptions {
  /**
   * Determines if the build should auto-generate the `.vercel/output/config.json` config.
   *
   * Defaults to `true`.
   */
  outputConfig?: boolean;
  /**
   * The `entrypoint` property in the `.vc-config.json` file. Indicates the initial file where code
   * will be executed for the Edge Function.
   *
   * Defaults to `entry.vercel-edge.js`.
   */
  vcConfigEntryPoint?: string;
  /**
   * The `envVarsInUse` property in the `.vc-config.json` file. List of environment variable names
   * that will be available for the Edge Function to utilize.
   *
   * Defaults to `undefined`.
   */
  vcConfigEnvVarsInUse?: string[];
  /**
   * Manually add pathnames that should be treated as static paths and not SSR. For example, when
   * these pathnames are requested, their response should come from a static file, rather than a
   * server-side rendered response.
   */
  staticPaths?: string[];

  /**
   * Define the `target` property in the `ssr` object in the `vite.config.ts` file.
   *
   * Defaults to `webworker`.
   */
  target?: 'webworker' | 'node';
}

/** @public */
export type { StaticGenerateRenderOptions };
