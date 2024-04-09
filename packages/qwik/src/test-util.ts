import { createServer } from 'vite';
import { isAbsolute, resolve, join } from 'path';

import type { InlineConfig, PluginOption } from 'vite';
import { fileURLToPath, pathToFileURL } from 'node:url';

export async function loadFixture(inlineConfig: InlineConfig) {
  if (!inlineConfig?.root) {
    throw new Error("Must provide { root: './fixtures/...' }");
  }
  let root = resolve(__dirname, inlineConfig?.root);
  // Handle URL, should already be absolute so just convert to path
  if (typeof root !== 'string') {
    root = fileURLToPath(root);
  }
  // Handle "file:///C:/Users/fred", convert to "C:/Users/fred"
  else if (root.startsWith('file://')) {
    root = fileURLToPath(new URL(root));
  }
  // Handle "./fixtures/...", convert to absolute path
  else if (isAbsolute(root)) {
    root = fileURLToPath(new URL(root, import.meta.url));
  }

  const packagesDir = resolve(__dirname, '../..');

  const qwikDistDir = join(packagesDir, 'qwik', 'dist');
  const qwikDistMjs = join(qwikDistDir, 'core.mjs');
  const qwikCityDistDir = join(packagesDir, 'qwik-city', 'lib');
  const qwikDistOptimizerPath = join(qwikDistDir, 'optimizer.mjs');
  const qwikCityDistVite = join(qwikCityDistDir, 'vite', 'index.mjs');

  const plugins: PluginOption[] = [];

  const qwikCityVite: typeof import('@builder.io/qwik-city/vite') = await import(
    file(qwikCityDistVite)
  );
  plugins.push(qwikCityVite.qwikCity());

  const optimizer: typeof import('@builder.io/qwik/optimizer') = await import(
    file(qwikDistOptimizerPath)
  );

  plugins.push(optimizer.qwikVite());
  const baseurl = 'http://localhost:5173' + inlineConfig.base;
  const resolveUrl = (url: string) => `${baseurl}${url.replace(/^\/?/, '/')}`;

  return {
    resolveUrl,
    async startDevServer(devInlineConfig: InlineConfig) {
      process.env.NODE_ENV = 'development';

      const devServer = await createServer({
        ...inlineConfig,
        mode: 'development',
        ...devInlineConfig,
        plugins,
        root,
        configFile: false,
        resolve: {
          conditions: ['development'],
          mainFields: [],
          alias: [
            {
              find: /^@builder\.io\/qwik-city/,
              replacement: qwikCityDistDir,
            },
            {
              find: /^@builder\.io\/qwik$/,
              replacement: qwikDistMjs,
            },
            {
              find: /^@builder\.io\/qwik/,
              replacement: qwikDistDir,
            },
          ],
        },
      });

      // update port
      await devServer.listen();

      return devServer;
    },
    async fetch(url: string, init: RequestInit) {
      const resolvedUrl = resolveUrl(url);
      try {
        return await fetch(resolvedUrl, init);
      } catch (err: any) {
        if (err.message?.includes('fetch failed')) {
          console.error(err);
        }
        throw err;
      }
    },
  };
}

const isWindows = process.platform === 'win32';

const file = (filePath: string) => {
  return isWindows ? pathToFileURL(filePath).toString() : filePath;
};