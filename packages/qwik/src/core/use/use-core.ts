import { isArray, isObject, ValueOrPromise } from '../util/types';
import type { Props } from '../props/props.public';
import { assertDefined } from '../assert/assert';
import type { QwikDocument } from '../document';
import { QContainerSelector, QHostAttr, RenderEvent } from '../util/markers';
import { getDocument } from '../util/dom';
import type { QRL } from '../import/qrl.public';
import type { Subscriber } from './use-subscriber';
import type { RenderContext } from '../render/cursor';
import { qError, QError_useInvokeContext, QError_useMethodOutsideContext } from '../error/error';

declare const document: QwikDocument;

export interface StyleAppend {
  type: 'style';
  styleId: string;
  content: string;
}

export interface InvokeContext {
  $url$: URL | null;
  $seq$: number;
  $doc$?: Document;
  $hostElement$?: Element;
  $element$?: Element;
  $event$: any;
  $qrl$?: QRL<any>;
  $waitOn$?: ValueOrPromise<any>[];
  $props$?: Props;
  $subscriber$?: Subscriber | null;
  $renderCtx$?: RenderContext;
  $scopeId$?: string;
}

export type RenderInvokeContext = Required<InvokeContext>;

let _context: InvokeContext | undefined;

export const CONTAINER = Symbol('container');

export const isStyleTask = (obj: any): obj is StyleAppend => {
  return isObject(obj) && obj.type === 'style';
};

export const tryGetInvokeContext = (): InvokeContext | undefined => {
  if (!_context) {
    const context = typeof document !== 'undefined' && document && document.__q_context__;
    if (!context) {
      return undefined;
    }
    if (isArray(context)) {
      const element = context[0];
      const hostElement = getHostElement(element);
      assertDefined(hostElement, `invoke: can not find hostElement from active element`, element);
      return (document.__q_context__ = newInvokeContext(
        getDocument(element),
        hostElement,
        element,
        context[1],
        context[2]
      ));
    }
    return context as InvokeContext;
  }
  return _context;
};

export const getInvokeContext = (): InvokeContext => {
  const ctx = tryGetInvokeContext();
  if (!ctx) {
    throw qError(QError_useMethodOutsideContext);
  }
  return ctx;
};

export const useInvokeContext = (): RenderInvokeContext => {
  const ctx = getInvokeContext();
  if (ctx.$event$ !== RenderEvent) {
    throw qError(QError_useInvokeContext);
  }
  assertDefined(ctx.$hostElement$, `invoke: $hostElement$ must be defined`, ctx);
  assertDefined(ctx.$waitOn$, `invoke: $waitOn$ must be defined`, ctx);
  assertDefined(ctx.$renderCtx$, `invoke: $renderCtx$ must be defined`, ctx);
  assertDefined(ctx.$doc$, `invoke: $doc$ must be defined`, ctx);
  assertDefined(ctx.$subscriber$, `invoke: $subscriber$ must be defined`, ctx);

  return ctx as any;
};

export const useInvoke = <ARGS extends any[] = any[], RET = any>(
  context: InvokeContext,
  fn: (...args: ARGS) => RET,
  ...args: ARGS
): RET => {
  const previousContext = _context;
  let returnValue: RET;
  try {
    _context = context;
    returnValue = fn.apply(null, args);
  } finally {
    _context = previousContext;
  }
  return returnValue;
};

export const newInvokeContext = (
  doc?: Document,
  hostElement?: Element,
  element?: Element,
  event?: any,
  url?: URL
): InvokeContext => {
  return {
    $seq$: 0,
    $doc$: doc,
    $hostElement$: hostElement,
    $element$: element,
    $event$: event,
    $url$: url || null,
    $qrl$: undefined,
  };
};

export const getHostElement = (el: Element): Element | null => {
  let foundSlot = false;
  let node: Element | null = el;
  while (node) {
    const isHost = node.hasAttribute(QHostAttr);
    const isSlot = node.tagName === 'Q:SLOT';
    if (isHost) {
      if (!foundSlot) {
        break;
      } else {
        foundSlot = false;
      }
    }
    if (isSlot) {
      foundSlot = true;
    }
    node = node.parentElement;
  }
  return node;
};

export const getContainer = (el: Element): Element | null => {
  let container = (el as any)[CONTAINER];
  if (!container) {
    container = el.closest(QContainerSelector);
    (el as any)[CONTAINER] = container;
  }
  return container;
};
