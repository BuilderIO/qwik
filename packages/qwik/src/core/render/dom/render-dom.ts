import { qError, QError_invalidJsxNodeType } from '../../error/error';
import { type InvokeContext, newInvokeContext, invoke } from '../../use/use-core';
import { EMPTY_ARRAY, EMPTY_OBJ } from '../../util/flyweight';
import { logWarn } from '../../util/log';
import { isNotNullable, isPromise, promiseAll, maybeThen } from '../../util/promises';
import { qDev, qInspector, seal } from '../../util/qdev';
import { isArray, isFunction, isObject, isString, type ValueOrPromise } from '../../util/types';
import { domToVnode, smartUpdateChildren } from './visitor';
import { SkipRender } from '../jsx/utils.public';
import { isJSXNode, SKIP_RENDER_TYPE, _jsxC, Virtual } from '../jsx/jsx-runtime';
import type { DevJSX, JSXNode } from '../jsx/types/jsx-node';
import { executeComponent, shouldWrapFunctional } from '../execute-component';
import type { RenderContext } from '../types';
import { type QwikElement, VIRTUAL, type VirtualElement } from './virtual-element';
import { appendHeadStyle } from './operations';
import { isSignal, type Signal } from '../../state/signal';
import { HOST_FLAG_MOUNTED, type QContext } from '../../state/context';

export const renderComponent = (
  rCtx: RenderContext,
  elCtx: QContext,
  flags: number
): ValueOrPromise<void> => {
  const justMounted = !(elCtx.$flags$ & HOST_FLAG_MOUNTED);
  const hostElement = elCtx.$element$;
  const containerState = rCtx.$static$.$containerState$;
  // Component is not dirty any more
  containerState.$hostsStaging$.delete(elCtx);
  // Clean current subscription before render
  containerState.$subsManager$.$clearSub$(hostElement);

  // TODO, serialize scopeIds
  return maybeThen(executeComponent(rCtx, elCtx), (res) => {
    const staticCtx = rCtx.$static$;
    const newCtx = res.rCtx;
    const iCtx = newInvokeContext(rCtx.$static$.$locale$, hostElement);
    staticCtx.$hostElements$.add(hostElement);
    iCtx.$subscriber$ = [0, hostElement];
    iCtx.$renderCtx$ = newCtx;
    if (justMounted) {
      if (elCtx.$appendStyles$) {
        for (const style of elCtx.$appendStyles$) {
          appendHeadStyle(staticCtx, style);
        }
      }
    }
    const processedJSXNode = processData(res.node, iCtx);
    return maybeThen(processedJSXNode, (processedJSXNode) => {
      const newVdom = wrapJSX(hostElement, processedJSXNode);
      // const oldVdom = getVdom(hostElement);
      const oldVdom = getVdom(elCtx);
      return maybeThen(smartUpdateChildren(newCtx, oldVdom, newVdom, flags), () => {
        // setVdom(hostElement, newVdom);
        elCtx.$vdom$ = newVdom;
      });
    });
  });
};

export const getVdom = (elCtx: QContext) => {
  if (!elCtx.$vdom$) {
    elCtx.$vdom$ = domToVnode(elCtx.$element$);
  }
  return elCtx.$vdom$;
};

export class ProcessedJSXNodeImpl implements ProcessedJSXNode {
  $elm$: Node | VirtualElement | null = null;
  $text$: string = '';
  $signal$: Signal<any> | null = null;
  $id$: string;
  $dev$: DevJSX | undefined;

  constructor(
    public $type$: string,
    public $props$: Record<string, any>,
    public $immutableProps$: Record<string, any> | null,
    public $children$: ProcessedJSXNode[],
    public $flags$: number,
    public $key$: string | null
  ) {
    this.$id$ = $type$ + ($key$ ? ':' + $key$ : '');
    if (qDev && qInspector) {
      this.$dev$ = undefined;
    }
    seal(this);
  }
}

export const processNode = (
  node: JSXNode,
  invocationContext?: InvokeContext
): ValueOrPromise<ProcessedJSXNode | ProcessedJSXNode[] | undefined> => {
  const { key, type, props, children, flags, immutableProps } = node;
  let textType = '';
  if (isString(type)) {
    textType = type;
  } else if (type === Virtual) {
    textType = VIRTUAL;
  } else if (isFunction(type)) {
    const res = invoke(invocationContext, type, props, key, flags, node.dev);
    if (!shouldWrapFunctional(res, node)) {
      return processData(res, invocationContext);
    }
    return processNode(_jsxC(Virtual, { children: res }, null, 0, key), invocationContext);
  } else {
    throw qError(QError_invalidJsxNodeType, type);
  }
  let convertedChildren = EMPTY_ARRAY as ProcessedJSXNode[];
  if (children != null) {
    return maybeThen(processData(children, invocationContext), (result) => {
      if (result !== undefined) {
        convertedChildren = isArray(result) ? result : [result];
      }
      const vnode = new ProcessedJSXNodeImpl(
        textType,
        props,
        immutableProps,
        convertedChildren,
        flags,
        key
      );
      if (qDev && qInspector) {
        vnode.$dev$ = node.dev;
      }
      return vnode;
    });
  } else {
    const vnode = new ProcessedJSXNodeImpl(
      textType,
      props,
      immutableProps,
      convertedChildren,
      flags,
      key
    );
    if (qDev && qInspector) {
      vnode.$dev$ = node.dev;
    }
    return vnode;
  }
};

export const wrapJSX = (
  element: QwikElement,
  input: ProcessedJSXNode[] | ProcessedJSXNode | undefined
) => {
  const children: ProcessedJSXNode[] =
    input === undefined ? EMPTY_ARRAY : isArray(input) ? input : [input];
  const node = new ProcessedJSXNodeImpl(':virtual', {}, null, children, 0, null);
  node.$elm$ = element;
  return node;
};

export const processData = (
  node: any,
  invocationContext?: InvokeContext
): ValueOrPromise<ProcessedJSXNode[] | ProcessedJSXNode | undefined> => {
  if (node == null || typeof node === 'boolean') {
    return undefined;
  }
  if (isPrimitive(node)) {
    const newNode = new ProcessedJSXNodeImpl('#text', EMPTY_OBJ, null, EMPTY_ARRAY, 0, null);
    newNode.$text$ = String(node);
    return newNode;
  } else if (isJSXNode(node)) {
    return processNode(node, invocationContext);
  } else if (isSignal(node)) {
    const newNode = new ProcessedJSXNodeImpl('#signal', EMPTY_OBJ, null, EMPTY_ARRAY, 0, null);
    newNode.$signal$ = node;
    return newNode;
  } else if (isArray(node)) {
    const output = promiseAll(node.flatMap((n) => processData(n, invocationContext)));
    return maybeThen(output, (array) => array.flat(100).filter(isNotNullable));
  } else if (isPromise(node)) {
    return node.then((node) => processData(node, invocationContext));
  } else if (node === SkipRender) {
    return new ProcessedJSXNodeImpl(SKIP_RENDER_TYPE, EMPTY_OBJ, null, EMPTY_ARRAY, 0, null);
  } else {
    logWarn('A unsupported value was passed to the JSX, skipping render. Value:', node);
    return undefined;
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

export const isPrimitive = (obj: any) => {
  return isString(obj) || typeof obj === 'number';
};

export type ProcessedJSXNodeType =
  | '#text'
  | ':virtual'
  | ':signal'
  | typeof SKIP_RENDER_TYPE
  | string;

export interface ProcessedJSXNode {
  $type$: ProcessedJSXNodeType;
  $id$: string;
  $props$: Record<string, any>;
  $immutableProps$: Record<string, any> | null;
  $flags$: number;
  $children$: ProcessedJSXNode[];
  $key$: string | null;
  $elm$: Node | VirtualElement | null;
  $text$: string;
  $signal$: Signal<any> | null;
  $dev$?: DevJSX;
}
