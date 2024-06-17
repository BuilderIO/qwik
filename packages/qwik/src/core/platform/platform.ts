import { isServer } from '@builder.io/qwik/build';
import { qError, QError_qrlMissingChunk, QError_qrlMissingContainer } from '../error/error';
import { getSymbolHash } from '../qrl/qrl-class';
import type { QwikElement } from '../render/dom/virtual-element';
import { qDynamicPlatform } from '../util/qdev';
import type { CorePlatform } from './types';

export const createPlatform = (): CorePlatform => {
  return {
    isServer,
    importSymbol(containerEl, url, symbolName) {
      if (isServer) {
        const hash = getSymbolHash(symbolName);
        const regSym = (globalThis as any).__qwik_reg_symbols?.get(hash);
        if (regSym) {
          return regSym;
        }
      }
      if (!url) {
        throw qError(QError_qrlMissingChunk, symbolName);
      }
      if (!containerEl) {
        throw qError(QError_qrlMissingContainer, url, symbolName);
      }
      const urlDoc = toUrl(containerEl.ownerDocument, containerEl, url).toString();
      const urlCopy = new URL(urlDoc);
      urlCopy.hash = '';
      urlCopy.search = '';
      const importURL = urlCopy.href;
      return import(/* @vite-ignore */ importURL).then((mod) => {
        return mod[symbolName];
      });
    },
    raf: (fn) => {
      return new Promise((resolve) => {
        requestAnimationFrame(() => {
          resolve(fn());
        });
      });
    },
    nextTick: (fn) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(fn());
        });
      });
    },
    chunkForSymbol(symbolName, chunk) {
      return [symbolName, chunk ?? '_'];
    },
  };
};

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
export const toUrl = (doc: Document, containerEl: QwikElement, url: string | URL): URL => {
  const base = new URL(containerEl.getAttribute('q:base') ?? doc.baseURI, doc.baseURI);
  const isStartSlash = url.toString().startsWith('/');
  const isEndslash = base.pathname.endsWith('/');
  const pathUrl =
    (isEndslash && !isStartSlash
      ? base.pathname
      : isEndslash
        ? base.pathname.slice(0, -1)
        : base.pathname) + url;
  return new URL(pathUrl, !base.origin ? base : base.origin);
};

let _platform = /*#__PURE__ */ createPlatform();

// <docs markdown="./readme.md#setPlatform">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!!
// (edit ./readme.md#setPlatform instead)
/**
 * Sets the `CorePlatform`.
 *
 * This is useful to override the platform in tests to change the behavior of,
 * `requestAnimationFrame`, and import resolution.
 *
 * @param doc - The document of the application for which the platform is needed.
 * @param platform - The platform to use.
 * @public
 */
// </docs>
export const setPlatform = (plt: CorePlatform) => (_platform = plt);

// <docs markdown="./readme.md#getPlatform">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!!
// (edit ./readme.md#getPlatform instead)
/**
 * Retrieve the `CorePlatform`.
 *
 * The `CorePlatform` is also responsible for retrieving the Manifest, that contains mappings from
 * symbols to javascript import chunks. For this reason, `CorePlatform` can't be global, but is
 * specific to the application currently running. On server it is possible that many different
 * applications are running in a single server instance, and for this reason the `CorePlatform` is
 * associated with the application document.
 *
 * @param docOrNode - The document (or node) of the application for which the platform is needed.
 * @public
 */
// </docs>
export const getPlatform = (): CorePlatform => {
  return _platform;
};

export const isServerPlatform = () => {
  if (qDynamicPlatform) {
    return _platform.isServer;
  }
  return false;
};
