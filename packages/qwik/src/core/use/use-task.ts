import { intToStr, strToInt, type ContainerState, type MustGetObjID } from '../container/container';
import { assertDefined, assertEqual } from '../error/assert';
import { QError_trackUseStore, codeToText } from '../error/error';
import { isServerPlatform } from '../platform/platform';
import { assertQrl, assertSignal, createQRL, type QRLInternal } from '../qrl/qrl-class';
import type { QRL } from '../qrl/qrl.public';
import { _hW, notifyTask } from '../render/dom/notify-render';
import type { QwikElement } from '../render/dom/virtual-element';
import { handleError } from '../render/error-handling';
import type { RenderContext } from '../render/types';
import {
  SubscriptionType,
  getSubscriptionManager,
  noSerialize,
  unwrapProxy,
  type NoSerialize,
} from '../state/common';
import { QObjectManagerSymbol } from '../state/constants';
import {
  QObjectSignalFlags,
  SIGNAL_IMMUTABLE,
  SIGNAL_UNASSIGNED,
  _createSignal,
  isSignal,
  type ReadonlySignal,
  type Signal,
  type SignalInternal,
} from '../state/signal';
import { logError, logErrorAndStop } from '../util/log';
import { ComputedEvent, TaskEvent } from '../util/markers';
import { delay, isPromise, maybeThen, safeCall } from '../util/promises';
import { isFunction, isObject, type ValueOrPromise } from '../util/types';
import { ChoreType } from '../v2/shared/scheduler';
import { isContainer2, type Container2, type HostElement, type fixMeAny } from '../v2/shared/types';
import { invoke, newInvokeContext, untrack, waitAndRun } from './use-core';
import { useOn, useOnDocument } from './use-on';
import { useSequentialScope } from './use-sequential-scope';

export const enum TaskFlags {
  VISIBLE_TASK = 1 << 0,
  TASK = 1 << 1,
  RESOURCE = 1 << 2,
  COMPUTED = 1 << 3,
  DIRTY = 1 << 4,
}

// <docs markdown="../readme.md#Tracker">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!!
// (edit ../readme.md#Tracker instead)
/**
 * Used to signal to Qwik which state should be watched for changes.
 *
 * The `Tracker` is passed into the `taskFn` of `useTask`. It is intended to be used to wrap state
 * objects in a read proxy which signals to Qwik which properties should be watched for changes. A
 * change to any of the properties causes the `taskFn` to rerun.
 *
 * ### Example
 *
 * The `obs` passed into the `taskFn` is used to mark `state.count` as a property of interest. Any
 * changes to the `state.count` property will cause the `taskFn` to rerun.
 *
 * ```tsx
 * const Cmp = component$(() => {
 *   const store = useStore({ count: 0, doubleCount: 0 });
 *   const signal = useSignal(0);
 *   useTask$(({ track }) => {
 *     // Any signals or stores accessed inside the task will be tracked
 *     const count = track(() => store.count);
 *     // You can also pass a signal to track() directly
 *     const signalCount = track(signal);
 *     store.doubleCount = count + signalCount;
 *   });
 *   return (
 *     <div>
 *       <span>
 *         {store.count} / {store.doubleCount}
 *       </span>
 *       <button
 *         onClick$={() => {
 *           store.count++;
 *           signal.value++;
 *         }}
 *       >
 *         +
 *       </button>
 *     </div>
 *   );
 * });
 * ```
 *
 * @public
 * @see `useTask`
 */
// </docs>
export interface Tracker {
  /**
   * Include the expression using stores / signals to track:
   *
   * ```tsx
   * track(() => store.count);
   * ```
   *
   * The `track()` function also returns the value of the scoped expression:
   *
   * ```tsx
   * const count = track(() => store.count);
   * ```
   */
  <T>(fn: () => T): T;

  /**
   * Used to track the whole object. If any property of the passed store changes, the task will be
   * scheduled to run. Also accepts signals.
   *
   * Note that the change tracking is not deep. If you want to track changes to nested properties,
   * you need to use `track` on each of them.
   *
   * ```tsx
   * track(store); // returns store
   * track(signal); // returns signal.value
   * ```
   */
  <T extends object>(obj: T): T extends Signal<infer U> ? U : T;

  /**
   * Used to track to track a specific property of an object.
   *
   * Note that the change tracking is not deep. If you want to track changes to nested properties,
   * you need to use `track` on each of them.
   *
   * ```tsx
   * track(store, 'propA'); // returns store.propA
   * ```
   */
  <T extends object, P extends keyof T>(obj: T, prop: P): T[P];
}

/** @public */
export interface TaskCtx {
  track: Tracker;
  cleanup(callback: () => void): void;
}

/** @public */
export interface ResourceCtx<T> {
  readonly track: Tracker;
  cleanup(callback: () => void): void;
  cache(policyOrMilliseconds: number | 'immutable'): void;
  readonly previous: T | undefined;
}

/** @public */
export type TaskFn = (ctx: TaskCtx) => ValueOrPromise<void | (() => void)>;

/** @public */
export type ComputedFn<T> = () => T;

/** @public */
export type ResourceFn<T> = (ctx: ResourceCtx<unknown>) => ValueOrPromise<T>;

/** @public */
export type ResourceReturn<T> = ResourcePending<T> | ResourceResolved<T> | ResourceRejected<T>;

/** @public */
export interface ResourcePending<T> {
  readonly value: Promise<T>;
  readonly loading: boolean;
}

/** @public */
export interface ResourceResolved<T> {
  readonly value: Promise<T>;
  readonly loading: boolean;
}

/** @public */
export interface ResourceRejected<T> {
  readonly value: Promise<T>;
  readonly loading: boolean;
}

export interface ResourceReturnInternal<T> {
  __brand: 'resource';
  _state: 'pending' | 'resolved' | 'rejected';
  _resolved: T | undefined;
  _error: Error | undefined;
  _cache: number;
  _timeout: number;
  value: Promise<T>;
  loading: boolean;
}
/** @public */
export interface DescriptorBase<T = unknown, B = unknown> {
  $qrl$: QRLInternal<T>;
  $el$: QwikElement;
  $flags$: number;
  $index$: number;
  $destroy$: NoSerialize<() => void> | null;
  $state$: B | undefined;
}

/** @public */
export type EagernessOptions = 'visible' | 'load' | 'idle';

/** @public */
export type VisibleTaskStrategy = 'intersection-observer' | 'document-ready' | 'document-idle';

/** @public */
export interface OnVisibleTaskOptions {
  /**
   * The strategy to use to determine when the "VisibleTask" should first execute.
   *
   * - `intersection-observer`: the task will first execute when the element is visible in the
   *   viewport, under the hood it uses the IntersectionObserver API.
   * - `document-ready`: the task will first execute when the document is ready, under the hood it
   *   uses the document `load` event.
   * - `document-idle`: the task will first execute when the document is idle, under the hood it uses
   *   the requestIdleCallback API.
   */
  strategy?: VisibleTaskStrategy;
}

/** @public */
export interface UseTaskOptions {
  /**
   * - `visible`: run the effect when the element is visible.
   * - `load`: eagerly run the effect when the application resumes.
   */
  eagerness?: EagernessOptions;
}

// <docs markdown="../readme.md#useTask">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!!
// (edit ../readme.md#useTask instead)
/**
 * Reruns the `taskFn` when the observed inputs change.
 *
 * Use `useTask` to observe changes on a set of inputs, and then re-execute the `taskFn` when those
 * inputs change.
 *
 * The `taskFn` only executes if the observed inputs change. To observe the inputs, use the `obs`
 * function to wrap property reads. This creates subscriptions that will trigger the `taskFn` to
 * rerun.
 *
 * @param task - Function which should be re-executed when changes to the inputs are detected
 * @public
 *
 * ### Example
 *
 * The `useTask` function is used to observe the `store.count` property. Any changes to the
 * `store.count` cause the `taskFn` to execute which in turn updates the `store.doubleCount` to
 * the double of `store.count`.
 *
 * ```tsx
 * const Cmp = component$(() => {
 *   const store = useStore({
 *     count: 0,
 *     doubleCount: 0,
 *     debounced: 0,
 *   });
 *
 *   // Double count task
 *   useTask$(({ track }) => {
 *     const count = track(() => store.count);
 *     store.doubleCount = 2 * count;
 *   });
 *
 *   // Debouncer task
 *   useTask$(({ track }) => {
 *     const doubleCount = track(() => store.doubleCount);
 *     const timer = setTimeout(() => {
 *       store.debounced = doubleCount;
 *     }, 2000);
 *     return () => {
 *       clearTimeout(timer);
 *     };
 *   });
 *   return (
 *     <div>
 *       <div>
 *         {store.count} / {store.doubleCount}
 *       </div>
 *       <div>{store.debounced}</div>
 *     </div>
 *   );
 * });
 * ```
 *
 * @public
 * @see `Tracker`
 */
// </docs>
export const useTaskQrl = (qrl: QRL<TaskFn>, opts?: UseTaskOptions): void => {
  const { val, set, iCtx, i, elCtx } = useSequentialScope<1 | Task>();
  if (val) {
    return;
  }
  assertQrl(qrl);
  set(1);

  if (iCtx.$container2$) {
    const host = iCtx.$hostElement$ as unknown as HostElement;
    const task = new Task(
      TaskFlags.DIRTY | TaskFlags.TASK,
      i,
      iCtx.$hostElement$,
      qrl,
      undefined,
      null
    );
    // In V2 we add the task to the sequential scope. We need to do this
    // in order to be able to retrieve it later when the parent element is
    // deleted and we need to be able to release the task subscriptions.
    set(task);
    const result = runTask2(task, iCtx.$container2$, host);
    if (isPromise(result)) {
      throw result;
    }
    qrl.$resolveLazy$(host as fixMeAny);
    if (isServerPlatform()) {
      useRunTask(task, opts?.eagerness);
    }
  } else {
    const containerState = iCtx.$renderCtx$.$static$.$containerState$;
    const task = new Task(
      TaskFlags.DIRTY | TaskFlags.TASK,
      i,
      elCtx.$element$,
      qrl,
      undefined,
      null
    );
    qrl.$resolveLazy$(containerState.$containerEl$);
    if (!elCtx.$tasks$) {
      elCtx.$tasks$ = [];
    }
    elCtx.$tasks$.push(task);
    waitAndRun(iCtx, () => runTask(task, containerState, iCtx.$renderCtx$));
    if (isServerPlatform()) {
      useRunTask(task, opts?.eagerness);
    }
  }
};

export const runTask2 = (
  task: TaskDescriptor | ComputedDescriptor<unknown>,
  container: Container2,
  host: HostElement
) => {
  task.$flags$ &= ~TaskFlags.DIRTY;
  const iCtx = newInvokeContext(container.$locale$, host as fixMeAny, undefined, TaskEvent);
  const taskFn = task.$qrl$.getFn(iCtx, () => {
    container.$subsManager$.$clearSub$(task);
  }) as TaskFn;

  const track: Tracker = (obj: (() => unknown) | object | Signal, prop?: string) => {
    if (isFunction(obj)) {
      const ctx = newInvokeContext();
      ctx.$subscriber$ = [SubscriptionType.HOST, task];
      return invoke(ctx, obj);
    }
    const manager = getSubscriptionManager(obj);
    if (manager) {
      manager.$addSub$([SubscriptionType.HOST, task], prop);
    } else {
      logErrorAndStop(codeToText(QError_trackUseStore), obj);
    }
    if (prop) {
      return (obj as Record<string, unknown>)[prop];
    } else if (isSignal(obj)) {
      return obj.value;
    } else {
      return obj;
    }
  };
  const handleError = (reason: unknown) => container.handleError(reason, host);
  let cleanupFns: (() => void)[] | null = null;
  const cleanup = (fn: () => void) => {
    if (typeof fn == 'function') {
      if (!cleanupFns) {
        cleanupFns = [];
        task.$destroy$ = noSerialize(() => {
          task.$destroy$ = null;
          cleanupFns!.forEach((fn) => {
            try {
              fn();
            } catch (err) {
              handleError(err);
            }
          });
        });
      }
      cleanupFns.push(fn);
    }
  };

  const taskApi: TaskCtx = { track, cleanup };
  cleanupTask(task);
  const result = safeCall(() => taskFn(taskApi), cleanup, handleError);
  return result;
};

export const runComputed2 = (
  task: TaskDescriptor | ComputedDescriptor<unknown>,
  container: Container2,
  host: HostElement
): ValueOrPromise<void> => {
  assertSignal(task.$state$);
  task.$flags$ &= ~TaskFlags.DIRTY;
  const iCtx = newInvokeContext(container.$locale$, host as fixMeAny, undefined, ComputedEvent);
  iCtx.$subscriber$ = [SubscriptionType.HOST, task];

  const taskFn = task.$qrl$.getFn(iCtx, () => {
    container.$subsManager$.$clearSub$(task);
  }) as ComputedFn<unknown>;

  const handleError = (reason: unknown) => container.handleError(reason, host);
  const result = safeCall(
    taskFn,
    (returnValue) =>
      untrack(() => {
        const signal = task.$state$! as SignalInternal<unknown>;
        signal[QObjectSignalFlags] &= ~SIGNAL_UNASSIGNED;
        signal.untrackedValue = returnValue;
        signal[QObjectManagerSymbol].$notifySubs$();
      }),
    handleError
  );
  return result;
};

interface ComputedQRL {
  <T>(qrl: QRL<ComputedFn<T>>): ReadonlySignal<Awaited<T>>;
}

/** @public */
export const useComputedQrl: ComputedQRL = <T>(qrl: QRL<ComputedFn<T>>): Signal<Awaited<T>> => {
  const { val, set, iCtx, i } = useSequentialScope<Signal<Awaited<T>>>();
  if (val) {
    return val;
  }
  assertQrl(qrl);

  const host = iCtx.$hostElement$ as unknown as HostElement;
  const signal = _createSignal(
    undefined as Awaited<T>,
    iCtx.$container2$.$subsManager$,
    SIGNAL_UNASSIGNED | SIGNAL_IMMUTABLE,
    undefined
  );
  const task = new Task(
    TaskFlags.DIRTY | TaskFlags.TASK | TaskFlags.COMPUTED,
    i,
    iCtx.$hostElement$,
    qrl,
    signal,
    null
  );
  set(signal);
  qrl.$resolveLazy$(host as fixMeAny);
  const result = runComputed2(task, iCtx.$container2$, host);
  if (isPromise(result)) {
    throw result;
  }
  return signal;
};


// <docs markdown="../readme.md#useVisibleTask">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!!
// (edit ../readme.md#useVisibleTask instead)
/**
 * ```tsx
 * const Timer = component$(() => {
 *   const store = useStore({
 *     count: 0,
 *   });
 *
 *   useVisibleTask$(() => {
 *     // Only runs in the client
 *     const timer = setInterval(() => {
 *       store.count++;
 *     }, 500);
 *     return () => {
 *       clearInterval(timer);
 *     };
 *   });
 *
 *   return <div>{store.count}</div>;
 * });
 * ```
 *
 * @public
 */
// </docs>
export const useVisibleTaskQrl = (qrl: QRL<TaskFn>, opts?: OnVisibleTaskOptions): void => {
  const { val, set, i, iCtx, elCtx } = useSequentialScope<Task<TaskFn>>();
  const eagerness = opts?.strategy ?? 'intersection-observer';
  if (val) {
    if (isServerPlatform()) {
      useRunTask(val, eagerness);
    }
    return;
  }
  assertQrl(qrl);

  if (iCtx.$container2$) {
    const task = new Task(TaskFlags.VISIBLE_TASK, i, iCtx.$hostElement$, qrl, undefined, null);
    set(task);
    useRunTask(task, eagerness);
    if (!isServerPlatform()) {
      qrl.$resolveLazy$(iCtx.$hostElement$ as fixMeAny);
      iCtx.$container2$.$scheduler$(
        task.$flags$ & TaskFlags.VISIBLE_TASK ? ChoreType.VISIBLE : ChoreType.TASK,
        task
      );
    }
  } else {
    const task = new Task(TaskFlags.VISIBLE_TASK, i, elCtx.$element$, qrl, undefined, null);
    const containerState = iCtx.$renderCtx$.$static$.$containerState$;
    if (!elCtx.$tasks$) {
      elCtx.$tasks$ = [];
    }
    elCtx.$tasks$.push(task);
    set(task);
    useRunTask(task, eagerness);
    if (!isServerPlatform()) {
      qrl.$resolveLazy$(containerState.$containerEl$);
      notifyTask(task, containerState);
    }
  }
};


export type TaskDescriptor = DescriptorBase<TaskFn>;

export interface ResourceDescriptor<T>
  extends DescriptorBase<ResourceFn<T>, ResourceReturnInternal<T>> {}

export interface ComputedDescriptor<T> extends DescriptorBase<ComputedFn<T>, Signal<T>> {}

export type SubscriberHost = QwikElement;

export type SubscriberEffect =
  | TaskDescriptor
  | ResourceDescriptor<unknown>
  | ComputedDescriptor<unknown>;

export const isResourceTask = (task: SubscriberEffect): task is ResourceDescriptor<unknown> => {
  return (task.$flags$ & TaskFlags.RESOURCE) !== 0;
};

export const isComputedTask = (task: SubscriberEffect): task is ComputedDescriptor<unknown> => {
  return (task.$flags$ & TaskFlags.COMPUTED) !== 0;
};
export const runSubscriber = async (
  task: SubscriberEffect,
  containerState: ContainerState,
  rCtx: RenderContext
) => {
  assertEqual(!!(task.$flags$ & TaskFlags.DIRTY), true, 'Resource is not dirty', task);
  if (isResourceTask(task)) {
    return runResource(task, containerState, rCtx);
  } else if (isComputedTask(task)) {
    return runComputed(task, containerState, rCtx);
  } else {
    return runTask(task, containerState, rCtx);
  }
};

export const runSubscriber2 = async (
  task: SubscriberEffect,
  container: Container2,
  host: HostElement
) => {
  assertEqual(!!(task.$flags$ & TaskFlags.DIRTY), true, 'Task is not dirty', task);
  if (isResourceTask(task)) {
    return runResource(task, container, host as fixMeAny);
  } else if (isComputedTask(task)) {
    return runComputed2(task, container, host);
  } else {
    return runTask2(task, container, host);
  }
};

export const runResource = <T>(
  task: ResourceDescriptor<T>,
  containerState: ContainerState | Container2,
  rCtx: RenderContext,
  waitOn?: Promise<unknown>
): ValueOrPromise<void> => {
  task.$flags$ &= ~TaskFlags.DIRTY;
  cleanupTask(task);

  const el = task.$el$;
  const locale = isContainer2(containerState) ? containerState.$locale$ : rCtx.$static$.$locale$;
  const iCtx = newInvokeContext(locale, el, undefined, TaskEvent);
  const { $subsManager$: subsManager } = containerState;
  iCtx.$renderCtx$ = rCtx;
  const taskFn = task.$qrl$.getFn(iCtx, () => {
    subsManager.$clearSub$(task);
  });

  const cleanups: (() => void)[] = [];
  const resource = task.$state$;
  assertDefined(
    resource,
    'useResource: when running a resource, "task.r" must be a defined.',
    task
  );

  const track: Tracker = (obj: (() => unknown) | object | Signal, prop?: string) => {
    if (isFunction(obj)) {
      const ctx = newInvokeContext();
      ctx.$renderCtx$ = rCtx;
      ctx.$subscriber$ = [SubscriptionType.HOST, task];
      return invoke(ctx, obj);
    }
    const manager = getSubscriptionManager(obj);
    if (manager) {
      manager.$addSub$([SubscriptionType.HOST, task], prop);
    } else {
      logErrorAndStop(codeToText(QError_trackUseStore), obj);
    }
    if (prop) {
      return (obj as Record<string, unknown>)[prop];
    } else if (isSignal(obj)) {
      return obj.value;
    } else {
      return obj;
    }
  };
  const resourceTarget = unwrapProxy(resource);
  const opts: ResourceCtx<T> = {
    track,
    cleanup(callback) {
      cleanups.push(callback);
    },
    cache(policy) {
      let milliseconds = 0;
      if (policy === 'immutable') {
        milliseconds = Infinity;
      } else {
        milliseconds = policy;
      }
      resource._cache = milliseconds;
    },
    previous: resourceTarget._resolved,
  };

  let resolve: (v: T) => void;
  let reject: (v: unknown) => void;
  let done = false;

  const setState = (resolved: boolean, value: T | Error) => {
    if (!done) {
      done = true;
      if (resolved) {
        done = true;
        resource.loading = false;
        resource._state = 'resolved';
        resource._resolved = value as T;
        resource._error = undefined;

        resolve(value as T);
      } else {
        done = true;
        resource.loading = false;
        resource._state = 'rejected';
        resource._error = value as Error;
        reject(value as Error);
      }
      return true;
    }
    return false;
  };

  // Execute mutation inside empty invocation
  invoke(iCtx, () => {
    resource._state = 'pending';
    resource.loading = !isServerPlatform();
    const promise = (resource.value = new Promise((r, re) => {
      resolve = r;
      reject = re;
    }));
    promise.catch(ignoreErrorToPreventNodeFromCrashing);
  });

  task.$destroy$ = noSerialize(() => {
    done = true;
    cleanups.forEach((fn) => fn());
  });

  const promise = safeCall(
    () => maybeThen(waitOn, () => taskFn(opts)),
    (value) => {
      setState(true, value);
    },
    (reason) => {
      setState(false, reason);
    }
  );

  const timeout = resourceTarget._timeout;
  if (timeout > 0) {
    return Promise.race([
      promise,
      delay(timeout).then(() => {
        if (setState(false, new Error('timeout'))) {
          cleanupTask(task);
        }
      }),
    ]);
  }
  return promise;
};

const ignoreErrorToPreventNodeFromCrashing = (err: unknown) => {
  // ignore error to prevent node from crashing
  // node will crash in promise is rejected and no one is listening to the rejection.
};

export const runTask = (
  task: TaskDescriptor | ComputedDescriptor<unknown>,
  containerState: ContainerState,
  rCtx: RenderContext
): ValueOrPromise<void> => {
  task.$flags$ &= ~TaskFlags.DIRTY;

  cleanupTask(task);
  const hostElement = task.$el$;
  const iCtx = newInvokeContext(rCtx.$static$.$locale$, hostElement, undefined, TaskEvent);
  iCtx.$renderCtx$ = rCtx;
  const { $subsManager$: subsManager } = containerState;
  const taskFn = task.$qrl$.getFn(iCtx, () => {
    subsManager.$clearSub$(task);
  }) as TaskFn;
  const track: Tracker = (obj: (() => unknown) | object | Signal, prop?: string) => {
    if (isFunction(obj)) {
      const ctx = newInvokeContext();
      ctx.$subscriber$ = [SubscriptionType.HOST, task];
      return invoke(ctx, obj);
    }
    const manager = getSubscriptionManager(obj);
    if (manager) {
      manager.$addSub$([SubscriptionType.HOST, task], prop);
    } else {
      logErrorAndStop(codeToText(QError_trackUseStore), obj);
    }
    if (prop) {
      return (obj as Record<string, unknown>)[prop];
    } else if (isSignal(obj)) {
      return obj.value;
    } else {
      return obj;
    }
  };
  const cleanups: (() => void)[] = [];
  task.$destroy$ = noSerialize(() => {
    cleanups.forEach((fn) => fn());
  });

  const opts: TaskCtx = {
    track,
    cleanup(callback) {
      cleanups.push(callback);
    },
  };
  return safeCall(
    () => taskFn(opts),
    (returnValue) => {
      if (isFunction(returnValue)) {
        cleanups.push(returnValue);
      }
    },
    (reason) => {
      handleError(reason, hostElement, rCtx.$static$.$containerState$);
    }
  );
};

export const runComputed = (
  task: ComputedDescriptor<unknown>,
  containerState: ContainerState,
  rCtx: RenderContext
): ValueOrPromise<void> => {
  assertSignal(task.$state$);
  task.$flags$ &= ~TaskFlags.DIRTY;
  cleanupTask(task);
  const hostElement = task.$el$;
  const iCtx = newInvokeContext(rCtx.$static$.$locale$, hostElement, undefined, ComputedEvent);
  iCtx.$subscriber$ = [SubscriptionType.HOST, task];
  iCtx.$renderCtx$ = rCtx;

  const { $subsManager$: subsManager } = containerState;
  const taskFn = task.$qrl$.getFn(iCtx, () => {
    subsManager.$clearSub$(task);
  }) as ComputedFn<unknown>;

  return safeCall(
    taskFn,
    (returnValue) =>
      untrack(() => {
        const signal = task.$state$! as SignalInternal<unknown>;
        signal[QObjectSignalFlags] &= ~SIGNAL_UNASSIGNED;
        signal.untrackedValue = returnValue;
        signal[QObjectManagerSymbol].$notifySubs$();
      }),
    (reason) => {
      handleError(reason, hostElement, rCtx.$static$.$containerState$);
    }
  );
};

export const cleanupTask = (task: SubscriberEffect) => {
  const destroy = task.$destroy$;
  if (destroy) {
    task.$destroy$ = null;
    try {
      destroy();
    } catch (err) {
      logError(err);
    }
  }
};

const useRunTask = (
  task: SubscriberEffect,
  eagerness: VisibleTaskStrategy | EagernessOptions | undefined
) => {
  if (eagerness === 'visible' || eagerness === 'intersection-observer') {
    useOn('qvisible', getTaskHandlerQrl(task));
  } else if (eagerness === 'load' || eagerness === 'document-ready') {
    useOnDocument('qinit', getTaskHandlerQrl(task));
  } else if (eagerness === 'idle' || eagerness === 'document-idle') {
    useOnDocument('qidle', getTaskHandlerQrl(task));
  }
};

const getTaskHandlerQrl = (task: SubscriberEffect): QRL<(ev: Event) => void> => {
  const taskQrl = task.$qrl$;
  const taskHandler = createQRL<(ev: Event) => void>(
    taskQrl.$chunk$,
    '_hW',
    _hW,
    null,
    null,
    [task],
    taskQrl.$symbol$
  );
  return taskHandler;
};

export const isSubscriberDescriptor = (obj: unknown): obj is SubscriberEffect => {
  return isObject(obj) && obj instanceof Task;
};

export const serializeTask = (task: SubscriberEffect, getObjId: MustGetObjID) => {
  let value = `${intToStr(task.$flags$)} ${intToStr(task.$index$)} ${getObjId(
    task.$qrl$
  )} ${getObjId(task.$el$)}`;
  if (task.$state$) {
    value += ` ${getObjId(task.$state$)}`;
  }
  return value;
};

export const parseTask = (data: string) => {
  const [flags, index, qrl, el, resource] = data.split(' ');
  return new Task(strToInt(flags), strToInt(index), el as any, qrl as any, resource as any, null);
};

export class Task<T = unknown, B = T> implements DescriptorBase<unknown, Signal<B>> {
  constructor(
    public $flags$: number,
    public $index$: number,
    public $el$: QwikElement,
    public $qrl$: QRLInternal<T>,
    public $state$: Signal<B> | undefined,
    public $destroy$: NoSerialize<() => void> | null
  ) {}
}

export const isTask = (value: any): value is Task => {
  return value instanceof Task;
};
