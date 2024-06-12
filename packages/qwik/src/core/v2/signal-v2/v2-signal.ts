/**
 * @file
 *
 *   Signals come in two types:
 *
 *   1. `Signal` - A storage of data
 *   2. `ComputedSignal` - A signal which is computed from other signals.
 *
 *   ## Why is `ComputedSignal` different?
 *
 *   - It needs to store a function which needs to re-run.
 *   - It is `Readonly` because it is computed.
 */

import { assertDefined, assertFalse, assertTrue } from '../../error/assert';
import type { QRLInternal } from '../../qrl/qrl-class';
import type { QRL } from '../../qrl/qrl.public';
import { newInvokeContext, tryGetInvokeContext } from '../../use/use-core';
import { Task, isTask } from '../../use/use-task';
import { isPromise } from '../../util/promises';
import { qDev } from '../../util/qdev';
import type { VNode } from '../client/types';
import { ChoreType } from '../shared/scheduler';
import type { Container2 } from '../shared/types';
import type { Signal2 as ISignal2 } from './v2-signal.public';

const DEBUG = true;

/**
 * Special value used to mark that a given signal needs to be computed. This is essentially a
 * "marked as dirty" flag.
 */
const NEEDS_COMPUTATION: any = {
  __dirty__: true,
};

// eslint-disable-next-line no-console
const log = (...args: any[]) => console.log(...args);

export const createSignal2 = (value?: any) => {
  return new Signal2(value);
};

export const createComputedSignal2 = <T>(qrl: QRL<() => T>) => {
  return new ComputedSignal2(qrl as QRLInternal<() => T>);
};

export const isSignal2 = (value: any): value is ISignal2<unknown> => {
  return value instanceof Signal2;
};

class Signal2<T = any> implements ISignal2<T> {
  protected $untrackedValue$: T;

  /**
   * Store a list of effects which are dependent on this signal.
   *
   * An effect is work which needs to be done when the signal changes.
   *
   * 1. `Task` - A task which needs to be re-run. For example a `useTask` or `useResource`, etc...
   * 2. `VNode` - A component or Direct DOM update. (Look at the VNode attributes to determine if it is
   *    a Component or VNode signal target)
   * 3. `Signal2` - A derived signal which needs to be re-computed. A derived signal gets marked as
   *    dirty synchronously, but the computation is lazy.
   *
   * `Task` and `VNode` are leaves in a tree, where as `Signal2` is a node in a tree. When
   * processing a change in a signal, the leaves (`Task` and `VNode`) are scheduled for execution,
   * where as the Nodes (`Signal2`) are synchronously recursed into and marked as dirty.
   */
  // @wmertens: Question @mhevery: why null instead of not provided?
  protected $effects$: null | Set<Task | VNode | Signal2> = null;

  protected $container2$: Container2 | undefined;

  constructor(value: T) {
    this.$untrackedValue$ = value;
  }

  get untrackedValue() {
    return this.$untrackedValue$;
  }

  get value() {
    const ctx = tryGetInvokeContext();
    if (ctx) {
      if (!this.$container2$) {
        // Grab the container now we have access to it
        this.$container2$ = ctx.$container2$;
      }
      const subscriber = ctx.$subscriber$;
      if (subscriber) {
        let target: Signal2 | Task;
        if (subscriber instanceof ComputedSignal2) {
          // computed signal reading a signal
          target = subscriber;
        } else {
          target = subscriber[1] as Task;
          assertTrue(isTask(target), 'Invalid subscriber.');
        }
        const effects = (this.$effects$ ||= new Set());
        DEBUG &&
          !effects.has(target) &&
          log('Signal.subscribe', isSignal2(target) ? 'Signal2' : 'Task', String(target));
        effects.add(target);
      }
    }
    return this.untrackedValue;
  }

  set value(value) {
    if (value === this.untrackedValue) {
      return;
    }
    DEBUG &&
      log(
        'Signal.set',
        this.untrackedValue,
        '->',
        value,
        this.$effects$?.size,
        !!this.$container2$
      );
    this.$untrackedValue$ = value;
    this.$triggerEffects$();
  }

  // prevent accidental use as value
  valueOf() {
    if (qDev) {
      throw new TypeError('Cannot coerce a Signal, use `.value` instead');
    }
  }
  toString() {
    return `[Signal ${String(this.value)}]`;
  }
  toJSON() {
    return { value: this.value };
  }

  $triggerEffects$() {
    if (!(this.$effects$ && this.$container2$)) {
      return;
    }
    const scheduler = this.$container2$.$scheduler$;
    const scheduleEffect = (effect: VNode | Task | Signal2) => {
      DEBUG && log('       schedule.effect', String(effect));
      if (isTask(effect)) {
        scheduler(ChoreType.TASK, effect);
      } else if (effect instanceof ComputedSignal2) {
        // clear the computed signal and notify its subscribers
        effect.$markDirty$();
      } else {
        throw new Error('Not implemented');
      }
    };

    // Note, effects may not add new effects while this runs
    this.$effects$.forEach(scheduleEffect);
    this.$effects$.clear();
  }
}

class ComputedSignal2<T> extends Signal2<T> {
  /**
   * The compute function is stored here.
   *
   * The computed functions must be executed synchronously (because of this we need to eagerly
   * resolve the QRL during the mark dirty phase so that any call to it will be synchronous). )
   */
  $computeQrl$: QRLInternal<() => T>;
  // We need a separate flag so we know when a computation changed
  $isDirty$: boolean = true;

  constructor(computeTask: QRLInternal<() => T> | null) {
    assertDefined(computeTask, 'compute QRL must be provided');
    super(NEEDS_COMPUTATION);
    this.$computeQrl$ = computeTask;
  }

  /** Invalidate the current value */
  $markDirty$() {
    this.$isDirty$ = true;
    this.$triggerEffects$();
  }

  /**
   * Use this to force running subscribers, for example when the calculated value has mutated but
   * remained the same object
   */
  force() {
    this.$untrackedValue$ = NEEDS_COMPUTATION;
    this.$markDirty$();
  }

  $triggerEffects$(): void {
    if (this.$effects$?.size) {
      const qrl = this.$computeQrl$;
      if (!qrl.resolved) {
        const resolvedP = qrl.resolve();
        this.$container2$?.$scheduler$(ChoreType.QRL_RESOLVE, null, null, resolvedP);
      }
    }
    super.$triggerEffects$();
  }

  get untrackedValue() {
    if (this.$isDirty$) {
      const computeQrl = this.$computeQrl$;
      if (!computeQrl.resolved) {
        // rewind the render and wait for the promise to resolve.
        // Maybe we can let the optimizer hint required qrls
        throw computeQrl.resolve();
      }

      // TODO locale (ideally move to global state)
      const ctx = newInvokeContext();
      ctx.$subscriber$ = this as any;
      ctx.$container2$ = this.$container2$;
      const untrackedValue = computeQrl.getFn(ctx)() as T;

      assertFalse(isPromise(untrackedValue), 'Computed function must be synchronous.');
      DEBUG && log('Signal.computed', untrackedValue);
      this.$untrackedValue$ = untrackedValue;
      this.$isDirty$ = false;
    }
    return this.$untrackedValue$;
  }

  // Getters don't get inherited
  get value() {
    return super.value;
  }

  set value(_: any) {
    throw new TypeError('ComputedSignal is read-only');
  }
}

qDev &&
  (Signal2.prototype.toString = () => {
    return 'Signal2';
  });
qDev &&
  (ComputedSignal2.prototype.toString = () => {
    return 'ComputedSignal2';
  });
