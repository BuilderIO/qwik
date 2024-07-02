import { describe, expect, it, vi } from 'vitest';
import { delay } from '../core/util/promises';
import { addDependencies, directFetch } from './direct-fetch';
import { processMessage } from './process-message';
import { setupServiceWorker } from './setup';
import { createState, type SWTask } from './state';

describe('service-worker', async () => {
  describe('registration', async () => {
    it('initialization', async () => {
      const swScope = mockSwScope();
      setupServiceWorker(swScope);
      swScope.event.install!();
      expect(swScope.skipWaiting).toHaveBeenCalled();

      const event = {
        waitUntil: vi.fn(),
      };
      await swScope.event.activate!(event);
      expect(swScope.clients.claim).toHaveBeenCalled();
      expect(event.waitUntil).toHaveBeenCalled();
      expect(swScope.event.fetch).toBeDefined();
      expect(swScope.event.message).toBeDefined();
    });
  });

  describe('graph', async () => {
    const singleGraph = createGraph([['a.js']]);
    const graph = createGraph([['a.js', 'b.js', 'c.js'], ['b.js', 'c.js'], ['c.js']]);
    it('load single', async () => {
      const swState = mockSwState();
      await processMessage(swState, ['graph', '/base/', ...singleGraph]);
      expect(swState.$bases$.length).toBe(1);
      expect(swState.$bases$[0].$path$).toBe('/base/');
      expect(swState.$bases$[0].$graph$).toEqual(singleGraph);
      expect(swState.mockCache.mock.has('/base/a.js')).toBe(false);
    });

    it('load many', async () => {
      const swState = mockSwState();
      await processMessage(swState, ['graph', '/base/', ...graph]);
      expect(swState.$bases$.length).toBe(1);
      expect(swState.$bases$[0].$path$).toBe('/base/');
      expect(swState.$bases$[0].$graph$).toEqual(graph);
    });

    it('load same base replaces previous', async () => {
      const differentGraph = createGraph([['a.js']]);
      const swState = mockSwState();
      await processMessage(swState, ['graph', '/base/', ...graph]);
      await processMessage(swState, ['graph', '/base/', ...differentGraph]);
      expect(swState.$bases$.length).toBe(1);
      expect(swState.$bases$[0].$path$).toBe('/base/');
      expect(swState.$bases$[0].$graph$).toEqual(differentGraph);
    });

    it('should load graph from network', async () => {
      const swState = mockSwState();
      const graph = createGraph([['a.js', 'b.js'], ['b.js']]);
      const p = processMessage(swState, ['graph-url', '/base/', 'q-graph.json']);
      await delay(0);
      swState.$fetch$.mock.get('/base/q-graph.json')!.resolve(new Response(JSON.stringify(graph)));
      await p;
      expect(swState.$bases$.length).toBe(1);
      expect(swState.$bases$[0].$path$).toBe('/base/');
      expect(swState.$bases$[0].$graph$).toEqual([...graph, 'q-graph.json']);
      expect(Array.from(swState.mockCache.mock.keys())).toEqual(['/base/q-graph.json']);
    });
  });

  describe('addDependencies', async () => {
    it('no dependencies', async () => {
      const deps = addDependencies([], new Set(), 'abc.js');
      expect(deps).toEqual(new Set(['abc.js']));
    });

    it('one level deps', async () => {
      const deps = addDependencies(
        createGraph([['a.js', 'b.js'], ['b.js'], ['unrelated.js']]),
        new Set(),
        'a.js'
      );
      expect(deps).toEqual(new Set(['a.js', 'b.js']));
    });
    it('two level deps', async () => {
      const deps = addDependencies(
        createGraph([['a.js', 'b.js', 'c.js'], ['b.js', 'c.js'], ['c.js'], ['unrelated.js']]),
        new Set(),
        'a.js'
      );
      expect(deps).toEqual(new Set(['a.js', 'b.js', 'c.js']));
    });
    it('multi level deps', async () => {
      const deps = addDependencies(
        createGraph([
          ['a.js', 'b.js', 'c.js', 'd.js'],
          ['b.js', 'c.js', 'e.js'],
          ['c.js', 'e.js', 'a.js'],
          ['e.js'],
          ['d.js'],
          ['unrelated.js'],
        ]),
        new Set(),
        'a.js'
      );
      expect(deps).toEqual(new Set(['a.js', 'b.js', 'c.js', 'e.js', 'd.js']));
    });
  });

  describe('bundle-load', async () => {
    it('should pass requests outside base through', async () => {
      const swState = mockSwState();
      expect(
        await directFetch(swState, new URL('http://server/unknown/some-path.js'))
      ).toBeUndefined();
    });

    it('should intercept requests inside base', async () => {
      const swState = mockSwState();
      await processMessage(swState, ['graph', '/base/']);
      const responsePromise = directFetch(swState, new URL('http://server/base/unknown.js'));
      await delay(0);
      swState.$fetch$.mock.get('/base/unknown.js')!.resolve(new Response('RESPONSE'));
      const response = await responsePromise;
      expect(response).not.toBeUndefined();
      expect(response!.status).toBe(200);
      expect(await response!.text()).toEqual('RESPONSE');

      // remove the fetch mock
      swState.$fetch$.mock.delete('/base/unknown.js');
      // Now the second request should come from the cache.
      const secondResponse = await directFetch(swState, new URL('http://server/base/unknown.js'));
      expect(secondResponse).not.toBe(response);
      expect(secondResponse).not.toBeUndefined();
      expect(secondResponse!.status).toBe(200);
      expect(await secondResponse!.text()).toEqual('RESPONSE');
    });

    it('should not add non 200 response to cache', async () => {
      const swState = mockSwState();
      await processMessage(swState, ['graph', '/base/']);
      const responsePromise = directFetch(swState, new URL('http://server/base/unknown.js'));
      await delay(0);
      swState.$fetch$.mock
        .get('/base/unknown.js')!
        .resolve(new Response('RESPONSE', { status: 404 }));
      const response = await responsePromise;
      expect(response!.status).toBe(404);
      expect(swState.mockCache.mock.has('/base/unknown.js')).toBe(false);
    });

    it('should cache response', async () => {
      const swState = mockSwState();
      swState.$put$('/base/abc.js', new Response('RESPONSE'));
      await processMessage(swState, ['graph', '/base/', 'abc.js']);
      const response = await directFetch(swState, new URL('http://server/base/abc.js'));
      expect(response).not.toBeUndefined();
      expect(response!.status).toBe(200);
      expect(await response!.text()).toEqual('RESPONSE');
    });

    it('should add dependencies to cache', async () => {
      const swState = mockSwState();
      await processMessage(swState, [
        'graph',
        '/base/',
        ...createGraph([['abc.js', 'def.js'], ['def.js']]),
      ]);
      const responsePromise = directFetch(swState, new URL('http://server/base/abc.js'));
      await delay(0);
      swState.$fetch$.mock.get('/base/abc.js')!.resolve(new Response('ABC'));
      swState.$fetch$.mock.get('/base/def.js')!.resolve(new Response('DEF'));
      const response = await responsePromise;
      expect(await response!.text()).toEqual('ABC');
      expect(swState.mockCache.mock.has('/base/def.js')).toBe(true);
    });
  });

  describe('queue behavior', async () => {
    it('should not have more than X concurrent prefetch requests', async () => {
      const swState = mockSwState();
      swState.$maxPrefetchRequests$ = 1;
      await processMessage(swState, ['graph', '/base/']);
      await processMessage(swState, ['prefetch', '/base/', 'a.js', 'b.js', 'c.js']);
      await delay(0);
      expect(swState.$queue$.length).toBe(3);
      expect(swState.$queue$.filter((t) => t.$isFetching$).length).toBe(1);
      swState.$fetch$.mock.get('/base/a.js')!.resolve(new Response('A'));
      await delay(0);
      expect(swState.$queue$.length).toBe(2);
      expect(swState.$queue$.filter((t) => t.$isFetching$).length).toBe(1);
      swState.$fetch$.mock.get('/base/b.js')!.resolve(new Response('B'));
      await delay(0);
      expect(swState.$queue$.length).toBe(1);
      expect(swState.$queue$.filter((t) => t.$isFetching$).length).toBe(1);
      swState.$fetch$.mock.get('/base/c.js')!.resolve(new Response('C'));
      await delay(0);
      expect(swState.$queue$.length).toBe(0);
    });
    it('should put direct request at the front of the queue', async () => {
      const swState = mockSwState();
      swState.$maxPrefetchRequests$ = 1;
      await processMessage(swState, ['graph', '/base/']);
      await processMessage(swState, ['prefetch', '/base/', 'a.js', 'b.js']);
      await delay(0);
      expect(swState.$queue$.length).toBe(2);
      expect(swState.$queue$.filter((t) => t.$isFetching$).length).toBe(1);
      const responsePromise = directFetch(swState, new URL('http://server/base/direct.js'), true);
      await delay(0);
      expect(swState.$queue$.length).toBe(3);
      expect(swState.$queue$.filter((t) => t.$isFetching$).length).toBe(2);
      swState.$fetch$.mock.get('/base/a.js')!.resolve(new Response('A'));
      await delay(0);
      expect(swState.$queue$.length).toBe(2);
      expect(swState.$queue$.filter((t) => t.$isFetching$).length).toBe(1);
      swState.$fetch$.mock.get('/base/direct.js')!.resolve(new Response('DIRECT'));
      expect(await (await responsePromise)!.text()).toEqual('DIRECT');
      await delay(0);
      expect(swState.$queue$.length).toBe(1);
      expect(swState.$queue$.filter((t) => t.$isFetching$).length).toBe(1);
      swState.$fetch$.mock.get('/base/b.js')!.resolve(new Response('B'));
      await delay(0);
      expect(swState.$queue$.length).toBe(0);
      expect(swState.$queue$.filter((t) => t.$isFetching$).length).toBe(0);
    });
    it('should upgrade prefetch request to direct request when dependent request needs it', async () => {
      const swState = mockSwState();
      swState.$maxPrefetchRequests$ = 2;
      await processMessage(swState, [
        'graph',
        '/base/',
        ...createGraph([['a.js', 'b.js'], ['b.js'], ['c.js']]),
      ]);
      await processMessage(swState, ['prefetch', '/base/', 'a.js', 'b.js', 'c.js']);
      await delay(0);
      expect(swState.$queue$.filter(areFetching).map(getPathname)).toEqual([
        '/base/a.js',
        '/base/b.js',
      ]);
      directFetch(swState, new URL('http://server/base/a.js'));
      await delay(0);
      // The `b.js` should be upgraded to direct request because it is a dependency of `a.js`.
      expect(swState.$queue$.filter(areFetching).map(getPathname)).toEqual([
        '/base/a.js',
        '/base/b.js',
      ]);
      swState.$fetch$.mock.get('/base/a.js')!.resolve(new Response('a'));
      swState.$fetch$.mock.get('/base/b.js')!.resolve(new Response('B'));
      await delay(0);
      // The `b.js` should be upgraded to direct request because it is a dependency of `a.js`.
      expect(swState.$queue$.filter(areFetching).map(getPathname)).toEqual(['/base/c.js']);
      swState.$fetch$.mock.get('/base/c.js')!.resolve(new Response('C'));
      await delay(0);
      expect(swState.$queue$.length).toBe(0);
    });
  });

  describe('cache', async () => {
    it('should respond from cache', async () => {
      const swState = mockSwState();
      swState.mockCache.mock.set('/base/abc.js', new Response('RESPONSE'));
      await processMessage(swState, ['graph', '/base/', 'abc.js']);
      const response = await directFetch(swState, new URL('http://server/base/abc.js'));
      expect(response!.status).toBe(200);
      expect(await response?.text()).toEqual('RESPONSE');
    });

    it('should populate cache from prefetch', async () => {
      const swState = mockSwState();
      const graph = createGraph([['a.js', 'b.js'], ['b.js', 'c.js'], ['c.js']]);
      await processMessage(swState, ['graph', '/base/', ...graph]);
      await processMessage(swState, ['prefetch', '/base/', 'a.js']);
      await delay(0);
      swState.$fetch$.mock.get('/base/a.js')!.resolve(new Response('A'));
      swState.$fetch$.mock.get('/base/b.js')!.resolve(new Response('B'));
      swState.$fetch$.mock.get('/base/c.js')!.resolve(new Response('C'));
      await delay(0);
      expect(Array.from(swState.mockCache.mock.keys())).toEqual([
        '/base/a.js',
        '/base/b.js',
        '/base/c.js',
      ]);
    });

    it('should not re-request data if already in the cache', async () => {
      const swState = mockSwState();
      swState.mockCache.mock.set('/base/a.js', new Response('A'));
      await processMessage(swState, [
        'graph',
        '/base/',
        ...createGraph([['a.js', 'b.js'], ['b.js']]),
      ]);
      await processMessage(swState, ['prefetch', '/base/', 'a.js']);
      await delay(0);
      expect(swState.$queue$.length).toBe(1);
      expect(swState.$queue$.filter(areFetching).map(getPathname)).toEqual(['/base/b.js']);
    });

    describe('cleanup', async () => {
      it('should remove old cache entries, when new graph is provided', async () => {
        const swState = mockSwState();
        swState.mockCache.mock.set('/base/a.js', new Response('A'));
        swState.mockCache.mock.set('/base/b.js', new Response('B'));
        await processMessage(swState, ['graph', '/base/', ...createGraph([['b.js']])]);
        expect(Array.from(swState.mockCache.mock.keys())).toEqual(['/base/b.js']);
      });
    });
  });
});

function mockSwScope() {
  const event = {
    install: null as Function | null,
    activate: null as Function | null,
    message: null as Function | null,
    fetch: null as Function | null,
  };
  const scope = {
    skipWaiting: vi.fn(),
    clients: { claim: vi.fn() },
    caches: { open: vi.fn() },
    fetch: vi.fn(),
    location: { href: 'http://test-mock/' },
    event,
    addEventListener: (name: keyof typeof event, fn: Function) => {
      event[name] = fn;
    },
  };
  return scope as typeof scope & ServiceWorkerGlobalScope;
}
function mockSwState() {
  const cache = {
    mock: new Map<string, Response>(),
    match: (url: URL) => {
      if (typeof url == 'string') {
        url = new URL(url, 'http://localhost/');
      }
      return Promise.resolve(cache.mock.get(url.pathname));
    },
    put: (url: URL | string, response: Response) => {
      if (typeof url == 'string') {
        url = new URL(url, 'http://localhost/');
      }
      cache.mock.set(url.pathname, response.clone());
      return Promise.resolve();
    },
    keys: () =>
      Promise.resolve(
        Array.from(cache.mock.keys()).map((k) => new Request(new URL(k, 'http://localhost/')))
      ),
    delete: async (request: Request) => {
      cache.mock.delete(new URL(request.url).pathname);
    },
  };
  const fetch = Object.assign(
    (url: URL) => {
      let response = fetch.mock.get(url.pathname);
      if (!response) {
        let resolveFn: (response: Response) => void;
        response = new Promise((res) => (resolveFn = res)) as any;
        response!.resolve = resolveFn!;
        fetch.mock.set(url.pathname, response!);
      }
      return response!;
    },
    {
      mock: new Map<string, Response & { resolve: (response: Response) => void }>(),
    }
  );
  const swState = createState(fetch as any, new URL('http://unit-test/service-worker.js'));
  (swState as any).mockCache = cache;
  swState.$getCache$ = () => {
    return (swState.$cache$ = cache as any);
  };
  return swState as any as typeof swState & {
    mockCache: typeof cache;
    $fetch$: typeof fetch;
  };
}

function createGraph(graph: Array<string[]>): Array<string | number> {
  const map = new Map<string, number>();
  const swGraph: Array<string | number> = [];
  for (const bundleDeps of graph) {
    const bundleName = bundleDeps[0];
    const index = swGraph.length;
    map.set(bundleName, index);
    swGraph.push(bundleName);
    while (index + bundleDeps.length > swGraph.length) {
      swGraph.push(null!);
    }
  }
  // Second pass to to update dependency pointers
  for (const bundleDeps of graph) {
    const bundleName = bundleDeps[0];
    const index = map.get(bundleName)!;
    for (let i = 1; i < bundleDeps.length; i++) {
      const depName = bundleDeps[i];
      const depIndex = map.get(depName)!;
      if (depIndex == undefined) {
        throw new Error(`Missing dependency: ${depName}`);
      }
      swGraph[index + i] = depIndex;
    }
  }
  return swGraph;
}
const areFetching = (q: SWTask): boolean => q.$isFetching$;
const getPathname = (q: SWTask): string => q.$url$.pathname;
