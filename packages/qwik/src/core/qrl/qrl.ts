import { EMPTY_ARRAY } from '../util/flyweight';
import type { QRL } from './qrl.public';
import {
  assertQrl,
  createQRL,
  emitEvent,
  getSymbolHash,
  isSyncQrl,
  type QRLInternal,
} from './qrl-class';
import { isFunction, isString } from '../util/types';
import {
  qError,
  QError_dynamicImportFailed,
  QError_qrlMissingChunk,
  QError_unknownTypeArgument,
} from '../error/error';
import { qRuntimeQrl, qSerialize } from '../util/qdev';
import { getPlatform } from '../platform/platform';
import { assertDefined, assertTrue, assertElement } from '../error/assert';
import type { ContainerState, MustGetObjID } from '../container/container';
import type { QContext } from '../state/context';
import { mapJoin } from '../container/pause';
import { throwErrorAndStop } from '../util/log';

// https://regexr.com/68v72
const EXTRACT_IMPORT_PATH = /\(\s*(['"])([^\1]+)\1\s*\)/;

// https://regexr.com/690ds
const EXTRACT_SELF_IMPORT = /Promise\s*\.\s*resolve/;

// https://regexr.com/6a83h
const EXTRACT_FILE_NAME = /[\\/(]([\w\d.\-_]+\.(js|ts)x?):/;

const announcedQRL = /*#__PURE__*/ new Set<string>();

/** @public */
export interface QRLDev {
  file: string;
  lo: number;
  hi: number;
}

// <docs markdown="../readme.md#qrl">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!!
// (edit ../readme.md#qrl instead)
/**
 * Used by Qwik Optimizer to point to lazy-loaded resources.
 *
 * This function should be used by the Qwik Optimizer only. The function should not be directly
 * referred to in the source code of the application.
 *
 * @param chunkOrFn - Chunk name (or function which is stringified to extract chunk name)
 * @param symbol - Symbol to lazy load
 * @param lexicalScopeCapture - A set of lexically scoped variables to capture.
 * @public
 * @see `QRL`, `$(...)`
 */
// </docs>
export const qrl = <T = any>(
  chunkOrFn: string | (() => Promise<any>),
  symbol: string,
  lexicalScopeCapture: any[] = EMPTY_ARRAY,
  stackOffset = 0
): QRL<T> => {
  let chunk: string | null = null;
  let symbolFn: null | (() => Promise<Record<string, any>>) = null;
  if (isFunction(chunkOrFn)) {
    symbolFn = chunkOrFn;
    if (qSerialize) {
      let match: RegExpMatchArray | null;
      const srcCode = String(chunkOrFn);
      if ((match = srcCode.match(EXTRACT_IMPORT_PATH)) && match[2]) {
        chunk = match[2];
      } else if ((match = srcCode.match(EXTRACT_SELF_IMPORT))) {
        const ref = 'QWIK-SELF';
        const frames = new Error(ref).stack!.split('\n');
        const start = frames.findIndex((f) => f.includes(ref));
        const frame = frames[start + 2 + stackOffset];
        match = frame.match(EXTRACT_FILE_NAME);
        if (!match) {
          chunk = 'main';
        } else {
          chunk = match[1];
        }
      } else {
        throw qError(QError_dynamicImportFailed, srcCode);
      }
    }
  } else if (isString(chunkOrFn)) {
    chunk = chunkOrFn;
  } else {
    throw qError(QError_unknownTypeArgument, chunkOrFn);
  }

  if (!announcedQRL.has(symbol)) {
    // Emit event
    announcedQRL.add(symbol);
    emitEvent('qprefetch', {
      symbols: [getSymbolHash(symbol)],
      bundles: [chunk],
    });
  }

  // Unwrap subscribers
  return createQRL<T>(chunk, symbol, null, symbolFn, null, lexicalScopeCapture, null);
};

/** @internal */
export const inlinedQrl = <T>(
  symbol: T,
  symbolName: string,
  lexicalScopeCapture: any[] = EMPTY_ARRAY
): QRL<T> => {
  // Unwrap subscribers
  return createQRL<T>(null, symbolName, symbol, null, null, lexicalScopeCapture, null);
};

/** @internal */
export const _noopQrl = <T>(
  symbolName: string,
  lexicalScopeCapture: any[] = EMPTY_ARRAY
): QRL<T> => {
  return createQRL<T>(null, symbolName, null, null, null, lexicalScopeCapture, null);
};

/** @internal */
export const _noopQrlDEV = <T>(
  symbolName: string,
  opts: QRLDev,
  lexicalScopeCapture: any[] = EMPTY_ARRAY
): QRL<T> => {
  const newQrl = _noopQrl(symbolName, lexicalScopeCapture) as QRLInternal<T>;
  newQrl.dev = opts;
  return newQrl;
};

/** @internal */
export const qrlDEV = <T = any>(
  chunkOrFn: string | (() => Promise<any>),
  symbol: string,
  opts: QRLDev,
  lexicalScopeCapture: any[] = EMPTY_ARRAY
): QRL<T> => {
  const newQrl = qrl(chunkOrFn, symbol, lexicalScopeCapture, 1) as QRLInternal<T>;
  newQrl.dev = opts;
  return newQrl;
};

/** @internal */
export const inlinedQrlDEV = <T = any>(
  symbol: T,
  symbolName: string,
  opts: QRLDev,
  lexicalScopeCapture: any[] = EMPTY_ARRAY
): QRL<T> => {
  const qrl = inlinedQrl(symbol, symbolName, lexicalScopeCapture) as QRLInternal<T>;
  qrl.dev = opts;
  return qrl;
};

export interface QRLSerializeOptions {
  $getObjId$?: MustGetObjID;
  $addRefMap$?: (obj: any) => string;
  $containerState$?: ContainerState;
}

export const serializeQRL = (qrl: QRLInternal, opts: QRLSerializeOptions = {}) => {
  assertTrue(qSerialize, 'In order to serialize a QRL, qSerialize must be true');
  assertQrl(qrl);
  let symbol = qrl.$symbol$;
  let chunk = qrl.$chunk$;
  const refSymbol = qrl.$refSymbol$ ?? symbol;
  const platform = getPlatform();

  if (platform) {
    const result = platform.chunkForSymbol(refSymbol, chunk, qrl.dev?.file);
    if (result) {
      chunk = result[1];
      if (!qrl.$refSymbol$) {
        symbol = result[0];
      }
    } else {
      console.error('serializeQRL: Cannot resolve symbol', symbol, 'in', chunk, qrl.dev?.file);
    }
  }

  if (qRuntimeQrl && chunk == null) {
    chunk = '/runtimeQRL';
    symbol = '_';
  }
  if (chunk == null) {
    throw qError(QError_qrlMissingChunk, qrl.$symbol$);
  }
  if (chunk.startsWith('./')) {
    chunk = chunk.slice(2);
  }
  if (isSyncQrl(qrl)) {
    if (opts.$containerState$) {
      const fn = qrl.resolved as Function;
      const containerState = opts.$containerState$;
      const fnStrKey = fn.toString();
      let id = containerState.$inlineFns$.get(fnStrKey);
      if (id === undefined) {
        id = containerState.$inlineFns$.size;
        containerState.$inlineFns$.set(fnStrKey, id);
      }
      symbol = String(id);
    } else {
      throwErrorAndStop('Sync QRL without containerState');
    }
  }
  let output = `${encodeURI(chunk)}#${symbol}`;
  const capture = qrl.$capture$;
  const captureRef = qrl.$captureRef$;
  if (captureRef && captureRef.length) {
    if (opts.$getObjId$) {
      output += `[${mapJoin(captureRef, opts.$getObjId$, ' ')}]`;
    } else if (opts.$addRefMap$) {
      output += `[${mapJoin(captureRef, opts.$addRefMap$, ' ')}]`;
    }
  } else if (capture && capture.length > 0) {
    output += `[${capture.join(' ')}]`;
  }
  return output;
};

export const serializeQRLs = (
  existingQRLs: QRLInternal<any>[],
  containerState: ContainerState,
  elCtx: QContext
): string => {
  assertElement(elCtx.$element$);
  const opts: QRLSerializeOptions = {
    $containerState$: containerState,
    $addRefMap$: (obj) => addToArray(elCtx.$refMap$, obj),
  };
  return mapJoin(existingQRLs, (qrl) => serializeQRL(qrl, opts), '\n');
};

/** `./chunk#[attr#][symbol][[captures]] */
export const parseQRL = <T = any>(qrl: string, containerEl?: Element): QRLInternal<T> => {
  const parse = /^(?<c>[^#[]*)#?((?<a>[^#]+)#)?(?<s>[^[]*)(\[(?<p>[^\]]*)\])?$/.exec(qrl);
  if (!parse) {
    throw new Error(`Invalid QRL format "${qrl}"`);
  }
  const { c, a, s, p } = parse.groups!;
  const chunk = `${decodeURI(c)}${a ? `#${a}` : ''}`;
  const symbol = s || 'default';
  const capture = p ? p.split(' ') : [];

  const iQrl = createQRL<any>(chunk, symbol, null, null, capture, null, null);
  if (containerEl) {
    iQrl.$setContainer$(containerEl);
  }
  return iQrl as QRLInternal<T>;
};

const addToArray = (array: any[], obj: any) => {
  const index = array.indexOf(obj);
  if (index === -1) {
    array.push(obj);
    return String(array.length - 1);
  }
  return String(index);
};

export const inflateQrl = (qrl: QRLInternal, elCtx: QContext) => {
  assertDefined(qrl.$capture$, 'invoke: qrl capture must be defined inside useLexicalScope()', qrl);
  return (qrl.$captureRef$ = qrl.$capture$.map((idx) => {
    const int = parseInt(idx, 10);
    const obj = elCtx.$refMap$[int];
    assertTrue(elCtx.$refMap$.length > int, 'out of bounds inflate access', idx);
    return obj;
  }));
};

/** @internal */
export const _regSymbol = (symbol: any, hash: string) => {
  if (typeof (globalThis as any).__qwik_reg_symbols === 'undefined') {
    (globalThis as any).__qwik_reg_symbols = new Map<string, any>();
  }
  (globalThis as any).__qwik_reg_symbols.set(hash, symbol);
  return symbol;
};
