//////////////////////////////////////////////////////////////////////////////////////////
// Developer Core API
//////////////////////////////////////////////////////////////////////////////////////////
export { componentQrl, component$ } from './component/component.public';

export type {
  PropsOf,
  OnRenderFn,
  Component,
  PublicProps,
  PropFunctionProps,
  _AllowPlainQrl,
  _Only$,
} from './component/component.public';

//////////////////////////////////////////////////////////////////////////////////////////
// Developer Event API
//////////////////////////////////////////////////////////////////////////////////////////
export type {
  SnapshotState,
  SnapshotResult,
  SnapshotMeta,
  SnapshotMetaValue,
  SnapshotListener,
} from './container/container';

//////////////////////////////////////////////////////////////////////////////////////////
// Internal Runtime
//////////////////////////////////////////////////////////////////////////////////////////
export { $, sync$, _qrlSync, type SyncQRL } from './qrl/qrl.public';
export { eventQrl } from './qrl/qrl.public';
export { event$ } from './qrl/qrl.public.dollar';

export { qrl, inlinedQrl, inlinedQrlDEV, qrlDEV } from './qrl/qrl';
export type { QRL, PropFunction, PropFnInterface } from './qrl/qrl.public';
export { implicit$FirstArg } from './util/implicit_dollar';

//////////////////////////////////////////////////////////////////////////////////////////
// PLATFORM
//////////////////////////////////////////////////////////////////////////////////////////
export { getPlatform, setPlatform } from './platform/platform';
export type { CorePlatform } from './platform/types';
export type { ClientContainer } from './v2/client/types';
export type { DomContainer } from './v2/client/dom-container';

//////////////////////////////////////////////////////////////////////////////////////////
// JSX Runtime
//////////////////////////////////////////////////////////////////////////////////////////
export {
  SSRStreamBlock,
  SSRRaw,
  SSRStream,
  SSRComment,
  SkipRender,
} from './render/jsx/utils.public';
export type { SSRStreamProps, SSRHintProps, SSRStreamChildren } from './render/jsx/utils.public';
export { Slot } from './render/jsx/slot.public';
export {
  Fragment,
  RenderOnce,
  jsx,
  jsxDEV,
  jsxs,
  h,
  h as createElement,
} from './render/jsx/jsx-runtime';
export type * from './render/jsx/types/jsx-generated';
export type {
  DOMAttributes,
  QwikAttributes,
  JSXTagName,
  JSXChildren,
  ComponentBaseProps,
  ClassList,
  CorrectedToggleEvent,
  EventHandler,
  QRLEventHandlerMulti,
} from './render/jsx/types/jsx-qwik-attributes';
export type { JSXOutput, FunctionComponent, JSXNode, DevJSX } from './render/jsx/types/jsx-node';
export type { QwikDOMAttributes, QwikJSX, QwikJSX as JSX } from './render/jsx/types/jsx-qwik';

export type { QwikIntrinsicElements } from './render/jsx/types/jsx-qwik-elements';
export type { QwikHTMLElements, QwikSVGElements } from './render/jsx/types/jsx-generated';
export { render2 as render } from './v2/client/dom-render';
export { getDomContainer, _getQContainerElement } from './v2/client/dom-container';
export type { RenderSSROptions, StreamWriter } from './render/ssr/render-ssr';
export type { RenderOptions, RenderResult } from './render/dom/render.public';

//////////////////////////////////////////////////////////////////////////////////////////
// use API
//////////////////////////////////////////////////////////////////////////////////////////
export { useLexicalScope } from './use/use-lexical-scope.public';
export { useStore } from './use/use-store.public';
export { untrack } from './use/use-core';
export { useId } from './use/use-id';
export { useContext, useContextProvider, createContextId } from './use/use-context';
export { useServerData } from './use/use-env-data';
export { useStylesQrl, useStyles$, useStylesScopedQrl, useStylesScoped$ } from './use/use-styles';
export { useOn, useOnDocument, useOnWindow } from './use/use-on';
export { useSignal, useConstant, createSignal } from './use/use-signal';
export { withLocale, getLocale } from './use/use-locale';

export type { UseStylesScoped } from './use/use-styles';
export type { UseSignal } from './use/use-signal';
export type { ContextId } from './use/use-context';
export type { UseStoreOptions } from './use/use-store.public';
export type {
  ComputedFn,
  EagernessOptions,
  OnVisibleTaskOptions,
  ResourceCtx,
  ResourceFn,
  ResourcePending,
  ResourceRejected,
  ResourceResolved,
  ResourceReturn,
  TaskCtx,
  TaskFn,
  Tracker,
  UseTaskOptions,
  VisibleTaskStrategy,
} from './use/use-task';
export type { ResourceProps, ResourceOptions } from './use/use-resource';
export { useResource$, useResourceQrl, Resource } from './use/use-resource';
export {
  useTaskQrl,
  useVisibleTaskQrl,
  useComputedQrl,
  // TODO
  // createComputedQrl,
} from './use/use-task';
export {
  useComputed$,
  useTask$,
  useVisibleTask$,
  // TODO
  // createComputed$
} from './use/use-task-dollar';
export { useErrorBoundary } from './use/use-error-boundary';
export type { ErrorBoundaryStore } from './render/error-handling';

//////////////////////////////////////////////////////////////////////////////////////////
// Developer Low-Level API
//////////////////////////////////////////////////////////////////////////////////////////
export type { ValueOrPromise } from './util/types';
export type { Signal, ReadonlySignal } from './state/signal';
export { type NoSerialize, SubscriptionType } from './state/common';
export { noSerialize } from './state/common';
export { isSignal } from './state/signal';
export { version } from './version';

//////////////////////////////////////////////////////////////////////////////////////////
// Qwik Events
//////////////////////////////////////////////////////////////////////////////////////////
export type {
  KnownEventNames,
  QwikSymbolEvent,
  QwikVisibleEvent,
  QwikIdleEvent,
  QwikInitEvent,
  // old
  NativeAnimationEvent,
  NativeClipboardEvent,
  NativeCompositionEvent,
  NativeDragEvent,
  NativeFocusEvent,
  NativeKeyboardEvent,
  NativeMouseEvent,
  NativePointerEvent,
  NativeTouchEvent,
  NativeTransitionEvent,
  NativeUIEvent,
  NativeWheelEvent,
  QwikAnimationEvent,
  QwikClipboardEvent,
  QwikCompositionEvent,
  QwikDragEvent,
  QwikPointerEvent,
  QwikFocusEvent,
  QwikSubmitEvent,
  QwikInvalidEvent,
  QwikChangeEvent,
  QwikKeyboardEvent,
  QwikMouseEvent,
  QwikTouchEvent,
  QwikUIEvent,
  QwikWheelEvent,
  QwikTransitionEvent,
} from './render/jsx/types/jsx-qwik-events';

//////////////////////////////////////////////////////////////////////////////////////////
// Components
//////////////////////////////////////////////////////////////////////////////////////////
export { PrefetchServiceWorker, PrefetchGraph } from './components/prefetch';

//////////////////////////////////////////////////////////////////////////////////////////
// INTERNAL
//////////////////////////////////////////////////////////////////////////////////////////
export * from './internal';
