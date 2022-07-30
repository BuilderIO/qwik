import { assertDefined } from '../assert/assert';
import { QContainerAttr, QHostAttr } from '../util/markers';
import {
  createRenderContext,
  executeContextWithSlots,
  printRenderStats,
  RenderContext,
} from './cursor';
import { getContext, QContext, resumeIfNeeded } from '../props/props';
import { qDev, qTest } from '../util/qdev';
import { getPlatform } from '../platform/platform';
import { getDocument } from '../util/dom';
import { renderComponent } from './render-component';
import { logError, logWarn } from '../util/log';
import { getContainer } from '../use/use-core';
import {
  runSubscriber,
  SubscriberDescriptor,
  WatchFlagsIsDirty,
  WatchFlagsIsEffect,
  WatchFlagsIsResource,
  WatchFlagsIsWatch,
} from '../use/use-watch';
import { createSubscriptionManager, ObjToProxyMap, SubscriptionManager } from '../object/q-object';
import { then } from '../util/promises';
import type { ValueOrPromise } from '../util/types';
import type { CorePlatform } from '../platform/types';
import { codeToText, QError_errorWhileRendering } from '../error/error';
import { directGetAttribute } from './fast-calls';
import { useLexicalScope } from '../use/use-lexical-scope.public';
import type { Subscriber } from '../use/use-subscriber';
import { isElement } from '../util/element';

/**
 * @alpha
 */
export interface ContainerState {
  $containerEl$: Element;

  $proxyMap$: ObjToProxyMap;
  $subsManager$: SubscriptionManager;
  $platform$: CorePlatform;

  $watchNext$: Set<SubscriberDescriptor>;
  $watchStaging$: Set<SubscriberDescriptor>;

  $hostsNext$: Set<Element>;
  $hostsStaging$: Set<Element>;
  $hostsRendering$: Set<Element> | undefined;
  $renderPromise$: Promise<RenderContext> | undefined;

  $userContext$: Record<string, any>;
  $elementIndex$: number;

  $contexts$: QContext[];
  $stylesIds$: Set<string>;
}

const CONTAINER_STATE = Symbol('ContainerState');

export const getContainerState = (containerEl: Element): ContainerState => {
  let set = (containerEl as any)[CONTAINER_STATE] as ContainerState;
  if (!set) {
    (containerEl as any)[CONTAINER_STATE] = set = {
      $containerEl$: containerEl,

      $proxyMap$: new WeakMap(),
      $subsManager$: createSubscriptionManager(),
      $platform$: getPlatform(containerEl),

      $watchNext$: new Set(),
      $watchStaging$: new Set(),

      $hostsNext$: new Set(),
      $hostsStaging$: new Set(),
      $renderPromise$: undefined,
      $hostsRendering$: undefined,

      $userContext$: {},
      $elementIndex$: 0,

      $contexts$: [],
      $stylesIds$: new Set(),
    };
  }
  return set;
};

export const notifyChange = (subscriber: Subscriber) => {
  if (isElement(subscriber)) {
    notifyRender(subscriber);
  } else {
    notifyWatch(subscriber);
  }
};

/**
 * Mark component for rendering.
 *
 * Use `notifyRender` method to mark a component for rendering at some later point in time.
 * This method uses `getPlatform(doc).queueRender` for scheduling of the rendering. The
 * default implementation of the method is to use `requestAnimationFrame` to do actual rendering.
 *
 * The method is intended to coalesce multiple calls into `notifyRender` into a single call for
 * rendering.
 *
 * @param hostElement - Host-element of the component to re-render.
 * @returns A promise which is resolved when the component has been rendered.
 * @public
 */
const notifyRender = (hostElement: Element): void => {
  assertDefined(
    directGetAttribute(hostElement, QHostAttr),
    'render: notified element must be a component',
    hostElement
  );

  const containerEl = getContainer(hostElement);
  assertDefined(containerEl, 'render: host element need to be inside a q:container', hostElement);

  const state = getContainerState(containerEl);
  if (
    qDev &&
    !qTest &&
    state.$platform$.isServer &&
    directGetAttribute(containerEl, QContainerAttr) === 'paused'
  ) {
    logWarn('Can not rerender in server platform');
    return undefined;
  }
  resumeIfNeeded(containerEl);

  const ctx = getContext(hostElement);
  assertDefined(
    ctx.$renderQrl$,
    `render: notified host element must have a defined $renderQrl$`,
    ctx
  );

  if (ctx.$dirty$) {
    return;
  }
  ctx.$dirty$ = true;
  const activeRendering = state.$hostsRendering$ !== undefined;
  if (activeRendering) {
    assertDefined(
      state.$renderPromise$,
      'render: while rendering, $renderPromise$ must be defined',
      state
    );
    state.$hostsStaging$.add(hostElement);
  } else {
    state.$hostsNext$.add(hostElement);
    scheduleFrame(state);
  }
};

const notifyWatch = (watch: SubscriberDescriptor) => {
  if (watch.$flags$ & WatchFlagsIsDirty) {
    return;
  }
  watch.$flags$ |= WatchFlagsIsDirty;

  const containerEl = getContainer(watch.$el$)!;
  const state = getContainerState(containerEl);
  const activeRendering = state.$hostsRendering$ !== undefined;
  if (activeRendering) {
    assertDefined(
      state.$renderPromise$,
      'render: while rendering, $renderPromise$ must be defined',
      state
    );
    state.$watchStaging$.add(watch);
  } else {
    state.$watchNext$.add(watch);
    scheduleFrame(state);
  }
};

const scheduleFrame = (containerState: ContainerState): Promise<RenderContext> => {
  if (containerState.$renderPromise$ === undefined) {
    containerState.$renderPromise$ = containerState.$platform$.nextTick(() =>
      renderMarked(containerState)
    );
  }
  return containerState.$renderPromise$;
};

/**
 * Low-level API used by the Optimizer to process `useWatch$()` API. This method
 * is not intended to be used by developers.
 * @alpha
 */
export const handleWatch = () => {
  const [watch] = useLexicalScope();
  notifyWatch(watch);
};

const renderMarked = async (containerState: ContainerState): Promise<RenderContext> => {
  const hostsRendering = (containerState.$hostsRendering$ = new Set(containerState.$hostsNext$));
  containerState.$hostsNext$.clear();
  await executeWatchesBefore(containerState);

  containerState.$hostsStaging$.forEach((host) => {
    hostsRendering.add(host);
  });
  containerState.$hostsStaging$.clear();

  const doc = getDocument(containerState.$containerEl$);
  const platform = containerState.$platform$;
  const renderingQueue = Array.from(hostsRendering);
  sortNodes(renderingQueue);

  const ctx = createRenderContext(doc, containerState);

  for (const el of renderingQueue) {
    if (!ctx.$hostElements$.has(el)) {
      ctx.$roots$.push(el);
      try {
        await renderComponent(ctx, getContext(el));
      } catch (e) {
        logError(codeToText(QError_errorWhileRendering), e);
      }
    }
  }

  // Early exist, no dom operations
  if (ctx.$operations$.length === 0) {
    printRenderStats(ctx);
    postRendering(containerState, ctx);
    return ctx;
  }

  return platform.raf(() => {
    executeContextWithSlots(ctx);
    printRenderStats(ctx);
    postRendering(containerState, ctx);
    return ctx;
  });
};

export const postRendering = async (containerState: ContainerState, ctx: RenderContext) => {
  await executeWatchesAfter(containerState, (watch, stage) => {
    if ((watch.$flags$ & WatchFlagsIsEffect) === 0) {
      return false;
    }
    if (stage) {
      return ctx.$hostElements$.has(watch.$el$);
    }
    return true;
  });

  // Clear staging
  containerState.$hostsStaging$.forEach((el) => {
    containerState.$hostsNext$.add(el);
  });
  containerState.$hostsStaging$.clear();

  containerState.$hostsRendering$ = undefined;
  containerState.$renderPromise$ = undefined;

  if (containerState.$hostsNext$.size + containerState.$watchNext$.size > 0) {
    scheduleFrame(containerState);
  }
};

const executeWatchesBefore = async (containerState: ContainerState) => {
  const resourcesPromises: ValueOrPromise<SubscriberDescriptor>[] = [];
  const watchPromises: ValueOrPromise<SubscriberDescriptor>[] = [];
  const isWatch = (watch: SubscriberDescriptor) => (watch.$flags$ & WatchFlagsIsWatch) !== 0;
  const isResourceWatch = (watch: SubscriberDescriptor) =>
    (watch.$flags$ & WatchFlagsIsResource) !== 0;

  containerState.$watchNext$.forEach((watch) => {
    if (isWatch(watch)) {
      watchPromises.push(then(watch.$qrl$.$resolveLazy$(watch.$el$), () => watch));
      containerState.$watchNext$.delete(watch);
    }
    if (isResourceWatch(watch)) {
      resourcesPromises.push(then(watch.$qrl$.$resolveLazy$(watch.$el$), () => watch));
      containerState.$watchNext$.delete(watch);
    }
  });
  do {
    // Run staging effected
    containerState.$watchStaging$.forEach((watch) => {
      if (isWatch(watch)) {
        watchPromises.push(then(watch.$qrl$.$resolveLazy$(watch.$el$), () => watch));
      } else if (isResourceWatch(watch)) {
        resourcesPromises.push(then(watch.$qrl$.$resolveLazy$(watch.$el$), () => watch));
      } else {
        containerState.$watchNext$.add(watch);
      }
    });

    containerState.$watchStaging$.clear();

    // Wait for all promises
    if (watchPromises.length > 0) {
      const watches = await Promise.all(watchPromises);
      sortWatches(watches);
      await Promise.all(
        watches.map((watch) => {
          return runSubscriber(watch, containerState);
        })
      );
      watchPromises.length = 0;
    }
  } while (containerState.$watchStaging$.size > 0);

  if (resourcesPromises.length > 0) {
    const resources = await Promise.all(resourcesPromises);
    sortWatches(resources);
    resources.forEach((watch) => runSubscriber(watch, containerState));
  }
};

const executeWatchesAfter = async (
  containerState: ContainerState,
  watchPred: (watch: SubscriberDescriptor, staging: boolean) => boolean
) => {
  const watchPromises: ValueOrPromise<SubscriberDescriptor>[] = [];

  containerState.$watchNext$.forEach((watch) => {
    if (watchPred(watch, false)) {
      watchPromises.push(then(watch.$qrl$.$resolveLazy$(watch.$el$), () => watch));
      containerState.$watchNext$.delete(watch);
    }
  });
  do {
    // Run staging effected
    containerState.$watchStaging$.forEach((watch) => {
      if (watchPred(watch, true)) {
        watchPromises.push(then(watch.$qrl$.$resolveLazy$(watch.$el$), () => watch));
      } else {
        containerState.$watchNext$.add(watch);
      }
    });
    containerState.$watchStaging$.clear();

    // Wait for all promises
    if (watchPromises.length > 0) {
      const watches = await Promise.all(watchPromises);
      sortWatches(watches);
      await Promise.all(
        watches.map((watch) => {
          return runSubscriber(watch, containerState);
        })
      );
      watchPromises.length = 0;
    }
  } while (containerState.$watchStaging$.size > 0);
};

const sortNodes = (elements: Element[]) => {
  elements.sort((a, b) => (a.compareDocumentPosition(b) & 2 ? 1 : -1));
};

const sortWatches = (watches: SubscriberDescriptor[]) => {
  watches.sort((a, b) => {
    if (a.$el$ === b.$el$) {
      return a.$index$ < b.$index$ ? -1 : 1;
    }
    return (a.$el$.compareDocumentPosition(b.$el$) & 2) !== 0 ? 1 : -1;
  });
};
