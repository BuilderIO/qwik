/** @file Public APIs for the SSR */
import { _SharedContainer, _walkJSX } from '@builder.io/qwik';
import { isDev } from '@builder.io/qwik/build';
import type { ResolvedManifest } from '@builder.io/qwik/optimizer';
import { getQwikLoaderScript } from '@builder.io/qwik/server';
import { applyPrefetchImplementation2 } from './prefetch-implementation';
import { getPrefetchResources } from './prefetch-strategy';
import {
  DEBUG_TYPE,
  ELEMENT_ID,
  ELEMENT_KEY,
  ELEMENT_PROPS,
  ELEMENT_SEQ,
  OnRenderProp,
  QCtxAttr,
  QScopedStyle,
  QSlot,
  QSlotParent,
  QSlotRef,
  QStyle,
  VirtualType,
  convertStyleIdsToString,
  getScopedStyleIdsAsPrefix,
  isClassAttr,
  mapArray_get,
  mapArray_set,
  maybeThen,
} from './qwik-copy';
import type {
  ContextId,
  ISsrNode,
  JSXChildren,
  JSXOutput,
  SerializationContext,
  ValueOrPromise,
  HostElement,
  SSRContainer as ISSRContainer,
  ISsrComponentFrame,
  SsrAttrs,
  StreamWriter,
} from './qwik-types';
import { Q_FUNCS_PREFIX } from './render';
import type { PrefetchResource, RenderOptions, RenderToStreamResult } from './types';
import { createTimer } from './utils';
import { SsrComponentFrame, SsrNode } from './v2-node';
import { TagNesting, allowedContent, initialTag, isTagAllowed } from './v2-tag-nesting';
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

interface ContainerElementFrame {
  tagNesting: TagNesting;
  parent: ContainerElementFrame | null;
  /** Element name. */
  elementName: string;
  shouldSkipStyleElement: boolean;
  /**
   * Current element index.
   *
   * This number must match the depth-first traversal of the DOM elements as returned by the
   * https://developer.mozilla.org/en-US/docs/Web/API/TreeWalker
   */
  depthFirstElementIdx: number;
  vNodeData: VNodeData;
}

interface StyleData {
  content: string;
  scoped: boolean;
}

const EMPTY_OBJ = {};

class SSRContainer extends _SharedContainer implements ISSRContainer {
  public tag: string;
  public writer: StreamWriter;
  public timing: RenderToStreamResult['timing'];
  public buildBase: string;
  public resolvedManifest: ResolvedManifest;
  public renderOptions: RenderOptions;
  public prefetchResources: PrefetchResource[] = [];
  public serializationCtx: SerializationContext;
  private lastNode: ISsrNode | null = null;
  private currentComponentNode: ISsrNode | null = null;
  private styleIds = new Set<string>();
  private headStyles = new Map<string, StyleData>();

  private currentElementFrame: ContainerElementFrame | null = null;

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
  private unclaimedProjections: Array<ISsrNode | string | JSXChildren> = [];

  constructor(opts: Required<Required<Parameters<typeof ssrCreateContainer>>[0]>) {
    super(() => null, opts.renderOptions.serverData ?? EMPTY_OBJ, opts.locale);
    this.serializationCtx = this.serializationCtxFactory(SsrNode, opts.writer);
    this.renderTimer = createTimer();
    this.tag = opts.tagName;
    this.writer = opts.writer;
    this.timing = opts.timing;
    this.buildBase = opts.buildBase;
    this.resolvedManifest = opts.resolvedManifest;
    this.renderOptions = opts.renderOptions;
  }

  processJsx(host: HostElement, jsx: JSXOutput): void {}

  handleError(err: any, $host$: HostElement): void {
    throw err;
  }

  async render(jsx: JSXOutput) {
    this.openContainer();
    await _walkJSX(this, jsx, true);
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
    if (this.renderOptions.containerAttributes?.['q:render']) {
      qRender = `${this.renderOptions.containerAttributes['q:render']}-${qRender}`;
    }

    const containerAttributes: Record<string, string> = {
      ...this.renderOptions.containerAttributes,
      'q:container': 'paused',
      'q:version': this.$version$ ?? 'dev',
      'q:render': qRender,
      'q:base': this.buildBase,
      'q:locale': this.$serverData$.locale || this.$locale$,
      'q:manifest-hash': this.resolvedManifest.manifest.manifestHash,
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
    this.$scheduler$.$drainCleanup$(null);
    return this.closeElement();
  }

  openElement(tag: string, attrs: SsrAttrs) {
    this.lastNode = null;
    this.pushFrame(tag, this.depthFirstElementCount++, true, isQwikStyleElement(tag, attrs));
    this.write('<');
    this.write(tag);
    this.writeAttrs(attrs);
    this.write('>');
    this.lastNode = null;
  }

  closeElement(): ValueOrPromise<void> {
    const currentFrame = this.currentElementFrame!;
    if (
      (currentFrame.parent === null && currentFrame.tagNesting !== TagNesting.HTML) ||
      currentFrame.tagNesting === TagNesting.BODY
    ) {
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

  private _closeElement() {
    const currentFrame = this.popFrame();
    this.write('</');
    this.write(currentFrame.elementName!);
    this.write('>');
    // Keep track of number of elements.
    const newFrame = this.currentElementFrame;
    if (newFrame && currentFrame && !currentFrame.shouldSkipStyleElement) {
      vNodeData_incrementElementCount(newFrame.vNodeData);
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
    this.getComponentFrame(0)!.projectionDepth++;
  }

  closeProjection() {
    this.getComponentFrame(0)!.projectionDepth--;
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
    let lastIdx = 0;
    let openAngleBracketIdx: number;
    while ((openAngleBracketIdx = text.indexOf('<')) !== -1) {
      this.write(text.substring(lastIdx, openAngleBracketIdx));
      lastIdx = openAngleBracketIdx;
    }
    this.write(lastIdx === 0 ? text : text.substring(lastIdx));
    vNodeData_addTextSize(this.currentElementFrame!.vNodeData, text.length);
    this.lastNode = null;
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
        this.currentElementFrame!.depthFirstElementIdx + 1
      );
    }
    return this.lastNode!;
  }

  addUnclaimedProjection(node: ISsrNode, name: string, children: JSXChildren): void {
    this.unclaimedProjections.push(node, name, children);
  }

  $appendStyle$(content: string, styleId: string, host: ISsrNode, scoped: boolean): void {
    if (scoped) {
      const componentFrame = this.getComponentFrame(0)!;
      componentFrame.scopedStyleIds.add(styleId);
      const scopedStyleIds = convertStyleIdsToString(componentFrame.scopedStyleIds);
      this.setHostProp(host, QScopedStyle, scopedStyleIds);
    }

    if (!this.styleIds.has(styleId)) {
      this.styleIds.add(styleId);
      if (this.currentElementFrame?.elementName === 'html') {
        this.headStyles.set(styleId, {
          content,
          scoped,
        });
      } else {
        this._styleNode(styleId, {
          content,
          scoped,
        });
      }
    }
  }

  $appendHeadNodes$(): void {
    // render styles inside head
    this.headStyles.forEach((value, styleId) => this._styleNode(styleId, value));
    this.headStyles.clear();

    this.emitQwikLoaderAtTopIfNeeded();
  }

  private _styleNode(styleId: string, value: StyleData) {
    this.openElement('style', [QStyle, value.scoped ? styleId : '']);
    this.textNode(value.content);
    this.closeElement();
  }

  ////////////////////////////////////

  emitContainerData(): ValueOrPromise<void> {
    this.emitUnclaimedProjection();
    this.emitVNodeData();
    return maybeThen(this.emitStateData(), () => {
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
          this.write('~');
        }
        if (flag & (VNodeDataFlag.TEXT_DATA | VNodeDataFlag.VIRTUAL_NODE)) {
          let fragmentAttrs: SsrAttrs | null = null;
          for (let i = 1; i < vNode.length; i++) {
            const value = vNode[i];
            if (Array.isArray(value)) {
              vNodeAttrsStack.push(fragmentAttrs!);
              fragmentAttrs = value;
            } else if (value === OPEN_FRAGMENT) {
              this.write('{');
            } else if (value === CLOSE_FRAGMENT) {
              // write out fragment attributes
              if (fragmentAttrs) {
                for (let i = 0; i < fragmentAttrs.length; ) {
                  const key = fragmentAttrs[i++] as string;
                  let value = fragmentAttrs[i++] as string;
                  if (typeof value !== 'string') {
                    value = String(this.addRoot(value));
                  }
                  switch (key) {
                    case QScopedStyle:
                      this.write(';');
                      break;
                    case OnRenderProp:
                      this.write('<');
                      break;
                    case ELEMENT_ID:
                      this.write('=');
                      break;
                    case ELEMENT_PROPS:
                      this.write('>');
                      break;
                    case QSlotRef:
                      this.write('?');
                      break;
                    case ELEMENT_KEY:
                      this.write('@');
                      break;
                    case ELEMENT_SEQ:
                      this.write('[');
                      break;
                    // Skipping `\` character for now because it is used for escaping.
                    case QCtxAttr:
                      this.write(']');
                      break;
                    case QSlot:
                      this.write('~');
                      break;
                    default:
                      this.write('|');
                      this.write(key);
                      this.write('|');
                  }
                  this.write(value!);
                }
                fragmentAttrs = vNodeAttrsStack.pop()!;
              }
              this.write('}');
            } else if (value >= 0) {
              // Text nodes get encoded as alphanumeric characters.
              this.write(encodeAsAlphanumeric(value));
            } else {
              // Element counts get encoded as numbers.
              this.write(String(0 - value));
            }
          }
        }
      }
    }
    this.closeElement();
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

  private emitQwikLoaderAtTopIfNeeded() {
    const positionMode = this.getQwikLoaderPositionMode();
    if (positionMode === 'top') {
      const includeMode = this.getQwikLoaderIncludeMode();
      const includeLoader = includeMode !== 'never';
      if (includeLoader) {
        this.emitQwikLoader();

        // Assume there will be at least click handlers
        this.emitQwikEvents(true, ['"click"']);
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
      includeLoader,
      Array.from(this.serializationCtx.$eventNames$, (s) => JSON.stringify(s))
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

  private emitQwikEvents(includeLoader: boolean, eventNames: string[]) {
    const extraListeners = eventNames;
    if (extraListeners.length > 0) {
      const scriptAttrs: SsrAttrs = [];
      if (this.renderOptions.serverData?.nonce) {
        scriptAttrs.push('nonce', this.renderOptions.serverData.nonce);
      }
      this.openElement('script', scriptAttrs);
      this.write(includeLoader ? `window.qwikevents` : `(window.qwikevents||=[])`);
      this.write('.push(');
      this.writeArray(extraListeners, ', ');
      this.write(')');
      this.closeElement();
    }
  }

  private async emitUnclaimedProjection() {
    const unclaimedProjections = this.unclaimedProjections;
    if (unclaimedProjections.length) {
      this.openElement('q:template', ['style', 'display:none']);
      let idx = 0;
      let ssrComponentNode: ISsrNode | null = null;
      while (idx < unclaimedProjections.length) {
        const value = unclaimedProjections[idx++];
        if (value instanceof SsrNode) {
          ssrComponentNode = value;
        } else if (typeof value === 'string') {
          const children = unclaimedProjections[idx++] as JSXOutput;
          this.openFragment(
            isDev
              ? [DEBUG_TYPE, VirtualType.Projection, QSlotParent, ssrComponentNode!.id]
              : [QSlotParent, ssrComponentNode!.id]
          );
          ssrComponentNode?.setProp(value, this.getLastNode().id);
          _walkJSX(this, children, false);
          this.closeFragment();
        } else {
          throw Error(); // 'should not get here'
        }
      }
      this.closeElement();
    }
  }

  private emitVNodeSeparators(lastSerializedIdx: number, elementIdx: number): number {
    let skipCount = elementIdx - lastSerializedIdx;
    // console.log('emitVNodeSeparators', lastSerializedIdx, elementIdx, skipCount);
    while (skipCount != 0) {
      if (skipCount >= 4096) {
        this.write('/');
        skipCount -= 8192;
      } else {
        skipCount & 2096 && this.write('.');
        skipCount & 2048 && this.write('-');
        skipCount & 1024 && this.write('+');
        skipCount & 512 && this.write('*');
        skipCount & 256 && this.write(')');
        skipCount & 128 && this.write('(');
        skipCount & 64 && this.write("'");
        skipCount & 32 && this.write('&');
        skipCount & 16 && this.write('%');
        skipCount & 8 && this.write('$');
        skipCount & 4 && this.write('#');
        skipCount & 2 && this.write('"');
        skipCount & 1 && this.write('!');
        skipCount = 0;
      }
    }
    return elementIdx;
  }

  /**
   * @param tag
   * @param depthFirstElementIdx
   * @param isElement
   * @param shouldSkipStyleElement Should not count this element towards the number of elements in
   *   VNodeData. This is used for skipping over styles which should be moved to the head of the
   *   document.
   */
  private pushFrame(
    tag: string,
    depthFirstElementIdx: number,
    isElement: boolean,
    shouldSkipStyleElement: boolean
  ) {
    let tagNesting: TagNesting = TagNesting.ANYTHING;
    if (isDev) {
      if (tag !== tag.toLowerCase()) {
        throw newTagError(`Tag '${tag}' must be lower case, because HTML is case insensitive.`);
      }
      if (!this.currentElementFrame) {
        tagNesting = initialTag(tag);
      } else {
        let frame: ContainerElementFrame | null = this.currentElementFrame;
        const previousTagNesting = frame!.tagNesting;
        tagNesting = isTagAllowed(previousTagNesting, tag);
        if (tagNesting === TagNesting.NOT_ALLOWED) {
          const frames: ContainerElementFrame[] = [];
          while (frame) {
            frames.unshift(frame);
            frame = frame.parent;
          }
          const text: string[] = [
            `HTML rules do not allow '<${tag}>' at this location.`,
            `  (The HTML parser will try to recover by auto-closing or inserting additional tags which will confuse Qwik when it resumes.)`,
            `  Offending tag: <${tag}>`,
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
            `${indent}<${tag}> <= is not allowed as a child of ${
              allowedContent(previousTagNesting)[0]
            }.`
          );
          throw newTagError(text.join('\n'));
        }
      }
    }
    const frame: ContainerElementFrame = {
      tagNesting: tagNesting,
      parent: this.currentElementFrame,
      elementName: tag,
      shouldSkipStyleElement,
      depthFirstElementIdx: depthFirstElementIdx,
      vNodeData: [VNodeDataFlag.NONE],
    };
    this.currentElementFrame = frame;
    if (isElement) {
      this.vNodeData.push(frame.vNodeData);
    }
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

  private writeAttrs(attrs: (string | null)[]) {
    if (attrs.length) {
      for (let i = 0; i < attrs.length; i++) {
        const key = attrs[i++] as string;
        const value = attrs[i];
        this.write(' ');
        this.write(key);
        if (value != null) {
          this.write('="');
          let startIdx = 0;
          let quoteIdx: number;
          const componentFrame = this.getNearestComponentFrame();
          if (isClassAttr(key) && componentFrame && componentFrame.scopedStyleIds.size) {
            this.write(getScopedStyleIdsAsPrefix(componentFrame.scopedStyleIds) + ' ');
          }
          while ((quoteIdx = value.indexOf('"', startIdx)) != -1) {
            this.write(value.substring(startIdx, quoteIdx));
            this.write('&quot;');
            startIdx = quoteIdx;
          }
          this.write(startIdx === 0 ? value : value.substring(startIdx));
          this.write('"');
        }
      }
    }
  }
}

const isQwikStyleElement = (tag: string, attrs: SsrAttrs) => {
  if (tag === 'style') {
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
