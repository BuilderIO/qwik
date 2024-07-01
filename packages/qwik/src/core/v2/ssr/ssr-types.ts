/** @file Public types for the SSR */

import type {
  Container2,
  JSXChildren,
  JSXOutput,
  SerializationContext,
  ValueOrPromise,
} from '../../../server/qwik-types';
import type { PrefetchResource } from '../../../server/types';
import type { JSXNode } from '../../render/jsx/types/jsx-node';
import type { Signal } from '../../state/signal';

export type SsrAttrKey = string;
export type SsrAttrValue = string | Signal<any> | boolean | Object | null;
export type SsrAttrs = Array<SsrAttrKey | SsrAttrValue>;
export interface StreamWriter {
  write(chunk: string): void;
}

export interface ISsrNode {
  id: string;
  currentComponentNode: ISsrNode | null;
  setProp(name: string, value: any): void;
  getProp(name: string): any;
  removeProp(name: string): void;
}

export interface ISsrComponentFrame {
  componentNode: ISsrNode;
  childrenScopedStyle: string | null;
  projectionDepth: number;
  releaseUnclaimedProjections(
    unclaimedProjections: (ISsrComponentFrame | JSXChildren | string)[]
  ): void;
  consumeChildrenForSlot(projectionNode: ISsrNode, slotName: string): JSXChildren | null;
  distributeChildrenIntoSlots(children: JSXChildren, scopedStyle: string | null): void;
  hasSlot(slotName: string): boolean;
}

export type SymbolToChunkResolver = (symbol: string) => string;

export interface SSRContainer extends Container2 {
  readonly tag: string;
  readonly writer: StreamWriter;
  readonly prefetchResources: PrefetchResource[];
  readonly serializationCtx: SerializationContext;
  readonly symbolToChunkResolver: SymbolToChunkResolver;
  readonly buildBase: string;
  additionalHeadNodes: Array<JSXNode>;
  additionalBodyNodes: Array<JSXNode>;
  unclaimedProjectionComponentFrameQueue: ISsrComponentFrame[];

  openContainer(): void;
  closeContainer(): void;

  openElement(
    elementName: string,
    varAttrs: SsrAttrs | null,
    constAttrs?: SsrAttrs | null
  ): string | undefined;
  closeElement(): ValueOrPromise<void>;

  openFragment(attrs: SsrAttrs): void;
  closeFragment(): void;

  openProjection(attrs: SsrAttrs): void;
  closeProjection(): void;

  openComponent(attrs: SsrAttrs): void;
  getComponentFrame(projectionDepth: number): ISsrComponentFrame | null;
  getNearestComponentFrame(): ISsrComponentFrame | null;
  closeComponent(): void;

  textNode(text: string): void;
  htmlNode(rawHtml: string): void;
  commentNode(text: string): void;
  addRoot(obj: any): number;
  getLastNode(): ISsrNode;
  addUnclaimedProjection(frame: ISsrComponentFrame, name: string, children: JSXChildren): void;
  isStatic(): boolean;
  render(jsx: JSXOutput): Promise<void>;

  emitQwikLoaderAtTopIfNeeded(): void;
}
