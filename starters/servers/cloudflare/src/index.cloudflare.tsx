import { renderApp } from './index.server';
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import symbols from '../server/build/q-symbols.json';

const CACHING = true;

async function handleRequest(event: any) {
  const request = event.request;
  const url = new URL(request.url);
  if (/\.\w+$/.test(url.pathname)) {
    try {
      // Server static file
      const options = CACHING
        ? {
            cacheControl(req: Request) {
              const inmmutable = /\/q-\w+\.\w+$/.test(req.url);
              if (inmmutable) {
                return {
                  browserTTL: 31536000,
                  edgeTTL: 31536000,
                  bypassCache: false,
                };
              }
              return {
                browserTTL: 60 * 60,
                edgeTTL: 60,
                bypassCache: false,
              };
            },
          }
        : undefined;

      const staticResponse = await getAssetFromKV(event, options);
      return staticResponse;
    } catch (e) {
      // Handle 404
      return new Response(`"${url.pathname}" not found`, {
        status: 404,
        statusText: 'not found',
      });
    }
  } else {
    const cache = await caches.open('custom:qwik');
    if (CACHING) {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    const ssrResult = await renderApp({
      url: event.request.url,
      symbols,
    });

    const response = new Response(ssrResult.html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': `max-age=${60}`,
      },
    });
    if (CACHING) {
      event.waitUntil(cache.put(request, response.clone()));
    }
    return cache;
  }
}

addEventListener('fetch', (event: any) => {
  event.respondWith(handleRequest(event));
});
