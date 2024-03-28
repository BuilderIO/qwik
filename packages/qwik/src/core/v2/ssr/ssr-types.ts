/** @file Public types for the SSR */

import type {
  Container2,
  JSXChildren,
  JSXOutput,
  SerializationContext,
  ValueOrPromise,
} from '../../../server/qwik-types';
import type { PrefetchResource } from '../../../server/types';
import type { Signal } from '../../state/signal';

export type SsrAttrKey = string;
export type SsrAttrValue = string | Signal<any> | null;
export type SsrAttrs = Array<SsrAttrKey | SsrAttrValue>;
export interface StreamWriter {
  write(chunk: string): void;
}

export interface ISsrNode {
  id: string;
  currentComponentNode: ISsrNode | null;
  setProp(name: string, value: any): void;
  getProp(name: string): any;
}

export interface ISsrComponentFrame {
  componentNode: ISsrNode;
  scopedStyleIds: Set<string>;
  projectionDepth: number;
  releaseUnclaimedProjections(unclaimedProjections: (ISsrNode | JSXChildren)[]): void;
  consumeChildrenForSlot(projectionNode: ISsrNode, slotName: string): JSXChildren | null;
  distributeChildrenIntoSlots(children: JSXChildren): void;
}

export type SymbolToChunkResolver = (symbol: string) => string;

export interface SSRContainer extends Container2 {
  readonly tag: string;
  readonly writer: StreamWriter;
  readonly prefetchResources: PrefetchResource[];
  readonly serializationCtx: SerializationContext;
  readonly symbolToChunkResolver: SymbolToChunkResolver;

  openContainer(): void;
  closeContainer(): void;

  openElement(tag: string, attrs: SsrAttrs | null, immutableAttrs?: SsrAttrs | null): void;
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
  addRoot(obj: any): number;
  getLastNode(): ISsrNode;
  addUnclaimedProjection(node: ISsrNode, name: string, children: JSXChildren): void;
  isStatic(): boolean;
  render(jsx: JSXOutput): Promise<void>;

  $appendHeadNodes$(): void;
}
