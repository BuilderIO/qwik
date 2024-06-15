import type { TestPlatform } from './types';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

function createPlatform() {
  interface Queue<T> {
    fn: () => Promise<T>;
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (value: any) => void;
  }

  let render: Queue<any> | null = null;

  const moduleCache = new Map<string, { [symbol: string]: any }>();
  const testPlatform: TestPlatform = {
    isServer: false,
    importSymbol(containerEl, url, symbolName) {
      if (!url) {
        throw new Error('Missing URL');
      }
      if (!containerEl) {
        throw new Error('Missing Container');
      }
      let attr: string | undefined;
      if (typeof url === 'string') {
        [url, attr] = url.split('#');
      }
      const urlDoc = toUrl(containerEl.ownerDocument, containerEl, url);
      const importPath = toPath(urlDoc);
      let mod = moduleCache.get(importPath);
      if (mod) {
        if (attr) {
          mod = mod[attr];
        }
        if (!mod || !(symbolName in mod)) {
          throw new Error(`Q-ERROR: missing symbol '${symbolName}' in module '${url}'.`);
        }
        return mod[symbolName];
      }
      return import(importPath).then((mod) => {
        moduleCache.set(importPath, mod);
        if (attr) {
          mod = mod[attr];
        }
        if (!mod || !(symbolName in mod)) {
          throw new Error(`Q-ERROR: missing symbol '${symbolName}' in module '${url}'.`);
        }
        return mod[symbolName];
      });
    },
    nextTick: (renderMarked) => {
      if (!render) {
        render = {
          fn: renderMarked,
          promise: null!,
          resolve: null!,
          reject: null!,
        };
        render.promise = new Promise((resolve, reject) => {
          render!.resolve = resolve;
          render!.reject = reject;
        });
      } else if (renderMarked !== render.fn) {
        // TODO(misko): proper error and test
        throw new Error('Must be same function');
      }
      return render.promise;
    },
    raf: (fn) => {
      return new Promise((resolve) => {
        // Do not use process.nextTick, as this will execute at same priority as promises.
        // We need to execute after promises.
        setTimeout(() => {
          resolve(fn());
        });
      });
    },
    flush: async () => {
      await Promise.resolve();
      if (render) {
        try {
          render.resolve(await render.fn());
        } catch (e) {
          render.reject(e);
        }
        render = null;
      }
    },
    chunkForSymbol() {
      return undefined;
    },
  };
  return testPlatform;
}

export function setTestPlatform(_setPlatform: Function) {
  _setPlatform(testPlatform);
}

/**
 * Convert relative base URI and relative URL into a fully qualified URL.
 *
 * @param base -`QRL`s are relative, and therefore they need a base for resolution.
 *
 *   - `Element` use `base.ownerDocument.baseURI`
 *   - `Document` use `base.baseURI`
 *   - `string` use `base` as is
 *   - `QConfig` use `base.baseURI`
 *
 * @param url - Relative URL
 * @returns Fully qualified URL.
 */
export function toUrl(doc: Document, containerEl: Element, url: string | URL): URL {
  const base = new URL(containerEl?.getAttribute('q:base') ?? doc.baseURI, doc.baseURI);
  return new URL(url, base);
}

function toPath(url: URL) {
  const normalizedUrl = new URL(String(url));
  normalizedUrl.hash = '';
  normalizedUrl.search = '';
  const path = fileURLToPath(String(normalizedUrl));
  const importPaths = [path, ...testExts.map((ext) => path + ext)];

  for (const importPath of importPaths) {
    if (existsSync(importPath)) {
      return importPath;
    }
  }

  throw new Error(`Unable to find path for import "${url}"`);
}

const testPlatform = createPlatform();

/** @public */
export function getTestPlatform(): TestPlatform {
  return testPlatform;
}

const testExts = ['.ts', '.tsx', '.js', '.cjs', '.mjs', '.jsx'];
