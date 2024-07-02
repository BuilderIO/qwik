import { directFetch } from './direct-fetch';
import { drainMsgQueue } from './process-message';
import { createState, type SWState } from './state';

export const setupServiceWorker = (swScope: ServiceWorkerGlobalScope) => {
  const swState: SWState = createState(swScope.fetch.bind(swScope), new URL(swScope.location.href));
  let cacheTimeout: any;
  swState.$getCache$ = () => {
    if (swState.$cache$) {
      return swState.$cache$;
    }
    clearTimeout(cacheTimeout);
    setTimeout(() => {
      swState.$cache$ = null;
    }, 5000);
    return swScope.caches.open('QwikBundles');
  };
  swScope.addEventListener('fetch', (ev) => {
    const request = ev.request;
    if (request.method === 'GET') {
      const response = directFetch(swState, new URL(request.url), true);
      if (response) {
        ev.respondWith(response);
      }
    }
  });
  swScope.addEventListener('message', (ev) => {
    swState.$msgQueue$.push(ev.data);
    drainMsgQueue(swState);
  });
  swScope.addEventListener('install', () => {
    swScope.skipWaiting();
  });
  swScope.addEventListener('activate', (event) => {
    let cacheTimeout: any;
    swState.$getCache$ = () => {
      if (swState.$cache$) {
        return swState.$cache$;
      }
      clearTimeout(cacheTimeout);
      setTimeout(() => {
        swState.$cache$ = null;
      }, 5000);
      return swScope.caches.open('QwikBundles');
    };
    event.waitUntil(swScope.clients.claim());
  });
};
