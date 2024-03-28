import type { DevJSX, FunctionComponent, JSXNode } from './types/jsx-node';
import type { QwikJSX } from './types/jsx-qwik';
import { qDev, qRuntimeQrl, seal } from '../../util/qdev';
import { logError, logOnceWarn, logWarn } from '../../util/log';
import { isArray, isFunction, isObject, isString } from '../../util/types';
import { isQrl, type QRLInternal } from '../../qrl/qrl-class';
import { invoke, untrack } from '../../use/use-core';
import { verifySerializable } from '../../state/common';
import { isQwikComponent, type OnRenderFn } from '../../component/component.public';
import { SignalDerived, isSignal } from '../../state/signal';
import { isPromise } from '../../util/promises';
import { SkipRender } from './utils.public';
import { EMPTY_OBJ } from '../../util/flyweight';
import { _IMMUTABLE } from '../../internal';
import { isBrowser } from '@builder.io/qwik/build';
import { static_subtree } from '../execute-component';
import type { JsxChild } from 'typescript';
import { ELEMENT_ID, OnRenderProp, QScopedStyle, QSlot, QSlotS } from '../../util/markers';
import type { JSXChildren } from './types/jsx-qwik-attributes';

/**
 * Create a JSXNode with children already split
 *
 * @param type - The JSX type
 * @param mutableProps - The properties of the tag
 * @param immutableProps - The properties of the tag that are known to be static and don't need
 *   checking for changes on re-render
 * @param children - JSX children. Any `children` in the props objects are ignored.
 * @internal
 */
export const _jsxQ = <T>(
  type: T,
  mutableProps: Record<any, unknown>,
  immutableProps: Record<any, unknown> | null,
  children: JSXChildren | null,
  flags: number,
  key: string | number | null,
  dev?: DevJSX
): JSXNode<T> => {
  const processed = key == null ? null : String(key);
  const node = new JSXNodeImpl(
    type,
    mutableProps as any,
    immutableProps,
    children,
    flags,
    processed
  );
  if (qDev && dev) {
    node.dev = {
      stack: new Error().stack,
      ...dev,
    };
  }
  validateJSXNode(node);
  seal(node);
  return node;
};

/**
 * Create a JSXNode
 *
 * @param type - The tag type
 * @param mutableProps - The properties of the tag that could change, including children
 * @param immutableProps - The properties of the tag that are known to be static and don't need
 *   checking for changes on re-render
 * @internal
 */
export const _jsxC = <T extends string | FunctionComponent<any>>(
  type: T,
  mutableProps: Record<any, unknown> | null,
  immutableProps: Record<any, unknown> | null,
  flags: number,
  key: string | number | null,
  dev?: DevJSX
): JSXNode<T> => {
  let children;
  if (mutableProps) {
    children = mutableProps.children;
  } else {
    mutableProps = typeof type === 'string' ? EMPTY_OBJ : {};
  }
  return _jsxQ(type, mutableProps, immutableProps, children as JSXChildren, flags, key, dev);
};

/**
 * @public
 * Used by the JSX transpilers to create a JSXNode.
 * Note that the optimizer will not use this, instead using _jsxC and _jsxQ directly.
 */
export const jsx = <T extends string | FunctionComponent<any>>(
  type: T,
  props: T extends FunctionComponent<infer PROPS> ? PROPS : Record<any, unknown>,
  key?: string | number | null
): JSXNode<T> => {
  const processed = key == null ? null : String(key);
  const children = untrack(() => {
    const c = props.children;
    return c;
  });
  return _jsxQ(type, props, null, children, 0, processed);
};

export const SKIP_RENDER_TYPE = ':skipRender';

export class JSXNodeImpl<T> implements JSXNode<T> {
  dev?: DevJSX;
  constructor(
    public type: T,
    public mutableProps: T extends FunctionComponent<infer PROPS> ? PROPS : Record<any, unknown>,
    public immutableProps: Record<any, unknown> | null,
    public children: JSXChildren,
    public flags: number,
    public key: string | null = null
  ) {}

  _proxy?: typeof this.mutableProps;
  get props() {
    // We use a proxy to merge the immutableProps if they exist and to evaluate derived signals
    this._proxy ||= new Proxy<any>(this.mutableProps as object, {
      get: (target, prop) => {
        // escape hatch to get the separated props from a component
        if (prop === _IMMUTABLE) {
          return { mutable: this.mutableProps, immutable: this.immutableProps };
        }
        const value =
          prop in this.immutableProps! ? this.immutableProps![prop as string] : target[prop];
        // a proxied value that the optimizer made
        return value instanceof SignalDerived ? value.value : value;
      },
      set: (target, prop, value) => {
        target[prop] = value;
        return true;
      },
      deleteProperty: (target, prop) => {
        if (typeof prop !== 'string') {
          return false;
        }
        let didDelete = delete target[prop];
        if (this.immutableProps) {
          didDelete = delete this.immutableProps[prop as string] || didDelete;
        }
        return didDelete;
      },
      has: (target, prop) => {
        return prop in target || prop in this.immutableProps!;
      },
      ownKeys: (target) => {
        return [...Object.keys(target), ...Object.keys(this.immutableProps!)];
      },
    });
    return this._proxy!;
  }
}

/** @private */
export const Virtual: FunctionComponent<{
  children?: JSXChildren;
  dangerouslySetInnerHTML?: string;
  [OnRenderProp]?: QRLInternal<OnRenderFn<any>>;
  [QSlot]?: string;
  [QSlotS]?: string;
  props?: Record<any, unknown>;
  [QScopedStyle]?: string;
  [ELEMENT_ID]?: string;
}> = (props: any) => props.children;

/** @public */
export const RenderOnce: FunctionComponent<{
  children?: unknown;
  key?: string | number | null | undefined;
}> = (props: any, key) => {
  return new JSXNodeImpl(Virtual, EMPTY_OBJ, null, props.children, static_subtree, key);
};

const validateJSXNode = (node: JSXNode<any>) => {
  if (qDev) {
    const { type, props, immutableProps, children } = node;
    invoke(undefined, () => {
      const isQwikC = isQwikComponent(type);
      if (!isString(type) && !isFunction(type)) {
        throw new Error(
          `The <Type> of the JSX element must be either a string or a function. Instead, it's a "${typeof type}": ${String(
            type
          )}.`
        );
      }
      if (children) {
        const flatChildren = isArray(children) ? children.flat() : [children];
        if (isString(type) || isQwikC) {
          flatChildren.forEach((child: unknown) => {
            if (!isValidJSXChild(child)) {
              const typeObj = typeof child;
              let explanation = '';
              if (typeObj === 'object') {
                if (child?.constructor) {
                  explanation = `it's an instance of "${child?.constructor.name}".`;
                } else {
                  explanation = `it's a object literal: ${printObjectLiteral(child as {})} `;
                }
              } else if (typeObj === 'function') {
                explanation += `it's a function named "${(child as Function).name}".`;
              } else {
                explanation = `it's a "${typeObj}": ${String(child)}.`;
              }

              throw new Error(
                `One of the children of <${type}> is not an accepted value. JSX children must be either: string, boolean, number, <element>, Array, undefined/null, or a Promise/Signal. Instead, ${explanation}\n`
              );
            }
          });
        }
        if (isBrowser) {
          if (isFunction(type) || immutableProps) {
            const keys: Record<string, boolean> = {};
            flatChildren.forEach((child: unknown) => {
              if (isJSXNode(child) && child.key != null) {
                const key = String(child.type) + ':' + child.key;
                if (keys[key]) {
                  const err = createJSXError(
                    `Multiple JSX sibling nodes with the same key.\nThis is likely caused by missing a custom key in a for loop`,
                    child
                  );
                  if (err) {
                    if (isString(child.type)) {
                      logOnceWarn(err);
                    } else {
                      logOnceWarn(err);
                    }
                  }
                } else {
                  keys[key] = true;
                }
              }
            });
          }
        }
      }

      const allProps = [
        ...(props ? Object.entries(props) : []),
        ...(immutableProps ? Object.entries(immutableProps) : []),
      ];
      if (!qRuntimeQrl) {
        for (const [prop, value] of allProps) {
          if (prop.endsWith('$') && value) {
            if (!isQrl(value) && !Array.isArray(value)) {
              throw new Error(
                `The value passed in ${prop}={...}> must be a QRL, instead you passed a "${typeof value}". Make sure your ${typeof value} is wrapped with $(...), so it can be serialized. Like this:\n$(${String(
                  value
                )})`
              );
            }
          }
          if (prop !== 'children' && isQwikC && value) {
            verifySerializable(
              value,
              `The value of the JSX attribute "${prop}" can not be serialized`
            );
          }
        }
      }
      if (isString(type)) {
        const hasSetInnerHTML = allProps.some((a) => a[0] === 'dangerouslySetInnerHTML');
        if (hasSetInnerHTML && children) {
          const err = createJSXError(
            `The JSX element <${type}> can not have both 'dangerouslySetInnerHTML' and children.`,
            node
          );
          logError(err);
        }
        if (allProps.some((a) => a[0] === 'children')) {
          throw new Error(`The JSX element <${type}> can not have both 'children' as a property.`);
        }
        if (type === 'style') {
          if (children) {
            logOnceWarn(`jsx: Using <style>{content}</style> will escape the content, effectively breaking the CSS.
In order to disable content escaping use '<style dangerouslySetInnerHTML={content}/>'

However, if the use case is to inject component styleContent, use 'useStyles$()' instead, it will be a lot more efficient.
See https://qwik.dev/docs/components/styles/#usestyles for more information.`);
          }
        }
        if (type === 'script') {
          if (children) {
            logOnceWarn(`jsx: Using <script>{content}</script> will escape the content, effectively breaking the inlined JS.
In order to disable content escaping use '<script dangerouslySetInnerHTML={content}/>'`);
          }
        }
      }
    });
  }
};

const printObjectLiteral = (obj: Record<string, unknown>) => {
  return `{ ${Object.keys(obj)
    .map((key) => `"${key}"`)
    .join(', ')} }`;
};

export const isJSXNode = (n: unknown): n is JSXNode => {
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

export const isValidJSXChild = (node: unknown): node is JsxChild => {
  if (!node) {
    return true;
  } else if (node === SkipRender) {
    return true;
  } else if (isString(node) || typeof node === 'number' || typeof node === 'boolean') {
    return true;
  } else if (isJSXNode(node)) {
    return true;
  } else if (isArray(node)) {
    return node.every(isValidJSXChild);
  }
  if (isSignal(node)) {
    return isValidJSXChild(node.value);
  } else if (isPromise(node)) {
    return true;
  }
  return false;
};

/** @public */
export const Fragment: FunctionComponent<{ children?: any; key?: string | number | null }> = (
  props
) => props.children;

interface JsxDevOpts {
  fileName: string;
  lineNumber: number;
  columnNumber: number;
}

/** @public */
export const HTMLFragment: FunctionComponent<{ dangerouslySetInnerHTML: string }> = (props) =>
  jsx(Virtual, props);

/** @public */
export const jsxDEV = <T extends string | FunctionComponent<Record<any, unknown>>>(
  type: T,
  props: T extends FunctionComponent<infer PROPS> ? PROPS : Record<any, unknown>,
  key: string | number | null | undefined,
  _isStatic: boolean,
  opts: JsxDevOpts,
  _ctx: unknown
): JSXNode<T> => {
  const processed = key == null ? null : String(key);
  const children = untrack(() => {
    const c = props.children;
    if (typeof type === 'string') {
      delete props.children;
    }
    return c;
  }) as JSXChildren;
  if (isString(type)) {
    if ('className' in props) {
      (props as any).class = props.className;
      delete props.className;
      if (qDev) {
        logOnceWarn('jsx: `className` is deprecated. Use `class` instead.');
      }
    }
  }
  const node = new JSXNodeImpl<T>(type, props, null, children, 0, processed);
  node.dev = {
    stack: new Error().stack,
    ...opts,
  };
  validateJSXNode(node);
  seal(node);
  return node;
};

export type { QwikJSX as JSX };

export const createJSXError = (message: string, node: JSXNode) => {
  const error = new Error(message);
  if (!node.dev) {
    return error;
  }
  error.stack = `JSXError: ${message}\n${filterStack(node.dev.stack!, 1)}`;
  return error;
};

const filterStack = (stack: string, offset: number = 0) => {
  return stack.split('\n').slice(offset).join('\n');
};

export { jsx as jsxs };
