/** @file Public APIs for the SSR */

import type { ObjToProxyMap } from '../../container/container';
import { assertTrue } from '../../error/assert';
import { getPlatform } from '../../platform/platform';
import type { QRL } from '../../qrl/qrl.public';
import { ERROR_CONTEXT, isRecoverable } from '../../render/error-handling';
import type { JSXOutput } from '../../render/jsx/types/jsx-node';
import type { StoreTracker } from '../../state/store';
import type { ContextId } from '../../use/use-context';
import { SEQ_IDX_LOCAL } from '../../use/use-sequential-scope';
import { EMPTY_ARRAY } from '../../util/flyweight';
import { throwErrorAndStop } from '../../util/log';
import {
  ELEMENT_PROPS,
  ELEMENT_SEQ,
  OnRenderProp,
  QContainerAttr,
  QContainerSelector,
  QCtxAttr,
  QScopedStyle,
  QSlotParent,
  QStyle,
  QStyleSelector,
  QTemplate,
  QUnclaimedProjections,
} from '../../util/markers';
import { maybeThen } from '../../util/promises';
import { qDev } from '../../util/qdev';
import type { ValueOrPromise } from '../../util/types';
import { ChoreType } from '../shared/scheduler';
import {
  addComponentStylePrefix,
  convertScopedStyleIdsToArray,
  convertStyleIdsToString,
} from '../shared/scoped-styles';
import { _SharedContainer } from '../shared/shared-container';
import { inflateQRL, parseQRL, wrapDeserializerProxy } from '../shared/shared-serialization';
import type { HostElement } from '../shared/types';
import { VNodeDataChar, VNodeDataSeparator } from '../shared/vnode-data-types';
import {
  VNodeFlags,
  VNodeProps,
  type ContainerElement,
  type ElementVNode,
  type ClientContainer as IClientContainer,
  type QDocument,
  type VirtualVNode,
  type VNode,
} from './types';
import {
  VNodeJournalOpCode,
  mapArray_get,
  mapArray_set,
  vnode_applyJournal,
  vnode_getDOMChildNodes,
  vnode_getDomParent,
  vnode_getParent,
  vnode_getProp,
  vnode_getPropStartIndex,
  vnode_insertBefore,
  vnode_isVirtualVNode,
  vnode_locate,
  vnode_newElement,
  vnode_newUnMaterializedElement,
  vnode_setProp,
  type VNodeJournal,
  isQContainerInnerHTMLElement,
} from './vnode';
import { vnode_diff } from './vnode-diff';

/** @public */
export function getDomContainer(element: Element | ElementVNode): IClientContainer {
  const qContainerElement = getQContainerElement(element);
  if (!qContainerElement) {
    throwErrorAndStop('Unable to find q:container.');
  }
  return getDomContainerFromHTMLElement(qContainerElement!);
}

export function getDomContainerFromHTMLElement(qContainerElement: Element): IClientContainer {
  const qElement = qContainerElement as ContainerElement;
  let container = qElement.qContainer;
  if (!container) {
    qElement.qContainer = container = new DomContainer(qElement);
  }
  return container;
}

export function getQContainerElement(element: Element | ElementVNode): Element | null {
  let qContainerElement: Element | null = Array.isArray(element)
    ? (vnode_getDomParent(element) as Element)
    : element;
  while (qContainerElement && !qContainerElement.hasAttribute(QContainerAttr)) {
    qContainerElement = qContainerElement.closest(QContainerSelector);
  }
  return qContainerElement;
}

export const isDomContainer = (container: any): container is DomContainer => {
  return container instanceof DomContainer;
};

/** @internal */
export class DomContainer extends _SharedContainer implements IClientContainer, StoreTracker {
  public element: ContainerElement;
  public qContainer: string;
  public qBase: string;
  public qManifestHash: string;
  public rootVNode: ElementVNode;
  public document: QDocument;
  public $journal$: VNodeJournal;
  public renderDone: Promise<void> | null = Promise.resolve();
  public rendering: boolean = false;
  public $rawStateData$: unknown[];
  public $proxyMap$: ObjToProxyMap = new WeakMap();
  public $qFuncs$: Array<(...args: unknown[]) => unknown>;

  private stateData: unknown[];
  private $styleIds$: Set<string> | null = null;
  private $vnodeLocate$: (id: string) => VNode = (id) => vnode_locate(this.rootVNode, id);
  private vNodesWithProjections: Array<VirtualVNode> = [];
  private _qTemplate: ElementVNode | null = null;

  constructor(element: ContainerElement) {
    super(
      () => this.scheduleRender(),
      () => vnode_applyJournal(this.$journal$),
      {},
      element.getAttribute('q:locale')!
    );
    this.qContainer = element.getAttribute(QContainerAttr)!;
    if (!this.qContainer) {
      throw new Error("Element must have 'q:container' attribute.");
    }
    this.$journal$ = [
      // The first time we render we need to hoist the styles.
      // (Meaning we need to move all styles from component inline to <head>)
      // We bulk move all of the styles, because the expensive part is
      // for the browser to recompute the styles, (not the actual DOM manipulation.)
      // By moving all of them at once we can minimize the reflow.
      VNodeJournalOpCode.HoistStyles,
      element.ownerDocument,
    ];
    this.document = element.ownerDocument as QDocument;
    this.element = element;
    this.qBase = element.getAttribute('q:base')!;
    // this.containerState = createContainerState(element, this.qBase);
    this.qManifestHash = element.getAttribute('q:manifest-hash')!;
    this.rootVNode = vnode_newUnMaterializedElement(this.element);
    // These are here to initialize all properties at once for single class transition
    this.$rawStateData$ = null!;
    this.stateData = null!;
    const document = this.element.ownerDocument as QDocument;
    if (!document.qVNodeData) {
      processVNodeData(document);
    }
    this.$rawStateData$ = [];
    this.stateData = [];
    const qwikStates = element.querySelectorAll('script[type="qwik/state"]');
    if (qwikStates.length !== 0) {
      const lastState = qwikStates[qwikStates.length - 1];
      this.$rawStateData$ = JSON.parse(lastState.textContent!);
      this.stateData = wrapDeserializerProxy(this, this.$rawStateData$) as unknown[];
    }
    this.$qFuncs$ = element.qFuncs || EMPTY_ARRAY;
  }

  get qTemplate(): ElementVNode {
    if (this._qTemplate === null) {
      let qTemplateElement: HTMLElement | null = this.document.body.querySelector('q\\:template');

      if (!qTemplateElement) {
        qTemplateElement = this.document.createElement(QTemplate);
        qTemplateElement.style.display = 'none';
        this.$journal$.push(VNodeJournalOpCode.Insert, this.document.body, null, qTemplateElement);
      }
      this._qTemplate = vnode_newElement(qTemplateElement, QTemplate);
    }

    return this._qTemplate;
  }

  $setRawState$(id: number, vParent: ElementVNode | VirtualVNode): void {
    this.stateData[id] = vParent;
  }

  parseQRL<T = unknown>(qrl: string): QRL<T> {
    return inflateQRL(this, parseQRL(qrl)) as QRL<T>;
  }

  processJsx(host: HostElement, jsx: JSXOutput): ValueOrPromise<void> {
    // console.log('>>>> processJsx', String(host));
    const styleScopedId = this.getHostProp<string>(host, QScopedStyle);
    return vnode_diff(this, jsx, host as VirtualVNode, addComponentStylePrefix(styleScopedId));
  }

  handleError(err: any, host: HostElement): void {
    if (qDev) {
      // Clean vdom
      if (typeof document !== 'undefined') {
        const vHost = host as VirtualVNode;
        const errorDiv = document.createElement('errored-host');
        if (err && err instanceof Error) {
          (errorDiv as any).props = { error: err };
        }
        errorDiv.setAttribute('q:key', '_error_');
        const journal: VNodeJournal = [];
        vnode_getDOMChildNodes(journal, vHost).forEach((child) => errorDiv.appendChild(child));
        const vErrorDiv = vnode_newElement(errorDiv, 'error-host');
        vnode_insertBefore(journal, vHost, vErrorDiv, null);
        vnode_applyJournal(journal);
      }

      if (err && err instanceof Error) {
        if (!('hostElement' in err)) {
          (err as any)['hostElement'] = host;
        }
      }
      if (!isRecoverable(err)) {
        throw err;
      }
    }
    const errorStore = this.resolveContext(host, ERROR_CONTEXT);
    if (!errorStore) {
      throw err;
    }
    errorStore.error = err;
  }

  setContext<T>(host: HostElement, context: ContextId<T>, value: T): void {
    let ctx = this.getHostProp<Array<string | unknown>>(host, QCtxAttr);
    if (!ctx) {
      this.setHostProp(host, QCtxAttr, (ctx = []));
    }
    mapArray_set(ctx, context.id, value, 0);
  }

  resolveContext<T>(host: HostElement, contextId: ContextId<T>): T | undefined {
    while (host) {
      const ctx = this.getHostProp<Array<string | unknown>>(host, QCtxAttr);
      if (ctx) {
        const value = mapArray_get(ctx, contextId.id, 0) as T;
        if (value) {
          return value as T;
        }
      }
      host = this.getParentHost(host)!;
    }
    return undefined;
  }

  getParentHost(host: HostElement): HostElement | null {
    let vNode = vnode_getParent(host as any);
    while (vNode) {
      if (vnode_isVirtualVNode(vNode)) {
        if (vnode_getProp(vNode, OnRenderProp, null) !== null) {
          return vNode as any as HostElement;
        }
        // If virtual node, than it could be a slot so we need to read its parent.
        const parent = vnode_getProp<VNode>(vNode, QSlotParent, this.$vnodeLocate$);
        if (parent) {
          vNode = parent;
          continue;
        }
      }
      vNode = vnode_getParent(vNode);
    }
    return null;
  }

  setHostProp<T>(host: HostElement, name: string, value: T): void {
    const vNode: VirtualVNode = host as any;
    vnode_setProp(vNode, name, value);
  }

  getHostProp<T>(host: HostElement, name: string): T | null {
    const vNode: VirtualVNode = host as any;
    let getObjectById: ((id: string) => any) | null = null;
    switch (name) {
      case ELEMENT_SEQ:
      case ELEMENT_PROPS:
      case OnRenderProp:
      case QCtxAttr:
        getObjectById = this.$getObjectById$;
        break;
      case SEQ_IDX_LOCAL:
        getObjectById = parseInt;
        break;
    }
    return vnode_getProp(vNode, name, getObjectById);
  }

  scheduleRender() {
    // console.log('>>>> scheduleRender', !!this.rendering);
    if (!this.rendering) {
      this.rendering = true;
      this.renderDone = getPlatform().nextTick(() => {
        // console.log('>>>> scheduleRender nextTick', !!this.rendering);
        this.$scheduler$(ChoreType.UNCLAIMED_PROJECTIONS);
        return maybeThen(this.$scheduler$(ChoreType.WAIT_FOR_ALL), () => {
          // console.log('>>>> scheduleRender done', !!this.rendering);
          this.rendering = false;
        });
      });
    }
    return this.renderDone;
  }

  ensureProjectionResolved(vNode: VirtualVNode): void {
    // console.log('ensureProjectionResolved', String(vNode));
    if ((vNode[VNodeProps.flags] & VNodeFlags.Resolved) === 0) {
      vNode[VNodeProps.flags] |= VNodeFlags.Resolved;
      for (let i = vnode_getPropStartIndex(vNode); i < vNode.length; i = i + 2) {
        const prop = vNode[i] as string;
        if (!prop.startsWith('q:')) {
          const value = vNode[i + 1];
          if (typeof value == 'string') {
            vNode[i + 1] = this.$vnodeLocate$(value);
          }
        }
      }
    }
  }

  addVNodeProjection(componentVNodeWithProjection: VirtualVNode): void {
    this.vNodesWithProjections.push(componentVNodeWithProjection);
  }

  emitUnclaimedProjection(): ValueOrPromise<void> {
    const unclaimedProjections = this.vNodesWithProjections.flatMap((component) =>
      vnode_getProp<(string | VNode)[]>(component, QUnclaimedProjections, null)
    );
    if (unclaimedProjections.length) {
      // remove slot names
      for (let i = unclaimedProjections.length - 2; i >= 0; i = i - 2) {
        unclaimedProjections.splice(i, 1);
      }

      for (let i = 0; i < unclaimedProjections.length; i++) {
        const unclaimedProjection = unclaimedProjections[i] as VNode | null;
        if (unclaimedProjection) {
          vnode_insertBefore(this.$journal$, this.qTemplate, unclaimedProjection, null);
        }
      }
      this.vNodesWithProjections = [];
    }
  }

  $getObjectById$ = (id: number | string): unknown => {
    if (typeof id === 'string') {
      id = parseFloat(id);
    }
    assertTrue(id < this.$rawStateData$.length, 'Invalid reference');
    return this.stateData[id];
  };

  getSyncFn(id: number): (...args: unknown[]) => unknown {
    const fn = this.$qFuncs$[id];
    assertTrue(typeof fn === 'function', 'Invalid reference: ' + id);
    return fn;
  }

  $appendStyle$(content: string, styleId: string, host: VirtualVNode, scoped: boolean): void {
    if (scoped) {
      const scopedStyleIdsString = this.getHostProp<string>(host, QScopedStyle);
      const scopedStyleIds = new Set(convertScopedStyleIdsToArray(scopedStyleIdsString));
      scopedStyleIds.add(styleId);
      this.setHostProp(host, QScopedStyle, convertStyleIdsToString(scopedStyleIds));
    }

    if (this.$styleIds$ == null) {
      this.$styleIds$ = new Set();
      this.element.querySelectorAll(QStyleSelector).forEach((style) => {
        this.$styleIds$!.add(style.getAttribute(QStyle)!);
      });
    }
    if (!this.$styleIds$.has(styleId)) {
      this.$styleIds$.add(styleId);
      const styleElement = this.document.createElement('style');
      styleElement.setAttribute(QStyle, styleId);
      styleElement.textContent = content;
      this.$journal$.push(VNodeJournalOpCode.Insert, this.document.head, null, styleElement);
    }
  }
}

export function processVNodeData(document: Document) {
  const qDocument = document as QDocument;
  const vNodeDataMap =
    qDocument.qVNodeData || (qDocument.qVNodeData = new WeakMap<Element, string>());
  const vNodeData = document.querySelectorAll('script[type="qwik/vnode"]');
  if (vNodeData.length === 0) {
    return;
  }
  const containers = document.querySelectorAll('[q\\:container]');
  const containerElement = containers[0] as ContainerElement;
  const qVNodeRefs = (containerElement.qVNodeRefs = new Map<number, Element | ElementVNode>());
  const walker = document.createTreeWalker(
    containerElement.parentNode!,
    1 /* NodeFilter.SHOW_ELEMENT */
  );
  const currentVNodeData = vNodeData[0].textContent!;
  const currentVNodeDataLength = currentVNodeData.length;
  /// Stores the current element index as the TreeWalker traverses the DOM.
  let elementIdx = -1;
  /// Stores the current VNode index as derived from the VNodeData script tag.
  let vNodeElementIndex = -1;
  let vNodeDataStart = 0;
  let vNodeDataEnd = 0;
  let ch: number;
  let needsToStoreRef = -1;
  for (let node = walker.firstChild(); node !== null; node = walker.nextNode()) {
    if (isQContainerInnerHTMLElement(node.parentElement)) {
      continue;
    }
    elementIdx++;
    if (vNodeElementIndex < elementIdx) {
      // VNodeData needs to catch up with the elementIdx
      if (vNodeElementIndex == -1) {
        // Special case for initial catch up
        vNodeElementIndex = 0;
      }
      vNodeDataStart = vNodeDataEnd;
      if (vNodeDataStart < currentVNodeDataLength) {
        while (isSeparator((ch = currentVNodeData.charCodeAt(vNodeDataStart)))) {
          // Keep consuming the separators and incrementing the vNodeIndex
          // console.log('ADVANCE', vNodeElementIndex, ch, ch - 33);
          vNodeElementIndex += 1 << (ch - VNodeDataSeparator.SKIP_0);
          vNodeDataStart++;
          if (vNodeDataStart >= currentVNodeDataLength) {
            // we reached the end of the vNodeData stop.
            break;
          }
        }
        const shouldStoreRef = ch === VNodeDataSeparator.REFERENCE;
        if (shouldStoreRef) {
          // if we need to store the ref handle it here.
          needsToStoreRef = vNodeElementIndex;
          vNodeDataStart++;
          if (vNodeDataStart < currentVNodeDataLength) {
            ch = currentVNodeData.charCodeAt(vNodeDataEnd);
          } else {
            // assume separator on end.
            ch = VNodeDataSeparator.SKIP_0;
          }
        }
        vNodeDataEnd = vNodeDataStart;
        let depth = 0;
        while (true as boolean) {
          // look for the end of VNodeData
          if (vNodeDataEnd < currentVNodeDataLength) {
            ch = currentVNodeData.charCodeAt(vNodeDataEnd);
            if (depth === 0 && isSeparator(ch)) {
              break;
            } else {
              if (ch === VNodeDataChar.OPEN) {
                depth++;
              } else if (ch === VNodeDataChar.CLOSE) {
                depth--;
              }
              vNodeDataEnd++;
            }
          } else {
            break;
          }
        }
      } else {
        elementIdx = Number.MAX_SAFE_INTEGER;
      }
    }
    // console.log('WALK', elementIdx, (node as Element).outerHTML, vNodeElementIndex);

    if (needsToStoreRef === elementIdx) {
      qVNodeRefs.set(elementIdx, node as Element);
    }
    if (elementIdx === vNodeElementIndex) {
      // console.log('MATCH', elementIdx, vNodeElementIndex);
      const instructions = currentVNodeData.substring(vNodeDataStart, vNodeDataEnd);
      // console.log('SET', (node as Element).outerHTML, instructions);
      vNodeDataMap.set(node as Element, instructions);
    }
  }

  function isSeparator(ch: number) {
    return /* `!` */ 33 <= ch && ch <= 47; /* `/` */
  }
}
