import { EMPTY_ARRAY } from '../util/flyweight';
import type { QRL } from './qrl.public';
import { assertQrl, createQRL, QRLInternal } from './qrl-class';
import { isFunction, isString } from '../util/types';
import type { CorePlatform } from '../platform/types';
import { getDocument } from '../util/dom';
import { logError } from '../util/log';
import { tryGetInvokeContext } from '../use/use-core';
import {
  codeToText,
  qError,
  QError_dynamicImportFailed,
  QError_runtimeQrlNoElement,
  QError_unknownTypeArgument,
} from '../error/error';
import { qTest } from '../util/qdev';
import { getPlatform } from '../platform/platform';
import type { QContext } from '../props/props';

let runtimeSymbolId = 0;
const RUNTIME_QRL = '/runtimeQRL';
const INLINED_QRL = '/inlinedQRL';

// https://regexr.com/68v72
const EXTRACT_IMPORT_PATH = /\(\s*(['"])([^\1]+)\1\s*\)/;

// https://regexr.com/690ds
const EXTRACT_SELF_IMPORT = /Promise\s*\.\s*resolve/;

// https://regexr.com/6a83h
const EXTRACT_FILE_NAME = /[\\/(]([\w\d.\-_]+\.(js|ts)x?):/;

// <docs markdown="../readme.md#qrl">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!!
// (edit ../readme.md#qrl instead)
/**
 * Used by Qwik Optimizer to point to lazy-loaded resources.
 *
 * This function should be used by the Qwik Optimizer only. The function should not be directly
 * referred to in the source code of the application.
 *
 * @see `QRL`, `$(...)`
 *
 * @param chunkOrFn - Chunk name (or function which is stringified to extract chunk name)
 * @param symbol - Symbol to lazy load
 * @param lexicalScopeCapture - a set of lexically scoped variables to capture.
 * @alpha
 */
// </docs>
export const qrl = <T = any>(
  chunkOrFn: string | (() => Promise<any>),
  symbol: string,
  lexicalScopeCapture: any[] = EMPTY_ARRAY
): QRL<T> => {
  let chunk: string;
  let symbolFn: null | (() => Promise<Record<string, any>>) = null;
  if (isString(chunkOrFn)) {
    chunk = chunkOrFn;
  } else if (isFunction(chunkOrFn)) {
    symbolFn = chunkOrFn;
    let match: RegExpMatchArray | null;
    const srcCode = String(chunkOrFn);
    if ((match = srcCode.match(EXTRACT_IMPORT_PATH)) && match[2]) {
      chunk = match[2];
    } else if ((match = srcCode.match(EXTRACT_SELF_IMPORT))) {
      const ref = 'QWIK-SELF';
      const frames = new Error(ref).stack!.split('\n');
      const start = frames.findIndex((f) => f.includes(ref));
      const frame = frames[start + 2];
      match = frame.match(EXTRACT_FILE_NAME);
      if (!match) {
        chunk = 'main';
      } else {
        chunk = match[1];
      }
    } else {
      throw qError(QError_dynamicImportFailed, srcCode);
    }
  } else {
    throw qError(QError_unknownTypeArgument, chunkOrFn);
  }

  // Unwrap subscribers
  const qrl = createQRL<T>(chunk, symbol, null, symbolFn, null, lexicalScopeCapture, null);
  const ctx = tryGetInvokeContext();
  if (ctx && ctx.$element$) {
    qrl.$setContainer$(ctx.$element$);
  }
  return qrl as any;
};

export const runtimeQrl = <T>(
  symbol: T,
  lexicalScopeCapture: any[] = EMPTY_ARRAY
): QRLInternal<T> => {
  return createQRL<T>(
    RUNTIME_QRL,
    's' + runtimeSymbolId++,
    symbol,
    null,
    null,
    lexicalScopeCapture,
    null
  );
};

/**
 * @alpha
 */
export const inlinedQrl = <T>(
  symbol: T,
  symbolName: string,
  lexicalScopeCapture: any[] = EMPTY_ARRAY
): QRL<T> => {
  // Unwrap subscribers
  return createQRL<T>(INLINED_QRL, symbolName, symbol, null, null, lexicalScopeCapture, null);
};

export interface QRLSerializeOptions {
  $platform$?: CorePlatform;
  $element$?: Element;
  $getObjId$?: (obj: any) => string | null;
}

export const stringifyQRL = (qrl: QRLInternal, opts: QRLSerializeOptions = {}) => {
  assertQrl(qrl);
  let symbol = qrl.$symbol$;
  let chunk = qrl.$chunk$;
  const refSymbol = qrl.$refSymbol$ ?? symbol;
  const platform = opts.$platform$;
  const element = opts.$element$;
  if (platform) {
    const result = platform.chunkForSymbol(refSymbol);
    if (result) {
      chunk = result[1];
      if (!qrl.$refSymbol$) {
        symbol = result[0];
      }
    }
  }
  const parts: string[] = [chunk];
  if (symbol && symbol !== 'default') {
    if (chunk === RUNTIME_QRL && qTest) {
      symbol = '_';
    }
    parts.push('#', symbol);
  }
  const capture = qrl.$capture$;
  const captureRef = qrl.$captureRef$;
  if (opts.$getObjId$) {
    if (captureRef && captureRef.length) {
      const capture = captureRef.map(opts.$getObjId$);
      parts.push(`[${capture.join(' ')}]`);
    }
  } else if (capture && capture.length > 0) {
    parts.push(`[${capture.join(' ')}]`);
  }
  const qrlString = parts.join('');
  if (qrl.$chunk$ === RUNTIME_QRL && element) {
    const qrls: Set<QRL> = (element as any).__qrls__ || ((element as any).__qrls__ = new Set());
    qrls.add(qrl);
  }
  return qrlString;
};

export const serializeQRLs = (existingQRLs: QRLInternal<any>[], ctx: QContext): string => {
  const opts: QRLSerializeOptions = {
    $platform$: getPlatform(ctx.$element$),
    $element$: ctx.$element$,
  };
  return existingQRLs.map((qrl) => stringifyQRL(qrl, opts)).join(' ');
};

export const qrlToUrl = (element: Element, qrl: QRLInternal): URL => {
  return new URL(stringifyQRL(qrl), getDocument(element).baseURI);
};

/**
 * `./chunk#symbol[captures]
 */
export const parseQRL = (qrl: string, el?: Element): QRLInternal => {
  const endIdx = qrl.length;
  const hashIdx = indexOf(qrl, 0, '#');
  const captureIdx = indexOf(qrl, hashIdx, '[');

  const chunkEndIdx = Math.min(hashIdx, captureIdx);
  const chunk = qrl.substring(0, chunkEndIdx);

  const symbolStartIdx = hashIdx == endIdx ? hashIdx : hashIdx + 1;
  const symbolEndIdx = captureIdx;
  const symbol =
    symbolStartIdx == symbolEndIdx ? 'default' : qrl.substring(symbolStartIdx, symbolEndIdx);

  const captureStartIdx = captureIdx;
  const captureEndIdx = endIdx;
  const capture =
    captureStartIdx === captureEndIdx
      ? EMPTY_ARRAY
      : qrl.substring(captureStartIdx + 1, captureEndIdx - 1).split(' ');

  if (chunk === RUNTIME_QRL) {
    logError(codeToText(QError_runtimeQrlNoElement), qrl);
  }
  const iQrl = createQRL<any>(chunk, symbol, null, null, capture, null, null);
  if (el) {
    iQrl.$setContainer$(el);
  }
  return iQrl;
};

const indexOf = (text: string, startIdx: number, char: string) => {
  const endIdx = text.length;
  const charIdx = text.indexOf(char, startIdx == endIdx ? 0 : startIdx);
  return charIdx == -1 ? endIdx : charIdx;
};
