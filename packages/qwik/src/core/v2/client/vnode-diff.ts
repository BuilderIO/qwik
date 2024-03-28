import { isDev } from '@builder.io/qwik/build';
import { type OnRenderFn } from '../../component/component.public';
import { SERIALIZABLE_STATE } from '../../container/serializers';
import { assertDefined, assertFalse } from '../../error/assert';
import type { QRLInternal } from '../../qrl/qrl-class';
import type { QRL } from '../../qrl/qrl.public';
import { serializeClass, stringifyStyle } from '../../render/execute-component';
import { Fragment, JSXNodeImpl, isJSXNode } from '../../render/jsx/jsx-runtime';
import { Slot } from '../../render/jsx/slot.public';
import type { JSXNode, JSXOutput } from '../../render/jsx/types/jsx-node';
import type { JSXChildren } from '../../render/jsx/types/jsx-qwik-attributes';
import { SubscriptionType } from '../../state/common';
import { isSignal } from '../../state/signal';
import { trackSignal } from '../../use/use-core';
import { destroyTask, isTask, type SubscriberEffect } from '../../use/use-task';
import { EMPTY_ARRAY, EMPTY_OBJ } from '../../util/flyweight';
import { throwErrorAndStop } from '../../util/log';
import {
  ELEMENT_KEY,
  ELEMENT_PROPS,
  ELEMENT_SEQ,
  OnRenderProp,
  QScopedStyle,
  QSlot,
  QSlotParent,
  QStyle,
} from '../../util/markers';
import { isPromise } from '../../util/promises';
import { type ValueOrPromise } from '../../util/types';
import { executeComponent2 } from '../shared/component-execution';
import {
  getEventNameFromJsxProp,
  getEventNameScopeFromJsxProp,
  isHtmlAttributeAnEventName,
  isJsxPropertyAnEventName,
} from '../shared/event-names';
import { addPrefixForScopedStyleIdsString, isClassAttr } from '../shared/scoped-styles';
import type { QElement2, fixMeAny } from '../shared/types';
import { DEBUG_TYPE, VirtualType } from '../shared/types';
import type { DomContainer } from './dom-container';
import {
  ElementVNodeProps,
  VNodeFlags,
  VNodeProps,
  type ClientAttrKey,
  type ClientAttrs,
  type ClientContainer,
  type ElementVNode,
  type TextVNode,
  type VNode,
  type VirtualVNode,
} from './types';
import {
  mapApp_findIndx,
  mapArray_set,
  vnode_ensureElementInflated,
  vnode_getAttr,
  vnode_getElementName,
  vnode_getFirstChild,
  vnode_getNextSibling,
  vnode_getNode,
  vnode_getParent,
  vnode_getProjectionParentComponent,
  vnode_getProp,
  vnode_getText,
  vnode_getType,
  vnode_insertBefore,
  vnode_isElementVNode,
  vnode_isTextVNode,
  vnode_isVirtualVNode,
  vnode_locate,
  vnode_newElement,
  vnode_newText,
  vnode_newVirtual,
  vnode_remove,
  vnode_setAttr,
  vnode_setProp,
  vnode_setText,
  vnode_truncate,
} from './vnode';

export type ComponentQueue = Array<VNode>;

export const vnode_diff = (container: ClientContainer, jsxNode: JSXOutput, vStartNode: VNode) => {
  const journal = (container as DomContainer).$journal$;

  /**
   * Stack is used to keep track of the state of the traversal.
   *
   * We push current state into the stack before descending into the child, and we pop the state
   * when we are done with the child.
   */
  const stack: any[] = [];

  const asyncQueue: Array<VNode | ValueOrPromise<JSXOutput>> = [];

  ////////////////////////////////
  //// Traverse state variables
  ////////////////////////////////
  let vParent: VNode = null!;
  /// Current node we compare against. (Think of it as a cursor.)
  /// (Node can be null, if we are at the end of the list.)
  let vCurrent: VNode | null = null;
  /// When we insert new node we start it here so that we can descend into it.
  /// NOTE: it can't be stored in `vCurrent` because `vNewCurrent` is in journal
  /// and is not connected to the tree.
  let vNewNode: VNode | null = null;
  /// When elements have keys they can be consumed out of order and therefore we can't use nextSibling.
  /// In such a case this array will contain the elements after the current location.
  /// The array even indices will contains keys and odd indices the vNode.
  let vSiblings: Array<string | null | VNode> | null = null;
  let vSiblingsIdx = -1;
  /// Current set of JSX children.
  let jsxChildren: any[] = null!;
  // Current JSX child.
  let jsxValue: any = null;
  let jsxIdx = 0;
  let jsxCount = 0;
  // When we descend into children, we need to skip advance() because we just descended.
  let shouldAdvance = true;
  let scopedStyleIdPrefix: string | null;
  ////////////////////////////////

  diff(jsxNode, vStartNode);
  return drainAsyncQueue();

  //////////////////////////////////////////////
  //////////////////////////////////////////////
  //////////////////////////////////////////////

  function diff(jsxNode: JSXOutput, vStartNode: VNode) {
    vParent = vStartNode;
    vNewNode = null;
    vCurrent = vnode_getFirstChild(vStartNode);
    retrieveScopedStyleIdPrefix();
    stackPush(jsxNode, true);
    while (stack.length) {
      while (jsxIdx < jsxCount) {
        assertFalse(vParent === vCurrent, "Parent and current can't be the same");
        if (typeof jsxValue === 'string') {
          expectText(jsxValue);
        } else if (typeof jsxValue === 'number') {
          expectText(String(jsxValue));
        } else if (jsxValue && typeof jsxValue === 'object') {
          if (Array.isArray(jsxValue)) {
            descend(jsxValue, false);
          } else if (isSignal(jsxValue)) {
            expectVirtual(VirtualType.DerivedSignal);
            descend(
              trackSignal(jsxValue, [
                SubscriptionType.TEXT_MUTABLE,
                vCurrent || (vNewNode as fixMeAny), // This should be host, but not sure why
                jsxValue,
                vCurrent || (vNewNode as fixMeAny),
              ]),
              true
            );
          } else if (isPromise(jsxValue)) {
            expectVirtual(VirtualType.Awaited);
            asyncQueue.push(jsxValue, vNewNode || vCurrent);
          } else if (isJSXNode(jsxValue)) {
            const type = jsxValue.type;
            if (typeof type === 'string') {
              expectNoMoreTextNodes();
              expectElement(jsxValue, type);
              descend(jsxValue.children, true);
            } else if (typeof type === 'function') {
              if (type === Fragment) {
                expectNoMoreTextNodes();
                expectVirtual(VirtualType.Fragment);
                descend(jsxValue.children, true);
              } else if (type === Slot) {
                expectNoMoreTextNodes();
                if (!expectSlot()) {
                  // nothing to project, so try to render the Slot default content.
                  descend(jsxValue.children, true);
                }
              } else if (type === Projection) {
                expectProjection();
                descend(jsxValue.children, true);
              } else {
                // Must be a component
                expectNoMoreTextNodes();
                expectComponent(type);
              }
            } else {
              throwErrorAndStop(`Unsupported type: ${type}`);
            }
          } else {
            throwErrorAndStop(`Unsupported value: ${jsxValue}`);
          }
        } else {
          expectText('');
        }
        advance();
      }
      expectNoMore();
      ascend();
    }
  }

  function advance() {
    if (!shouldAdvance) {
      shouldAdvance = true;
      return;
    }
    jsxIdx++;
    if (jsxIdx < jsxCount) {
      jsxValue = jsxChildren[jsxIdx];
    } else if (stack[stack.length - 1] === false) {
      // this was special `descendVNode === false` so pop and try again
      return ascend();
    }
    if (vNewNode !== null) {
      // We have a new Node.
      // This means that the `vCurrent` was deemed not useful and we inserted in front of it.
      // This means that the next node we should look at is the `vCurrent` so just clear the
      // vNewNode  and try again.
      vNewNode = null;
    } else if (vSiblings !== null) {
      // We came across a key, and we moved nodes around. This means we can no longer use
      // `vnode_getNextSibling` to look at next node and instead we have to go by `vSiblings`.
      vSiblingsIdx += 2; // advance;
      vCurrent = vSiblingsIdx < vSiblings.length ? (vSiblings[vSiblingsIdx + 1] as any) : null;
    } else {
      // If we don't have a `vNewNode`, than that means we just reconciled the current node.
      // So advance it.
      vCurrent = vCurrent ? vnode_getNextSibling(vCurrent) : null;
    }
  }

  /**
   * @param children
   * @param descendVNode - If true we are descending into vNode; This is set to false if we come
   *   across an array in jsx, and we need to descend into the array without actually descending
   *   into the vNode.
   *
   *   Example:
   *
   *   ```
   *   <>
   *   before
   *   {[1,2].map((i) => <span>{i}</span>)}
   *   after
   *   </>
   * ```
   *
   *   In the above example all nodes are on same level so we don't `descendVNode` even thought there
   *   is an array produced by the `map` function.
   */
  function descend(children: any, descendVNode: boolean) {
    if (children == null) {
      expectNoChildren();
      return;
    }
    stackPush(children, descendVNode);
    if (descendVNode) {
      assertDefined(vCurrent || vNewNode, 'Expecting vCurrent to be defined.');
      vSiblings = null;
      vSiblingsIdx = -1;
      vParent = vNewNode || vCurrent!;
      vCurrent = vnode_getFirstChild(vParent);
      vNewNode = null;
    }
    shouldAdvance = false;
  }

  function ascend() {
    const descendVNode = stack.pop(); // boolean: descendVNode
    if (descendVNode) {
      vSiblingsIdx = stack.pop();
      vSiblings = stack.pop();
      vNewNode = stack.pop();
      vCurrent = stack.pop();
      vParent = stack.pop();
    }
    jsxValue = stack.pop();
    jsxCount = stack.pop();
    jsxIdx = stack.pop();
    jsxChildren = stack.pop();
    advance();
  }

  function stackPush(children: any, descendVNode: boolean) {
    stack.push(jsxChildren, jsxIdx, jsxCount, jsxValue);
    if (descendVNode) {
      stack.push(vParent, vCurrent, vNewNode, vSiblings, vSiblingsIdx);
    }
    stack.push(descendVNode);
    if (Array.isArray(children)) {
      jsxIdx = 0;
      jsxCount = children.length;
      jsxChildren = children;
      jsxValue = jsxCount > 0 ? children[0] : null;
    } else if (children === undefined) {
      // no children
      jsxIdx = 0;
      jsxValue = null;
      jsxChildren = null!;
      jsxCount = 0;
    } else {
      jsxIdx = 0;
      jsxValue = children;
      jsxChildren = null!;
      jsxCount = 1;
    }
  }

  function getInsertBefore() {
    if (vNewNode) {
      return vCurrent;
    } else if (vSiblings !== null) {
      const nextIdx = vSiblingsIdx + 3; // 2 plus 1 for node offset
      return nextIdx < vSiblings.length ? (vSiblings[nextIdx] as VNode) : null;
    } else {
      return vCurrent && vnode_getNextSibling(vCurrent);
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  function descendProjection(children: JSXChildren) {
    if (children == null) {
      return;
    }
    if (!Array.isArray(children)) {
      children = [children];
    }
    if (children.length) {
      const projection: Array<string | JSXNode> = [];
      /// STEP 1: Bucketize the children based on the projection name.
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const slotName = String((isJSXNode(child) && child.props[QSlot]) || '');
        const idx = mapApp_findIndx(projection, slotName, 0);
        let jsxBucket: JSXNodeImpl<typeof Projection>;
        if (idx >= 0) {
          jsxBucket = projection[idx + 1] as any;
        } else {
          projection.splice(
            ~idx,
            0,
            slotName,
            (jsxBucket = new JSXNodeImpl(Projection, EMPTY_OBJ, null, [], 0, slotName))
          );
        }
        (jsxBucket.children as JSXChildren[]).push(child);
      }
      /// STEP 2: remove the names
      for (let i = projection.length - 2; i >= 0; i = i - 2) {
        projection.splice(i, 1);
      }
      descend(projection, true);
    }
  }

  function expectProjection() {
    const slotName = jsxValue.key as string;
    // console.log('expectProjection', JSON.stringify(slotName));
    vCurrent = vnode_getProp<VirtualVNode | null>(
      vParent, // The parent is the component and it should have our portal.
      slotName,
      (id) => vnode_locate(container.rootVNode, id)
    );
    if (vCurrent == null) {
      vNewNode = vnode_newVirtual(vParent);
      isDev && vnode_setProp(vNewNode, DEBUG_TYPE, VirtualType.Projection);
      vnode_setProp(vNewNode as VirtualVNode, QSlot, slotName);
      vnode_setProp(vNewNode as VirtualVNode, QSlotParent, vParent);
      vnode_setProp(vParent as VirtualVNode, slotName, vNewNode);
    }
  }

  function expectSlot() {
    const slotNameKey: string = jsxValue.props.name || '';
    // console.log('expectSlot', JSON.stringify(slotNameKey));
    const vHost = vnode_getProjectionParentComponent(vParent, container.$getObjectById$);
    const vProjectedNode = vHost
      ? vnode_getProp<VirtualVNode | null>(
          vHost,
          slotNameKey,
          // for slots this id is vnode ref id
          null // Projections should have been resolved through container.ensureProjectionResolved
          //(id) => vnode_locate(container.rootVNode, id)
        )
      : null;
    // console.log('   ', String(vHost), String(vProjectedNode));
    if (vProjectedNode == null) {
      // Nothing to project, so render content of the slot.
      vnode_insertBefore(
        journal,
        vParent as ElementVNode | VirtualVNode,
        (vNewNode = vnode_newVirtual(vParent)),
        vCurrent && getInsertBefore()
      );
      isDev && vnode_setProp(vNewNode, DEBUG_TYPE, VirtualType.Projection);
      return false;
    } else if (vProjectedNode === vCurrent) {
      // All is good.
      // console.log('  NOOP', String(vCurrent));
    } else {
      vnode_insertBefore(
        journal,
        vParent as ElementVNode | VirtualVNode,
        (vNewNode = vProjectedNode),
        vCurrent && getInsertBefore()
      );
    }
    return true;
  }

  function drainAsyncQueue(): ValueOrPromise<void> {
    while (asyncQueue.length) {
      const jsxNode = asyncQueue.shift() as ValueOrPromise<JSXNode>;
      const vHostNode = asyncQueue.shift() as VNode;
      if (isPromise(jsxNode)) {
        return jsxNode.then((jsxNode) => {
          diff(jsxNode, vHostNode);
          return drainAsyncQueue();
        });
      } else {
        diff(jsxNode, vHostNode);
      }
    }
  }

  function expectNoChildren() {
    let vChild = vCurrent && vnode_getFirstChild(vCurrent);
    if (vChild !== null) {
      vnode_truncate(journal, vCurrent as ElementVNode | VirtualVNode, vChild);
      while (vChild) {
        container.$scheduler$.$drainCleanup$(vChild as fixMeAny);
        vChild = vnode_getNextSibling(vChild);
      }
    }
  }

  function expectNoMore() {
    assertFalse(vParent === vCurrent, "Parent and current can't be the same");
    if (vCurrent !== null) {
      let vCleanup: VNode | null = vCurrent;
      while (vCleanup) {
        releaseSubscriptions(container, vCleanup);
        vCleanup = vnode_getNextSibling(vCleanup);
      }
      let vChild: VNode | null = vCurrent;
      while (vChild) {
        // container.$scheduler$.$drainCleanup$(vChild as fixMeAny);
        releaseSubscriptions(container, vChild);
        vnode_remove(journal, vParent as ElementVNode | VirtualVNode, vChild, true);
        vChild = vnode_getNextSibling(vChild);
      }
    }
  }

  function expectNoMoreTextNodes() {
    while (vCurrent !== null && vnode_getType(vCurrent) === 3 /* Text */) {
      releaseSubscriptions(container, vCurrent);
      vnode_remove(journal, vParent, vCurrent, true);
      vCurrent = vnode_getNextSibling(vCurrent);
      container.$scheduler$.$drainCleanup$(vCurrent as fixMeAny);
    }
  }

  /** @param tag Returns true if `qDispatchEvent` needs patching */
  function createNewElement(jsx: JSXNode, tag: string): boolean {
    const element = container.document.createElement(tag);
    vnode_insertBefore(
      journal,
      vParent as ElementVNode,
      (vNewNode = vnode_newElement(vParent, element, tag)),
      vCurrent
    );
    const { constProps } = jsx;
    let needsQDispatchEventPatch = false;
    if (constProps) {
      // Const props are, well, constant, they will never change!
      // For this reason we can cheat and write them directly into the DOM.
      // We never tell the vNode about them saving us time and memory.
      for (const key in constProps) {
        let value = constProps[key];
        if (isJsxPropertyAnEventName(key)) {
          // So for event handlers we must add them to the vNode so that qwikloader can look them up
          // But we need to mark them so that they don't get pulled into the diff.
          const eventName = getEventNameFromJsxProp(key);
          const scope = getEventNameScopeFromJsxProp(key);
          vnode_setProp(vNewNode, HANDLER_PREFIX + ':' + scope + ':' + eventName, value);
          needsQDispatchEventPatch = true;
          continue;
        }
        if (isSignal(value)) {
          value = trackSignal(value, [
            SubscriptionType.PROP_IMMUTABLE,
            vNewNode as fixMeAny,
            value,
            vNewNode as fixMeAny,
            key,
          ]);
        }

        if (isClassAttr(key)) {
          value = serializeClassWithScopedStyle(value);
        } else if (key === 'style') {
          value = stringifyStyle(value);
        }
        element.setAttribute(key, String(value));
      }
    }
    return needsQDispatchEventPatch;
  }

  function expectElement(jsx: JSXNode, tag: string) {
    const isSameTagName =
      vCurrent && vnode_isElementVNode(vCurrent) && tag === vnode_getElementName(vCurrent);
    let jsxKey: string | null = null;
    let needsQDispatchEventPatch = false;
    if (
      isSameTagName &&
      (jsxKey = jsx.key) == vnode_getProp(vCurrent as ElementVNode, ELEMENT_KEY, null)
    ) {
      // All is good.
    } else if (jsxKey !== null) {
      // So we have a key and it does not match the current node.
      // We need to do a forward search to find it.
      // The complication is that once we start taking nodes out of order we can't use `vnode_getNextSibling`
      vNewNode = retrieveChildWithKey(jsxKey);
      if (vNewNode === null) {
        // No existing node with key exists, just create a new one.
        needsQDispatchEventPatch = createNewElement(jsx, tag);
      } else {
        // Existing keyed node
        vnode_remove(journal, vParent, vNewNode, false);
        vnode_insertBefore(journal, vParent as ElementVNode, vNewNode, vCurrent);
      }
    } else {
      needsQDispatchEventPatch = createNewElement(jsx, tag);
    }
    // reconcile attributes
    let jsxAttrs = (jsx as unknown as { attrs: ClientAttrs }).attrs;
    if (jsxAttrs === EMPTY_ARRAY) {
      const props = Object.entries((jsx as JSXNode).props);
      props.map(([key, value]) => {
        if (jsxAttrs === EMPTY_ARRAY) {
          jsxAttrs = (jsx as unknown as { attrs: ClientAttrs }).attrs = [];
        }
        if (isClassAttr(key)) {
          value = serializeClassWithScopedStyle(value);
        } else if (key === 'style') {
          value = stringifyStyle(value);
        }
        mapArray_set(jsxAttrs, key, value, 0);
      });
      const jsxKey = jsx.key;
      if (jsxKey !== null) {
        if (jsxAttrs === EMPTY_ARRAY) {
          jsxAttrs = (jsx as unknown as { attrs: ClientAttrs }).attrs = [ELEMENT_KEY, jsxKey];
        } else {
          mapArray_set(jsxAttrs, ELEMENT_KEY, jsxKey, 0);
        }
      }
    }
    const vNode = (vNewNode || vCurrent) as ElementVNode;
    needsQDispatchEventPatch = setBulkProps(vNode, jsxAttrs) || needsQDispatchEventPatch;
    if (needsQDispatchEventPatch) {
      // Event handler needs to be patched onto the element.
      const element = vnode_getNode(vNode) as QElement2;
      if (!element.qDispatchEvent) {
        element.qDispatchEvent = (event: Event) => {
          let eventName = event.type;
          let scope = '';
          if (eventName.startsWith(':')) {
            // :document:event or :window:event
            const colonIndex = eventName.substring(1).indexOf(':');
            scope = eventName.substring(1, colonIndex + 1);
            eventName = eventName.substring(colonIndex + 2);
          }

          const eventProp = ':' + scope + ':' + eventName;
          const qrls = [
            vnode_getProp<QRL>(vNode, eventProp, null),
            vnode_getProp<QRL>(vNode, HANDLER_PREFIX + eventProp, null),
          ];
          let returnValue = false;
          qrls.flat(2).forEach((qrl) => {
            if (qrl) {
              const value = qrl(event) as any;
              returnValue = returnValue || value === true;
            }
          });
          return returnValue;
        };
      }
    }
  }

  /** @param tag Returns true if `qDispatchEvent` needs patching */
  function setBulkProps(vnode: ElementVNode, srcAttrs: ClientAttrs): boolean {
    vnode_ensureElementInflated(vnode);
    const dstAttrs = vnode as ClientAttrs;
    let srcIdx = 0;
    const srcLength = srcAttrs.length;
    let dstIdx = ElementVNodeProps.PROPS_OFFSET;
    let dstLength = dstAttrs.length;
    let srcKey: ClientAttrKey | null = srcIdx < srcLength ? srcAttrs[srcIdx++] : null;
    let dstKey: ClientAttrKey | null = dstIdx < dstLength ? dstAttrs[dstIdx++] : null;
    let patchEventDispatch = false;

    const record = (key: string, value: any) => {
      if (key.startsWith(':')) {
        vnode_setProp(vnode, key, value);
        return;
      }
      vnode_setAttr(journal, vnode, key, value);
      if (value === null) {
        // if we set `null` than attribute was removed and we need to shorten the dstLength
        dstLength = dstAttrs.length;
      }
    };

    while (srcKey !== null || dstKey !== null) {
      if (dstKey?.startsWith(HANDLER_PREFIX)) {
        // This is a special key which we use to mark the event handlers as immutable.
        // we need to ignore them.
        dstIdx++; // skip the destination value, we don't care about it.
        dstKey = dstIdx < dstLength ? dstAttrs[dstIdx++] : null;
      } else if (srcKey == null) {
        // Source has more keys, so we need to remove them from destination
        if (dstKey && isHtmlAttributeAnEventName(dstKey)) {
          patchEventDispatch = true;
        } else {
          record(dstKey!, null);
        }
        dstIdx++; // skip the destination value, we don't care about it.
        dstKey = dstIdx < dstLength ? dstAttrs[dstIdx++] : null;
      } else if (dstKey == null) {
        // Destination has more keys, so we need to insert them from source.
        const isEvent = isJsxPropertyAnEventName(srcKey);
        if (isEvent) {
          // Special handling for events
          patchEventDispatch = true;
          const eventName = getEventNameFromJsxProp(srcKey);
          const scope = getEventNameScopeFromJsxProp(srcKey);
          record(':' + scope + ':' + eventName, srcAttrs[srcIdx]);
        } else {
          record(srcKey!, srcAttrs[srcIdx]);
        }
        srcIdx++;
        srcKey = srcIdx < srcLength ? srcAttrs[srcIdx++] : null;
      } else if (srcKey == dstKey) {
        const srcValue = srcAttrs[srcIdx++];
        const dstValue = dstAttrs[dstIdx++];
        if (srcValue !== dstValue) {
          record(dstKey, srcValue);
        }
        srcKey = srcIdx < srcLength ? srcAttrs[srcIdx++] : null;
        dstKey = dstIdx < dstLength ? dstAttrs[dstIdx++] : null;
      } else if (srcKey < dstKey) {
        // Destination is missing the key, so we need to insert it.
        if (isJsxPropertyAnEventName(srcKey)) {
          // Special handling for events
          patchEventDispatch = true;
          const eventName = getEventNameFromJsxProp(srcKey);
          const scope = getEventNameScopeFromJsxProp(srcKey);
          record(':' + scope + ':' + eventName, srcAttrs[srcIdx]);
        } else {
          record(srcKey, srcAttrs[srcIdx]);
        }
        srcIdx++;
        // advance srcValue
        srcKey = srcIdx < srcLength ? srcAttrs[srcIdx++] : null;
      } else {
        // Source is missing the key, so we need to remove it from destination.
        if (isHtmlAttributeAnEventName(dstKey)) {
          patchEventDispatch = true;
        } else {
          record(dstKey!, null);
        }
        dstIdx++; // skip the destination value, we don't care about it.
        dstKey = dstIdx < dstLength ? dstAttrs[dstIdx++] : null;
      }
    }
    return patchEventDispatch;
  }

  function serializeClassWithScopedStyle(value: any) {
    const serializedClass = serializeClass(value);
    value =
      scopedStyleIdPrefix && serializedClass
        ? `${scopedStyleIdPrefix} ${serializedClass}`
        : serializedClass;
    return value;
  }

  function retrieveScopedStyleIdPrefix() {
    if (vParent && vnode_isVirtualVNode(vParent)) {
      const scopedStyleId = vnode_getProp<string>(vParent, QScopedStyle, null);
      scopedStyleIdPrefix = scopedStyleId ? addPrefixForScopedStyleIdsString(scopedStyleId) : null;
    }
  }

  /**
   * Retrieve the child with the given key.
   *
   * By retrieving the child with the given key we are effectively removing it from the list of
   * future elements. This means that we can't just use `vnode_getNextSibling` to find the next
   * instead we have to keep track of the elements we have already seen.
   *
   * We call this materializing the elements.
   *
   * `vSiblingsIdx`:
   *
   * - -1: Not materialized
   * - Positive number - the index of the next element in the `vSiblings` array.
   *
   * By retrieving the child with the given key we are effectively removing it from the list (hence
   * we need to splice the `vSiblings` array).
   *
   * @param key
   * @returns
   */
  function retrieveChildWithKey(key: string): ElementVNode | VirtualVNode | null {
    let vNodeWithKey: ElementVNode | VirtualVNode | null = null;
    if (vSiblingsIdx === -1) {
      // it is not materialized; so materialize it.
      vSiblings = [];
      vSiblingsIdx = 0;
      let vNode = vCurrent;
      while (vNode) {
        const vKey = getKey(vNode, container.$getObjectById$);
        if (vNodeWithKey === null && vKey == key) {
          vNodeWithKey = vNode as ElementVNode | VirtualVNode;
        } else {
          // we only add the elements which we did not find yet.
          vSiblings.push(vKey, vNode);
        }
        vNode = vnode_getNextSibling(vNode);
      }
    } else {
      for (let idx = vSiblingsIdx; idx < vSiblings!.length; idx += 2) {
        const vKey = vSiblings![idx];
        if (vKey == key) {
          vNodeWithKey = vSiblings![idx + 1] as any;
          // remove the node from the siblings array
          vSiblings?.splice(idx, 2);
          break;
        }
      }
    }
    return vNodeWithKey;
  }

  function expectVirtual(type: VirtualType) {
    if (vCurrent && vnode_isVirtualVNode(vCurrent)) {
      // All is good.
    } else {
      vnode_insertBefore(
        journal,
        vParent as VirtualVNode,
        (vNewNode = vnode_newVirtual(vParent)),
        vCurrent && getInsertBefore()
      );
    }
    isDev && vnode_setProp((vNewNode || vCurrent) as VirtualVNode, DEBUG_TYPE, type);
  }

  function expectComponent(component: Function) {
    // expectVirtual(VirtualType.Component);
    const componentMeta = (component as any)[SERIALIZABLE_STATE] as [QRLInternal<OnRenderFn<any>>];
    let host = (vNewNode || vCurrent) as VirtualVNode;
    const jsxProps = jsxValue.props;
    if (componentMeta) {
      // QComponent
      let shouldRender = false;
      const [componentQRL] = componentMeta;
      const jsxKey = jsxValue.key || componentQRL.$hash$;
      const vNodeKey = getKey(host, container.$getObjectById$);
      if (jsxKey !== vNodeKey) {
        // See if we already have this component later on.
        vNewNode = retrieveChildWithKey(jsxKey);
        if (vNewNode) {
          // We found the component, move it up.
          vnode_remove(journal, vParent, vNewNode, false);
          vnode_insertBefore(journal, vParent as VirtualVNode, vNewNode, vCurrent);
        } else {
          // We did not find the component, create it.
          vnode_insertBefore(
            journal,
            vParent as VirtualVNode,
            (vNewNode = vnode_newVirtual(vParent)),
            vCurrent && getInsertBefore()
          );
          isDev && vnode_setProp(vNewNode, DEBUG_TYPE, VirtualType.Component);
          container.setHostProp(vNewNode, OnRenderProp, componentQRL);
          container.setHostProp(vNewNode, ELEMENT_PROPS, jsxProps);
        }
        host = vNewNode as VirtualVNode;
        shouldRender = true;
      }
      const vNodeProps = vnode_getProp<any>(host, ELEMENT_PROPS, container.$getObjectById$);
      shouldRender = shouldRender || propsDiffer(jsxProps, vNodeProps);
      if (shouldRender) {
        const jsx = container.$scheduler$
          .$scheduleComponent$(host, componentQRL, jsxProps)
          .$drainComponent$(host);
        asyncQueue.push(jsx, host);
      }
      descendProjection(jsxValue.children);
    } else {
      // Inline Component
      if (!host) {
        // We did not find the component, create it.
        vnode_insertBefore(
          journal,
          vParent as VirtualVNode,
          (vNewNode = vnode_newVirtual(vParent)),
          vCurrent && getInsertBefore()
        );
        host = vNewNode;
      }
      isDev &&
        vnode_setProp(
          (vNewNode || vCurrent) as VirtualVNode,
          DEBUG_TYPE,
          VirtualType.InlineComponent
        );
      let component$Host: VNode = host;
      // Find the closest component host which has `OnRender` prop.
      while (
        component$Host &&
        (vnode_isVirtualVNode(component$Host)
          ? vnode_getProp(component$Host, OnRenderProp, null) === null
          : true)
      ) {
        component$Host = vnode_getParent(component$Host)!;
      }
      const jsxOutput = executeComponent2(
        container,
        host,
        (component$Host || container.rootVNode) as fixMeAny,
        component as OnRenderFn<any>,
        jsxProps
      );
      asyncQueue.push(jsxOutput, host);
    }
  }

  function expectText(text: string) {
    if (vCurrent !== null) {
      const type = vnode_getType(vCurrent);
      if (type === 3 /* Text */) {
        if (text !== vnode_getText(vCurrent as TextVNode)) {
          vnode_setText(journal, vCurrent as TextVNode, text);
          return;
        }
        return;
      }
    }
    vnode_insertBefore(
      journal,
      vParent as VirtualVNode,
      (vNewNode = vnode_newText(vParent, container.document.createTextNode(text), text)),
      vCurrent
    );
  }
};

export const isQStyleVNode = (vNode: VNode): boolean => {
  return (
    vnode_isElementVNode(vNode) &&
    vnode_getElementName(vNode) === 'style' &&
    vnode_getAttr(vNode, QStyle) !== null
  );
};

/**
 * Retrieve the key from the VNode.
 *
 * If the VNode does not have a key and it is a QComponent, we fallback to the QRL as the key.
 *
 * @param vNode - VNode to retrieve the key from
 * @param getObject - Function to retrieve the object by id for QComponent QRL
 * @returns Key
 */
function getKey(vNode: VNode | null, getObject: (id: string) => any): string | null {
  if (vNode == null) {
    return null;
  }
  let vKey = vnode_getProp<string>(vNode, ELEMENT_KEY, null);
  if (vKey == null) {
    const qrl = vnode_getProp<QRLInternal>(vNode, OnRenderProp, getObject);
    // If this is a QComponent and it does not have a key, we fallback to the QRL as the key
    if (qrl) {
      vKey = qrl.$hash$;
    }
  }
  return vKey;
}

/**
 * Marker class for JSX projection.
 *
 * Assume you have component like so
 *
 * ```
 * <SomeComponent>
 *   some-text
 *   <span q:slot="name">some more text</span>
 *   more-text
 * </SomeComponent>
 * ```
 *
 * Before the `<SomeCompetent/>` is processed its children are transformed into:
 *
 * ```
 *   <Projection q:slot="">
 *     some-text
 *     more-text
 *   </Projection>
 *   <Projection q:slot="name">
 *     <span q:slot="name">some more text</span>
 *   </Projection>
 * ```
 */
function Projection() {}

function propsDiffer(src: Record<string, any>, dst: Record<string, any>): boolean {
  if (!src || !dst) {
    return true;
  }
  let srcKeys = removeChildrenKey(Object.keys(src));
  let dstKeys = removeChildrenKey(Object.keys(dst));
  if (srcKeys.length !== dstKeys.length) {
    return true;
  }
  srcKeys = srcKeys.sort();
  dstKeys = dstKeys.sort();
  for (let idx = 0; idx < srcKeys.length; idx++) {
    const srcKey = srcKeys[idx];
    const dstKey = dstKeys[idx];
    if (srcKey !== dstKey || src[srcKey] !== dst[dstKey]) {
      return true;
    }
  }
  return false;
}

function removeChildrenKey(keys: string[]): string[] {
  const childrenIdx = keys.indexOf('children');
  if (childrenIdx !== -1) {
    keys.splice(childrenIdx, 1);
  }
  return keys;
}

/**
 * If vnode is removed, it is necessary to release all subscriptions associated with it.
 *
 * This function will traverse the vnode and release all subscriptions.
 */
export function releaseSubscriptions(container: ClientContainer, vNode: VNode) {
  let vCursor: VNode | null = vNode;
  // Depth first traversal
  if (vnode_isTextVNode(vNode)) {
    // Text nodes don't have subscriptions or children;
    return;
  }
  do {
    const type = vCursor[VNodeProps.flags];
    if (type & VNodeFlags.ELEMENT_OR_VIRTUAL_MASK) {
      // Only elements and virtual nodes need to be traversed for children
      if (type & VNodeFlags.Virtual) {
        // ONly virtual nodes need can have subscriptions
        container.$subsManager$.$clearSub$(vCursor as fixMeAny);
        const seq = container.getHostProp<Array<any>>(vCursor as fixMeAny, ELEMENT_SEQ);
        if (seq) {
          for (let i = 0; i < seq.length; i++) {
            const obj = seq[i];
            if (isTask(obj)) {
              const task = obj as SubscriberEffect;
              container.$subsManager$.$clearSub$(task);
              destroyTask(task);
            }
          }
        }
      }
      // Descend into children
      const vFirstChild = vnode_getFirstChild(vCursor);
      if (vFirstChild) {
        vCursor = vFirstChild;
        continue;
      }
    }
    // Out of children, go to next sibling
    const vNextSibling = vnode_getNextSibling(vCursor);
    if (vNextSibling) {
      vCursor = vNextSibling;
      continue;
    }
    if (vCursor === vNode) {
      // we are back where we started, we are done.
      return;
    }
    // Out of siblings, got to parent
    let vParent = vnode_getParent(vCursor);
    while (vParent) {
      if (vParent === vNode) {
        // We are back where we started, we are done.
        return;
      }
      const vNextParentSibling = vnode_getNextSibling(vParent);
      if (vNextParentSibling) {
        vCursor = vNextParentSibling;
        break;
      }
      vParent = vnode_getParent(vParent);
    }
  } while (true as boolean);
}

/**
 * This marks the property as immutable. It is needed for the QRLs so that QwikLoader can get a hold
 * of them. This character must be `:` so that the `vnode_getAttr` can ignore them.
 */
const HANDLER_PREFIX = ':';
