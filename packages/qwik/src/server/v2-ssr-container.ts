/** @file Public APIs for the SSR */
import {
  _SharedContainer,
  _jsxSorted,
  _jsxSplit,
  _walkJSX,
  isSignal,
  type JSXNode,
} from '@builder.io/qwik';
import { isDev } from '@builder.io/qwik/build';
import type { ResolvedManifest } from '@builder.io/qwik/optimizer';
import { getQwikLoaderScript } from '@builder.io/qwik/server';
import { applyPrefetchImplementation2 } from './prefetch-implementation';
import { getPrefetchResources } from './prefetch-strategy';
import {
  dangerouslySetInnerHTML,
  DEBUG_TYPE,
  ELEMENT_ID,
  ELEMENT_KEY,
  ELEMENT_PROPS,
  ELEMENT_SEQ,
  ELEMENT_SEQ_IDX,
  OnRenderProp,
  QCtxAttr,
  QScopedStyle,
  QSlot,
  QSlotParent,
  QSlotRef,
  QStyle,
  QContainerAttr,
  QTemplate,
  SubscriptionType,
  VNodeDataChar,
  VirtualType,
  mapArray_get,
  mapArray_set,
  maybeThen,
  serializeAttribute,
  isClassAttr,
  QContainerValue,
  VNodeDataSeparator,
  QRenderAttr,
  QRuntimeAttr,
  QVersionAttr,
  QBaseAttr,
  QLocaleAttr,
  QManifestHashAttr,
  escapeHTML,
  convertStyleIdsStringToArray,
  convertStyleIdsArrayToString,
} from './qwik-copy';
import {
  type ContextId,
  type HostElement,
  type SSRContainer as ISSRContainer,
  type ISsrComponentFrame,
  type ISsrNode,
  type JSXChildren,
  type JSXOutput,
  type SerializationContext,
  type SsrAttrKey,
  type SsrAttrValue,
  type SsrAttrs,
  type StreamWriter,
  type SymbolToChunkResolver,
  type ValueOrPromise,
  type fixMeAny,
} from './qwik-types';
import { Q_FUNCS_PREFIX } from './render';
import type { PrefetchResource, RenderOptions, RenderToStreamResult } from './types';
import { createTimer } from './utils';
import { SsrComponentFrame, SsrNode } from './v2-node';
import {
  TagNesting,
  allowedContent,
  initialTag,
  isSelfClosingTag,
  isTagAllowed,
} from './v2-tag-nesting';
import {
  CLOSE_FRAGMENT,
  OPEN_FRAGMENT,
  VNodeDataFlag,
  encodeAsAlphanumeric,
  vNodeData_addTextSize,
  vNodeData_closeFragment,
  vNodeData_createSsrNodeReference,
  vNodeData_incrementElementCount,
  vNodeData_openFragment,
  type VNodeData,
} from './v2-vnode-data';

export function ssrCreateContainer(
  opts: {
    locale?: string;
    tagName?: string;
    writer?: StreamWriter;
    timing?: RenderToStreamResult['timing'];
    buildBase?: string;
    resolvedManifest?: ResolvedManifest;
    renderOptions?: RenderOptions;
  } = {}
): ISSRContainer {
  return new SSRContainer({
    tagName: opts.tagName || 'div',
    writer: opts.writer || new StringBufferWriter(),
    locale: opts.locale || '',
    timing: opts.timing || {
      firstFlush: 0,
      render: 0,
      snapshot: 0,
    },
    buildBase: opts.buildBase || '/build/',
    resolvedManifest: opts.resolvedManifest || {
      mapper: {},
      manifest: {
        manifestHash: 'dev',
        mapping: {},
        bundles: {},
        symbols: {},
        version: 'dev-mode',
      },
    },
    renderOptions: opts.renderOptions || {},
  });
}

class StringBufferWriter {
  private buffer = [] as string[];
  write(text: string) {
    this.buffer.push(text);
  }
  toString() {
    return this.buffer.join('');
  }
}

interface ElementFrame {
  /*
   * Used during development mode to track the nesting of HTML tags
   * in order provide error messages when the nesting is incorrect.
   */
  tagNesting: TagNesting;
  parent: ElementFrame | null;
  /** Element name. */
  elementName: string;
  /**
   * Current element index.
   *
   * This number must match the depth-first traversal of the DOM elements as returned by the
   * https://developer.mozilla.org/en-US/docs/Web/API/TreeWalker
   */
  depthFirstElementIdx: number;
  vNodeData: VNodeData;
}

const EMPTY_OBJ = {};

/**
 * Stores sequential sequence arrays, which in turn store Tasks which have cleanup functions which
 * need to be executed at the end of SSR.
 */
export type CleanupQueue = any[][];

class SSRContainer extends _SharedContainer implements ISSRContainer {
  public tag: string;
  public writer: StreamWriter;
  public timing: RenderToStreamResult['timing'];
  public buildBase: string;
  public resolvedManifest: ResolvedManifest;
  public symbolToChunkResolver: SymbolToChunkResolver;
  public renderOptions: RenderOptions;
  public prefetchResources: PrefetchResource[] = [];
  public serializationCtx: SerializationContext;
  /**
   * We use this to append additional nodes in the head node
   *
   * - From manifest injections
   * - From useStyles and useScopedStyles hooks
   */
  public additionalHeadNodes = new Array<JSXNode>();

  /**
   * We use this to append additional nodes in the body node
   *
   * - From manifest injections
   */
  public additionalBodyNodes = new Array<JSXNode>();
  private lastNode: ISsrNode | null = null;
  private currentComponentNode: ISsrNode | null = null;
  private styleIds = new Set<string>();

  private currentElementFrame: ElementFrame | null = null;

  private renderTimer: ReturnType<typeof createTimer>;
  /**
   * Current element index.
   *
   * This number must match the depth-first traversal of the DOM elements as returned by the
   * https://developer.mozilla.org/en-US/docs/Web/API/TreeWalker
   */
  private depthFirstElementCount: number = -1;
  private vNodeData: VNodeData[] = [];
  private componentStack: ISsrComponentFrame[] = [];
  private unclaimedProjections: Array<ISsrComponentFrame | string | JSXChildren> = [];
  unclaimedProjectionComponentFrameQueue: Array<ISsrComponentFrame> = [];
  private cleanupQueue: CleanupQueue = [];

  constructor(opts: Required<Required<Parameters<typeof ssrCreateContainer>>[0]>) {
    super(
      () => null,
      () => null,
      opts.renderOptions.serverData ?? EMPTY_OBJ,
      opts.locale
    );
    this.symbolToChunkResolver = (symbol: string): string => {
      const idx = symbol.lastIndexOf('_');
      const chunk = this.resolvedManifest.mapper[idx == -1 ? symbol : symbol.substring(idx + 1)];
      return chunk ? chunk[1] : '';
    };
    this.serializationCtx = this.serializationCtxFactory(
      SsrNode,
      this.symbolToChunkResolver,
      opts.writer
    );
    this.renderTimer = createTimer();
    this.tag = opts.tagName;
    this.writer = opts.writer;
    this.timing = opts.timing;
    this.buildBase = opts.buildBase;
    this.resolvedManifest = opts.resolvedManifest;
    this.renderOptions = opts.renderOptions;

    this.$processInjectionsFromManifest$();
  }

  ensureProjectionResolved(host: HostElement): void {}

  processJsx(host: HostElement, jsx: JSXOutput): void {
    /**
     * During SSR the output needs to be streamed. So we should never get here, because we can't
     * process JSX out of order.
     */
    throw new Error('Should not get here.');
  }

  handleError(err: any, $host$: HostElement): void {
    throw err;
  }

  async render(jsx: JSXOutput) {
    this.openContainer();
    await _walkJSX(this, jsx, true, null);
    this.closeContainer();
  }

  setContext<T>(host: HostElement, context: ContextId<T>, value: T): void {
    const ssrNode: ISsrNode = host as any;
    let ctx: Array<string | unknown> = ssrNode.getProp(QCtxAttr);
    if (!ctx) {
      ssrNode.setProp(QCtxAttr, (ctx = []));
    }
    mapArray_set(ctx, context.id, value, 0);
  }

  resolveContext<T>(host: HostElement, contextId: ContextId<T>): T | undefined {
    let ssrNode: ISsrNode | null = host as any;
    while (ssrNode) {
      const ctx: Array<string | unknown> = ssrNode.getProp(QCtxAttr);
      if (ctx) {
        const value = mapArray_get(ctx, contextId.id, 0) as T;
        if (value) {
          return value;
        }
      }
      ssrNode = ssrNode.currentComponentNode;
    }
    return undefined;
  }

  getParentHost(host: HostElement): HostElement | null {
    const ssrNode: ISsrNode = host as any;
    return ssrNode.currentComponentNode as ISsrNode | null;
  }

  setHostProp<T>(host: ISsrNode, name: string, value: T): void {
    const ssrNode: ISsrNode = host as any;
    return ssrNode.setProp(name, value);
  }

  getHostProp<T>(host: ISsrNode, name: string): T | null {
    const ssrNode: ISsrNode = host as any;
    return ssrNode.getProp(name);
  }

  openContainer() {
    if (this.tag == 'html') {
      this.write('<!DOCTYPE html>');
    }
    let qRender = isDev ? 'ssr-dev' : 'ssr';
    if (this.renderOptions.containerAttributes?.[QRenderAttr]) {
      qRender = `${this.renderOptions.containerAttributes[QRenderAttr]}-${qRender}`;
    }
    const containerAttributes: Record<string, string> = {
      ...this.renderOptions.containerAttributes,
      [QRuntimeAttr]: '2',
      [QContainerAttr]: QContainerValue.PAUSED,
      [QVersionAttr]: this.$version$ ?? 'dev',
      [QRenderAttr]: qRender,
      [QBaseAttr]: this.buildBase,
      [QLocaleAttr]: this.$locale$,
      [QManifestHashAttr]: this.resolvedManifest.manifest.manifestHash,
    };

    const containerAttributeArray = Object.entries(containerAttributes).reduce<string[]>(
      (acc, [key, value]) => {
        acc.push(key, value);
        return acc;
      },
      []
    );

    this.openElement(this.tag, containerAttributeArray);
  }

  closeContainer(): ValueOrPromise<void> {
    return this.closeElement();
  }

  openElement(
    elementName: string,
    varAttrs: SsrAttrs | null,
    constAttrs?: SsrAttrs | null
  ): string | undefined {
    let innerHTML: string | undefined = undefined;
    this.lastNode = null;
    const isQwikStyle =
      isQwikStyleElement(elementName, varAttrs) || isQwikStyleElement(elementName, constAttrs);
    if (!isQwikStyle && this.currentElementFrame) {
      vNodeData_incrementElementCount(this.currentElementFrame.vNodeData);
    }

    this.createAndPushFrame(elementName, this.depthFirstElementCount++);
    this.write('<');
    this.write(elementName);
    if (varAttrs) {
      innerHTML = this.writeAttrs(elementName, varAttrs, false);
    }
    this.write(' :');
    // Domino sometimes does not like empty attributes, so we need to add a empty value
    isDev && this.write('=""');
    if (constAttrs && constAttrs.length) {
      innerHTML = this.writeAttrs(elementName, constAttrs, true) || innerHTML;
    }
    this.write('>');
    this.lastNode = null;
    return innerHTML;
  }

  closeElement(): ValueOrPromise<void> {
    const currentFrame = this.currentElementFrame!;
    if (
      (currentFrame.parent === null && currentFrame.tagNesting !== TagNesting.HTML) ||
      currentFrame.tagNesting === TagNesting.BODY
    ) {
      this.drainCleanupQueue();
      this.timing.render = this.renderTimer();
      const snapshotTimer = createTimer();
      return maybeThen(
        maybeThen(this.emitContainerData(), () => this._closeElement()),
        () => {
          this.timing.snapshot = snapshotTimer();
        }
      );
    }
    this._closeElement();
  }
  drainCleanupQueue() {
    for (let i = 0; i < this.cleanupQueue.length; i++) {
      const sequences = this.cleanupQueue[i];
      for (let j = 0; j < sequences.length; j++) {
        const item = sequences[j];
        if (hasDestroy(item)) {
          item.$destroy$();
        }
      }
    }
  }

  private _closeElement() {
    const currentFrame = this.popFrame();
    const elementName = currentFrame.elementName!;
    if (!isSelfClosingTag(elementName)) {
      this.write('</');
      this.write(elementName);
      this.write('>');
    }
    this.lastNode = null;
  }

  openFragment(attrs: SsrAttrs) {
    this.lastNode = null;
    vNodeData_openFragment(this.currentElementFrame!.vNodeData, attrs);
  }

  closeFragment() {
    vNodeData_closeFragment(this.currentElementFrame!.vNodeData);
    this.lastNode = null;
  }

  openProjection(attrs: SsrAttrs) {
    this.openFragment(attrs);
    const componentFrame = this.getComponentFrame();
    if (componentFrame) {
      componentFrame.projectionDepth++;
    }
  }

  closeProjection() {
    const componentFrame = this.getComponentFrame();
    if (componentFrame) {
      componentFrame.projectionDepth--;
    }
    this.closeFragment();
  }

  openComponent(attrs: SsrAttrs) {
    this.openFragment(attrs);
    this.currentComponentNode = this.getLastNode();
    this.componentStack.push(new SsrComponentFrame(this.getLastNode()));
  }

  /**
   * Returns the current component frame.
   *
   * @param projectionDepth - How many levels of projection to skip. This is needed when projections
   *   are nested inside other projections we need to have a way to read from a frame above.
   * @returns
   */
  getComponentFrame(projectionDepth: number = 0): ISsrComponentFrame | null {
    const length = this.componentStack.length;
    const idx = length - projectionDepth - 1;
    return idx >= 0 ? this.componentStack[idx] : null;
  }

  getNearestComponentFrame(): ISsrComponentFrame | null {
    const currentFrame = this.getComponentFrame(0);
    if (!currentFrame) {
      return null;
    }
    return this.getComponentFrame(currentFrame.projectionDepth);
  }

  closeComponent() {
    const componentFrame = this.componentStack.pop()!;
    componentFrame.releaseUnclaimedProjections(this.unclaimedProjections);
    this.closeFragment();
    this.currentComponentNode = this.currentComponentNode?.currentComponentNode || null;
  }

  /** Write a text node with correct escaping. Save the length of the text node in the vNodeData. */
  textNode(text: string) {
    this.write(escapeHTML(text));
    vNodeData_addTextSize(this.currentElementFrame!.vNodeData, text.length);
    this.lastNode = null;
  }

  htmlNode(rawHtml: string) {
    this.write(rawHtml);
  }

  commentNode(text: string) {
    this.write('<!--' + text + '-->');
  }

  addRoot(obj: unknown): number {
    return this.serializationCtx.$addRoot$(obj);
  }

  getLastNode(): ISsrNode {
    if (!this.lastNode) {
      this.lastNode = vNodeData_createSsrNodeReference(
        this.currentComponentNode,
        this.currentElementFrame!.vNodeData,
        // we start at -1, so we need to add +1
        this.currentElementFrame!.depthFirstElementIdx + 1,
        this.cleanupQueue
      );
    }
    return this.lastNode!;
  }

  addUnclaimedProjection(frame: ISsrComponentFrame, name: string, children: JSXChildren): void {
    // componentFrame, scopedStyleIds, slotName, children
    this.unclaimedProjections.push(frame, null, name, children);
  }

  $processInjectionsFromManifest$(): void {
    const injections = this.resolvedManifest.manifest.injections;
    if (!injections) {
      return;
    }

    for (let i = 0; i < injections.length; i++) {
      const injection = injections[i];

      const jsxNode = _jsxSplit(injection.tag, null, injection.attributes || {}, null, 0, null);
      if (injection.location === 'head') {
        this.additionalHeadNodes.push(jsxNode);
      } else {
        this.additionalBodyNodes.push(jsxNode);
      }
    }
  }

  $appendStyle$(content: string, styleId: string, host: ISsrNode, scoped: boolean): void {
    const propName = scoped ? QScopedStyle : QStyle;
    const styleIdsString = this.getHostProp<string>(host, propName);
    const styleIds = convertStyleIdsStringToArray(styleIdsString) || [];
    if (!styleIds.includes(styleId)) {
      styleIds.push(styleId);
      this.setHostProp(host, propName, convertStyleIdsArrayToString(styleIds));
    }

    if (!this.styleIds.has(styleId)) {
      this.styleIds.add(styleId);
      if (this.currentElementFrame?.elementName === 'html') {
        this.additionalHeadNodes.push(
          _jsxSorted(
            'style',
            null,
            { dangerouslySetInnerHTML: content, [QStyle]: styleId },
            null,
            0,
            styleId
          )
        );
      } else {
        this._styleNode(styleId, content);
      }
    }
  }

  private _styleNode(styleId: string, content: string) {
    this.openElement('style', [QStyle, styleId]);
    this.write(content);
    this.closeElement();
  }

  ////////////////////////////////////

  emitContainerData(): ValueOrPromise<void> {
    this.emitUnclaimedProjection();
    this.addVNodeDataToSerializationRoots();
    return maybeThen(this.emitStateData(), () => {
      this.emitVNodeData();
      this.emitPrefetchResourcesData();
      this.emitSyncFnsData();
      this.emitQwikLoaderAtBottomIfNeeded();
    });
  }

  /**
   * Serialize the vNodeData into a string and emit it as a script tag.
   *
   * ## Encoding:
   *
   * - Alphabetical characters are text node lengths.
   * - Numbers are element counts.
   * - `{` is start of virtual node.
   * - `}` is end of virtual node.
   * - `~` Store as reference for data deserialization.
   * - `!"#$%&'()*+'-./` are separators (sequential characters in ASCII table)
   *
   * ## Attribute encoding:
   *
   * - `;` - `q:sstyle` - Style attribute.
   * - `<` - `q:renderFn' - Component QRL render function (body)
   * - `=` - `q:id` - ID of the element.
   * - `>` - `q:props' - Component QRL Props
   * - `?` - `q:sref` - Slot reference.
   * - `@` - `q:key` - Element key.
   * - `[` - `q:seq' - Seq value from `useSequentialScope()`
   * - `\` - SKIP because `\` is used as escaping
   * - `]` - `q:ctx' - Component context/props
   * - `~` - `q:slot' - Slot name
   *
   * ## Separator Encoding:
   *
   * - `~` is a reference to the node. Save it.
   * - `!` is vNodeData separator skipping 0. (ie next vNode)
   * - `"` is vNodeData separator skipping 1.
   * - `#` is vNodeData separator skipping 2.
   * - `$` is vNodeData separator skipping 4.
   * - `%` is vNodeData separator skipping 8.
   * - `&` is vNodeData separator skipping 16.
   * - `'` is vNodeData separator skipping 32.
   * - `(` is vNodeData separator skipping 64.
   * - `)` is vNodeData separator skipping 128.
   * - `*` is vNodeData separator skipping 256.
   * - `+` is vNodeData separator skipping 512.
   * - `'` is vNodeData separator skipping 1024.
   * - `.` is vNodeData separator skipping 2048.
   * - `/` is vNodeData separator skipping 4096.
   *
   * NOTE: Not every element will need vNodeData. So we need to encode how many elements should be
   * skipped. By choosing different separators we can encode different numbers of elements to skip.
   */
  emitVNodeData() {
    this.openElement('script', ['type', 'qwik/vnode']);
    const vNodeAttrsStack: SsrAttrs[] = [];
    const vNodeData = this.vNodeData;
    let lastSerializedIdx = 0;
    for (let elementIdx = 0; elementIdx < vNodeData.length; elementIdx++) {
      const vNode = vNodeData[elementIdx];
      const flag = vNode[0];
      if (flag !== VNodeDataFlag.NONE) {
        lastSerializedIdx = this.emitVNodeSeparators(lastSerializedIdx, elementIdx);
        if (flag & VNodeDataFlag.REFERENCE) {
          this.write(VNodeDataSeparator.REFERENCE_CH);
        }
        if (flag & (VNodeDataFlag.TEXT_DATA | VNodeDataFlag.VIRTUAL_NODE)) {
          let fragmentAttrs: SsrAttrs | null = null;
          /**
           * We keep track of how many virtual open/close fragments we have seen so far. Normally we
           * should not have to do it, but if you put a fragment around `<body>` tag than we start
           * emitting before `<body/>` close tag. This means that the system did not get a chance to
           * insert the close fragment. So we just assume that there will be nothing else and
           * auto-close.
           */
          let depth = 0;
          for (let i = 1; i < vNode.length; i++) {
            const value = vNode[i];
            if (Array.isArray(value)) {
              vNodeAttrsStack.push(fragmentAttrs!);
              fragmentAttrs = value;
            } else if (value === OPEN_FRAGMENT) {
              depth++;
              this.write(VNodeDataChar.OPEN_CHAR);
            } else if (value === CLOSE_FRAGMENT) {
              // write out fragment attributes
              if (fragmentAttrs) {
                writeFragmentAttrs(this.write.bind(this), this.addRoot.bind(this), fragmentAttrs);
                fragmentAttrs = vNodeAttrsStack.pop()!;
              }
              depth--;
              this.write(VNodeDataChar.CLOSE_CHAR);
            } else if (value >= 0) {
              // Text nodes get encoded as alphanumeric characters.
              this.write(encodeAsAlphanumeric(value));
            } else {
              // Element counts get encoded as numbers.
              this.write(String(0 - value));
            }
          }
          while (depth-- > 0) {
            if (fragmentAttrs) {
              writeFragmentAttrs(this.write.bind(this), this.addRoot.bind(this), fragmentAttrs);
              fragmentAttrs = vNodeAttrsStack.pop()!;
            }
            this.write(VNodeDataChar.CLOSE_CHAR);
          }
        }
      }
    }

    function writeFragmentAttrs(
      write: (text: string) => void,
      addRoot: (obj: unknown) => number,
      fragmentAttrs: SsrAttrs
    ): void {
      for (let i = 0; i < fragmentAttrs.length; ) {
        const key = fragmentAttrs[i++] as string;
        let value = fragmentAttrs[i++] as string;
        if (typeof value !== 'string') {
          value = String(addRoot(value));
        }
        switch (key) {
          case QScopedStyle:
            write(VNodeDataChar.SCOPED_STYLE_CHAR);
            break;
          case QStyle:
            write(VNodeDataChar.STYLE_CHAR);
            break;
          case OnRenderProp:
            write(VNodeDataChar.RENDER_FN_CHAR);
            break;
          case ELEMENT_ID:
            write(VNodeDataChar.ID_CHAR);
            break;
          case ELEMENT_PROPS:
            write(VNodeDataChar.PROPS_CHAR);
            break;
          case QSlotRef:
            write(VNodeDataChar.SLOT_REF_CHAR);
            break;
          case ELEMENT_KEY:
            write(VNodeDataChar.KEY_CHAR);
            break;
          case ELEMENT_SEQ:
            write(VNodeDataChar.SEQ_CHAR);
            break;
          case ELEMENT_SEQ_IDX:
            write(VNodeDataChar.SEQ_IDX_CHAR);
            break;
          // Skipping `\` character for now because it is used for escaping.
          case QCtxAttr:
            write(VNodeDataChar.CONTEXT_CHAR);
            break;
          case QSlot:
            write(VNodeDataChar.SLOT_CHAR);
            break;
          default:
            write(VNodeDataChar.SEPARATOR_CHAR);
            write(key);
            write(VNodeDataChar.SEPARATOR_CHAR);
        }
        write(value);
      }
    }

    this.closeElement();
  }

  /**
   * This is needed for the case when we have a component around the `<body>` tag. In this case we
   * start emitting the vnode script tag before the `<body>` close tag.
   */
  addVNodeDataToSerializationRoots() {
    const vNodeAttrsStack: SsrAttrs[] = [];
    const vNodeData = this.vNodeData;
    for (let elementIdx = 0; elementIdx < vNodeData.length; elementIdx++) {
      const vNode = vNodeData[elementIdx];
      const flag = vNode[0];
      if (flag !== VNodeDataFlag.NONE) {
        if (flag & (VNodeDataFlag.TEXT_DATA | VNodeDataFlag.VIRTUAL_NODE)) {
          let fragmentAttrs: SsrAttrs | null = null;
          let depth = 0;
          for (let i = 1; i < vNode.length; i++) {
            const value = vNode[i];
            if (Array.isArray(value)) {
              vNodeAttrsStack.push(fragmentAttrs!);
              fragmentAttrs = value;
            } else if (value === OPEN_FRAGMENT) {
              depth++;
            } else if (value === CLOSE_FRAGMENT) {
              // write out fragment attributes
              if (fragmentAttrs) {
                for (let i = 0; i < fragmentAttrs.length; i++) {
                  const value = fragmentAttrs[i] as string;
                  if (typeof value !== 'string') {
                    fragmentAttrs[i] = String(this.addRoot(value));
                  }
                }
                fragmentAttrs = vNodeAttrsStack.pop()!;
              }
              depth--;
            }
          }

          while (depth-- > 0) {
            if (fragmentAttrs) {
              for (let i = 0; i < fragmentAttrs.length; i++) {
                const value = fragmentAttrs[i] as string;
                if (typeof value !== 'string') {
                  fragmentAttrs[i] = String(this.addRoot(value));
                }
              }
              fragmentAttrs = vNodeAttrsStack.pop()!;
            }
          }
        }
      }
    }
  }

  private emitStateData(): ValueOrPromise<void> {
    this.openElement('script', ['type', 'qwik/state']);
    return maybeThen(this.serializationCtx.$breakCircularDepsAndAwaitPromises$(), () => {
      this.serializationCtx.$serialize$();
      this.closeElement();
    });
  }

  private emitSyncFnsData() {
    const fns = this.serializationCtx.$syncFns$;
    if (fns.length) {
      const scriptAttrs = ['q:func', 'qwik/json'];
      if (this.renderOptions.serverData?.nonce) {
        scriptAttrs.push('nonce', this.renderOptions.serverData.nonce);
      }
      this.openElement('script', scriptAttrs);
      this.write(Q_FUNCS_PREFIX);
      this.write('[');
      this.writeArray(fns, ',');
      this.write(']');
      this.closeElement();
    }
  }

  private emitPrefetchResourcesData() {
    const qrls = Array.from(this.serializationCtx.$eventQrls$);
    if (this.renderOptions.prefetchStrategy !== null && qrls.length) {
      // skip prefetch implementation if prefetchStrategy === null
      const prefetchResources = getPrefetchResources(
        qrls,
        this.renderOptions,
        this.resolvedManifest
      );
      if (prefetchResources.length > 0) {
        applyPrefetchImplementation2(this, this.renderOptions.prefetchStrategy, prefetchResources);
        this.prefetchResources = prefetchResources;
      }
    }
  }

  isStatic(): boolean {
    return this.serializationCtx.$eventQrls$.size === 0;
  }

  private getQwikLoaderPositionMode() {
    return this.renderOptions.qwikLoader?.position ?? 'bottom';
  }

  private getQwikLoaderIncludeMode() {
    return this.renderOptions.qwikLoader?.include ?? 'auto';
  }

  emitQwikLoaderAtTopIfNeeded() {
    const positionMode = this.getQwikLoaderPositionMode();
    if (positionMode === 'top') {
      const includeMode = this.getQwikLoaderIncludeMode();
      const includeLoader = includeMode !== 'never';
      if (includeLoader) {
        this.emitQwikLoader();

        // Assume there will be at least click handlers
        this.emitQwikEvents(['"click"'], {
          includeLoader: true,
          includeNonce: false,
        });
      }
    }
  }

  private emitQwikLoaderAtBottomIfNeeded() {
    const positionMode = this.getQwikLoaderPositionMode();
    let includeLoader = true;

    if (positionMode === 'bottom') {
      const needLoader = !this.isStatic();
      const includeMode = this.getQwikLoaderIncludeMode();
      includeLoader = includeMode === 'always' || (includeMode === 'auto' && needLoader);
      if (includeLoader) {
        this.emitQwikLoader();
      }
    }

    // always emit qwik events regardless of position
    this.emitQwikEvents(
      Array.from(this.serializationCtx.$eventNames$, (s) => JSON.stringify(s)),
      {
        includeLoader,
        includeNonce: true,
      }
    );
  }

  private emitQwikLoader() {
    const qwikLoaderScript = getQwikLoaderScript({
      debug: this.renderOptions.debug,
    });
    const scriptAttrs = ['id', 'qwikloader'];
    if (this.renderOptions.serverData?.nonce) {
      scriptAttrs.push('nonce', this.renderOptions.serverData.nonce);
    }
    this.openElement('script', scriptAttrs);
    this.write(qwikLoaderScript);
    this.closeElement();
  }

  private emitQwikEvents(
    eventNames: string[],
    opts: { includeNonce: boolean; includeLoader: boolean }
  ) {
    if (eventNames.length > 0) {
      const scriptAttrs: SsrAttrs = [];
      if (this.renderOptions.serverData?.nonce && opts.includeNonce) {
        scriptAttrs.push('nonce', this.renderOptions.serverData.nonce);
      }
      this.openElement('script', scriptAttrs);
      this.write(opts.includeLoader ? `window.qwikevents` : `(window.qwikevents||=[])`);
      this.write('.push(');
      this.writeArray(eventNames, ', ');
      this.write(')');
      this.closeElement();
    }
  }

  private async emitUnclaimedProjection() {
    const unclaimedProjections = this.unclaimedProjections;
    if (unclaimedProjections.length) {
      const previousCurrentComponentNode = this.currentComponentNode;
      try {
        this.openElement(QTemplate, ['style', 'display:none'], null);
        let idx = 0;
        let ssrComponentNode: ISsrNode | null = null;
        let ssrComponentFrame: ISsrComponentFrame | null = null;
        let scopedStyleId: string | null = null;

        for (let i = 0; i < unclaimedProjections.length; i += 4) {
          this.unclaimedProjectionComponentFrameQueue.push(
            unclaimedProjections[i] as ISsrComponentFrame
          );
        }

        while (idx < unclaimedProjections.length) {
          const value = unclaimedProjections[idx++];
          if (value instanceof SsrComponentFrame) {
            // It is important to restore the `ssrComponentNode` so that the content
            // can pretend to be inside the component.
            ssrComponentNode = this.currentComponentNode = value.componentNode;
            ssrComponentFrame = value;
            // scopedStyleId is always after ssrComponentNode
            scopedStyleId = unclaimedProjections[idx++] as string;
          } else if (typeof value === 'string') {
            const children = unclaimedProjections[idx++] as JSXOutput;
            if (!ssrComponentFrame?.hasSlot(value)) {
              /**
               * Skip the slot if it is already claimed by previous unclaimed projections. We need
               * to remove the slot from the component frame so that it does not incorrectly resolve
               * non-existing node later
               */
              ssrComponentFrame && ssrComponentFrame.componentNode.removeProp(value);
              continue;
            }
            this.unclaimedProjectionComponentFrameQueue.shift();
            this.openFragment(
              isDev
                ? [DEBUG_TYPE, VirtualType.Projection, QSlotParent, ssrComponentNode!.id]
                : [QSlotParent, ssrComponentNode!.id]
            );
            ssrComponentNode?.setProp(value, this.getLastNode().id);
            _walkJSX(this, children, false, scopedStyleId);
            this.closeFragment();
          } else {
            throw Error(); // 'should not get here'
          }
        }
        this.closeElement();
      } finally {
        this.currentComponentNode = previousCurrentComponentNode;
      }
    }
  }

  private emitVNodeSeparators(lastSerializedIdx: number, elementIdx: number): number {
    let skipCount = elementIdx - lastSerializedIdx;
    // console.log('emitVNodeSeparators', lastSerializedIdx, elementIdx, skipCount);
    while (skipCount != 0) {
      if (skipCount > 4096) {
        this.write(VNodeDataSeparator.ADVANCE_8192_CH);
        skipCount -= 8192;
      } else {
        skipCount & 4096 && this.write(VNodeDataSeparator.ADVANCE_4096_CH);
        skipCount & 2048 && this.write(VNodeDataSeparator.ADVANCE_2048_CH);
        skipCount & 1024 && this.write(VNodeDataSeparator.ADVANCE_1024_CH);
        skipCount & 512 && this.write(VNodeDataSeparator.ADVANCE_512_CH);
        skipCount & 256 && this.write(VNodeDataSeparator.ADVANCE_256_CH);
        skipCount & 128 && this.write(VNodeDataSeparator.ADVANCE_128_CH);
        skipCount & 64 && this.write(VNodeDataSeparator.ADVANCE_64_CH);
        skipCount & 32 && this.write(VNodeDataSeparator.ADVANCE_32_CH);
        skipCount & 16 && this.write(VNodeDataSeparator.ADVANCE_16_CH);
        skipCount & 8 && this.write(VNodeDataSeparator.ADVANCE_8_CH);
        skipCount & 4 && this.write(VNodeDataSeparator.ADVANCE_4_CH);
        skipCount & 2 && this.write(VNodeDataSeparator.ADVANCE_2_CH);
        skipCount & 1 && this.write(VNodeDataSeparator.ADVANCE_1_CH);
        skipCount = 0;
      }
    }
    return elementIdx;
  }

  private createAndPushFrame(elementName: string, depthFirstElementIdx: number) {
    let tagNesting: TagNesting = TagNesting.ANYTHING;
    if (isDev) {
      if (!this.currentElementFrame) {
        tagNesting = initialTag(elementName);
      } else {
        let frame: ElementFrame | null = this.currentElementFrame;
        const previousTagNesting = frame!.tagNesting;
        tagNesting = isTagAllowed(previousTagNesting, elementName);
        if (tagNesting === TagNesting.NOT_ALLOWED) {
          const frames: ElementFrame[] = [];
          while (frame) {
            frames.unshift(frame);
            frame = frame.parent;
          }
          const text: string[] = [
            `HTML rules do not allow '<${elementName}>' at this location.`,
            `  (The HTML parser will try to recover by auto-closing or inserting additional tags which will confuse Qwik when it resumes.)`,
            `  Offending tag: <${elementName}>`,
            `  Existing tag context:`,
          ];
          let indent = '    ';
          let lastName = '';
          for (const frame of frames) {
            const [name, example] = allowedContent(frame.tagNesting);
            text.push(
              `${indent}<${frame.elementName}>${
                lastName !== name ? ` [${name}]${example ? ` -> ${example}` : ''}` : ''
              }`
            );
            lastName = name;
            indent += ' ';
          }
          text.push(
            `${indent}<${elementName}> <= is not allowed as a child of ${
              allowedContent(previousTagNesting)[0]
            }.`
          );
          throw newTagError(text.join('\n'));
        }
      }
    }
    const frame: ElementFrame = {
      tagNesting,
      parent: this.currentElementFrame,
      elementName,
      depthFirstElementIdx,
      vNodeData: [VNodeDataFlag.NONE],
    };
    this.currentElementFrame = frame;
    this.vNodeData.push(frame.vNodeData);
  }
  private popFrame() {
    const closingFrame = this.currentElementFrame!;
    this.currentElementFrame = closingFrame.parent;
    return closingFrame;
  }

  ////////////////////////////////////
  private write(text: string) {
    this.writer.write(text);
  }

  writeArray(array: string[], separator: string) {
    for (let i = 0; i < array.length; i++) {
      const element = array[i];
      if (i > 0) {
        this.write(separator);
      }
      this.write(element);
    }
  }

  private writeAttrs(tag: string, attrs: SsrAttrs, immutable: boolean): string | undefined {
    let innerHTML: string | undefined = undefined;
    if (attrs.length) {
      for (let i = 0; i < attrs.length; i++) {
        let key = attrs[i++] as SsrAttrKey;
        let value = attrs[i] as SsrAttrValue;
        let styleScopedId: string | null = null;

        if (isSSRUnsafeAttr(key)) {
          if (isDev) {
            throw new Error('Attribute value is unsafe for SSR');
          }
          continue;
        }

        if (isClassAttr(key) && Array.isArray(value)) {
          // value is a signal and key is a class, we need to retrieve data first
          const [signalValue, styleId] = value;
          value = signalValue;
          styleScopedId = styleId;
        }

        if (isSignal(value)) {
          const lastNode = this.getLastNode();
          if (key === 'ref') {
            value.value = lastNode;
            continue;
          } else {
            value = this.trackSignalValue(value, [
              immutable ? SubscriptionType.PROP_IMMUTABLE : SubscriptionType.PROP_MUTABLE,
              lastNode as fixMeAny,
              value,
              lastNode as fixMeAny,
              key,
              styleScopedId || undefined,
            ]);
          }
        }

        if (key === dangerouslySetInnerHTML) {
          innerHTML = String(value);
          key = QContainerAttr;
          value = QContainerValue.HTML;
          // we can skip this attribute for a style node
          // because we skip materializing the style node
          if (tag === 'style') {
            continue;
          }
        }

        if (tag === 'textarea' && key === 'value') {
          if (typeof value !== 'string') {
            if (isDev) {
              throw new Error('The value of the textarea must be a string');
            }
            continue;
          }
          innerHTML = escapeHTML(value);
          key = QContainerAttr;
          value = QContainerValue.TEXT;
        }

        value = serializeAttribute(key, value, styleScopedId);

        if (value != null && value !== false) {
          this.write(' ');
          this.write(key);
          if (value !== true) {
            this.write('="');
            const strValue = escapeHTML(String(value));
            this.write(strValue);

            this.write('"');
          }
        }
      }
    }
    return innerHTML;
  }
}

const isQwikStyleElement = (tag: string, attrs: SsrAttrs | null | undefined) => {
  if (tag === 'style' && attrs != null) {
    for (let i = 0; i < attrs.length; i = i + 2) {
      const attr = attrs[i];
      if (attr === QStyle || attr === QScopedStyle) {
        return true;
      }
    }
  }
  return false;
};

function newTagError(text: string) {
  return new Error('SsrError(tag): ' + text);
}

function hasDestroy(obj: any): obj is { $destroy$(): void } {
  return obj && typeof obj === 'object' && typeof obj.$destroy$ === 'function';
}

// https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
const unsafeAttrCharRE = /[>/="'\u0009\u000a\u000c\u0020]/; // eslint-disable-line no-control-regex
function isSSRUnsafeAttr(name: string): boolean {
  return unsafeAttrCharRE.test(name);
}
