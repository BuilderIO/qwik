// DO NOT USE FOR PRODUCTION!!!
// Internal Testing/Dev Server
// DO NOT USE FOR PRODUCTION!!!
/* eslint-disable no-console */

import express, { Request, Response } from 'express';
import { isAbsolute, join, resolve, dirname } from 'path';
import { readdirSync, statSync, unlinkSync, rmdirSync, existsSync } from 'fs';
import { Plugin, rollup } from 'rollup';
import type { QwikManifest } from '@builder.io/qwik/optimizer';
import type { Render, RenderToStreamOptions } from '@builder.io/qwik/server';
import { fileURLToPath } from 'url';

const app = express();
const port = parseInt(process.argv[process.argv.length - 1], 10) || 3300;
const address = `http://localhost:${port}/`;
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const startersDir = __dirname;
const startersAppsDir = join(startersDir, 'apps');
const appNames = readdirSync(startersAppsDir).filter(
  (p) => statSync(join(startersAppsDir, p)).isDirectory() && p !== 'base'
);

const qwikDistDir = join(__dirname, '..', 'packages', 'qwik', 'dist');
const qwikDistCorePath = join(qwikDistDir, 'core.mjs');
const qwikDistServerPath = join(qwikDistDir, 'server.mjs');
const qwikDistOptimizerPath = join(qwikDistDir, 'optimizer.mjs');
const qwikDistJsxRuntimePath = join(qwikDistDir, 'jsx-runtime.mjs');
Error.stackTraceLimit = 1000;

// dev server builds ssr's the starter app on-demand (don't do this in production)
const cache = new Map<string, QwikManifest>();
async function handleApp(req: Request, res: Response) {
  try {
    const url = new URL(req.url, address);
    const paths = url.pathname.split('/');
    const appName = paths[1];
    const appDir = join(startersAppsDir, appName);

    if (!existsSync(appDir)) {
      res.send(`❌ Invalid dev-server path: ${appDir}`);
      return;
    }

    console.log(req.method, req.url, `[${appName} build/ssr]`);

    let clientManifest = cache.get(appDir);
    if (!clientManifest) {
      clientManifest = await buildApp(appDir);
      cache.set(appDir, clientManifest);
    }

    const html = await ssrApp(req, appName, appDir, clientManifest);

    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (e: any) {
    console.error(e);
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.send(`❌ ${e.stack || e}`);
  }
}

function devPlugin(opts: { isServer: boolean }): Plugin {
  return {
    name: 'devPlugin',
    resolveId(id, importee) {
      if (id === '@builder.io/qwik') {
        return qwikDistCorePath;
      }
      if (id === '@qwik-client-manifest') {
        return id;
      }
      if (id === '@builder.io/qwik/server') {
        return qwikDistServerPath;
      }
      if (id === '@builder.io/qwik/build') {
        return id;
      }
      if (id === '@builder.io/qwik/jsx-runtime') {
        return qwikDistJsxRuntimePath;
      }
      if (!id.startsWith('.') && !isAbsolute(id)) {
        return { id, external: true };
      }
      if (importee) {
        const fileId = id.split('?')[0];
        if (fileId.endsWith('.css')) {
          return resolve(dirname(importee), fileId);
        }
      }
      return null;
    },
    load(id) {
      if (id === '@builder.io/qwik/build') {
        return `
export const isServer = ${String(opts.isServer)};
export const isBrowser = ${String(!opts.isServer)};
        `;
      }
      if (id === '@qwik-client-manifest') {
        return 'export const manifest = undefined;';
      }
      return null;
    },
    transform(code, id) {
      if (id.endsWith('.css')) {
        return `const CSS = ${JSON.stringify(code)}; export default CSS;`;
      }
      return null;
    },
    renderDynamicImport({ targetModuleId }) {
      if (targetModuleId === 'node-fetch') {
        return { left: 'import(', right: ')' };
      }
    },
  };
}

async function buildApp(appDir: string) {
  const optimizer: typeof import('@builder.io/qwik/optimizer') = await import(
    qwikDistOptimizerPath
  );
  const appSrcDir = join(appDir, 'src');
  const appDistDir = join(appDir, 'dist');
  const appServerDir = join(appDir, 'server');

  // always clean the build directory
  removeDir(appDistDir);
  removeDir(appServerDir);

  let clientManifest: QwikManifest | undefined = undefined;

  const clientBuild = await rollup({
    input: getSrcInput(appSrcDir),
    plugins: [
      devPlugin({ isServer: false }),
      optimizer.qwikRollup({
        target: 'client',
        buildMode: 'development',
        debug: true,
        srcDir: appSrcDir,
        forceFullBuild: true,
        entryStrategy: { type: 'hook' },
        manifestOutput: (m) => {
          clientManifest = m;
        },
      }),
    ],
  });
  await clientBuild.write({
    dir: appDistDir,
  });

  const ssrBuild = await rollup({
    input: join(appSrcDir, 'entry.ssr.tsx'),
    plugins: [
      devPlugin({ isServer: true }),
      optimizer.qwikRollup({
        target: 'ssr',
        buildMode: 'production',
        srcDir: appSrcDir,
        entryStrategy: { type: 'inline' },
        manifestInput: clientManifest,
      }),
    ],
  });

  console.log('appServerDir', appServerDir);

  await ssrBuild.write({
    dir: appServerDir,
  });

  return clientManifest!;
}

function getSrcInput(appSrcDir: string) {
  // get all the entry points for tsx for DEV ONLY!
  const srcInputs: string[] = [];

  function readDir(dir: string) {
    const items = readdirSync(dir);
    for (const item of items) {
      const itemPath = join(dir, item);
      const s = statSync(itemPath);
      if (s.isDirectory()) {
        readDir(itemPath);
      } else if (item.endsWith('.tsx') && !item.endsWith('entry.express.tsx')) {
        srcInputs.push(itemPath);
      }
    }
  }
  readDir(appSrcDir);

  return srcInputs;
}

function removeDir(dir: string) {
  try {
    const items = readdirSync(dir);
    const itemPaths = items.map((i) => join(dir, i));
    itemPaths.forEach((itemPath) => {
      if (statSync(itemPath).isDirectory()) {
        removeDir(itemPath);
      } else {
        unlinkSync(itemPath);
      }
    });
    rmdirSync(dir);
  } catch (e) {
    /**/
  }
}

async function ssrApp(req: Request, appName: string, appDir: string, manifest: QwikManifest) {
  const ssrPath = join(appDir, 'server', 'entry.ssr.js');
  const mod = await import(ssrPath);
  const render = (mod.default ?? mod.render) as Render;

  // ssr the document
  const base = `/${appName}/build/`;
  console.log('req.url', req.url);
  const chunks: string[] = [];
  const opts: RenderToStreamOptions = {
    stream: {
      write(chunk) {
        chunks.push(chunk);
      },
    },
    manifest,
    debug: true,
    base,
  };
  await render(opts);

  return chunks.join('');
}

function startersHomepage(_: Request, res: Response) {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!-- Some comment --><!DOCTYPE html>
  <html>
    <head>
      <title>Starters Dev Server</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji;
          line-height: 1.5;
        }
        a { color: #4340C4; }
        a:hover { text-decoration: none; }
        h1 { margin: 5px 0; }
      </style>
    </head>
    <body>
      <h1>⚡️ Starters Dev Server ⚡️</h1>
      <ul>
        ${appNames.map((a) => `<li><a href="/${a}/">${a}</a></li>`).join('')}
      </ul>
    </body>
  </html>
  `);
}

import nodeFetch, { Headers, Request as R, Response as RE } from 'node-fetch';

(global as any).fetch = nodeFetch;
(global as any).Headers = Headers;
(global as any).Request = R;
(global as any).Response = RE;

function favicon(_: Request, res: Response) {
  const path = join(startersAppsDir, 'base', 'public', 'favicon.ico');
  res.sendFile(path);
}

const partytownPath = resolve(startersDir, '..', 'node_modules', '@builder.io', 'partytown', 'lib');
app.use(`/~partytown`, express.static(partytownPath));

appNames.forEach((appName) => {
  const buildPath = join(startersAppsDir, appName, 'dist', 'build');
  app.use(`/${appName}/build`, express.static(buildPath));

  const publicPath = join(startersAppsDir, appName, 'public');
  app.use(`/${appName}`, express.static(publicPath));
});

app.get('/', startersHomepage);
app.get('/favicon.ico', favicon);
app.get('/*', handleApp);

const server = app.listen(port, () => {
  console.log(`Starter Dir: ${startersDir}`);
  console.log(`Dev Server: ${address}\n`);

  console.log(`Starters:`);
  appNames.forEach((appName) => {
    console.log(`  ${address}${appName}/`);
  });
  console.log(``);
});

process.on('SIGTERM', () => server.close());
