import { Extractor, ExtractorConfig } from '@microsoft/api-extractor';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateApiMarkdownDocs } from './api-docs';
import { type BuildConfig, panic } from './util';

/**
 * Create each submodule's bundled dts file, and ensure the public API has not changed for a
 * production build.
 */
export async function apiExtractor(config: BuildConfig) {
  const apiJsonInputDir = join(config.rootDir, 'dist-dev', 'api');
  rmSync(apiJsonInputDir, { recursive: true, force: true });

  // core
  // Run the api extractor for each of the submodules
  createTypesApi(
    config,
    join(config.srcQwikDir, 'core'),
    join(config.distQwikPkgDir, 'core.d.ts'),
    '.'
  );
  createTypesApi(
    config,
    join(config.srcQwikDir, 'jsx-runtime'),
    join(config.distQwikPkgDir, 'jsx-runtime.d.ts'),
    '.'
  );
  createTypesApi(
    config,
    join(config.srcQwikDir, 'optimizer'),
    join(config.distQwikPkgDir, 'optimizer.d.ts'),
    '.'
  );
  createTypesApi(
    config,
    join(config.srcQwikDir, 'server'),
    join(config.distQwikPkgDir, 'server.d.ts'),
    '.'
  );
  createTypesApi(
    config,
    join(config.srcQwikDir, 'testing'),
    join(config.distQwikPkgDir, 'testing', 'index.d.ts'),
    '..'
  );
  createTypesApi(
    config,
    join(config.srcQwikDir, 'build'),
    join(config.distQwikPkgDir, 'build', 'index.d.ts'),
    '..'
  );
  generateServerReferenceModules(config);

  // qwik-city
  createTypesApi(
    config,
    join(config.packagesDir, 'qwik-city', 'runtime', 'src'),
    join(config.packagesDir, 'qwik-city', 'lib', 'index.d.ts')
  );
  createTypesApi(
    config,
    join(config.packagesDir, 'qwik-city', 'runtime', 'src', 'service-worker'),
    join(config.packagesDir, 'qwik-city', 'lib', 'service-worker.d.ts')
  );
  createTypesApi(
    config,
    join(config.packagesDir, 'qwik-city', 'buildtime', 'vite'),
    join(config.packagesDir, 'qwik-city', 'lib', 'vite', 'index.d.ts')
  );
  createTypesApi(
    config,
    join(config.packagesDir, 'qwik-city', 'adapters', 'azure-swa', 'vite'),
    join(config.packagesDir, 'qwik-city', 'lib', 'adapters', 'azure-swa', 'vite', 'index.d.ts')
  );
  createTypesApi(
    config,
    join(config.packagesDir, 'qwik-city', 'adapters', 'cloudflare-pages', 'vite'),
    join(
      config.packagesDir,
      'qwik-city',
      'lib',
      'adapters',
      'cloudflare-pages',
      'vite',
      'index.d.ts'
    )
  );
  createTypesApi(
    config,
    join(config.packagesDir, 'qwik-city', 'adapters', 'cloud-run', 'vite'),
    join(config.packagesDir, 'qwik-city', 'lib', 'adapters', 'cloud-run', 'vite', 'index.d.ts')
  );
  createTypesApi(
    config,
    join(config.packagesDir, 'qwik-city', 'adapters', 'deno-server', 'vite'),
    join(config.packagesDir, 'qwik-city', 'lib', 'adapters', 'deno-server', 'vite', 'index.d.ts')
  );
  createTypesApi(
    config,
    join(config.packagesDir, 'qwik-city', 'adapters', 'bun-server', 'vite'),
    join(config.packagesDir, 'qwik-city', 'lib', 'adapters', 'bun-server', 'vite', 'index.d.ts')
  );
  createTypesApi(
    config,
    join(config.packagesDir, 'qwik-city', 'adapters', 'node-server', 'vite'),
    join(config.packagesDir, 'qwik-city', 'lib', 'adapters', 'node-server', 'vite', 'index.d.ts')
  );
  createTypesApi(
    config,
    join(config.packagesDir, 'qwik-city', 'adapters', 'netlify-edge', 'vite'),
    join(config.packagesDir, 'qwik-city', 'lib', 'adapters', 'netlify-edge', 'vite', 'index.d.ts')
  );
  createTypesApi(
    config,
    join(config.packagesDir, 'qwik-city', 'adapters', 'shared', 'vite'),
    join(config.packagesDir, 'qwik-city', 'lib', 'adapters', 'shared', 'vite', 'index.d.ts')
  );
  createTypesApi(
    config,
    join(config.packagesDir, 'qwik-city', 'adapters', 'static', 'vite'),
    join(config.packagesDir, 'qwik-city', 'lib', 'adapters', 'static', 'vite', 'index.d.ts')
  );
  createTypesApi(
    config,
    join(config.packagesDir, 'qwik-city', 'adapters', 'vercel-edge', 'vite'),
    join(config.packagesDir, 'qwik-city', 'lib', 'adapters', 'vercel-edge', 'vite', 'index.d.ts')
  );
  createTypesApi(
    config,
    join(config.packagesDir, 'qwik-city', 'adapters', 'vercel-serverless', 'vite'),
    join(
      config.packagesDir,
      'qwik-city',
      'lib',
      'adapters',
      'vercel-serverless',
      'vite',
      'index.d.ts'
    )
  );
  createTypesApi(
    config,
    join(config.packagesDir, 'qwik-city', 'middleware', 'azure-swa'),
    join(config.packagesDir, 'qwik-city', 'lib', 'middleware', 'azure-swa', 'index.d.ts')
  );
  createTypesApi(
    config,
    join(config.packagesDir, 'qwik-city', 'middleware', 'cloudflare-pages'),
    join(config.packagesDir, 'qwik-city', 'lib', 'middleware', 'cloudflare-pages', 'index.d.ts')
  );
  createTypesApi(
    config,
    join(config.packagesDir, 'qwik-city', 'middleware', 'bun'),
    join(config.packagesDir, 'qwik-city', 'lib', 'middleware', 'bun', 'index.d.ts')
  );
  createTypesApi(
    config,
    join(config.packagesDir, 'qwik-city', 'middleware', 'deno'),
    join(config.packagesDir, 'qwik-city', 'lib', 'middleware', 'deno', 'index.d.ts')
  );
  createTypesApi(
    config,
    join(config.packagesDir, 'qwik-city', 'middleware', 'netlify-edge'),
    join(config.packagesDir, 'qwik-city', 'lib', 'middleware', 'netlify-edge', 'index.d.ts')
  );
  createTypesApi(
    config,
    join(config.packagesDir, 'qwik-city', 'middleware', 'node'),
    join(config.packagesDir, 'qwik-city', 'lib', 'middleware', 'node', 'index.d.ts')
  );
  createTypesApi(
    config,
    join(config.packagesDir, 'qwik-city', 'middleware', 'request-handler'),
    join(config.packagesDir, 'qwik-city', 'lib', 'middleware', 'request-handler', 'index.d.ts')
  );
  createTypesApi(
    config,
    join(config.packagesDir, 'qwik-city', 'middleware', 'firebase'),
    join(config.packagesDir, 'qwik-city', 'lib', 'middleware', 'firebase', 'index.d.ts')
  );
  createTypesApi(
    config,
    join(config.packagesDir, 'qwik-city', 'static'),
    join(config.packagesDir, 'qwik-city', 'lib', 'static', 'index.d.ts')
  );
  createTypesApi(
    config,
    join(config.packagesDir, 'qwik-city', 'middleware', 'vercel-edge'),
    join(config.packagesDir, 'qwik-city', 'lib', 'middleware', 'vercel-edge', 'index.d.ts')
  );
  generateQwikCityReferenceModules(config);

  await generateApiMarkdownDocs(config, apiJsonInputDir);

  console.log('🥶', 'submodule d.ts API files generated');
}

function createTypesApi(
  config: BuildConfig,
  inPath: string,
  outPath: string,
  relativePath?: string
) {
  const extractorConfigPath = join(inPath, 'api-extractor.json');
  const extractorConfig = ExtractorConfig.loadFileAndPrepare(extractorConfigPath);
  const result = Extractor.invoke(extractorConfig, {
    localBuild: !!config.dev,
    showVerboseMessages: true,
    showDiagnostics: true,
    messageCallback(msg) {
      msg.handled = true;
      if (msg.logLevel === 'verbose' || msg.logLevel === 'warning') {
        return;
      }
      if (msg.text.includes('Analysis will use')) {
        return;
      }
      if (
        msg.messageId === 'console-compiler-version-notice' ||
        msg.messageId === 'ae-undocumented'
      ) {
        return;
      }
      console.error(`❌ API Extractor, submodule: "${inPath}"\n${extractorConfigPath}\n`, msg);
    },
  });
  if (!result.succeeded) {
    panic(
      `Use "pnpm api.update" to automatically update the .md files if the api changes were expected`
    );
  }
  const srcPath = result.extractorConfig.untrimmedFilePath;
  const content = fixDtsContent(config, srcPath, relativePath);
  writeFileSync(outPath, content);
}

function generateQwikCityReferenceModules(config: BuildConfig) {
  // @builder.io/qwik-city/server-modules.d.ts
  const referenceDts = `
declare module '@qwik-city-plan' {
  export const routes: any[];
  export const menus: any[];
  export const trailingSlash: boolean;
  export const basePathname: string;
  export const cacheModules: boolean;
  const defaultExport: {
    routes: any[];
    menus: any[];
    trailingSlash: boolean;
    basePathname: string;
    cacheModules: boolean;
  };
  export default defaultExport;
}
`;
  const srcModulesPath = join(config.packagesDir, 'qwik-city', 'lib');

  const destModulesPath = join(srcModulesPath, 'modules.d.ts');
  writeFileSync(destModulesPath, referenceDts);

  // manually prepend the ts reference since api extractor removes it
  const prependReferenceDts = `/// <reference path="./modules.d.ts" />\n\n`;
  const distIndexPath = join(srcModulesPath, 'index.d.ts');
  let serverDts = readFileSync(distIndexPath, 'utf-8');
  serverDts = prependReferenceDts + serverDts;
  writeFileSync(distIndexPath, serverDts);
}

function generateServerReferenceModules(config: BuildConfig) {
  // server-modules.d.ts
  const referenceDts = `/// <reference types="./server" />
declare module '@qwik-client-manifest' {
  const manifest: import('./optimizer').QwikManifest;
  export { manifest };
}
// MD
declare module '*.md' {
  const node: import('./core').FunctionComponent;
  export const frontmatter: Record<string, any>;
  export default node;
}
// MDX
declare module '*.mdx' {
  const node: import('./core').FunctionComponent;
  export const frontmatter: Record<string, any>;
  export default node;
}
// Image ?jsx
declare module '*?jsx' {
  const Cmp: import('./core').FunctionComponent<Omit<import('./core').QwikIntrinsicElements['img'], 'src' | 'width' | 'height' | 'srcSet'>>
  export default Cmp;
  export const width: number;
  export const height: number;
  export const srcSet: string;
}

// Image &jsx
declare module '*&jsx' {
  const Cmp: import('./core').FunctionComponent<Omit<import('./core').QwikIntrinsicElements['img'], 'src' | 'width' | 'height' | 'srcSet'>>
  export default Cmp;
  export const width: number;
  export const height: number;
  export const srcSet: string;
}
`;

  const destServerModulesPath = join(config.distQwikPkgDir, 'server-modules.d.ts');
  writeFileSync(destServerModulesPath, referenceDts);

  // manually prepend the ts reference since api extractor removes it
  const prependReferenceDts = `/// <reference path="./server-modules.d.ts" />\n\n`;
  const distServerPath = join(config.distQwikPkgDir, 'server.d.ts');
  let serverDts = readFileSync(distServerPath, 'utf-8');
  serverDts = prependReferenceDts + serverDts;
  writeFileSync(distServerPath, serverDts);
}

/**
 * Fix up the generated dts content, and ensure it's using a relative path to find the core.d.ts
 * file, rather than node resolving it.
 */
function fixDtsContent(config: BuildConfig, srcPath: string, relativePath?: string) {
  let dts = readFileSync(srcPath, 'utf-8');

  // ensure we're just using a relative path
  if (relativePath) {
    dts = dts.replace(/'@builder\.io\/qwik(.*)'/g, `'${relativePath}$1'`);
  }

  // for some reason api-extractor is adding this in  ¯\_(ツ)_/¯
  dts = dts.replace('{};', '');

  // replace QWIK_VERSION with the actual version number, useful for debugging
  return dts.replace(/QWIK_VERSION/g, config.distVersion);
}
