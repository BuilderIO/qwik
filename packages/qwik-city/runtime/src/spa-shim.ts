import type { ScrollHistoryState } from './scroll-restoration';

import { isDev, isServer } from '@builder.io/qwik/build';
import { getPlatform } from '@builder.io/qwik';
import { basePathname } from '@qwik-city-plan';

import init from './spa-init';

export default () => {
  if (isServer) {
    const [symbol, bundle] = getPlatform().chunkForSymbol(init.getSymbol(), null)!;
    const path = (!isDev ? basePathname + 'build/' : '') + bundle;
    return `(${shim.toString()})('${path}', '${symbol}');`;
  }
};

/**
 * !!! DO NOT IMPORT OR USE ANY EXTERNAL REFERENCES IN THIS SCRIPT.
 */
const shim = async (path: string, symbol: string) => {
  /**
   * This should always be 'manual' if a page was arrived at via SPA.
   * Robust, stored in browser history state, will always be attached to history entry.
   * If this is not set, your page is MPA and never had an SPA context. (no pop needed?)
   */
  if (!(window as any)._qcs && history.scrollRestoration === 'manual') {
    // TODO Option to remove this shim especially for MFEs, like loader, for now we only run once.
    (window as any)._qcs = true;

    const scrollState = (history.state as ScrollHistoryState)?._qCityScroll;
    if (scrollState) {
      window.scrollTo(scrollState.x, scrollState.y);
    }

    const currentScript = document.currentScript as HTMLScriptElement;
    if (!isDev) {
      (await import(path))[symbol](currentScript);
    } else {
      // Importing @qwik-city-plan here explodes dev, get basePathname manually.
      const container = currentScript.closest('[q\\:container]')!;
      const base = new URL(container.getAttribute('q:base')!, document.baseURI);
      const url = new URL(path, base);

      // Bypass dev import hijack. (not going to work here)
      // eslint-disable-next-line no-new-func
      const imp = new Function('url', 'return import(url)');
      (await imp(url.href))[symbol](currentScript);
    }
  }
};
