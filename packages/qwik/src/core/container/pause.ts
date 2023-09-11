import { assertDefined, assertElement, assertEqual } from '../error/assert';
import { getDocument } from '../util/dom';
import {
  isComment,
  isDocument,
  isElement,
  isNode,
  isQwikElement,
  isText,
  isVirtualElement,
} from '../util/element';
import { logWarn } from '../util/log';
import { ELEMENT_ID, ELEMENT_ID_PREFIX, QContainerAttr, QScopedStyle } from '../util/markers';
import { qDev } from '../util/qdev';

import {
  destroyTask,
  isResourceTask,
  type ResourceReturnInternal,
  TaskFlagsIsDirty,
} from '../use/use-task';
import {
  qError,
  QError_containerAlreadyPaused,
  QError_missingObjectId,
  QError_verifySerializable,
} from '../error/error';
import {
  isArray,
  isFunction,
  isObject,
  isSerializableObject
} from '../util/types';
import { directGetAttribute, directSetAttribute } from '../render/fast-calls';
import { isNotNullable, isPromise } from '../util/promises';
import { collectDeps, serializeValue, UNDEFINED_PREFIX } from './serializers';
import {
  type ContainerState,
  FILTER_REJECT,
  FILTER_SKIP,
  _getContainerState,
  type GetObjID,
  intToStr,
  SHOW_COMMENT,
  SHOW_ELEMENT,
  type SnapshotMeta,
  type SnapshotMetaValue,
  type SnapshotResult,
} from './container';
import {
  processVirtualNodes,
  type QwikElement,
  type VirtualElement,
} from '../render/dom/virtual-element';
import { groupListeners } from '../state/listeners';
import { serializeSStyle } from '../style/qrl-styles';
import { serializeQRLs } from '../qrl/qrl';
import {
  fastSkipSerialize,
  fastWeakSerialize,
  getProxyFlags,
  getSubscriptionManager,
  getProxyTarget,
  isConnected,
  LocalSubscriptionManager,
  serializeSubscription,
  type Subscriptions,
} from '../state/common';
import { HOST_FLAG_DYNAMIC, type QContext, tryGetContext } from '../state/context';
import { SignalImpl } from '../state/signal';
import type { QRL } from '../qrl/qrl.public';
import { QObjectImmutable, QObjectRecursive } from '../state/constants';

/**
 * @internal
 */
export const _serializeData = async (data: any, pureQRL?: boolean) => {
  const containerState = {} as any;
  const collector = createCollector(containerState);
  collectValue(data, collector, false);

  // Wait for remaining promises
  let promises: Promise<any>[];
  while ((promises = collector.$promises$).length > 0) {
    collector.$promises$ = [];
    await Promise.all(promises);
  }

  const objs = Array.from(collector.$objSet$.keys());
  let count = 0;

  const objToId = new Map<any, string>();
  for (const obj of objs) {
    objToId.set(obj, intToStr(count));
    count++;
  }
  if (collector.$noSerialize$.length > 0) {
    const undefinedID = objToId.get(undefined);
    assertDefined(undefinedID, 'undefined ID must be defined');
    for (const obj of collector.$noSerialize$) {
      objToId.set(obj, undefinedID);
    }
  }

  const mustGetObjId = (obj: any): string => {
    let suffix = '';
    if (isPromise(obj)) {
      const promiseValue = getPromiseValue(obj);
      if (!promiseValue) {
        throw qError(QError_missingObjectId, obj);
      }
      obj = promiseValue.value;
      if (promiseValue.resolved) {
        suffix += '~';
      } else {
        suffix += '_';
      }
    }
    if (isObject(obj)) {
      const target = getProxyTarget(obj);
      if (target) {
        suffix += '!';
        obj = target;
      }
    }
    const key = objToId.get(obj);
    if (key === undefined) {
      throw qError(QError_missingObjectId, obj);
    }
    return key + suffix;
  };

  const convertedObjs = objs.map((obj) => {
    if (obj === null) {
      return null;
    }
    const typeObj = typeof obj;
    switch (typeObj) {
      case 'undefined':
        return UNDEFINED_PREFIX;
      case 'number':
        if (!Number.isFinite(obj)) {
          break;
        }
        return obj;
      case 'string':
      case 'boolean':
        return obj;
    }
    const value = serializeValue(obj, mustGetObjId, collector, containerState);
    if (value !== undefined) {
      return value;
    }
    if (typeObj === 'object') {
      if (isArray(obj)) {
        return obj.map(mustGetObjId);
      }
      if (isSerializableObject(obj)) {
        const output: Record<string, any> = {};
        for (const key in obj) {
          output[key] = mustGetObjId(obj[key]);
        }
        return output;
      }
    }
    throw qError(QError_verifySerializable, obj);
  });

  return JSON.stringify({
    _entry: mustGetObjId(data),
    _objs: convertedObjs,
  });
};

// <docs markdown="../readme.md#pauseContainer">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!!
// (edit ../readme.md#pauseContainer instead)
/**
 */
// </docs>
export const pauseContainer = async (
  elmOrDoc: Element | Document,
  defaultParentJSON?: Element
): Promise<SnapshotResult> => {
  const doc = getDocument(elmOrDoc);
  const documentElement = doc.documentElement;
  const containerEl = isDocument(elmOrDoc) ? documentElement : elmOrDoc;
  if (directGetAttribute(containerEl, QContainerAttr) === 'paused') {
    throw qError(QError_containerAlreadyPaused);
  }
  const parentJSON =
    defaultParentJSON ?? (containerEl === doc.documentElement ? doc.body : containerEl);

  const containerState = _getContainerState(containerEl);
  const contexts = getNodesInScope(containerEl, hasContext);

  // Set container to paused
  directSetAttribute(containerEl, QContainerAttr, 'paused');

  // Update elements with context
  for (const elCtx of contexts) {
    const elm = elCtx.$element$;
    const listeners = elCtx.li;
    if (elCtx.$scopeIds$) {
      const value = serializeSStyle(elCtx.$scopeIds$);
      if (value) {
        elm.setAttribute(QScopedStyle, value);
      }
    }
    if (elCtx.$id$) {
      elm.setAttribute(ELEMENT_ID, elCtx.$id$);
    }
    if (isElement(elm) && listeners.length > 0) {
      const groups = groupListeners(listeners);
      for (const listener of groups) {
        elm.setAttribute(listener[0], serializeQRLs(listener[1], elCtx));
      }
    }
  }

  // Serialize data
  const data = await _pauseFromContexts(contexts, containerState, (el) => {
    if (isNode(el) && isText(el)) {
      return getTextID(el, containerState);
    }
    return null;
  });

  // Emit Qwik JSON
  const qwikJson = doc.createElement('script');
  directSetAttribute(qwikJson, 'type', 'qwik/json');
  qwikJson.textContent = escapeText(JSON.stringify(data.state, undefined, qDev ? '  ' : undefined));
  parentJSON.appendChild(qwikJson);

  // Emit event registration
  const extraListeners = Array.from(containerState.$events$, (s) => JSON.stringify(s));
  const eventsScript = doc.createElement('script');
  eventsScript.textContent = `window.qwikevents||=[];window.qwikevents.push(${extraListeners.join(
    ', '
  )})`;
  parentJSON.appendChild(eventsScript);

  return data;
};

/**
 * @internal
 */
export const _pauseFromContexts = async (
  allContexts: QContext[],
  containerState: ContainerState,
  fallbackGetObjId?: GetObjID,
  textNodes?: Map<string, string>
): Promise<SnapshotResult> => {
  const collector = createCollector(containerState);
  textNodes?.forEach((_, key) => {
    collector.$seen$.add(key);
  });
  let hasListeners = false;

  // TODO: optimize
  for (const ctx of allContexts) {
    if (ctx.$tasks$) {
      for (const task of ctx.$tasks$) {
        if (qDev) {
          if (task.$flags$ & TaskFlagsIsDirty) {
            logWarn('Serializing dirty task. Looks like an internal error.');
          }
          if (!isConnected(task)) {
            logWarn('Serializing disconnected task. Looks like an internal error.');
          }
        }
        if (isResourceTask(task)) {
          collector.$resources$.push(task.$state$);
        }
        destroyTask(task);
      }
    }
  }

  for (const ctx of allContexts) {
    const el = ctx.$element$;
    const ctxListeners = ctx.li;
    for (const listener of ctxListeners) {
      if (isElement(el)) {
        const qrl = listener[1];
        const captured = qrl.$captureRef$;
        if (captured) {
          for (const obj of captured) {
            collectValue(obj, collector, true);
          }
        }
        collector.$qrls$.push(qrl);
        hasListeners = true;
      }
    }
  }

  // No listeners implies static page
  if (!hasListeners) {
    return {
      state: {
        refs: {},
        ctx: {},
        objs: [],
        subs: [],
      },
      objs: [],
      funcs: [],
      qrls: [],
      resources: collector.$resources$,
      mode: 'static',
    };
  }

  // Wait for remaining promises
  let promises: Promise<any>[];
  while ((promises = collector.$promises$).length > 0) {
    collector.$promises$ = [];
    await Promise.all(promises);
  }

  // If at this point any component can render, we need to capture Context and Props
  const canRender = collector.$elements$.length > 0;
  if (canRender) {
    for (const elCtx of collector.$deferElements$) {
      collectElementData(elCtx, collector, elCtx.$element$);
    }

    for (const ctx of allContexts) {
      collectProps(ctx, collector);
    }
  }

  // Wait for remaining promises
  while ((promises = collector.$promises$).length > 0) {
    collector.$promises$ = [];
    await Promise.all(promises);
  }

  // Convert objSet to array
  const elementToIndex = new Map<Node | QwikElement, string | null>();
  const objs = Array.from(collector.$objSet$.keys());
  const objToId = new Map<any, string>();

  const getElementID = (el: QwikElement): string | null => {
    let id = elementToIndex.get(el);
    if (id === undefined) {
      id = getQId(el);
      if (!id) {
        console.warn('Missing ID', el);
      }
      elementToIndex.set(el, id);
    }
    return id;
  };

  const getObjId: GetObjID = (obj) => {
    let suffix = '';
    if (isPromise(obj)) {
      const promiseValue = getPromiseValue(obj);
      if (!promiseValue) {
        return null;
      }
      obj = promiseValue.value;
      if (promiseValue.resolved) {
        suffix += '~';
      } else {
        suffix += '_';
      }
    }

    if (isObject(obj)) {
      const target = getProxyTarget(obj);
      if (target) {
        suffix += '!';
        obj = target;
      } else if (isQwikElement(obj)) {
        const elID = getElementID(obj);
        if (elID) {
          return ELEMENT_ID_PREFIX + elID + suffix;
        }
        return null;
      }
    }
    const id = objToId.get(obj);
    if (id) {
      return id + suffix;
    }
    const textId = textNodes?.get(obj);
    if (textId) {
      return '*' + textId;
    }
    if (fallbackGetObjId) {
      return fallbackGetObjId(obj);
    }
    return null;
  };

  const mustGetObjId = (obj: any): string => {
    const key = getObjId(obj);
    if (key === null) {
      throw qError(QError_missingObjectId, obj);
    }
    return key;
  };

  // Compute subscriptions
  const subsMap = new Map<any, (Subscriptions | number)[]>();
  for (const obj of objs) {
    const subs = getManager(obj, containerState)?.$subs$;
    if (!subs) {
      continue;
    }
    const flags = getProxyFlags(obj) ?? 0;
    const converted: (Subscriptions | number)[] = [];
    if (flags & QObjectRecursive) {
      converted.push(flags);
    }
    for (const sub of subs) {
      const host = sub[1];
      if (sub[0] === 0 && isNode(host) && isVirtualElement(host)) {
        if (!collector.$elements$.includes(tryGetContext(host)!)) {
          continue;
        }
      }
      converted.push(sub);
    }
    if (converted.length > 0) {
      subsMap.set(obj, converted);
    }
  }

  // Sort objects: the ones with subscriptions go first
  objs.sort((a, b) => {
    const isProxyA = subsMap.has(a) ? 0 : 1;
    const isProxyB = subsMap.has(b) ? 0 : 1;
    return isProxyA - isProxyB;
  });

  // Generate object ID by using a monotonic counter
  let count = 0;
  for (const obj of objs) {
    objToId.set(obj, intToStr(count));
    count++;
  }
  if (collector.$noSerialize$.length > 0) {
    const undefinedID = objToId.get(undefined);
    assertDefined(undefinedID, 'undefined ID must be defined');
    for (const obj of collector.$noSerialize$) {
      objToId.set(obj, undefinedID);
    }
  }

  // Serialize object subscriptions
  const subs: string[][] = [];
  for (const obj of objs) {
    const value = subsMap.get(obj);
    if (value == null) {
      break;
    }
    subs.push(
      value
        .map((s) => {
          if (typeof s === 'number') {
            return `_${s}`;
          }
          return serializeSubscription(s, getObjId);
        })
        .filter(isNotNullable)
    );
  }
  assertEqual(subs.length, subsMap.size, 'missing subscriptions to serialize', subs, subsMap);

  // Serialize objects
  const convertedObjs = objs.map((obj) => {
    if (obj === null) {
      return null;
    }
    const typeObj = typeof obj;
    switch (typeObj) {
      case 'undefined':
        return UNDEFINED_PREFIX;
      case 'number':
        if (!Number.isFinite(obj)) {
          break;
        }
        return obj;
      case 'string':
      case 'boolean':
        return obj;
    }
    const value = serializeValue(obj, mustGetObjId, collector, containerState);
    if (value !== undefined) {
      return value;
    }
    if (typeObj === 'object') {
      if (isArray(obj)) {
        return obj.map(mustGetObjId);
      }
      if (isSerializableObject(obj)) {
        const output: Record<string, any> = {};
        for (const key in obj) {
          const id = getObjId(obj[key]);
          if (id !== null) {
            output[key] = id;
          }
        }
        return output;
      }
    }
    throw qError(QError_verifySerializable, obj);
  });

  const meta: SnapshotMeta = {};
  const refs: Record<string, string> = {};

  // Write back to the dom
  for (const ctx of allContexts) {
    const node = ctx.$element$;
    const elementID = ctx.$id$;
    const ref = ctx.$refMap$;
    const props = ctx.$props$;
    const contexts = ctx.$contexts$;
    const tasks = ctx.$tasks$;
    const renderQrl = ctx.$componentQrl$;
    const seq = ctx.$seq$;
    const metaValue: SnapshotMetaValue = {};
    const elementCaptured = isVirtualElement(node) && collector.$elements$.includes(ctx);
    assertDefined(elementID, `pause: can not generate ID for dom node`, node);

    if (ref.length > 0) {
      assertElement(node);
      const value = mapJoin(ref, mustGetObjId, ' ');
      if (value) {
        refs[elementID] = value;
      }
    } else if (canRender) {
      let add = false;
      if (elementCaptured) {
        assertDefined(renderQrl, 'renderQrl must be defined');
        const propsId = getObjId(props);
        metaValue.h = mustGetObjId(renderQrl) + (propsId ? ' ' + propsId : '');
        add = true;
      } else {
        const propsId = getObjId(props);
        if (propsId) {
          metaValue.h = ' ' + propsId;
          add = true;
        }
      }

      if (tasks && tasks.length > 0) {
        const value = mapJoin(tasks, getObjId, ' ');
        if (value) {
          metaValue.w = value;
          add = true;
        }
      }

      if (elementCaptured && seq && seq.length > 0) {
        const value = mapJoin(seq, mustGetObjId, ' ');
        metaValue.s = value;
        add = true;
      }

      if (contexts) {
        const serializedContexts: string[] = [];
        contexts.forEach((value, key) => {
          const id = getObjId(value);
          if (id) {
            serializedContexts.push(`${key}=${id}`);
          }
        });
        const value = serializedContexts.join(' ');
        if (value) {
          metaValue.c = value;
          add = true;
        }
      }
      if (add) {
        meta[elementID] = metaValue;
      }
    }
  }

  // Sanity check of serialized element
  if (qDev) {
    elementToIndex.forEach((value, el) => {
      if (!value) {
        logWarn('unconnected element', el.nodeName, '\n');
      }
    });
  }

  return {
    state: {
      refs,
      ctx: meta,
      objs: convertedObjs,
      subs,
    },
    objs,
    funcs: collector.$inlinedFunctions$,
    resources: collector.$resources$,
    qrls: collector.$qrls$,
    mode: canRender ? 'render' : 'listeners',
  };
};

export const mapJoin = (objects: any[], getObjectId: GetObjID, sep: string): string => {
  let output = '';
  for (const obj of objects) {
    const id = getObjectId(obj);
    if (id !== null) {
      if (output !== '') {
        output += sep;
      }
      output += id;
    }
  }
  return output;
};

export const getNodesInScope = <T>(
  parent: Element,
  predicate: (el: Node) => T | undefined
): T[] => {
  const results: T[] = [];
  const v = predicate(parent);
  if (v !== undefined) {
    results.push(v);
  }
  const walker = parent.ownerDocument.createTreeWalker(parent, SHOW_ELEMENT | SHOW_COMMENT, {
    acceptNode(node) {
      if (isContainer(node)) {
        return FILTER_REJECT;
      }
      const v = predicate(node);
      if (v !== undefined) {
        results.push(v);
      }
      return FILTER_SKIP;
    },
  });
  while (walker.nextNode()) {
    // do nothing
  }

  return results;
};

export interface Collector {
  $seen$: Set<any>;
  $objSet$: Set<any>;
  $noSerialize$: any[];
  $elements$: QContext[];
  $qrls$: QRL[];
  $inlinedFunctions$: string[];
  $resources$: ResourceReturnInternal<any>[];
  $prefetch$: number;
  $deferElements$: QContext[];
  $containerState$: ContainerState;
  $promises$: Promise<any>[];
}

const collectProps = (elCtx: QContext, collector: Collector) => {
  const parentCtx = elCtx.$parent$;
  const props = elCtx.$props$;
  if (parentCtx && props && !isEmptyObj(props) && collector.$elements$.includes(parentCtx)) {
    const subs = getSubscriptionManager(props)?.$subs$;
    const el = elCtx.$element$ as VirtualElement;
    if (subs) {
      for (const [type, host] of subs) {
        if (type === 0) {
          if (host !== el) {
            collectSubscriptions(getSubscriptionManager(props)!, collector, false);
          }
          if (isNode(host)) {
            collectElement(host, collector);
          } else {
            collectValue(host, collector, true);
          }
        } else {
          collectValue(props, collector, false);
          collectSubscriptions(getSubscriptionManager(props)!, collector, false);
        }
      }
    }
  }
};

const createCollector = (containerState: ContainerState): Collector => {
  return {
    $containerState$: containerState,
    $seen$: new Set(),
    $objSet$: new Set(),
    $prefetch$: 0,
    $noSerialize$: [],
    $inlinedFunctions$: [],
    $resources$: [],
    $elements$: [],
    $qrls$: [],
    $deferElements$: [],
    $promises$: [],
  };
};

const collectDeferElement = (el: VirtualElement, collector: Collector) => {
  const ctx = tryGetContext(el)!;
  if (collector.$elements$.includes(ctx)) {
    return;
  }
  collector.$elements$.push(ctx);
  collector.$prefetch$++;
  if (ctx.$flags$ & HOST_FLAG_DYNAMIC) {
    collectElementData(ctx, collector, true);
  } else {
    collector.$deferElements$.push(ctx);
  }
  collector.$prefetch$--;
};

const collectElement = (el: QwikElement, collector: Collector) => {
  const ctx = tryGetContext(el);
  if (ctx) {
    if (collector.$elements$.includes(ctx)) {
      return;
    }
    collector.$elements$.push(ctx);
    collectElementData(ctx, collector, el);
  }
};

export const collectElementData = (
  elCtx: QContext,
  collector: Collector,
  dynamicCtx: QwikElement | boolean
) => {
  if (elCtx.$props$ && !isEmptyObj(elCtx.$props$)) {
    collectValue(elCtx.$props$, collector, dynamicCtx);
    collectSubscriptions(getSubscriptionManager(elCtx.$props$)!, collector, dynamicCtx);
  }
  if (elCtx.$componentQrl$) {
    collectValue(elCtx.$componentQrl$, collector, dynamicCtx);
  }
  if (elCtx.$seq$) {
    for (const obj of elCtx.$seq$) {
      collectValue(obj, collector, dynamicCtx);
    }
  }
  if (elCtx.$tasks$) {
    const map = collector.$containerState$.$subsManager$.$groupToManagers$;
    for (const obj of elCtx.$tasks$) {
      if (map.has(obj)) {
        collectValue(obj, collector, dynamicCtx);
      }
    }
  }

  if (dynamicCtx === true) {
    collectContext(elCtx, collector);
    if (elCtx.$dynamicSlots$) {
      for (const slotCtx of elCtx.$dynamicSlots$) {
        collectContext(slotCtx, collector);
      }
    }
  }
};

const collectContext = (elCtx: QContext | null, collector: Collector) => {
  while (elCtx) {
    if (elCtx.$contexts$) {
      for (const obj of elCtx.$contexts$.values()) {
        collectValue(obj, collector, true);
      }
      if (elCtx.$contexts$.get('_') === true) {
        break;
      }
    }
    elCtx = elCtx.$slotParent$ ?? elCtx.$parent$;
  }
};

export const escapeText = (str: string) => {
  return str.replace(/<(\/?script)/g, '\\x3C$1');
};

export const collectSubscriptions = (
  manager: LocalSubscriptionManager,
  collector: Collector,
  leaks: boolean | QwikElement
) => {
  // if (!leaks) {
  //   return;
  // }
  if (collector.$seen$.has(manager)) {
    return;
  }
  collector.$seen$.add(manager);

  const subs = manager.$subs$;
  assertDefined(subs, 'subs must be defined');
  for (const key of subs) {
    const type = key[0];
    if (type > 0) {
      collectValue(key[2], collector, leaks);
    }
    if (leaks === true) {
      const host = key[1];
      if (isNode(host) && isVirtualElement(host)) {
        if (type === 0) {
          collectDeferElement(host, collector);
        }
      } else {
        collectValue(host, collector, true);
      }
    }
  }
};

const PROMISE_VALUE = Symbol();

interface PromiseValue {
  resolved: boolean;
  value: any;
}
const resolvePromise = (promise: Promise<any>) => {
  return promise.then(
    (value) => {
      const v: PromiseValue = {
        resolved: true,
        value,
      };
      (promise as any)[PROMISE_VALUE] = v;
      return value;
    },
    (value) => {
      const v: PromiseValue = {
        resolved: false,
        value,
      };
      (promise as any)[PROMISE_VALUE] = v;
      return value;
    }
  );
};

const getPromiseValue = (promise: Promise<any>): PromiseValue | undefined => {
  return (promise as any)[PROMISE_VALUE];
};

export const collectValue = (obj: any, collector: Collector, leaks: boolean | QwikElement) => {
  if (obj !== null) {
    const objType = typeof obj;
    switch (objType) {
      case 'function':
      case 'object': {
        const seen = collector.$seen$;
        if (seen.has(obj)) {
          return;
        }
        seen.add(obj);
        if (fastSkipSerialize(obj)) {
          collector.$objSet$.add(undefined);
          collector.$noSerialize$.push(obj);
          return;
        }

        const input = obj;
        const target = getProxyTarget(obj);
        if (target) {
          obj = target;
          // NOTE: You may be tempted to add the `target` to the `seen` set,
          // but that would not work as it is possible for the `target` object
          // to already be in `seen` set if it was passed in directly, so
          // we can't short circuit and need to do the work.
          // Issue: https://github.com/BuilderIO/qwik/issues/5001
          const mutable = (getProxyFlags(obj)! & QObjectImmutable) === 0;
          if (leaks && mutable) {
            collectSubscriptions(getSubscriptionManager(input)!, collector, leaks);
          }
          if (fastWeakSerialize(input)) {
            collector.$objSet$.add(obj);
            return;
          }
        }
        const collected = collectDeps(obj, collector, leaks);
        if (collected) {
          collector.$objSet$.add(obj);
          return;
        }

        if (isPromise(obj)) {
          collector.$promises$.push(
            resolvePromise(obj).then((value) => {
              collectValue(value, collector, leaks);
            })
          );
          return;
        } else if (isFunction(obj)) {
          collector.$objSet$.add(undefined);
          collector.$noSerialize$.push(obj);
          return;
        }

        if (objType === 'object') {
          if (isNode(obj)) {
            return;
          }
          if (isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
              collectValue(input[i], collector, leaks);
            }
          } else if (isSerializableObject(obj)) {
            for (const key in obj) {
              collectValue(input[key], collector, leaks);
            }
          }
        }
        break;
      }
      case 'string': {
        if (collector.$seen$.has(obj)) {
          return;
        }
      }
    }
  }
  collector.$objSet$.add(obj);
};

export const isContainer = (el: Node) => {
  return isElement(el) && el.hasAttribute(QContainerAttr);
};

const hasContext = (el: Node) => {
  const node = processVirtualNodes(el);
  if (isQwikElement(node)) {
    const ctx = tryGetContext(node);
    if (ctx && ctx.$id$) {
      return ctx;
    }
  }
  return undefined;
};

const getManager = (obj: any, containerState: ContainerState) => {
  if (!isObject(obj)) {
    return undefined;
  }
  if (obj instanceof SignalImpl) {
    return getSubscriptionManager(obj);
  }
  const proxy = containerState.$proxyMap$.get(obj);
  if (proxy) {
    return getSubscriptionManager(proxy);
  }
  return undefined;
};

const getQId = (el: QwikElement): string | null => {
  const ctx = tryGetContext(el);
  if (ctx) {
    return ctx.$id$;
  }
  return null;
};

const getTextID = (node: Text, containerState: ContainerState) => {
  const prev = node.previousSibling;
  if (prev && isComment(prev)) {
    if (prev.data.startsWith('t=')) {
      return ELEMENT_ID_PREFIX + prev.data.slice(2);
    }
  }
  const doc = node.ownerDocument;
  const id = intToStr(containerState.$elementIndex$++);
  const open = doc.createComment(`t=${id}`);
  const close = doc.createComment('');
  const parent = node.parentElement!;
  parent.insertBefore(open, node);
  parent.insertBefore(close, node.nextSibling);
  return ELEMENT_ID_PREFIX + id;
};

const isEmptyObj = (obj: Record<string, any>) => {
  return Object.keys(obj).length === 0;
};
