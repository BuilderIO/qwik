import { isNotNullable, isPromise, then } from '../../util/promises';
import { InvokeContext, newInvokeContext, useInvoke } from '../../use/use-core';
import { isJSXNode, jsx } from '../jsx/jsx-runtime';
import { isArray, isString, ValueOrPromise } from '../../util/types';
import { getContext, getPropsMutator, normalizeOnProp, QContext } from '../../props/props';
import type { JSXNode } from '../jsx/types/jsx-node';
import {
  ALLOWS_PROPS,
  createRenderContext,
  executeComponent,
  getNextIndex,
  HOST_PREFIX,
  SCOPE_PREFIX,
  stringifyClassOrStyle,
} from '../execute-component';
import { ELEMENT_ID, OnRenderProp, QCtxAttr, QSlot } from '../../util/markers';
import { Host } from '../jsx/host.public';
import { qDev } from '../../util/qdev';
import { logWarn } from '../../util/log';
import { addQRLListener, isOnProp } from '../../props/props-on';
import type { StreamWriter } from '../../../server/types';
import type { Ref } from '../../use/use-store.public';
import { version } from '../../version';
import { serializeInlineContexts } from '../../use/use-context';
import { fromCamelToKebabCase } from '../../util/case';
import { serializeQRLs } from '../../import/qrl';
import { qError, QError_rootNodeMustBeHTML } from '../../error/error';
import { ContainerState, getContainerState } from '../container';
import type { RenderContext } from '../types';

export interface SSRContext {
  rctx: RenderContext;
  projectedChildren?: any[];
  hostId?: string;
  invocationContext?: InvokeContext;
}

export interface RenderSSROptions {
  root?: string;
  stream: StreamWriter;
  base?: string;
  beforeClose?: (containerState: ContainerState) => Promise<JSXNode>;
}

/**
 * @alpha
 */
export const renderSSR = async (doc: Document, node: JSXNode, opts: RenderSSROptions) => {
  const root = opts.root ?? 'html';
  const containerEl = doc.createElement(root);
  const containerState = getContainerState(containerEl);
  const rctx = createRenderContext(doc, containerState);
  const ssrCtx: SSRContext = {
    rctx,
  };
  const containerAttributes: Record<string, string> = {
    'q:container': 'paused',
    'q:version': version ?? 'dev',
    'q:render': 'ssr',
  };
  if (opts.base) {
    containerAttributes['q:base'] = opts.base;
  }
  if (opts.root) {
    node = jsx(root, {
      ...containerAttributes,
      children: node,
    });
    await renderNode(node, ssrCtx, opts.stream, 0, () => opts.beforeClose?.(containerState));
  } else {
    const elCtx = getContext(containerEl);
    await renderRootNode(node, elCtx, containerAttributes, ssrCtx, opts.stream, 0, () =>
      opts.beforeClose?.(containerState)
    );
  }
};

export const renderRootNode = (
  node: JSXNode<any>,
  elCtx: QContext,
  containerAttributes: Record<string, string | undefined>,
  ssrCtx: SSRContext,
  stream: StreamWriter,
  flags: number,
  beforeClose?: () => ValueOrPromise<any>
): ValueOrPromise<void> => {
  if (isArray(node)) {
    if (node.length !== 1) {
      throw qError(QError_rootNodeMustBeHTML, node);
    }
    return renderRootNode(node[0], elCtx, containerAttributes, ssrCtx, stream, flags, beforeClose);
  }
  if (typeof node.type === 'string') {
    if (node.type !== 'html') {
      throw qError(QError_rootNodeMustBeHTML, node);
    }
    return renderNodeElement(
      node,
      elCtx,
      containerAttributes,
      undefined,
      ssrCtx,
      stream,
      flags,
      beforeClose
    );
  } else {
    const result = node.type(node.props, node.key);
    return renderRootNode(result, elCtx, containerAttributes, ssrCtx, stream, flags, beforeClose);
  }
};
const IS_HOST = 1 << 0;
const IS_HEAD = 1 << 1;
const IS_SVG = 1 << 2;

export const renderNodeFunction = (
  node: JSXNode<any>,
  ssrCtx: SSRContext,
  stream: StreamWriter,
  flags: number,
  beforeClose?: () => ValueOrPromise<any>
) => {
  const res = ssrCtx.invocationContext
    ? useInvoke(ssrCtx.invocationContext, () => node.type(node.props, node.key))
    : node.type(node.props, node.key);
  return processData(res, ssrCtx, stream, flags, beforeClose);
};

export const renderNodeElement = (
  node: JSXNode<string>,
  elCtx: QContext,
  extraAttributes: Record<string, string | undefined> | undefined,
  extraNodes: JSXNode[] | undefined,
  ssrCtx: SSRContext,
  stream: StreamWriter,
  flags: number,
  beforeClose?: () => ValueOrPromise<any>
): ValueOrPromise<void> => {
  const key = node.key != null ? String(node.key) : null;
  const props = node.props;
  const textType = node.type;
  const renderQrl = props[OnRenderProp];

  const hasRef = 'ref' in props;
  const isHost = flags & IS_HOST;
  const isHead = flags & IS_HEAD;
  const isSvg = flags & IS_SVG;
  if (!isSvg && textType === 'svg') {
    flags |= IS_SVG;
  }
  const attributes = updateProperties(ssrCtx.rctx, elCtx, props, flags);
  const hasEvents = elCtx.$listeners$;
  if (key) {
    attributes['q:key'] = key;
  }
  if (isHost || hasRef || hasEvents) {
    const newID = getNextIndex(ssrCtx.rctx);
    attributes[ELEMENT_ID] = newID;
    (elCtx.$element$ as any)[ELEMENT_ID] = newID;
    ssrCtx.rctx.$containerState$.$contexts$.push(elCtx);
  }
  if (isHead) {
    attributes['q:head'] = '';
  }
  if (extraAttributes) {
    Object.assign(attributes, extraAttributes);
  }
  if (isHost) {
    ssrCtx.hostId = attributes[ELEMENT_ID];
    if (elCtx.$contexts$) {
      attributes[QCtxAttr] = serializeInlineContexts(elCtx.$contexts$);
    }
  }
  if (elCtx.$listeners$) {
    elCtx.$listeners$.forEach((value, key) => {
      attributes[fromCamelToKebabCase(key)] = serializeQRLs(value, elCtx);
    });
  }
  if (renderQrl) {
    elCtx.$renderQrl$ = renderQrl;
    return renderSSRComponent(ssrCtx, stream, elCtx, node, attributes, flags);
  }

  stream.write(`<${textType}`);
  Object.entries(attributes).forEach(([key, value]) => {
    const chunk = value === '' ? ` ${key}` : ` ${key}="${escapeAttr(value)}"`;
    stream.write(chunk);
  });

  stream.write(`>`);
  const empty = !!emptyElements[textType];
  if (empty) {
    return;
  }

  // Render innerHTML
  if (props.innerHTML) {
    stream.write(props.innerHTML);
    stream.write(`</${textType}>`);
    return;
  }

  // Reset HOST flags
  flags = 0;
  if (textType === 'head') {
    flags |= IS_HEAD;
  }

  const children = extraNodes ? mergeChildren(extraNodes, props.children) : props.children;
  const promise = walkChildren(children, ssrCtx, stream, flags);
  return then(promise, () => {
    let p;
    if (beforeClose) {
      p = then(beforeClose(), (jsx) => {
        return walkChildren(jsx, ssrCtx, stream, flags);
      });
    }
    return then(p, () => {
      stream.write(`</${textType}>`);
    });
  });
};

export const mergeChildren = (a: any, b: any): any[] => {
  const output = [];
  if (a) {
    if (isArray(a)) {
      output.push(...a);
    } else {
      output.push(a);
    }
  }
  if (b) {
    if (isArray(b)) {
      output.push(...b);
    } else {
      output.push(b);
    }
  }
  return output;
};

export const renderSSRComponent = (
  ssrCtx: SSRContext,
  stream: StreamWriter,
  elCtx: QContext,
  node: JSXNode<string>,
  attributes: Record<string, string>,
  flags: number
): ValueOrPromise<void> => {
  return then(executeComponent(ssrCtx.rctx, elCtx), (res) => {
    if (res) {
      const hostElement = elCtx.$element$;
      const newCtx = res.rctx;
      let children = node.props.children;
      if (children) {
        if (isArray(children)) {
          if (children.filter(isNotNullable).length === 0) {
            children = undefined;
          }
        } else {
          children = [children];
        }
      }
      const invocationContext = newInvokeContext(newCtx.$doc$, hostElement, hostElement);
      invocationContext.$subscriber$ = hostElement;
      invocationContext.$renderCtx$ = newCtx;
      const newSSrContext: SSRContext = {
        ...ssrCtx,
        projectedChildren: children,
        rctx: newCtx,
        invocationContext,
      };

      const processedNode = jsx(node.type, {
        ...attributes,
      });
      if (res.node.type === Host) {
        processedNode.props = {
          ...attributes,
          ...res.node.props,
        };
      } else {
        processedNode.props['children'] = res.node;
      }
      flags |= IS_HOST;
      const extraNodes = [];
      for (const style of elCtx.$styles$) {
        extraNodes!.push(
          jsx('style', {
            'q:style': style.styleId,
            innerHTML: style.content,
          })
        );
      }
      return renderNodeElement(
        processedNode,
        elCtx,
        undefined,
        extraNodes,
        newSSrContext,
        stream,
        flags,
        () => {
          if (newSSrContext.projectedChildren) {
            return jsx('q:template', { children: newSSrContext.projectedChildren });
          }
          return null;
        }
      );
    }
  });
};

export const renderQSlot = (
  node: JSXNode,
  ssrCtx: SSRContext,
  stream: StreamWriter,
  flags: number
) => {
  const elCtx = getContext(ssrCtx.rctx.$doc$.createElement(node.type));
  node = jsx(node.type, {
    ...node.props,
    'q:sref': ssrCtx.hostId,
  });
  return renderNodeElement(node, elCtx, undefined, undefined, ssrCtx, stream, flags, () => {
    if (ssrCtx.projectedChildren) {
      const a = ssrCtx.projectedChildren;
      ssrCtx.projectedChildren = undefined;
      return a;
    }
  });
};

export const renderNode = (
  node: JSXNode<any>,
  ssrCtx: SSRContext,
  stream: StreamWriter,
  flags: number,
  beforeClose?: () => ValueOrPromise<any>
) => {
  if (node.type === QSlot) {
    return renderQSlot(node, ssrCtx, stream, flags);
  } else if (typeof node.type === 'string') {
    const elCtx = getContext(ssrCtx.rctx.$doc$.createElement(node.type));
    return renderNodeElement(
      node as any,
      elCtx,
      undefined,
      undefined,
      ssrCtx,
      stream,
      flags,
      beforeClose
    );
  } else {
    return renderNodeFunction(node, ssrCtx, stream, flags, beforeClose);
  }
};
export const processData = (
  node: any,
  ssrCtx: SSRContext,
  stream: StreamWriter,
  flags: number,
  beforeClose?: () => ValueOrPromise<any>
): ValueOrPromise<void> => {
  if (node == null || typeof node === 'boolean') {
    return;
  }
  if (isJSXNode(node)) {
    return renderNode(node, ssrCtx, stream, flags, beforeClose);
  } else if (isPromise(node)) {
    return node.then((node) => processData(node, ssrCtx, stream, flags, beforeClose));
  } else if (isArray(node)) {
    return walkChildren(node.flat(100), ssrCtx, stream, flags);
  } else if (isString(node) || typeof node === 'number') {
    stream.write(escape(String(node)));
  } else {
    logWarn('A unsupported value was passed to the JSX, skipping render. Value:', node);
  }
};

function walkChildren(
  children: any,
  ssrContext: SSRContext,
  stream: StreamWriter,
  flags: number
): ValueOrPromise<void> {
  let currentIndex = 0;
  children = isArray(children) ? children : [children];
  let prevPromise: ValueOrPromise<void> = undefined;
  for (let i = 0; i < children.length; i++) {
    const index = i;
    const child = children[index];
    const buffer: string[] = [];
    const localStream: StreamWriter = {
      write(chunk) {
        if (currentIndex === index) {
          stream.write(chunk);
        } else {
          buffer.push(chunk);
        }
      },
    };
    const p: ValueOrPromise<void> = prevPromise;
    prevPromise = then(processData(child, ssrContext, localStream, flags), () => {
      return then(p, () => {
        buffer.forEach(stream.write);
        currentIndex++;
      });
    });
  }
  return prevPromise;
}

const updateProperties = (
  rctx: RenderContext,
  ctx: QContext,
  expectProps: Record<string, any> | null,
  flags: number
) => {
  const attributes: Record<string, string> = {};
  if (!expectProps) {
    return attributes;
  }
  const keys = Object.keys(expectProps);
  if (keys.length === 0) {
    return attributes;
  }
  const elm = ctx.$element$;
  const isCmp = OnRenderProp in expectProps;
  const isSvg = !!(flags & IS_SVG);
  const qwikProps = isCmp ? getPropsMutator(ctx, rctx.$containerState$) : undefined;
  for (let key of keys) {
    if (key === 'children' || key === 'innerHTML' || key === OnRenderProp) {
      continue;
    }
    const newValue = expectProps[key];
    if (key === 'ref') {
      (newValue as Ref<Element>).current = elm;
      continue;
    }

    // Early exit if value didnt change
    // Check of data- or aria-
    if (key.startsWith('data-') || key.startsWith('aria-')) {
      attributes[key] = newValue;
      continue;
    }

    if (qwikProps) {
      const skipProperty = ALLOWS_PROPS.includes(key);
      const hasPrefix = SCOPE_PREFIX.test(key);
      if (!skipProperty && !hasPrefix) {
        // Qwik props
        qwikProps.set(key, newValue);
        continue;
      }
      const hPrefixed = key.startsWith(HOST_PREFIX);
      if (hPrefixed) {
        key = key.slice(HOST_PREFIX.length);
      }
    } else if (qDev && key.startsWith(HOST_PREFIX)) {
      logWarn(`${HOST_PREFIX} prefix can not be used in non components`);
      continue;
    }

    if (isOnProp(key)) {
      const attributeName = normalizeOnProp(key.slice(0, -1));
      addQRLListener(ctx, attributeName, newValue);
      continue;
    }

    // Check if its an exception
    setProperty(attributes, key, newValue, isSvg);
  }
  return attributes;
};

function setProperty(attributes: Record<string, string>, prop: string, value: any, isSvg: boolean) {
  if (isSvg) {
    attributes[prop] = String(value);
  } else {
    if (value != null && value !== false) {
      prop = processPropKey(prop);
      const attrValue = processPropValue(prop, value);
      if (attrValue !== null) {
        attributes[prop] = attrValue;
      }
    }
  }
}

function processPropKey(prop: string) {
  if (prop === 'className') {
    return 'class';
  }
  return prop.toLowerCase();
}

function processPropValue(prop: string, value: any): string | null {
  if (prop === 'class') {
    return stringifyClassOrStyle(value, true);
  }
  if (prop === 'style') {
    return stringifyClassOrStyle(value, false);
  }
  if (value === false || value == null) {
    return null;
  }
  if (value === true) {
    return '';
  }
  return String(value);
}

const emptyElements: Record<string, true | undefined> = {
  area: true,
  base: true,
  basefont: true,
  bgsound: true,
  br: true,
  col: true,
  embed: true,
  frame: true,
  hr: true,
  img: true,
  input: true,
  keygen: true,
  link: true,
  meta: true,
  param: true,
  source: true,
  track: true,
  wbr: true,
};

export interface ServerDocument {
  nodeType: 9;
  parentElement: null;
  ownerDocument: null;
  createElement(tagName: string): any;
}

export const escape = (s: string) => {
  return s.replace(/[&<>\u00A0]/g, function (c) {
    switch (c) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '\u00A0':
        return '&nbsp;';
      default:
        return '';
    }
  });
};

export const escapeAttr = (s: string) => {
  const toEscape = /[&"\u00A0]/g;
  if (!toEscape.test(s)) {
    // nothing to do, fast path
    return s;
  } else {
    return s.replace(toEscape, (c) => {
      switch (c) {
        case '&':
          return '&amp;';
        case '"':
          return '&quot;';
        case '\u00A0':
          return '&nbsp;';
        default:
          return '';
      }
    });
  }
};
