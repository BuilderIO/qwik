import type { RenderToStringOptions } from './types';

/**
 * Utility timer function for performance profiling.
 * Returns a duration of 0 in environments that do not support performance.
 * @alpha
 */
export function createTimer() {
  if (typeof performance === 'undefined') {
    return () => 0;
  }
  const start = performance.now();
  return () => {
    const end = performance.now();
    const delta = end - start;
    return delta / 1000000;
  };
}

export function getBuildBase(opts: RenderToStringOptions) {
  let base = opts.base;
  if (typeof base === 'string') {
    if (!base.endsWith('/')) {
      base += '/';
    }
    return base;
  }
  return '/build/';
}

/**
 * @public
 */
export const versions = {
  qwik: (globalThis as any).QWIK_VERSION as string,
  qwikDom: (globalThis as any).QWIK_DOM_VERSION as string,
} as const;
