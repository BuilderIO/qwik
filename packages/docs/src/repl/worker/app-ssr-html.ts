/* eslint-disable no-console */
import type { RenderOptions, RenderToStringResult } from '@builder.io/qwik/server';
import type { ReplInputOptions, ReplResult } from '../types';
import type { QwikWorkerGlobal } from './repl-service-worker';

export const appSsrHtml = async (options: ReplInputOptions, cache: Cache, result: ReplResult) => {
  const ssrModule = result.ssrModules.find((m) => m.path.endsWith('.js'));
  if (!ssrModule || typeof ssrModule.code !== 'string') {
    return;
  }
  const start = performance.now();

  const mod: any = { exports: {} };
  const run = new Function('module', 'exports', 'require', ssrModule.code);
  run(mod, mod.exports, noopRequire);

  const server: ServerModule = mod.exports;
  const render = typeof server === 'function' ? server : server.default ?? server.render;
  if (typeof render !== 'function') {
    throw new Error(`Server module "${ssrModule.path}" does not export render()`);
  }

  const log = console.log;
  const warn = console.warn;
  const error = console.error;
  const debug = console.debug;

  console.log = (...args: any[]) => {
    result.events.push({
      kind: 'console-log',
      scope: 'ssr',
      message: args.map((a) => String(a)),
      start: performance.now(),
    });
    log(...args);
  };

  console.warn = (...args: any[]) => {
    result.events.push({
      kind: 'console-warn',
      scope: 'ssr',
      message: args.map((a) => String(a)),
      start: performance.now(),
    });
    warn(...args);
  };

  console.error = (...args: any[]) => {
    result.events.push({
      kind: 'console-error',
      scope: 'ssr',
      message: args.map((a) => String(a)),
      start: performance.now(),
    });
  };

  console.debug = (...args: any[]) => {
    result.events.push({
      kind: 'console-debug',
      scope: 'ssr',
      message: args.map((a) => String(a)),
      start: performance.now(),
    });
    debug(...args);
  };

  const appUrl = `/repl/` + result.clientId + `/`;
  const baseUrl = appUrl + `build/`;
  const ssrResult = await render({
    base: baseUrl,
    manifest: result.manifest,
    prefetchStrategy: null as any,
  });

  console.log = log;
  console.warn = warn;
  console.error = error;
  console.debug = debug;

  result.html = ssrResult.html;

  result.events.push({
    kind: 'pause',
    scope: 'ssr',
    start,
    end: performance.now(),
    message: [],
  });

  if (options.buildMode !== 'production') {
    try {
      const html = self.prettier?.format(result.html, {
        parser: 'html',
        plugins: self.prettierPlugins,
      });
      if (html) {
        result.html = html;
      }
    } catch (e) {
      console.error(e);
    }
  }

  const url = new URL(appUrl, options.serverUrl);
  const req = new Request(url.href);

  const rsp = new Response(ssrResult.html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
  await cache.put(req, rsp);
};

const noopRequire = (path: string) => {
  console.debug(`require() not available from REPL SSR, path: ${path}`);
};

interface ServerModule {
  render: (opts: RenderOptions) => Promise<RenderToStringResult>;
  default?: (opts: RenderOptions) => Promise<RenderToStringResult>;
}

declare const self: QwikWorkerGlobal;
