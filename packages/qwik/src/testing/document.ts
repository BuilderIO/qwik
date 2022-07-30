import { setTestPlatform } from './platform';
import type { MockDocumentOptions, MockWindow } from './types';
import qwikDom from '@builder.io/qwik-dom';
import { normalizeUrl } from './util';

/**
 * Create emulated `Document` for server environment. Does not implement the full browser
 * `document` and `window` API. This api may be removed in the future.
 * @internal
 */
export function createDocument(opts?: MockDocumentOptions) {
  const doc = qwikDom.createDocument(opts?.html);
  ensureGlobals(doc, opts);
  setTestPlatform(doc);
  return doc;
}

/**
 * Create emulated `window` useful for testing.
 */
export function createWindow(opts: MockDocumentOptions = {}): MockWindow {
  const win = createDocument(opts).defaultView!;
  return win;
}

export function ensureGlobals(doc: any, opts?: MockDocumentOptions) {
  if (!doc[QWIK_DOC]) {
    if (!doc || doc.nodeType !== 9) {
      throw new Error(`Invalid document`);
    }

    doc[QWIK_DOC] = true;

    const loc = normalizeUrl(opts?.url);

    Object.defineProperty(doc, 'baseURI', {
      get: () => loc.href,
      set: (url: string) => (loc.href = normalizeUrl(url).href),
    });

    doc.defaultView = {
      get document() {
        return doc;
      },
      get location() {
        return loc;
      },
      get origin() {
        return loc.origin;
      },
      addEventListener: noop,
      removeEventListener: noop,
      history: {
        pushState: noop,
        replaceState: noop,
        go: noop,
        back: noop,
        forward: noop,
      },
      CustomEvent: class CustomEvent {
        type: string;
        constructor(type: string, details: any) {
          Object.assign(this, details);
          this.type = type;
        }
      },
    };
  }

  return doc.defaultView;
}

const noop = () => {};

const QWIK_DOC = Symbol();
