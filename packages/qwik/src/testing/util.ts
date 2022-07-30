import { normalize } from 'path';
import { pathToFileURL } from 'url';
import { isPromise } from '../core/util/promises';

export function toFileUrl(filePath: string) {
  return pathToFileURL(filePath).href;
}

export { isPromise };

export function normalizePath(path: string) {
  path = normalize(path);

  // MIT https://github.com/sindresorhus/slash/blob/main/license
  // Convert Windows backslash paths to slash paths: foo\\bar ➔ foo/bar
  const isExtendedLengthPath = /^\\\\\?\\/.test(path);
  const hasNonAscii = /[^\u0000-\u0080]+/.test(path); // eslint-disable-line no-control-regex

  if (isExtendedLengthPath || hasNonAscii) {
    return path;
  }

  path = path.replace(/\\/g, '/');
  if (path.endsWith('/')) {
    path = path.slice(0, path.length - 1);
  }
  return path;
}

/**
 * Walks the object graph and replaces any DOM Nodes with their string representation.
 *
 * This is useful when making asserts as DOM nodes show up as text.
 *
 * @param value
 * @returns
 */
export function html<T = any>(value: T): T {
  if (value !== null) {
    if (Array.isArray(value)) {
      return value.map(html) as any;
    } else if (typeof value === 'object') {
      if (isElement(value)) {
        return value.outerHTML as any;
      } else if (isNode(value)) {
        return value.textContent as any;
      } else {
        const obj: any = {};
        for (const key in value) {
          if (Object.prototype.hasOwnProperty.call(value, key)) {
            obj[key] = html(value[key]);
          }
        }
        return obj;
      }
    }
  }
  return value;
}

function isNode(value: any): value is Node {
  return 'outerHTML' in value;
}

function isElement(value: any): value is HTMLElement {
  return isNode(value) && value.nodeType == 1 /*ELEMENT_NODE*/;
}

export function normalizeUrl(url: string | URL | undefined | null) {
  if (url != null) {
    if (typeof url === 'string') {
      return new URL(url || '/', BASE_URI);
    }
    if (typeof url.href === 'string') {
      return new URL(url.href || '/', BASE_URI);
    }
  }
  return new URL(BASE_URI);
}

const BASE_URI = `http://document.qwik.dev/`;

declare const WorkerGlobalScope: any;

const __globalThis = typeof globalThis !== 'undefined' && globalThis;
const __window = typeof window !== 'undefined' && window;
const __self =
  typeof self !== 'undefined' &&
  typeof WorkerGlobalScope !== 'undefined' &&
  self instanceof WorkerGlobalScope &&
  self;
const __global = typeof global !== 'undefined' && global;
export const platformGlobal: { document: Document | undefined } = (__globalThis ||
  __global ||
  __window ||
  __self) as any;
