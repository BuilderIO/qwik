/**
 * Scheduler is responsible for running application code in predictable order.
 *
 * ## What is a Chore?
 *
 * A Chore is a unit of work that needs to be done. It can be:
 *
 * - Task / Resource
 * - Visible Task
 * - Component
 * - Computed
 * - Node Diff
 *
 * ## Order of execution
 *
 * - Parent component chores should run before child component chores.
 * - Visible Tasks should run after journal flush (visible tasks often read DOM layout.)
 *
 * ## Example
 *
 * ```typescript
 * const Child = component$(() => {
 *   useTask$(() => {
 *     console.log('Child task');
 *   });
 *   useVisibleTask$(() => {
 *     console.log('Child visible-task');
 *   });
 *   console.log('Child render');
 *   return <div>Child</div>;
 * });
 *
 * const Parent = component$(() => {
 *   const count = useSignal(0);
 *   useTask$(() => {
 *     console.log('Parent task', count.value);
 *   });
 *   useVisibleTask$(() => {
 *     console.log('Parent visible-task', count.value);
 *     count.value++;
 *   });
 *   console.log('Parent render', count.value);
 *   return <Child/>;
 * });
 * ```
 *
 * ## In the above example, the order of execution is:
 *
 * 1. Parent task 0
 * 2. Parent render 0
 * 3. Child task 0
 * 4. Child render 0
 * 5. Journal flush
 * 6. Parent visible-task 0
 * 7. Parent render 1
 * 8. Journal flush
 * 9. Child visible-task
 *
 * If at any point a new chore is scheduled it will insert itself into the correct order.
 *
 * ## Implementation
 *
 * Chores are kept in a sorted array. When a new chore is scheduled it is inserted into the correct
 * location. Processing of the chores always starts from the beginning of the array. This ensures
 * that parent chores are processed before child chores.
 *
 * ## Sorting
 *
 * Chores are sorted in three levels:
 *
 * - Macro: beforeJournalFlush, journalFlush, afterJournalFlush
 * - Component: depth first order of components
 * - Micro: order of chores within a component.
 *
 * Example of sorting:
 *
 * - Tasks are beforeJournalFlush, than depth first on component and finally in declaration order
 *   within component.
 * - Visible Tasks are sorted afterJournalFlush, than depth first on component and finally in
 *   declaration order within component.
 */

import { assertEqual } from '../../error/assert';
import type { QRLInternal } from '../../qrl/qrl-class';
import type { QRL } from '../../qrl/qrl.public';
import type { JSXOutput } from '../../render/jsx/types/jsx-node';
import {
  Task,
  TaskFlags,
  cleanupTask,
  runComputed2,
  runSubscriber2,
  type TaskFn,
} from '../../use/use-task';
import { isPromise, maybeThen, maybeThenPassError, safeCall } from '../../util/promises';
import type { ValueOrPromise } from '../../util/types';
import type { VirtualVNode } from '../client/types';
import { vnode_documentPosition, vnode_isVNode } from '../client/vnode';
import { vnode_diff } from '../client/vnode-diff';
import { executeComponent2 } from './component-execution';
import type { Container2, HostElement, fixMeAny } from './types';

// Turn this on to get debug output of what the scheduler is doing.
const DEBUG: boolean = false;

export const enum ChoreType {
  /// MASKS defining three levels of sorting
  MACRO /* ***************** */ = 0b111_000,
  /* order of elements (not encoded here) */
  MICRO /* ***************** */ = 0b000_111,

  COMPUTED /* ************** */ = 0b000_001,
  RESOURCE /* ************** */ = 0b000_010,
  TASK /* ****************** */ = 0b000_011,
  NODE_DIFF /* ************* */ = 0b000_100,
  COMPONENT_SSR /* ********* */ = 0b000_101,
  COMPONENT /* ************* */ = 0b000_110,
  WAIT_FOR_COMPONENTS /* *** */ = 0b001_000,
  JOURNAL_FLUSH /* ********* */ = 0b011_000,
  VISIBLE /* *************** */ = 0b100_000,
  CLEANUP_VISIBLE /* ******* */ = 0b101_000,
  WAIT_FOR_ALL /* ********** */ = 0b111_111,
}

export interface Chore {
  $type$: ChoreType;
  $idx$: number | string;
  $host$: HostElement;
  $target$: HostElement | QRLInternal<(...args: unknown[]) => unknown> | null;
  $payload$: unknown;
  $resolve$: (value: any) => void;
  $promise$: Promise<any>;
  $returnValue$: any;
}

export type Scheduler = ReturnType<typeof createScheduler>;

export const createScheduler = (
  container: Container2,
  scheduleDrain: () => void,
  journalFlush: () => void
) => {
  const choreQueue: Chore[] = [];

  let currentChore: Chore | null = null;
  let journalFlushScheduled: boolean = false;

  return schedule;

  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////

  function schedule(type: ChoreType.JOURNAL_FLUSH): ValueOrPromise<void>;
  function schedule(type: ChoreType.WAIT_FOR_ALL): ValueOrPromise<void>;
  function schedule(type: ChoreType.WAIT_FOR_COMPONENTS): ValueOrPromise<void>;
  /**
   * Schedule rendering of a component.
   *
   * @param type
   * @param host - Host element where the component is being rendered.
   * @param qrl - QRL of the component to render.
   * @param props- Props to pass to the component.
   * @param waitForChore? = false
   */
  function schedule(type: ChoreType.TASK | ChoreType.VISIBLE, task: Task): ValueOrPromise<void>;
  function schedule(
    type: ChoreType.COMPONENT,
    host: HostElement,
    qrl: QRL<(...args: any[]) => any>,
    props: any
  ): ValueOrPromise<JSXOutput>;
  function schedule(
    type: ChoreType.COMPONENT_SSR,
    host: HostElement,
    qrl: QRL<(...args: any[]) => any>,
    props: any
  ): ValueOrPromise<JSXOutput>;
  function schedule(type: ChoreType.COMPUTED, task: Task): ValueOrPromise<void>;
  function schedule(
    type: ChoreType.NODE_DIFF,
    host: HostElement,
    target: HostElement,
    value: JSXOutput
  ): ValueOrPromise<void>;
  function schedule(type: ChoreType.CLEANUP_VISIBLE, task: Task): ValueOrPromise<JSXOutput>;
  ///// IMPLEMENTATION /////
  function schedule(
    type: ChoreType,
    hostOrTask: HostElement | Task = null!,
    targetOrQrl: HostElement | QRL<(...args: any[]) => any> | null = null,
    payload: any = null
  ): ValueOrPromise<any> {
    const runLater: boolean =
      type !== ChoreType.WAIT_FOR_ALL &&
      type !== ChoreType.WAIT_FOR_COMPONENTS &&
      type !== ChoreType.COMPONENT_SSR;
    const isTask =
      type === ChoreType.TASK ||
      type === ChoreType.VISIBLE ||
      type === ChoreType.COMPUTED ||
      type === ChoreType.CLEANUP_VISIBLE;
    if (isTask) {
      (hostOrTask as Task).$flags$ |= TaskFlags.DIRTY;
    }
    let chore: Chore = {
      $type$: type,
      $idx$: isTask ? (hostOrTask as Task).$index$ : 0,
      $host$: isTask ? ((hostOrTask as Task).$el$ as fixMeAny) : (hostOrTask as HostElement),
      $target$: targetOrQrl as any,
      $payload$: isTask ? hostOrTask : payload,
      $resolve$: null!,
      $promise$: null!,
      $returnValue$: null,
    };
    chore.$promise$ = new Promise((resolve) => (chore.$resolve$ = resolve));
    DEBUG && debugTrace('schedule', chore, currentChore, choreQueue);
    chore = sortedInsert(choreQueue, chore, choreComparator, choreUpdate);
    if (!journalFlushScheduled && runLater) {
      // If we are not currently draining, we need to schedule a drain.
      journalFlushScheduled = true;
      schedule(ChoreType.JOURNAL_FLUSH);
      scheduleDrain();
    }
    if (runLater) {
      return chore.$promise$;
    } else {
      return drainUpTo(chore);
    }
  }

  /**
   * Execute all of the chores up to and including the given chore.
   *
   * @param runUptoChore
   */
  function drainUpTo(runUptoChore: Chore): ValueOrPromise<unknown> {
    if (currentChore) {
      // Already running chore
      return runUptoChore.$promise$;
    }
    while (choreQueue.length) {
      const nextChore = choreQueue.shift()!;
      const comp = choreComparator(nextChore, runUptoChore);
      if (comp > 0) {
        // we have processed all of the chores up to the given chore.
        break;
      }
      const returnValue = executeChore(nextChore);
      if (isPromise(returnValue)) {
        return returnValue.then(() => drainUpTo(runUptoChore));
      }
    }
    return runUptoChore.$returnValue$;
  }

  function executeChore(chore: Chore): ValueOrPromise<any> {
    const host = chore.$host$;
    DEBUG && debugTrace('execute', chore, currentChore, choreQueue);
    assertEqual(currentChore, null, 'Chore already running.');
    currentChore = chore;
    let returnValue: ValueOrPromise<unknown> | unknown = null;
    switch (chore.$type$) {
      case ChoreType.JOURNAL_FLUSH:
        returnValue = journalFlush();
        journalFlushScheduled = false;
        break;
      case ChoreType.COMPONENT:
      case ChoreType.COMPONENT_SSR:
        returnValue = safeCall(
          () =>
            executeComponent2(
              container,
              host,
              host,
              chore.$target$ as fixMeAny,
              chore.$payload$ as fixMeAny
            ),
          (jsx) => {
            return chore.$type$ === ChoreType.COMPONENT
              ? maybeThen(container.processJsx(host, jsx), () => jsx)
              : jsx;
          },
          (err: any) => container.handleError(err, host)
        );
        break;
      case ChoreType.COMPUTED:
        returnValue = runComputed2(chore.$payload$ as Task<TaskFn, TaskFn>, container, host);
        break;
      case ChoreType.TASK:
      case ChoreType.VISIBLE:
        returnValue = runSubscriber2(chore.$payload$ as Task<TaskFn, TaskFn>, container, host);
        break;
      case ChoreType.CLEANUP_VISIBLE:
        const task = chore.$payload$ as Task<TaskFn, TaskFn>;
        cleanupTask(task);
        break;
      case ChoreType.NODE_DIFF: {
        const parentVirtualNode = chore.$target$ as VirtualVNode;
        const jsx = chore.$payload$ as JSXOutput;
        returnValue = vnode_diff(container as fixMeAny, jsx, parentVirtualNode, null);
        break;
      }
    }
    return maybeThenPassError(returnValue, (value) => {
      DEBUG && debugTrace('execute.DONE', null, currentChore, choreQueue);
      currentChore?.$resolve$?.(value);
      currentChore = null;
      return (chore.$returnValue$ = value);
    });
  }
};

export const hostElementPredicate = (aHost: HostElement, bHost: HostElement): number => {
  if (aHost === bHost) {
    return 0;
  } else {
    if (vnode_isVNode(aHost) && vnode_isVNode(bHost)) {
      // we are running on the client.
      return vnode_documentPosition(aHost, bHost);
    } else {
      // we are running on the server.
      // On server we can't schedule task for a different host!
      // Server is SSR, and therefore scheduling for anything but the current host
      // implies that things need to be re-run and that is not supported because of streaming.
      throw new Error(
        'SERVER: during HTML streaming, it is not possible to cause a re-run of tasks on a different host'
      );
    }
  }
};

const toNumber = (value: number | string): number => {
  return typeof value === 'number' ? value : -1;
};

/**
 * When a derived signal is update we need to run vnode_diff. However the signal can update multiple
 * times during component execution. For this reason it is necessary for us to update the schedule
 * work with the latest result of the signal.
 */
const choreUpdate = (existing: Chore, newChore: Chore): void => {
  if (existing.$type$ === ChoreType.NODE_DIFF) {
    existing.$payload$ = newChore.$payload$;
  }
};

export const choreComparator = (a: Chore, b: Chore): number => {
  const macroTypeDiff = (a.$type$ & ChoreType.MACRO) - (b.$type$ & ChoreType.MACRO);
  if (macroTypeDiff !== 0) {
    return macroTypeDiff;
  }

  // JOURNAL_FLUSH does not have a host or $idx$, so we can't compare it.
  if (a.$type$ !== ChoreType.JOURNAL_FLUSH) {
    const aHost = a.$host$;
    const bHost = b.$host$;
    if (aHost !== bHost) {
      if (vnode_isVNode(aHost) && vnode_isVNode(bHost)) {
        // we are running on the client.
        const hostDiff = vnode_documentPosition(aHost, bHost);
        if (hostDiff !== 0) {
          return hostDiff;
        }
      } else {
        // we are running on the server.
        // On server we can't schedule task for a different host!
        // Server is SSR, and therefore scheduling for anything but the current host
        // implies that things need to be re-run nad that is not supported because of streaming.
        throw new Error(
          'SERVER: during HTML streaming, it is not possible to cause a re-run of tasks on a different host'
        );
      }
    }

    const microTypeDiff = (a.$type$ & ChoreType.MICRO) - (b.$type$ & ChoreType.MICRO);
    if (microTypeDiff !== 0) {
      return microTypeDiff;
    }

    const idxDiff = toNumber(a.$idx$) - toNumber(b.$idx$);
    if (idxDiff !== 0) {
      return idxDiff;
    }
  }

  return 0;
};

export const intraHostPredicate = (a: Chore, b: Chore): number => {
  const idxDiff = toNumber(a.$idx$) - toNumber(b.$idx$);
  if (idxDiff !== 0) {
    return idxDiff;
  }
  const typeDiff = a.$type$ - b.$type$;
  if (typeDiff !== 0) {
    return typeDiff;
  }
  if (a.$payload$ !== b.$payload$) {
    return 0;
  }
  if (a.$payload$ instanceof Task && b.$payload$ instanceof Task) {
    const aHash = a.$payload$.$qrl$.$hash$;
    const bHash = b.$payload$.$qrl$.$hash$;
    return aHash === bHash ? 0 : aHash < bHash ? -1 : 1;
  }
  return 0;
};

function sortedFindIndex<T>(
  sortedArray: T[],
  value: T,
  comparator: (a: T, b: T) => number
): number {
  /// We need to ensure that the `queue` is sorted by priority.
  /// 1. Find a place where to insert into.
  let bottom = 0;
  let top = sortedArray.length;
  while (bottom < top) {
    const middle = bottom + ((top - bottom) >> 1);
    const midChore = sortedArray[middle];
    const comp = comparator(value, midChore);
    if (comp < 0) {
      top = middle;
    } else if (comp > 0) {
      bottom = middle + 1;
    } else {
      // We already have the host in the queue.
      return middle;
    }
  }
  return ~bottom;
}

function sortedInsert<T>(
  sortedArray: T[],
  value: T,
  comparator: (a: T, b: T) => number,
  updater?: (a: T, b: T) => void
): T {
  /// We need to ensure that the `queue` is sorted by priority.
  /// 1. Find a place where to insert into.
  const idx = sortedFindIndex(sortedArray, value, comparator);
  if (idx < 0) {
    /// 2. Insert the chore into the queue.
    sortedArray.splice(~idx, 0, value);
    return value;
  }
  const existing = sortedArray[idx];
  updater && updater(existing, value);
  return existing;
}

function debugChoreToString(chore: Chore): string {
  const type =
    (
      {
        [ChoreType.COMPUTED]: 'COMPUTED',
        [ChoreType.RESOURCE]: 'RESOURCE',
        [ChoreType.TASK]: 'TASK',
        [ChoreType.NODE_DIFF]: 'NODE_DIFF',
        [ChoreType.COMPONENT]: 'COMPONENT',
        [ChoreType.COMPONENT_SSR]: 'COMPONENT_SSR',
        [ChoreType.JOURNAL_FLUSH]: 'JOURNAL_FLUSH',
        [ChoreType.VISIBLE]: 'VISIBLE',
        [ChoreType.WAIT_FOR_ALL]: 'WAIT_FOR_ALL',
        [ChoreType.WAIT_FOR_COMPONENTS]: 'WAIT_FOR_COMPONENTS',
      } as any
    )[chore.$type$] || 'UNKNOWN: ' + chore.$type$;
  const host = String(chore.$host$).replaceAll(/\n.*/gim, '');
  return `Chore(${type} ${host} ${chore.$idx$})`;
}

function debugTrace(
  action: string,
  arg?: any | null,
  currentChore?: Chore | null,
  queue?: Chore[]
) {
  const lines = ['Scheduler: ' + action];
  if (arg) {
    lines.push(
      '    arg: ' +
        ('$type$' in arg ? debugChoreToString(arg as Chore) : String(arg).replaceAll(/\n.*/gim, ''))
    );
  }
  if (currentChore) {
    lines.push('running: ' + debugChoreToString(currentChore));
  }
  if (queue) {
    queue.forEach((chore, idx) => {
      lines.push((idx == 0 ? '  queue: ' : '         ') + debugChoreToString(chore));
    });
  }
  // eslint-disable-next-line no-console
  console.log(lines.join('\n  ') + '\n');
}
