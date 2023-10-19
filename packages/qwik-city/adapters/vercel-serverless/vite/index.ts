import type { StaticGenerateRenderOptions } from '@builder.io/qwik-city/static';
import { getParentDir, type ServerAdapterOptions, viteAdapter } from '../../shared/vite';
import fs from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * @public
 */
export function vercelServerlessAdapter(opts: VercelServerlessAdapterOptions = {}): any {
  return viteAdapter({
    name: 'vercel-serverless',
    origin: process?.env?.VERCEL_URL || 'https://yoursitename.vercel.app',
    ssg: opts.ssg,
    staticPaths: opts.staticPaths,
    cleanStaticGenerated: true,

    config(config) {
      const outDir =
        config.build?.outDir || join('.vercel', 'output', 'functions', '_qwik-city.func');
      return {
        build: {
          ssr: true,
          outDir,
        },
        publicDir: false,
      };
    },

    async generate({ clientPublicOutDir, serverOutDir, basePathname, outputEntries }) {
      const vercelOutputDir = getParentDir(serverOutDir, 'output');

      if (opts.outputConfig !== false) {
        // https://vercel.com/docs/build-output-api/v3/configuration
        const vercelOutputConfig = {
          routes: [
            { handle: 'filesystem' },
            {
              src: basePathname + '.*',
              dest: '/_qwik-city',
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
        if (outputEntries.some((n) => n === 'entry.vercel-serverless.mjs')) {
          entrypoint = 'entry.vercel-serverless.mjs';
        } else {
          entrypoint = 'entry.vercel-serverless.js';
        }
      }

      // https://vercel.com/docs/build-output-api/v3/primitives#serverless-functions
      const vcConfigPath = join(serverOutDir, '.vc-config.json');
      const vcConfig = {
        launcherType: 'Nodejs',
        runtime: opts.runtime || 'nodejs18.x',
        handler: entrypoint,
        memory: opts.memory,
        maxDuration: opts.maxDuration,
        environment: opts.environment,
        regions: opts.regions,
        shouldAddSourcemapSupport: true,
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

/**
 * @public
 */
export interface VercelServerlessAdapterOptions extends ServerAdapterOptions {
  /**
   * Determines if the build should auto-generate the `.vercel/output/config.json` config.
   *
   * Defaults to `true`.
   */
  outputConfig?: boolean;
  /**
   * The `entrypoint` property in the `.vc-config.json` file.
   * Indicates the initial file where code will be executed for the Serverless Function.
   *
   * Defaults to `entry.vercel-serverless.js`.
   */
  vcConfigEntryPoint?: string;
  /**
   * Specifies which "runtime" will be used to execute the Serverless Function.
   * Defaults to `nodejs18.x`.
   */
  runtime?: string;
  /**
   * Amount of memory (RAM in MB) that will be allocated to the Serverless Function.
   */
  memory?: number;
  /**
   * Maximum execution duration (in seconds) that will be allowed for the Serverless Function.
   */
  maxDuration?: number;
  /**
   * Map of additional environment variables that will be available to the Serverless Function,
   * in addition to the env vars specified in the Project Settings.
   */
  environment?: Record<string, string>[];
  /**
   * List of Vercel Regions where the Serverless Function will be deployed to.
   */
  regions?: string[];
  /**
   * True if a custom runtime has support for Lambda runtime wrappers.
   */
  supportsWrapper?: boolean;
  /**
   * When true, the Serverless Function will stream the response to the client.
   * Defaulted to true since Qwik streams its content.
   */
  supportsResponseStreaming?: boolean;
  /**
   * Manually add pathnames that should be treated as static paths and not SSR.
   * For example, when these pathnames are requested, their response should
   * come from a static file, rather than a server-side rendered response.
   */
  staticPaths?: string[];
}

/**
 * @public
 */
export type { StaticGenerateRenderOptions };
