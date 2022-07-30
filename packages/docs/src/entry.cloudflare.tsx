import render from './entry.ssr';
import { qwikCity } from '@builder.io/qwik-city/middleware/cloudflare-pages';
import cityPlan from '@qwik-city-plan';

const qwikCityMiddleware = qwikCity(render, {
  prefetchStrategy: {
    implementation: 'link-prefetch',
  },
  ...cityPlan,
});

export const onRequestGet = [qwikCityMiddleware];

// export const onRequestGet = async ({ request, next, waitUntil }: any) => {
//   try {
//     // Generate Qwik SSR response
//     const result2 = await render({
//       url: request.url,
//       prefetchStrategy: {
//         implementation: 'link-prefetch',
//       },
//     });

//     const response = new Response(result.html, {
//       headers: {
//         'Content-Type': 'text/html; charset=utf-8',
//         'Cache-Control': useCache
//           ? `max-age=60, s-maxage=10, stale-while-revalidate=604800, stale-if-error=604800`
//           : `no-cache, max-age=0`,
//       },
//     });

//     const url = new URL(request.url);

//     if (url.pathname === '/docs') {
//       return Response.redirect(new URL('/docs/overview', url));
//     }

//     if (url.pathname.startsWith('/guide')) {
//       return Response.redirect(new URL('/docs/overview', url));
//     }

//     if (url.pathname === '/examples') {
//       return Response.redirect(new URL('/examples/introduction/hello-world', url));
//     }

//     if (url.pathname === '/tutorial') {
//       return Response.redirect(new URL('/tutorial/welcome/overview', url));
//     }

//     if (url.pathname === '/chat') {
//       return Response.redirect('https://discord.gg/bNVSQmPzqy');
//     }

//     // if (url.pathname.includes('/repl/~repl-server-')) {
//     //   return new Response(replServerHtml, {
//     //     headers: {
//     //       'Content-Type': 'text/html; charset=utf-8',
//     //       'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
//     //     },
//     //   });
//     // }

//     // Handle static assets
//     if (/\.\w+$/.test(url.pathname)) {
//       return next(request);
//     }

//     // do not using caching during development
//     const useCache = url.hostname !== 'localhost';

//     // Early return from cache
//     const cache = await caches.open('custom:qwik');
//     if (useCache) {
//       const cachedResponse = await cache.match(request);
//       if (cachedResponse) {
//         return cachedResponse;
//       }
//     }

//     // Generate Qwik SSR response
//     const result = await render({
//       url: request.url,
//       prefetchStrategy: {
//         implementation: 'link-prefetch',
//       },
//     });

//     const response = new Response(result.html, {
//       headers: {
//         'Content-Type': 'text/html; charset=utf-8',
//         'Cache-Control': useCache
//           ? `max-age=60, s-maxage=10, stale-while-revalidate=604800, stale-if-error=604800`
//           : `no-cache, max-age=0`,
//       },
//     });

//     if (useCache) {
//       waitUntil(cache.put(request, response.clone()));
//     }

//     // Return Qwik SSR response
//     return response;
//   } catch (e: any) {
//     // 500 Error
//     return new Response(String(e.stack || e), { status: 500 });
//   }
// };
