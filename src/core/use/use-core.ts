import type { Props } from '../index';
import { assertDefined } from '../assert/assert';
import type { QwikDocument } from '../document';
import type { QRLInternal } from '../import/qrl-class';
import { OnRenderSelector } from '../util/markers';

declare const document: QwikDocument;

interface InvokeContext {
  hostElement: Element;
  event: any;
  url: URL | null;
  qrl?: QRLInternal;
  subscriptions: boolean;
  waitOn?: Promise<any>[];
  props?: Props;
  qrlGuard?: (qrl: QRLInternal) => boolean;
}

let _context: InvokeContext | undefined;

export function tryGetInvokeContext(): InvokeContext | undefined {
  return _context;
}

export function getInvokeContext(): InvokeContext {
  if (!_context) {
    const context = typeof document !== 'undefined' && document && document.__q_context__;
    if (!context) {
      // TODO(misko): centralize
      throw new Error("Q-ERROR: invoking 'use*()' method outside of invocation context.");
    }
    if (Array.isArray(context)) {
      const element = context[0].closest(OnRenderSelector)!;
      assertDefined(element);
      return (document.__q_context__ = newInvokeContext(element, context[1], context[2]));
    }
    return context as InvokeContext;
  }
  return _context;
}

export function useInvoke<ARGS extends any[] = any[], RET = any>(
  context: InvokeContext,
  fn: (...args: ARGS) => RET,
  ...args: ARGS
): RET | Promise<RET> {
  const previousContext = _context;
  let returnValue: RET;
  try {
    _context = context;
    returnValue = fn.apply(null, args);
  } finally {
    const currentCtx = _context!;
    _context = previousContext;
    if (currentCtx.waitOn && currentCtx.waitOn.length > 0) {
      // eslint-disable-next-line no-unsafe-finally
      return Promise.all(currentCtx.waitOn).then(() => returnValue);
    }
  }
  return returnValue;
}
export function newInvokeContext(hostElement: Element, event?: any, url?: URL): InvokeContext {
  return {
    hostElement: hostElement,
    event: event,
    url: url || null,
    qrl: undefined,
    subscriptions: event === 'qRender',
  };
}

/**
 * @private
 */
export function useWaitOn(promise: Promise<any>): void {
  const ctx = getInvokeContext();
  (ctx.waitOn || (ctx.waitOn = [])).push(promise);
}
