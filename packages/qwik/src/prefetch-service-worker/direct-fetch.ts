import type { SWGraph } from './process-message';
import type { SWState, SWStateBase, SWTask } from './state';

const HIGH_PRIORITY = Number.MAX_SAFE_INTEGER >>> 1;
const LOW_PRIORITY = 0;

export function directFetch(
  swState: SWState,
  url: URL,
  highPriority = false
): Promise<Response> | undefined {
  const [basePath, filename] = parseBaseFilename(url);
  const base = swState.$bases$.find((base) => basePath === base.$path$);
  if (base) {
    swState.$log$('intercepting', url.pathname);
    // Check if direct here
    // Ignore any request which we are not aware of through base.
    const priority = highPriority ? HIGH_PRIORITY : LOW_PRIORITY;
    return enqueueFileAndDependencies(swState, base, [filename], priority).then(() =>
      getResponse(swState, url)
    );
  }
  return undefined;
}

export async function enqueueFileAndDependencies(
  swState: SWState,
  base: SWStateBase,
  filenames: string[],
  priority: number
) {
  const fetchSet = new Set<string>();
  filenames.forEach((filename) => addDependencies(base.$graph$, fetchSet, filename));
  await Promise.all(
    Array.from(fetchSet).map((filename) =>
      enqueueFetchIfNeeded(swState, new URL(base.$path$ + filename, swState.$url$), priority)
    )
  );
  taskTick(swState);
}

function getResponse(swState: SWState, url: URL): Promise<Response> {
  const currentRequestTask = swState.$queue$.find((task) => task.$url$.pathname === url.pathname)!;
  if (!currentRequestTask) {
    swState.$log$('CACHE HIT', url.pathname);
    return swState.$match$(url) as Promise<Response>;
  } else {
    return currentRequestTask.$response$.then((response) => response.clone());
  }
}

async function enqueueFetchIfNeeded(swState: SWState, url: URL, priority: number) {
  let task = swState.$queue$.find((task) => task.$url$.pathname === url.pathname);
  const mode = priority > HIGH_PRIORITY ? 'direct' : 'prefetch';
  if (task) {
    const state = task.$isFetching$ ? 'fetching' : 'waiting';
    if (task.$priority$ < priority) {
      swState.$log$('queue update priority', state, url.pathname);
      task.$priority$ = priority;
    } else {
      swState.$log$('already in queue', mode, state, url.pathname);
    }
  } else {
    const cacheEntry = await swState.$match$(url);
    if (!cacheEntry) {
      swState.$log$('enqueue', mode, url.pathname);
      task = {
        $priority$: priority,
        $url$: url,
        $resolveResponse$: null!,
        $response$: null!,
        $isFetching$: false,
      };
      task.$response$ = new Promise<Response>((resolve) => (task!.$resolveResponse$ = resolve));
      swState.$queue$.push(task);
    }
  }
  return task;
}

function taskTick(swState: SWState) {
  swState.$queue$.sort(byFetchOrder);
  let outstandingRequests = 0;
  for (const task of swState.$queue$) {
    if (task.$isFetching$) {
      outstandingRequests++;
    } else if (
      swState.$getCache$() &&
      (outstandingRequests < swState.$maxPrefetchRequests$ || task.$priority$ >= HIGH_PRIORITY)
    ) {
      task.$isFetching$ = true;
      outstandingRequests++;
      const action = task.$priority$ > HIGH_PRIORITY ? 'FETCH (CACHE MISS)' : 'FETCH';
      swState.$log$(action, task.$url$.pathname);
      swState
        .$fetch$(task.$url$)
        .then(async (response) => {
          task.$resolveResponse$(response);
          if (response.status === 200) {
            swState.$log$('CACHED', task.$url$.pathname);
            await swState.$put$(task.$url$, response.clone());
          }
        })
        .finally(() => {
          swState.$log$('FETCH DONE', task.$url$.pathname);
          swState.$queue$.splice(swState.$queue$.indexOf(task), 1);
          outstandingRequests--;
          taskTick(swState);
        });
    }
  }
}

export function byFetchOrder(a: SWTask, b: SWTask) {
  return b.$priority$ - a.$priority$;
}

export function addDependencies(graph: SWGraph, fetchSet: Set<string>, filename: string) {
  if (!fetchSet.has(filename)) {
    fetchSet.add(filename);
    let index = graph.findIndex((file) => file === filename);
    if (index !== -1) {
      while (typeof graph[++index] === 'number') {
        const dependentIdx = graph[index] as number;
        const dependentFilename = graph[dependentIdx] as string;
        addDependencies(graph, fetchSet, dependentFilename);
      }
    }
  }
  return fetchSet;
}
export function parseBaseFilename(url: URL): [string, string] {
  const pathname = new URL(url).pathname;
  const slashIndex = pathname.lastIndexOf('/');
  return [pathname.substring(0, slashIndex + 1), pathname.substring(slashIndex + 1)];
}
