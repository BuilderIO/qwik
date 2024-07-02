import type { StaticGenerateRenderOptions } from '@builder.io/qwik-city/static';
import { getParentDir, type ServerAdapterOptions, viteAdapter } from '../../shared/vite';
import fs from 'node:fs';
import { dirname, join } from 'node:path';

/** @public */
export const FUNCTION_DIRECTORY = '_qwik-city-serverless';

/** @public */
export function vercelServerlessAdapter(opts: VercelServerlessAdapterOptions = {}): any {
  return viteAdapter({
    name: 'vercel-serverless',
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
          target: 'node',
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
        runtime: opts.runtime || 'nodejs20.x',
        handler: entrypoint,
        memory: opts.memory,
        maxDuration: opts.maxDuration,
        environment: opts.environment,
        regions: opts.regions,
        shouldAddHelpers: opts.shouldAddHelpers,
        shouldAddSourcemapSupport: opts.shouldAddSourceMapSupport,
        awsLambdaHandler: opts.awsLambdaHandler,
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
export interface ServerlessFunctionConfig {
  /**
   * Specifies which "runtime" will be used to execute the Serverless Function.
   *
   * Required: Yes
   */
  runtime: string;

  /**
   * Indicates the initial file where code will be executed for the Serverless Function.
   *
   * Required: Yes
   */
  handler: string;

  /**
   * Amount of memory (RAM in MB) that will be allocated to the Serverless Function.
   *
   * Required: No
   */
  memory?: number;

  /**
   * Maximum duration (in seconds) that will be allowed for the Serverless Function.
   *
   * Required: No
   */
  maxDuration?: number;

  /**
   * Map of additional environment variables that will be available to the Serverless Function, in
   * addition to the env vars specified in the Project Settings.
   *
   * Required: No
   */
  environment?: Record<string, string>[];

  /**
   * List of Vercel Regions where the Serverless Function will be deployed to.
   *
   * Required: No
   */
  regions?: string[];

  /**
   * True if a custom runtime has support for Lambda runtime wrappers.
   *
   * Required: No
   */
  supportsWrapper?: boolean;

  /**
   * When true, the Serverless Function will stream the response to the client.
   *
   * Required: No
   */
  supportsResponseStreaming?: boolean;
}

/** @public */
export interface VercelServerlessAdapterOptions extends ServerAdapterOptions {
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
   * Manually add pathnames that should be treated as static paths and not SSR. For example, when
   * these pathnames are requested, their response should come from a static file, rather than a
   * server-side rendered response.
   */
  staticPaths?: string[];

  /**
   * Enables request and response helpers methods.
   *
   * Required: No Default: false
   */
  shouldAddHelpers?: boolean;

  /**
   * Enables source map generation.
   *
   * Required: No Default: false
   */
  shouldAddSourceMapSupport?: boolean;

  /**
   * AWS Handler Value for when the serverless function uses AWS Lambda syntax.
   *
   * Required: No
   */
  awsLambdaHandler?: string;

  /**
   * Specifies the target platform for the deployment, such as Vercel, AWS, etc.
   *
   * Required: No
   */
  target?: string;

  /**
   * Specifies the runtime environment for the function, for example, Node.js, Deno, etc.
   *
   * Required: No
   */
  runtime?: string;

  /**
   * Specifies the memory allocation for the serverless function.
   *
   * Required: No
   */
  memory?: number;

  /**
   * Specifies the maximum duration that the serverless function can run.
   *
   * Required: No
   */
  maxDuration?: number;

  /**
   * Specifies environment variables for the serverless function.
   *
   * Required: No
   */
  environment?: { [key: string]: string };

  /**
   * Specifies the regions in which the serverless function should run.
   *
   * Required: No
   */
  regions?: string[];
}

/** @public */
export type { StaticGenerateRenderOptions };
