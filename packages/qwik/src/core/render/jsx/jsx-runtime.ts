import type { FunctionComponent, JSXNode, ProcessedJSXNode } from './types/jsx-node';
import type { QwikJSX } from './types/jsx-qwik';
import { qDev } from '../../util/qdev';
import { Host, SkipRerender } from './host.public';
import { EMPTY_ARRAY } from '../../util/flyweight';
import { logWarn } from '../../util/log';
import { isArray, isFunction, isObject, isString, ValueOrPromise } from '../../util/types';
import { isNotNullable, isPromise, promiseAll, then } from '../../util/promises';
import { InvokeContext, useInvoke } from '../../use/use-core';
import { qError, QError_invalidJsxNodeType } from '../../error/error';

/**
 * @public
 */
export const jsx = <T extends string | FunctionComponent<PROPS>, PROPS>(
  type: T,
  props: PROPS,
  key?: string | number
): JSXNode<T> => {
  return new JSXNodeImpl<T>(type, props, key);
};

export const HOST_TYPE = ':host';
export const SKIP_RENDER_TYPE = ':skipRender';

export class JSXNodeImpl<T> implements JSXNode<T> {
  constructor(
    public type: T,
    public props: Record<string, any>,
    public key: string | number | null = null
  ) {}
}

export class ProcessedJSXNodeImpl implements ProcessedJSXNode {
  $elm$: Element | null = null;
  $text$: string = '';

  constructor(
    public $type$: string,
    public $props$: Record<string, any> | null,
    public $children$: ProcessedJSXNode[],
    public $key$: string | null
  ) {}
}

export const processNode = (
  node: JSXNode,
  invocationContext?: InvokeContext
): ValueOrPromise<ProcessedJSXNode | ProcessedJSXNode[] | undefined> => {
  const key = node.key != null ? String(node.key) : null;
  let textType = '';
  if (node.type === Host) {
    textType = HOST_TYPE;
  } else if (node.type === SkipRerender) {
    textType = SKIP_RENDER_TYPE;
  } else if (isFunction(node.type)) {
    const res = invocationContext
      ? useInvoke(invocationContext, () => node.type(node.props, node.key))
      : node.type(node.props, node.key);
    return processData(res, invocationContext);
  } else if (isString(node.type)) {
    textType = node.type;
  } else {
    throw qError(QError_invalidJsxNodeType, node.type);
  }
  let children: ProcessedJSXNode[] = EMPTY_ARRAY;
  if (node.props) {
    const mightPromise = processData(node.props.children, invocationContext);
    return then(mightPromise, (result) => {
      if (result !== undefined) {
        if (isArray(result)) {
          children = result;
        } else {
          children = [result];
        }
      }
      return new ProcessedJSXNodeImpl(textType, node.props, children, key);
    });
  }
  return new ProcessedJSXNodeImpl(textType, node.props, children, key);
};

export const processData = (
  node: any,
  invocationContext?: InvokeContext
): ValueOrPromise<ProcessedJSXNode[] | ProcessedJSXNode | undefined> => {
  if (node == null || typeof node === 'boolean') {
    return undefined;
  }
  if (isJSXNode(node)) {
    return processNode(node, invocationContext);
  } else if (isPromise(node)) {
    return node.then((node) => processData(node, invocationContext));
  } else if (isArray(node)) {
    const output = promiseAll(node.flatMap((n) => processData(n, invocationContext)));
    return then(output, (array) => array.flat(100).filter(isNotNullable));
  } else if (isString(node) || typeof node === 'number') {
    const newNode = new ProcessedJSXNodeImpl('#text', null, EMPTY_ARRAY, null);
    newNode.$text$ = String(node);
    return newNode;
  } else {
    logWarn('A unsupported value was passed to the JSX, skipping render. Value:', node);
    return undefined;
  }
};

export const isJSXNode = (n: any): n is JSXNode<unknown> => {
  if (qDev) {
    if (n instanceof JSXNodeImpl) {
      return true;
    }
    if (isObject(n) && 'key' in n && 'props' in n && 'type' in n) {
      logWarn(`Duplicate implementations of "JSXNode" found`);
      return true;
    }
    return false;
  } else {
    return n instanceof JSXNodeImpl;
  }
};

export const isProcessedJSXNode = (n: any): n is ProcessedJSXNode => {
  if (qDev) {
    if (n instanceof ProcessedJSXNodeImpl) {
      return true;
    }
    if (isObject(n) && n.constructor.name === ProcessedJSXNodeImpl.name) {
      throw new Error(`Duplicate implementations of "ProcessedJSXNodeImpl" found`);
    }
    return false;
  } else {
    return n instanceof ProcessedJSXNodeImpl;
  }
};

/**
 * @public
 */
export const Fragment: FunctionComponent<{ children?: any }> = (props) => props.children as any;

export type { QwikJSX as JSX };

export { jsx as jsxs, jsx as jsxDEV };
