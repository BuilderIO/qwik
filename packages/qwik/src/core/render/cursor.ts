import { ELEMENT_ID, OnRenderProp, QHostAttr, QSlot } from '../util/markers';
import {
  cleanupContext,
  ComponentCtx,
  getContext,
  getPropsMutator,
  normalizeOnProp,
  QContext,
  tryGetContext,
} from '../props/props';
import { addQRLListener, getDomListeners, isOnProp } from '../props/props-on';
import { isArray, isString, ValueOrPromise } from '../util/types';
import type { ProcessedJSXNode } from '../render/jsx/types/jsx-node';
import { renderComponent } from './render-component';
import { promiseAll, then } from '../util/promises';
import type { ContainerState } from './notify-render';
import { assertDefined, assertEqual, assertTrue } from '../assert/assert';
import { intToStr } from '../object/store';
import { EMPTY_ARRAY } from '../util/flyweight';
import { logDebug, logError, logWarn } from '../util/log';
import { qDev } from '../util/qdev';
import {
  codeToText,
  qError,
  QError_hostCanOnlyBeAtRoot,
  QError_rootNodeMustBeHTML,
  QError_setProperty,
  QError_strictHTMLChildren,
  QError_stringifyClassOrStyle,
} from '../error/error';
import { fromCamelToKebabCase } from '../util/case';
import type { OnRenderFn } from '../component/component.public';
import { CONTAINER, StyleAppend } from '../use/use-core';
import type { Ref } from '../use/use-store.public';
import type { SubscriptionManager } from '../object/q-object';
import { directGetAttribute, directSetAttribute } from './fast-calls';
import { HOST_TYPE, SKIP_RENDER_TYPE } from './jsx/jsx-runtime';
import { assertQrl } from '../import/qrl-class';
import { isElement } from '../util/element';
import { serializeQRLs } from '../import/qrl';

export const SVG_NS = 'http://www.w3.org/2000/svg';

type KeyToIndexMap = { [key: string]: number };

type PropHandler = (
  ctx: RenderContext,
  el: HTMLElement,
  key: string,
  newValue: any,
  oldValue: any
) => boolean;

/**
 * @alpha
 */
export interface RenderOperation {
  $el$: Node;
  $operation$: string;
  $args$: any[];
  $fn$: () => void;
}

export type ChildrenMode = 'root' | 'slot' | 'fallback' | 'default' | 'head';

/**
 * @alpha
 */
export interface RenderPerf {
  $visited$: number;
}

/**
 * @alpha
 */
export interface RenderContext {
  $doc$: Document;
  $roots$: Element[];
  $hostElements$: Set<Element>;
  $operations$: RenderOperation[];
  $contexts$: QContext[];
  $currentComponent$: ComponentCtx | undefined;
  $containerState$: ContainerState;
  $containerEl$: Element;
  $perf$: RenderPerf;
}

export const smartUpdateChildren = (
  ctx: RenderContext,
  elm: Node,
  ch: ProcessedJSXNode[],
  mode: ChildrenMode,
  isSvg: boolean
) => {
  if (ch.length === 1 && ch[0].$type$ === SKIP_RENDER_TYPE) {
    if (elm.firstChild !== null) {
      return;
    }
    ch = ch[0].$children$;
  }
  const isHead = elm.nodeName === 'HEAD';
  if (isHead) {
    mode = 'head';
  }
  const oldCh = getChildren(elm, mode);
  if (qDev) {
    if (elm.nodeType === 9) {
      if (ch.length !== 1 || ch[0].$type$ !== 'html') {
        throw qError(QError_rootNodeMustBeHTML, ch);
      }
    } else if (elm.nodeName === 'HTML') {
      if (ch.length !== 2 || ch[0].$type$ !== 'head' || ch[1].$type$ !== 'body') {
        throw qError(QError_strictHTMLChildren, ch);
      }
    }
  }
  if (oldCh.length > 0 && ch.length > 0) {
    return updateChildren(ctx, elm, oldCh, ch, isSvg, isHead);
  } else if (ch.length > 0) {
    return addVnodes(ctx, elm, null, ch, 0, ch.length - 1, isSvg, isHead);
  } else if (oldCh.length > 0) {
    return removeVnodes(ctx, oldCh, 0, oldCh.length - 1);
  }
};

export const updateChildren = (
  ctx: RenderContext,
  parentElm: Node,
  oldCh: Node[],
  newCh: ProcessedJSXNode[],
  isSvg: boolean,
  isHead: boolean
): ValueOrPromise<void> => {
  let oldStartIdx = 0;
  let newStartIdx = 0;
  let oldEndIdx = oldCh.length - 1;
  let oldStartVnode = oldCh[0];
  let oldEndVnode = oldCh[oldEndIdx];
  let newEndIdx = newCh.length - 1;
  let newStartVnode = newCh[0];
  let newEndVnode = newCh[newEndIdx];
  let oldKeyToIdx: KeyToIndexMap | undefined;
  let idxInOld: number;
  let elmToMove: Node;
  const results = [];

  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (oldStartVnode == null) {
      oldStartVnode = oldCh[++oldStartIdx]; // Vnode might have been moved left
    } else if (oldEndVnode == null) {
      oldEndVnode = oldCh[--oldEndIdx];
    } else if (newStartVnode == null) {
      newStartVnode = newCh[++newStartIdx];
    } else if (newEndVnode == null) {
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldStartVnode, newStartVnode)) {
      results.push(patchVnode(ctx, oldStartVnode, newStartVnode, isSvg));
      oldStartVnode = oldCh[++oldStartIdx];
      newStartVnode = newCh[++newStartIdx];
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      results.push(patchVnode(ctx, oldEndVnode, newEndVnode, isSvg));
      oldEndVnode = oldCh[--oldEndIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldStartVnode, newEndVnode)) {
      // Vnode moved right
      results.push(patchVnode(ctx, oldStartVnode, newEndVnode, isSvg));

      insertBefore(ctx, parentElm, oldStartVnode, oldEndVnode.nextSibling);
      oldStartVnode = oldCh[++oldStartIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldEndVnode, newStartVnode)) {
      // Vnode moved left
      results.push(patchVnode(ctx, oldEndVnode, newStartVnode, isSvg));

      insertBefore(ctx, parentElm, oldEndVnode, oldStartVnode);
      oldEndVnode = oldCh[--oldEndIdx];
      newStartVnode = newCh[++newStartIdx];
    } else {
      if (oldKeyToIdx === undefined) {
        oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
      }
      idxInOld = oldKeyToIdx[newStartVnode.$key$ as string];
      if (idxInOld === undefined) {
        // New element
        const newElm = createElm(ctx, newStartVnode, isSvg, isHead);
        results.push(
          then(newElm, (newElm) => {
            insertBefore(ctx, parentElm, newElm, oldStartVnode);
          })
        );
      } else {
        elmToMove = oldCh[idxInOld];
        if (!isTagName(elmToMove, newStartVnode.$type$)) {
          const newElm = createElm(ctx, newStartVnode, isSvg, isHead);
          results.push(
            then(newElm, (newElm) => {
              insertBefore(ctx, parentElm, newElm, oldStartVnode);
            })
          );
        } else {
          results.push(patchVnode(ctx, elmToMove, newStartVnode, isSvg));
          oldCh[idxInOld] = undefined as any;
          insertBefore(ctx, parentElm, elmToMove, oldStartVnode);
        }
      }
      newStartVnode = newCh[++newStartIdx];
    }
  }

  if (newStartIdx <= newEndIdx) {
    const before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].$elm$;
    results.push(addVnodes(ctx, parentElm, before, newCh, newStartIdx, newEndIdx, isSvg, isHead));
  }

  let wait = promiseAll(results) as any;
  if (oldStartIdx <= oldEndIdx) {
    const canRemove = parentElm.nodeName !== 'HEAD';
    if (canRemove) {
      wait = then(wait, () => {
        removeVnodes(ctx, oldCh, oldStartIdx, oldEndIdx);
      });
    }
  }
  return wait;
};

const isComponentNode = (node: ProcessedJSXNode) => {
  return node.$props$ && OnRenderProp in node.$props$;
};

const getCh = (elm: Node, filter: (el: Node) => boolean) => {
  return Array.from(elm.childNodes).filter(filter);
};

export const getChildren = (elm: Node, mode: ChildrenMode): Node[] => {
  switch (mode) {
    case 'default':
      return getCh(elm, isNode);
    case 'slot':
      return getCh(elm, isChildSlot);
    case 'root':
      return getCh(elm, isChildComponent);
    case 'fallback':
      return getCh(elm, isFallback);
    case 'head':
      return getCh(elm, isHeadChildren);
  }
};
export const isNode = (elm: Node): boolean => {
  const type = elm.nodeType;
  return type === 1 || type === 3;
};

const isFallback = (node: Node): boolean => {
  return node.nodeName === 'Q:FALLBACK';
};

const isHeadChildren = (node: Node): boolean => {
  return isElement(node) && (node.hasAttribute('q:head') || node.nodeName === 'TITLE');
};

const isChildSlot = (node: Node): boolean => {
  return isNode(node) && node.nodeName !== 'Q:FALLBACK' && node.nodeName !== 'Q:TEMPLATE';
};

const isSlotTemplate = (node: Node): node is HTMLTemplateElement => {
  return node.nodeName === 'Q:TEMPLATE';
};

const isChildComponent = (node: Node): boolean => {
  return isNode(node) && node.nodeName !== 'Q:TEMPLATE';
};

export const splitBy = <T>(input: T[], condition: (item: T) => string): Record<string, T[]> => {
  const output: Record<string, T[]> = {};
  for (const item of input) {
    const key = condition(item);
    const array = output[key] ?? (output[key] = []);
    array.push(item);
  }
  return output;
};

export const patchVnode = (
  rctx: RenderContext,
  elm: Node,
  vnode: ProcessedJSXNode,
  isSvg: boolean
): ValueOrPromise<void> => {
  vnode.$elm$ = elm;
  const tag = vnode.$type$;
  if (tag === '#text') {
    if ((elm as Text).data !== vnode.$text$) {
      setProperty(rctx, elm, 'data', vnode.$text$);
    }
    return;
  }

  if (tag === HOST_TYPE) {
    throw qError(QError_hostCanOnlyBeAtRoot);
  }

  if (tag === SKIP_RENDER_TYPE) {
    return;
  }

  if (!isSvg) {
    isSvg = tag === 'svg';
  }

  const props = vnode.$props$;
  const ctx = getContext(elm as Element);
  const isSlot = tag === QSlot;
  let dirty = updateProperties(rctx, ctx, props, isSvg, false);
  if (isSvg && vnode.$type$ === 'foreignObject') {
    isSvg = false;
  } else if (isSlot) {
    const currentComponent = rctx.$currentComponent$;
    if (currentComponent) {
      currentComponent.$slots$.push(vnode);
    }
  }
  const isComponent = isComponentNode(vnode);
  const ch = vnode.$children$;
  if (isComponent) {
    if (!dirty && !ctx.$renderQrl$ && !ctx.$element$.hasAttribute(QHostAttr)) {
      setAttribute(rctx, ctx.$element$, QHostAttr, '');
      setAttribute(rctx, ctx.$element$, ELEMENT_ID, getNextIndex(rctx));

      ctx.$renderQrl$ = props![OnRenderProp];
      assertQrl(ctx.$renderQrl$ as any);
      dirty = true;
    }
    const promise = dirty ? renderComponent(rctx, ctx) : undefined;
    return then(promise, () => {
      const slotMaps = getSlots(ctx.$component$, elm as Element);
      const splittedChidren = splitBy(ch, getSlotName);
      const promises: ValueOrPromise<void>[] = [];
      const slotRctx = copyRenderContext(rctx);
      slotRctx.$contexts$.push(ctx);

      // Mark empty slots and remove content
      Object.entries(slotMaps.slots).forEach(([key, slotEl]) => {
        if (slotEl && !splittedChidren[key]) {
          const oldCh = getChildren(slotEl, 'slot');
          if (oldCh.length > 0) {
            removeVnodes(slotRctx, oldCh, 0, oldCh.length - 1);
          }
        }
      });

      // Mark empty slots and remove content
      Object.entries(slotMaps.templates).forEach(([key, templateEl]) => {
        if (templateEl && !splittedChidren[key]) {
          removeNode(slotRctx, templateEl);
          slotMaps.templates[key] = undefined;
        }
      });
      // Render into slots
      Object.entries(splittedChidren).forEach(([key, ch]) => {
        const slotElm = getSlotElement(slotRctx, slotMaps, elm as Element, key);
        promises.push(smartUpdateChildren(slotRctx, slotElm, ch, 'slot', isSvg));
      });
      return then(promiseAll(promises), () => {
        removeTemplates(slotRctx, slotMaps);
      });
    });
  }
  const setsInnerHTML = checkInnerHTML(props);
  if (setsInnerHTML) {
    if (qDev && ch.length > 0) {
      logWarn('Node can not have children when innerHTML is set');
    }
    return;
  }
  const mode = isSlot ? 'fallback' : 'default';
  return smartUpdateChildren(rctx, elm, ch, mode, isSvg);
};

const addVnodes = (
  ctx: RenderContext,
  parentElm: Node,
  before: Node | null,
  vnodes: ProcessedJSXNode[],
  startIdx: number,
  endIdx: number,
  isSvg: boolean,
  isHead: boolean
): ValueOrPromise<void> => {
  const promises = [];
  for (; startIdx <= endIdx; ++startIdx) {
    const ch = vnodes[startIdx];
    assertDefined(ch, 'render: node must be defined at index', startIdx, vnodes);
    promises.push(createElm(ctx, ch, isSvg, isHead));
  }
  return then(promiseAll(promises), (children) => {
    for (const child of children) {
      insertBefore(ctx, parentElm, child, before);
    }
  });
};

const removeVnodes = (
  ctx: RenderContext,
  nodes: Node[],
  startIdx: number,
  endIdx: number
): void => {
  for (; startIdx <= endIdx; ++startIdx) {
    const ch = nodes[startIdx];
    if (ch) {
      removeNode(ctx, ch);
    }
  }
};

const getSlotElement = (
  ctx: RenderContext,
  slotMaps: SlotMaps,
  parentEl: Element,
  slotName: string
): Element => {
  const slotEl = slotMaps.slots[slotName];
  if (slotEl) {
    return slotEl;
  }
  const templateEl = slotMaps.templates[slotName];
  if (templateEl) {
    return templateEl;
  }
  const template = createTemplate(ctx, slotName);
  prepend(ctx, parentEl, template);
  slotMaps.templates[slotName] = template;
  return template;
};

const createTemplate = (ctx: RenderContext, slotName: string) => {
  const template = createElement(ctx, 'q:template', false);
  directSetAttribute(template, QSlot, slotName);
  directSetAttribute(template, 'hidden', '');
  directSetAttribute(template, 'aria-hidden', 'true');

  return template;
};

const removeTemplates = (ctx: RenderContext, slotMaps: SlotMaps) => {
  Object.keys(slotMaps.templates).forEach((key) => {
    const template = slotMaps.templates[key]!;
    if (template && slotMaps.slots[key] !== undefined) {
      removeNode(ctx, template);
      slotMaps.templates[key] = undefined;
    }
  });
};

export const resolveSlotProjection = (
  ctx: RenderContext,
  hostElm: Element,
  before: SlotMaps,
  after: SlotMaps
) => {
  Object.entries(before.slots).forEach(([key, slotEl]) => {
    if (slotEl && !after.slots[key]) {
      // Slot removed
      // Move slot to template
      const template = createTemplate(ctx, key);
      const slotChildren = getChildren(slotEl, 'slot');
      template.append(...slotChildren);
      hostElm.insertBefore(template, hostElm.firstChild);

      ctx.$operations$.push({
        $el$: template,
        $operation$: 'slot-to-template',
        $args$: slotChildren,
        $fn$: () => {},
      });
    }
  });

  Object.entries(after.slots).forEach(([key, slotEl]) => {
    if (slotEl && !before.slots[key]) {
      // Slot created
      // Move template to slot
      const template = before.templates[key];
      if (template) {
        slotEl.append(...getChildren(template, 'default'));
        template.remove();
        ctx.$operations$.push({
          $el$: slotEl,
          $operation$: 'template-to-slot',
          $args$: [template],
          $fn$: () => {},
        });
      }
    }
  });
};

const getSlotName = (node: ProcessedJSXNode): string => {
  return node.$props$?.[QSlot] ?? '';
};

const createElm = (
  rctx: RenderContext,
  vnode: ProcessedJSXNode,
  isSvg: boolean,
  isHead: boolean
): ValueOrPromise<Node> => {
  rctx.$perf$.$visited$++;
  const tag = vnode.$type$;
  if (tag === '#text') {
    return (vnode.$elm$ = createTextNode(rctx, vnode.$text$!));
  }

  if (tag === HOST_TYPE) {
    throw qError(QError_hostCanOnlyBeAtRoot);
  }

  if (!isSvg) {
    isSvg = tag === 'svg';
  }

  const props = vnode.$props$;
  const elm = (vnode.$elm$ = createElement(rctx, tag, isSvg));
  const isComponent = isComponentNode(vnode);
  const ctx = getContext(elm);
  setKey(elm, vnode.$key$);
  updateProperties(rctx, ctx, props, isSvg, false);
  if (isHead) {
    directSetAttribute(elm as Element, 'q:head', '');
  }

  if (isSvg && tag === 'foreignObject') {
    isSvg = false;
  }
  const currentComponent = rctx.$currentComponent$;
  if (currentComponent) {
    const styleTag = currentComponent.$styleClass$;
    if (styleTag) {
      classlistAdd(rctx, elm, styleTag);
    }
    if (tag === QSlot || tag === 'html') {
      currentComponent.$slots$.push(vnode);
    }
  }

  const hasRef = props && 'ref' in props;
  if (isComponent || ctx.$listeners$ || hasRef) {
    directSetAttribute(ctx.$element$, ELEMENT_ID, getNextIndex(rctx));
  }

  let wait: ValueOrPromise<void>;
  if (isComponent) {
    // Run mount hook
    const renderQRL = props![OnRenderProp];
    assertQrl<OnRenderFn<any>>(renderQRL);
    ctx.$renderQrl$ = renderQRL;
    directSetAttribute(ctx.$element$, QHostAttr, '');
    wait = renderComponent(rctx, ctx);
  } else {
    const setsInnerHTML = checkInnerHTML(props);
    if (setsInnerHTML) {
      if (qDev && vnode.$children$.length > 0) {
        logWarn('Node can not have children when innerHTML is set');
      }
      return elm;
    }
  }
  return then(wait, () => {
    let children = vnode.$children$;
    if (children.length > 0) {
      if (children.length === 1 && children[0].$type$ === SKIP_RENDER_TYPE) {
        children = children[0].$children$;
      }
      const slotRctx = copyRenderContext(rctx);
      slotRctx.$contexts$.push(ctx);
      const slotMap = isComponent ? getSlots(ctx.$component$, elm) : undefined;
      const promises = children.map((ch) => createElm(slotRctx, ch, isSvg, false));
      return then(promiseAll(promises), () => {
        let parent = elm;
        for (const node of children) {
          if (slotMap) {
            parent = getSlotElement(slotRctx, slotMap, elm, getSlotName(node));
          }
          parent.appendChild(node.$elm$!);
        }
        return elm;
      });
    }
    return elm;
  });
};
interface SlotMaps {
  slots: Record<string, Element | undefined>;
  templates: Record<string, Element | undefined>;
}

export const getNextIndex = (ctx: RenderContext) => {
  return intToStr(ctx.$containerState$.$elementIndex$++);
};

const getSlots = (componentCtx: ComponentCtx | null, hostElm: Element): SlotMaps => {
  if (hostElm.localName === 'html') {
    return { slots: { '': hostElm }, templates: {} };
  }
  const slots: Record<string, Element> = {};
  const templates: Record<string, HTMLTemplateElement> = {};
  const slotRef = directGetAttribute(hostElm, 'q:id');
  const existingSlots = Array.from(hostElm.querySelectorAll(`q\\:slot[q\\:sref="${slotRef}"]`));
  const newSlots = componentCtx?.$slots$ ?? EMPTY_ARRAY;
  const t = Array.from(hostElm.children).filter(isSlotTemplate);

  // Map slots
  for (const elm of existingSlots) {
    slots[directGetAttribute(elm, 'name') ?? ''] = elm;
  }

  // Map virtual slots
  for (const vnode of newSlots) {
    slots[vnode.$props$?.name ?? ''] = vnode.$elm$ as Element;
  }

  // Map templates
  for (const elm of t) {
    templates[directGetAttribute(elm, QSlot) ?? ''] = elm;
  }

  return { slots, templates };
};

const handleStyle: PropHandler = (ctx, elm, _, newValue) => {
  setAttribute(ctx, elm, 'style', stringifyClassOrStyle(newValue, false));
  return true;
};

const handleClass: PropHandler = (ctx, elm, _, newValue) => {
  setAttribute(ctx, elm, 'class', stringifyClassOrStyle(newValue, true));
  return true;
};

const checkBeforeAssign: PropHandler = (ctx, elm, prop, newValue) => {
  if (prop in elm) {
    if ((elm as any)[prop] !== newValue) {
      setProperty(ctx, elm, prop, newValue);
    }
  }
  return true;
};

const dangerouslySetInnerHTML = 'dangerouslySetInnerHTML';
const setInnerHTML: PropHandler = (ctx, elm, _, newValue) => {
  if (dangerouslySetInnerHTML in elm) {
    setProperty(ctx, elm, dangerouslySetInnerHTML, newValue);
  } else if ('innerHTML' in elm) {
    setProperty(ctx, elm, 'innerHTML', newValue);
  }
  return true;
};

export const PROP_HANDLER_MAP: Record<string, PropHandler> = {
  style: handleStyle,
  class: handleClass,
  className: handleClass,
  value: checkBeforeAssign,
  checked: checkBeforeAssign,
  [dangerouslySetInnerHTML]: setInnerHTML,
};

export const ALLOWS_PROPS = ['class', 'className', 'style', 'id', QSlot];
export const HOST_PREFIX = 'host:';
export const SCOPE_PREFIX = /^(host|window|document|prevent(d|D)efault):/;

export const updateProperties = (
  rctx: RenderContext,
  ctx: QContext,
  expectProps: Record<string, any> | null,
  isSvg: boolean,
  isHost: boolean
) => {
  if (!expectProps) {
    return false;
  }
  const keys = Object.keys(expectProps);
  if (keys.length === 0) {
    return false;
  }
  let cache = ctx.$cache$;
  const elm = ctx.$element$;
  const isCmp = OnRenderProp in expectProps;
  const qwikProps = isCmp ? getPropsMutator(ctx, rctx.$containerState$) : undefined;
  for (let key of keys) {
    if (key === 'children' || key === OnRenderProp) {
      continue;
    }
    const newValue = expectProps[key];
    if (key === 'ref') {
      (newValue as Ref<Element>).current = elm;
      continue;
    }

    // Early exit if value didnt change
    const cacheKey = isHost ? `_host:${key}` : `_:${key}`;
    if (!cache) {
      cache = ctx.$cache$ = new Map();
    }
    const oldValue = cache.get(cacheKey);
    if (newValue === oldValue) {
      continue;
    }
    cache.set(cacheKey, newValue);

    // Check of data- or aria-
    if (key.startsWith('data-') || key.startsWith('aria-')) {
      setAttribute(rctx, elm, key, newValue);
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
      setEvent(ctx, key, newValue);
      continue;
    }

    // Check if its an exception
    const exception = PROP_HANDLER_MAP[key];
    if (exception) {
      if (exception(rctx, elm as HTMLElement, key, newValue, oldValue)) {
        continue;
      }
    }

    // Check if property in prototype
    if (!isSvg && key in elm) {
      setProperty(rctx, elm, key, newValue);
      continue;
    }

    // Fallback to render attribute
    setAttribute(rctx, elm, key, newValue);
  }
  if (ctx.$listeners$) {
    ctx.$listeners$.forEach((value, key) => {
      setAttribute(rctx, elm, fromCamelToKebabCase(key), serializeQRLs(value, ctx));
    });
  }
  return ctx.$dirty$;
};

export const createRenderContext = (
  doc: Document,
  containerState: ContainerState
): RenderContext => {
  const ctx: RenderContext = {
    $doc$: doc,
    $containerState$: containerState,
    $containerEl$: containerState.$containerEl$,
    $hostElements$: new Set(),
    $operations$: [],
    $roots$: [],
    $contexts$: [],
    $currentComponent$: undefined,
    $perf$: {
      $visited$: 0,
    },
  };
  return ctx;
};

const setEvent = (ctx: QContext, prop: string, value: any) => {
  assertTrue(prop.endsWith('$'), 'render: event property does not end with $', prop);
  if (!ctx.$listeners$) {
    ctx.$listeners$ = getDomListeners(ctx.$element$);
  }
  addQRLListener(ctx, normalizeOnProp(prop.slice(0, -1)), value);
};

export const copyRenderContext = (ctx: RenderContext): RenderContext => {
  const newCtx: RenderContext = {
    ...ctx,
    $contexts$: [...ctx.$contexts$],
  };
  return newCtx;
};

export const setAttribute = (ctx: RenderContext, el: Element, prop: string, value: any) => {
  const fn = () => {
    if (value == null || value === false) {
      el.removeAttribute(prop);
    } else {
      const str = value === true ? '' : String(value);
      directSetAttribute(el, prop, str);
    }
  };
  ctx.$operations$.push({
    $el$: el,
    $operation$: 'set-attribute',
    $args$: [prop, value],
    $fn$: fn,
  });
};

export const classlistAdd = (ctx: RenderContext, el: Element, hostStyleTag: string) => {
  const fn = () => {
    el.classList.add(hostStyleTag);
  };
  ctx.$operations$.push({
    $el$: el,
    $operation$: 'classlist-add',
    $args$: [hostStyleTag],
    $fn$: fn,
  });
};

const setProperty = (ctx: RenderContext, node: any, key: string, value: any) => {
  const fn = () => {
    try {
      node[key] = value;
    } catch (err) {
      logError(codeToText(QError_setProperty), { node, key, value }, err);
    }
  };
  ctx.$operations$.push({
    $el$: node,
    $operation$: 'set-property',
    $args$: [key, value],
    $fn$: fn,
  });
};

const createElement = (ctx: RenderContext, expectTag: string, isSvg: boolean): Element => {
  const el = isSvg
    ? ctx.$doc$.createElementNS(SVG_NS, expectTag)
    : ctx.$doc$.createElement(expectTag);
  (el as any)[CONTAINER] = ctx.$containerEl$;
  ctx.$operations$.push({
    $el$: el,
    $operation$: 'create-element',
    $args$: [expectTag],
    $fn$: () => {},
  });
  return el;
};

const insertBefore = <T extends Node>(
  ctx: RenderContext,
  parent: Node,
  newChild: T,
  refChild: Node | null | undefined
): T => {
  const fn = () => {
    parent.insertBefore(newChild, refChild ? refChild : null);
  };
  ctx.$operations$.push({
    $el$: parent,
    $operation$: 'insert-before',
    $args$: [newChild, refChild],
    $fn$: fn,
  });
  return newChild;
};

export const appendStyle = (ctx: RenderContext, hostElement: Element, styleTask: StyleAppend) => {
  const fn = () => {
    const containerEl = ctx.$containerEl$;
    const isDoc = ctx.$doc$.documentElement === containerEl && !!ctx.$doc$.head;
    const style = ctx.$doc$.createElement('style');
    directSetAttribute(style, 'q:style', styleTask.styleId);
    style.textContent = styleTask.content;
    if (isDoc) {
      ctx.$doc$.head.appendChild(style);
    } else {
      containerEl.insertBefore(style, containerEl.firstChild);
    }
  };
  ctx.$containerState$.$stylesIds$.add(styleTask.styleId);
  ctx.$operations$.push({
    $el$: hostElement,
    $operation$: 'append-style',
    $args$: [styleTask],
    $fn$: fn,
  });
};

export const hasStyle = (containerState: ContainerState, styleId: string) => {
  return containerState.$stylesIds$.has(styleId);
};

const prepend = (ctx: RenderContext, parent: Element, newChild: Node) => {
  const fn = () => {
    parent.insertBefore(newChild, parent.firstChild);
  };
  ctx.$operations$.push({
    $el$: parent,
    $operation$: 'prepend',
    $args$: [newChild],
    $fn$: fn,
  });
};

const removeNode = (ctx: RenderContext, el: Node) => {
  const fn = () => {
    const parent = el.parentNode;
    if (parent) {
      if (el.nodeType === 1) {
        cleanupTree(el as Element, ctx.$containerState$.$subsManager$);
      }
      parent.removeChild(el);
    } else if (qDev) {
      logWarn('Trying to remove component already removed', el);
    }
  };
  ctx.$operations$.push({
    $el$: el,
    $operation$: 'remove',
    $args$: [],
    $fn$: fn,
  });
};

export const cleanupTree = (parent: Element, subsManager: SubscriptionManager) => {
  if (parent.nodeName === 'Q:SLOT') {
    return;
  }
  if (parent.hasAttribute(QHostAttr)) {
    cleanupElement(parent, subsManager);
  }
  let child = parent.firstElementChild;
  while (child) {
    cleanupTree(child, subsManager);
    child = child.nextElementSibling;
  }
};

const cleanupElement = (el: Element, subsManager: SubscriptionManager) => {
  const ctx = tryGetContext(el);
  if (ctx) {
    cleanupContext(ctx, subsManager);
  }
};

const createTextNode = (ctx: RenderContext, text: string): Text => {
  return ctx.$doc$.createTextNode(text);
};

export const executeContextWithSlots = (ctx: RenderContext) => {
  const before = ctx.$roots$.map((elm) => getSlots(null, elm));

  executeContext(ctx);

  const after = ctx.$roots$.map((elm) => getSlots(null, elm));
  assertEqual(
    before.length,
    after.length,
    'render: number of q:slots changed during render context execution',
    before,
    after
  );

  for (let i = 0; i < before.length; i++) {
    resolveSlotProjection(ctx, ctx.$roots$[i], before[i], after[i]);
  }
};

export const executeContext = (ctx: RenderContext) => {
  for (const op of ctx.$operations$) {
    op.$fn$();
  }
};

export const printRenderStats = (ctx: RenderContext) => {
  if (qDev) {
    if (typeof window !== 'undefined' && window.document != null) {
      const byOp: Record<string, number> = {};
      for (const op of ctx.$operations$) {
        byOp[op.$operation$] = (byOp[op.$operation$] ?? 0) + 1;
      }
      const affectedElements = Array.from(new Set(ctx.$operations$.map((a) => a.$el$)));
      const stats = {
        byOp,
        roots: ctx.$roots$,
        hostElements: Array.from(ctx.$hostElements$),
        affectedElements,
        visitedNodes: ctx.$perf$.$visited$,
        operations: ctx.$operations$.map((v) => [v.$operation$, v.$el$, ...v.$args$]),
      };
      const noOps = ctx.$operations$.length === 0;
      logDebug('Render stats.', noOps ? 'No operations' : '', stats);
    }
  }
};

const createKeyToOldIdx = (children: Node[], beginIdx: number, endIdx: number): KeyToIndexMap => {
  const map: KeyToIndexMap = {};
  for (let i = beginIdx; i <= endIdx; ++i) {
    const child = children[i];
    if (child.nodeType === 1) {
      const key = getKey(child as Element);
      if (key != null) {
        map[key as string] = i;
      }
    }
  }
  return map;
};

const KEY_SYMBOL = Symbol('vnode key');

const getKey = (el: Element): string | null => {
  let key = (el as any)[KEY_SYMBOL];
  if (key === undefined) {
    key = (el as any)[KEY_SYMBOL] = directGetAttribute(el, 'q:key');
  }
  return key;
};

const setKey = (el: Element, key: string | null) => {
  if (isString(key)) {
    directSetAttribute(el, 'q:key', key);
  }
  (el as any)[KEY_SYMBOL] = key;
};

const sameVnode = (elm: Node, vnode2: ProcessedJSXNode): boolean => {
  const isElement = elm.nodeType === 1;
  const type = vnode2.$type$;
  if (isElement) {
    const isSameSel = (elm as Element).localName === type;
    if (!isSameSel) {
      return false;
    }
    return getKey(elm as Element) === vnode2.$key$;
  }
  return elm.nodeName === type;
};

const isTagName = (elm: Node, tagName: string): boolean => {
  if (elm.nodeType === 1) {
    return (elm as Element).localName === tagName;
  }
  return elm.nodeName === tagName;
};

const checkInnerHTML = (props: Record<string, any> | undefined | null) => {
  return props && ('innerHTML' in props || dangerouslySetInnerHTML in props);
};

export const stringifyClassOrStyle = (obj: any, isClass: boolean): string => {
  if (obj == null) return '';
  if (typeof obj == 'object') {
    let text = '';
    let sep = '';
    if (isArray(obj)) {
      if (!isClass) {
        throw qError(QError_stringifyClassOrStyle, obj, 'style');
      }
      for (let i = 0; i < obj.length; i++) {
        text += sep + obj[i];
        sep = ' ';
      }
    } else {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];

          if (value) {
            text += isClass
              ? value
                ? sep + key
                : ''
              : sep + fromCamelToKebabCase(key) + ':' + value;
            sep = isClass ? ' ' : ';';
          }
        }
      }
    }
    return text;
  }
  return String(obj);
};
