import { isDev } from '@builder.io/qwik/build';
import { _jsxQ } from '../internal';

/**
 * Install a service worker which will prefetch the bundles.
 *
 * There can only be one service worker per page. Because there can be many separate Qwik Containers
 * on the page each container needs to load its prefetch graph using `PrefetchGraph` component.
 *
 * @param opts - Options for the prefetch service worker.
 *
 *   - `base` - Base URL for the service worker.
 *   - `path` - Path to the service worker.
 *
 * @alpha
 */
export const PrefetchServiceWorker = (opts: {
  base?: string;
  path?: string;
  verbose?: boolean;
  fetchBundleGraph?: boolean;
}) => {
  const resolvedOpts = {
    base: '/',
    verbose: false,
    path: 'qwik-prefetch-service-worker.js',
    ...opts,
  };
  let code = PREFETCH_CODE.replace('URL', resolvedOpts.base + resolvedOpts.path).replace(
    'SCOPE',
    resolvedOpts.base
  );
  if (!isDev) {
    code = code.replaceAll(/\s+/gm, '');
  }
  const props = {
    dangerouslySetInnerHTML: [
      '(' + code + ')(',
      [
        "document.currentScript.closest('[q\\\\:container]')",
        'navigator.serviceWorker',
        'window.qwikPrefetchSW||(window.qwikPrefetchSW=[])',
        resolvedOpts.verbose,
      ].join(','),
      ');',
    ].join(''),
  };
  return _jsxQ('script', null, props, null, 0, 'prefetch-service-worker');
};

const PREFETCH_CODE = /*#__PURE__*/ ((
  qc: HTMLElement, // QwikContainer Element
  c: ServiceWorkerContainer, // Service worker container
  q: Array<any[]>, // Queue of messages to send to the service worker.
  v: boolean, // Verbose mode
  b?: string,
  h?: string
) => {
  b = qc.getAttribute('q:base')!;
  h = qc.getAttribute('q:manifest-hash')!;
  c.register('URL', { scope: 'SCOPE' }).then(
    (sw: ServiceWorkerRegistration, onReady?: () => void) => {
      onReady = () => q.forEach((q.push = (v) => sw.active!.postMessage(v) as any));
      sw.installing
        ? sw.installing.addEventListener(
            'statechange',
            (e: any) => e.target.state == 'activated' && onReady!()
          )
        : onReady();
    }
  );
  v && q.push(['verbose']);
  document.addEventListener(
    'qprefetch',
    (e: any) => e.detail.bundles && q.push(['prefetch', b, ...e.detail.bundles])
  );
}).toString();

/**
 * Load the prefetch graph for the container.
 *
 * Each Qwik container needs to include its own prefetch graph.
 *
 * @param opts - Options for the loading prefetch graph.
 *
 *   - `base` - Base of the graph. For a default installation this will default to `/build/`. But if
 *       more than one MFE is installed on the page, then each MFE needs to have its own base.
 *   - `manifestHash` - Hash of the manifest file to load. If not provided the hash will be extracted
 *       from the container attribute `q:manifest-hash` and assume the default build file
 *       `${base}/q-bundle-graph-${manifestHash}.json`.
 *   - `manifestURL` - URL of the manifest file to load if non-standard bundle graph location name.
 *
 * @alpha
 */
export const PrefetchGraph = (
  opts: { base?: string; manifestHash?: string; manifestURL?: string } = {}
) => {
  const resolvedOpts = {
    base: '/build/',
    manifestHash: null,
    manifestURL: null,
    ...opts,
  };
  let code = PREFETCH_GRAPH_CODE;
  if (!isDev) {
    code = code.replaceAll(/\s+/gm, '');
  }
  const props = {
    dangerouslySetInnerHTML: [
      '(' + code + ')(',
      [
        "document.currentScript.closest('[q\\\\:container]')",
        'window.qwikPrefetchSW||(window.qwikPrefetchSW=[])',
        JSON.stringify(resolvedOpts.base),
        JSON.stringify(resolvedOpts.manifestHash),
        JSON.stringify(resolvedOpts.manifestURL),
      ].join(','),
      ');',
    ].join(''),
  };
  return _jsxQ('script', null, props, null, 0, 'prefetch-graph');
};

const PREFETCH_GRAPH_CODE = /*#__PURE__*/ ((
  qc: HTMLElement, // QwikContainer Element
  q: Array<any[]>, // Queue of messages to send to the service worker.
  b: string, // Base URL
  h: string | null, // Manifest hash
  u: string | null // Manifest URL
) => {
  q.push(['graph-url', b, u || `q-bundle-graph-${h || qc.getAttribute('q:manifest-hash')}.json`]);
}).toString();
