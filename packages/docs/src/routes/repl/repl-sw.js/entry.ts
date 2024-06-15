import { QWIK_REPL_DEPS_CACHE, QWIK_REPL_RESULT_CACHE } from '../../../repl/worker/repl-constants';
import { receiveMessageFromMain } from '../../../repl/worker/repl-messenger';
import { requestHandler } from '../../../repl/worker/repl-request-handler';

/**
 * REPL Service Worker
 *
 * /repl/repl-sw.js
 */

self.onmessage = receiveMessageFromMain;

self.onfetch = requestHandler;
self.onsync = (ev) => {
  debugger;
};
self.oninstall = (ev) => {
  debugger;
  self.skipWaiting();
  ev.waitUntil(
    Promise.all([caches.open(QWIK_REPL_DEPS_CACHE), caches.open(QWIK_REPL_RESULT_CACHE)])
  );
};

self.onactivate = () => {
  debugger;
  self.clients.claim();
};

export interface ReplGlobalApi {
  qwikCore?: typeof import('@builder.io/qwik');
  qwikOptimizer?: typeof import('@builder.io/qwik/optimizer');
  qwikServer?: typeof import('@builder.io/qwik/server');
  prettier?: typeof import('prettier');
  prettierPlugins?: any;
  rollup?: typeof import('rollup');
  Terser?: typeof import('terser');
  rollupCache?: any;
}

export interface QwikWorkerGlobal extends ReplGlobalApi {
  onmessage: (ev: MessageEvent) => void;
  onfetch: (ev: FetchEvent) => void;
  oninstall: (ev: ExtendableEvent) => void;
  onactivate: () => void;
  skipWaiting: () => void;
  clients: {
    claim: () => void;
  };
}

declare const self: QwikWorkerGlobal;
