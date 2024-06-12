import type { OnRenderFn } from '../component/component.public';
import type { ContainerState, GetObjID, GetObject } from '../container/container';
import { canSerialize } from '../container/serializers';
import { assertDefined, assertFail, assertTrue } from '../error/assert';
import { QError_verifySerializable, qError } from '../error/error';
import type { QRL } from '../qrl/qrl.public';
import { notifyChange } from '../render/dom/notify-render';
import type { QwikElement } from '../render/dom/virtual-element';
import { serializeAttribute } from '../render/execute-component';
import { trackSignal } from '../use/use-core';
import {
  TaskFlags,
  isComputedTask,
  isSubscriberDescriptor,
  isTask,
  type SubscriberEffect,
  type SubscriberHost,
  type Task,
} from '../use/use-task';
import { isNode } from '../util/element';
import { logError, throwErrorAndStop } from '../util/log';
import { ELEMENT_PROPS, OnRenderProp } from '../util/markers';
import { isPromise } from '../util/promises';
import { seal } from '../util/qdev';
import { isArray, isFunction, isObject, isSerializableObject } from '../util/types';
import type { DomContainer } from '../v2/client/dom-container';
import { ElementVNodeProps, type VNode, type VirtualVNode } from '../v2/client/types';
import { VNodeJournalOpCode, vnode_setAttr } from '../v2/client/vnode';
import { ChoreType } from '../v2/shared/scheduler';
import { isContainer2, type fixMeAny } from '../v2/shared/types';
import { isSignal2 } from '../v2/signal-v2/v2-signal';
import { QObjectFlagsSymbol, QObjectManagerSymbol, QObjectTargetSymbol } from './constants';
import { tryGetContext } from './context';
import type { Signal } from './signal';

/**
 * Top level manager of subscriptions (singleton, attached to DOM Container).
 *
 * Use the `SubscriptionManager` to create a new `LocalSubscriptionManager` for tracking
 * subscriptions.
 */
export interface SubscriptionManager {
  /** Map of all subscriptions from `Group` to their respective managers. */
  $groupToManagers$: GroupToManagersMap;
  $createManager$(map?: Subscriptions[]): LocalSubscriptionManager;
  $clearSub$: (group: Group) => void;
  $clearSignal$: (signal: SubscriberSignal) => void;
}

export type QObject<T extends {}> = T & { __brand__: 'QObject' };

export type TargetType = Record<string | symbol, any>;

/** @internal */
export const verifySerializable = <T>(value: T, preMessage?: string): T => {
  const seen = new Set();
  return _verifySerializable(value, seen, '_', preMessage);
};

const _verifySerializable = <T>(value: T, seen: Set<any>, ctx: string, preMessage?: string): T => {
  const unwrapped = unwrapProxy(value);
  if (unwrapped == null) {
    return value;
  }
  if (shouldSerialize(unwrapped)) {
    if (seen.has(unwrapped)) {
      return value;
    }
    seen.add(unwrapped);
    if (isSignal2(unwrapped)) {
      return value;
    }
    if (canSerialize(unwrapped)) {
      return value;
    }
    const typeObj = typeof unwrapped;
    switch (typeObj) {
      case 'object':
        if (isPromise(unwrapped)) {
          return value;
        }
        if (isNode(unwrapped)) {
          return value;
        }
        if (isArray(unwrapped)) {
          let expectIndex = 0;
          // Make sure the array has no holes
          unwrapped.forEach((v, i) => {
            if (i !== expectIndex) {
              throw qError(QError_verifySerializable, unwrapped);
            }
            _verifySerializable(v, seen, ctx + '[' + i + ']');
            expectIndex = i + 1;
          });
          return value;
        }
        if (isSerializableObject(unwrapped)) {
          for (const [key, item] of Object.entries(unwrapped)) {
            _verifySerializable(item, seen, ctx + '.' + key);
          }
          return value;
        }
        break;
      case 'boolean':
      case 'string':
      case 'number':
        return value;
    }
    let message = '';
    if (preMessage) {
      message = preMessage;
    } else {
      message = 'Value cannot be serialized';
    }
    if (ctx !== '_') {
      message += ` in ${ctx},`;
    }
    if (typeObj === 'object') {
      message += ` because it's an instance of "${value?.constructor.name}". You might need to use 'noSerialize()' or use an object literal instead. Check out https://qwik.dev/docs/advanced/dollar/`;
    } else if (typeObj === 'function') {
      const fnName = (value as Function).name;
      message += ` because it's a function named "${fnName}". You might need to convert it to a QRL using $(fn):\n\nconst ${fnName} = $(${String(
        value
      )});\n\nPlease check out https://qwik.dev/docs/advanced/qrl/ for more information.`;
    }
    console.error('Trying to serialize', value);
    throwErrorAndStop(message);
  }
  return value;
};
const noSerializeSet = /*#__PURE__*/ new WeakSet<object>();
const weakSerializeSet = /*#__PURE__*/ new WeakSet<object>();

export const shouldSerialize = (obj: unknown): boolean => {
  if (isObject(obj) || isFunction(obj)) {
    return !noSerializeSet.has(obj);
  }
  return true;
};

export const fastSkipSerialize = (obj: object): boolean => {
  return noSerializeSet.has(obj);
};

export const fastWeakSerialize = (obj: object): boolean => {
  return weakSerializeSet.has(obj);
};

/**
 * Returned type of the `noSerialize()` function. It will be TYPE or undefined.
 *
 * @public
 * @see noSerialize
 */
export type NoSerialize<T> = (T & { __no_serialize__: true }) | undefined;

// <docs markdown="../readme.md#noSerialize">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!!
// (edit ../readme.md#noSerialize instead)
/**
 * Marks a property on a store as non-serializable.
 *
 * At times it is necessary to store values on a store that are non-serializable. Normally this is a
 * runtime error as Store wants to eagerly report when a non-serializable property is assigned to
 * it.
 *
 * You can use `noSerialize()` to mark a value as non-serializable. The value is persisted in the
 * Store but does not survive serialization. The implication is that when your application is
 * resumed, the value of this object will be `undefined`. You will be responsible for recovering
 * from this.
 *
 * See: [noSerialize Tutorial](http://qwik.dev/tutorial/store/no-serialize)
 *
 * @public
 */
// </docs>
export const noSerialize = <T extends object | undefined>(input: T): NoSerialize<T> => {
  if (input != null) {
    noSerializeSet.add(input);
  }
  return input as any;
};

/** @internal */
export const _weakSerialize = <T extends object>(input: T): Partial<T> => {
  weakSerializeSet.add(input);
  return input as any;
};

export const isConnected = (sub: SubscriberEffect | SubscriberHost): boolean => {
  if (isSubscriberDescriptor(sub)) {
    return isConnected(sub.$el$);
  } else {
    return !!tryGetContext(sub) || sub.isConnected;
  }
};

/** @public */
export const unwrapProxy = <T>(proxy: T): T => {
  return isObject(proxy) ? getProxyTarget<any>(proxy) ?? proxy : proxy;
};

export const getProxyTarget = <T extends object>(obj: T): T | undefined => {
  return (obj as any)[QObjectTargetSymbol];
};

export const getSubscriptionManager = (obj: object): LocalSubscriptionManager | undefined => {
  return (obj as any)[QObjectManagerSymbol];
};

export const getProxyFlags = <T = object>(obj: T): number | undefined => {
  return (obj as any)[QObjectFlagsSymbol];
};

/** @internal */
export const enum SubscriptionType {
  HOST = 0,
  PROP_IMMUTABLE = 1,
  PROP_MUTABLE = 2,
  TEXT_IMMUTABLE = 3,
  TEXT_MUTABLE = 4,
}

export const enum SubscriptionProp {
  TYPE = 0,
  HOST = 1,
  SIGNAL = 2,
  ELEMENT = 3,
  ELEMENT_PROP = 4,
  STYLE_ID = 5,
}

/** Used with: Host (component) or Task */
type HostSubscriber = readonly [
  type: SubscriptionType.HOST,
  host: SubscriberEffect | SubscriberHost,
];

/** Used with derived signal on property: `<div prop={signal}>` */
type PropSubscriber = readonly [
  type: SubscriptionType.PROP_IMMUTABLE | SubscriptionType.PROP_MUTABLE,
  host: SubscriberHost,
  signal: Signal, // Derived Signal
  elm: QwikElement,
  elementProperty: string,
  styleScopedId: string | undefined,
];

/** Used with derived signal on text node: `<span>{signal}</span>` */
export type TextSubscriber = readonly [
  type: SubscriptionType.TEXT_IMMUTABLE | SubscriptionType.TEXT_MUTABLE,
  host: SubscriberHost | Text,
  signal: Signal, // Derived Signal
  elm: Node | QwikElement,
];

export type Subscriber = HostSubscriber | PropSubscriber | TextSubscriber;

type HostSubscriberWithKey = [...HostSubscriber, key: string | undefined];
type PropSubscriberWithKey = [...PropSubscriber, key: string | undefined];
type TextSubscriberWithKey = [...TextSubscriber, key: string | undefined];

export type SubscriberSignal = PropSubscriberWithKey | TextSubscriberWithKey;

export type Subscriptions = HostSubscriberWithKey | SubscriberSignal;

type Group = SubscriberEffect | SubscriberHost | Node;

export type GroupToManagersMap = Map<Group, LocalSubscriptionManager[]>;

export const serializeSubscription = (sub: Subscriptions, getObjId: GetObjID) => {
  const type = sub[SubscriptionProp.TYPE];
  const host =
    typeof sub[SubscriptionProp.HOST] === 'string'
      ? sub[SubscriptionProp.HOST]
      : getObjId(sub[SubscriptionProp.HOST]);
  if (!host) {
    return undefined;
  }
  let base = type + ' ' + host;
  let key: string | undefined;
  if (type === SubscriptionType.HOST) {
    key = sub[SubscriptionProp.SIGNAL];
  } else {
    const signalID = getObjId(sub[SubscriptionProp.SIGNAL]);
    if (!signalID) {
      return undefined;
    }
    if (type <= SubscriptionType.PROP_MUTABLE) {
      key = sub[SubscriptionProp.ELEMENT_PROP];
      base += ` ${signalID} ${must(getObjId(sub[SubscriptionProp.ELEMENT]))} ${
        sub[SubscriptionProp.ELEMENT_PROP]
      }`;
    } else if (type <= SubscriptionType.TEXT_MUTABLE) {
      key =
        sub.length > SubscriptionProp.ELEMENT_PROP ? sub[SubscriptionProp.ELEMENT_PROP] : undefined;
      const nodeID =
        typeof sub[SubscriptionProp.ELEMENT] === 'string'
          ? sub[SubscriptionProp.ELEMENT]
          : must(getObjId(sub[SubscriptionProp.ELEMENT]));
      base += ` ${signalID} ${nodeID}`;
    } else {
      assertFail('Should not get here: ' + type);
    }
  }
  if (key) {
    base += ` ${encodeURI(key)}`;
  }
  return base;
};

export const parseSubscription = (sub: string, getObject: GetObject): Subscriptions | undefined => {
  const parts = sub.split(' ');
  const type = parseInt(parts[0], 10);
  assertTrue(parts.length >= 2, 'At least 2 parts');
  const host = getObject(parts[1]);
  if (!host) {
    return undefined;
  }
  if (isSubscriberDescriptor(host) && !host.$el$) {
    return undefined;
  }
  if (type === SubscriptionType.HOST) {
    assertTrue(parts.length <= 3, 'Max 3 parts');
    return [type, host, parts.length === 3 ? safeDecode(parts[2]) : undefined];
  } else if (type <= 2) {
    assertTrue(parts.length === 6 || parts.length === 7, 'Type B has 5');
    return [
      type as SubscriptionType.PROP_IMMUTABLE,
      host,
      getObject(parts[2]),
      getObject(parts[3]),
      parts[4],
      safeDecode(parts[5]),
      safeDecode(parts[6]),
    ];
  }
  assertTrue(type <= 4 && (parts.length === 4 || parts.length === 5), 'Type C has 4');
  return [
    type as SubscriptionType.TEXT_IMMUTABLE,
    host,
    getObject(parts[2]),
    getObject(parts[3]),
    safeDecode(parts[4]),
  ];
};

const safeDecode = (str: string | undefined) => {
  if (str !== undefined) {
    return decodeURI(str);
  }
  return undefined;
};

export const createSubscriptionManager = (containerState: ContainerState): SubscriptionManager => {
  const groupToManagers: GroupToManagersMap = new Map();
  const manager: SubscriptionManager = {
    $groupToManagers$: groupToManagers,
    $createManager$: (initialMap?: Subscriptions[]) => {
      return new LocalSubscriptionManager(groupToManagers, containerState, initialMap);
    },
    $clearSub$: (group: Group) => {
      const managers = groupToManagers.get(group);
      if (managers) {
        for (const manager of managers) {
          manager.$unsubGroup$(group);
        }
        groupToManagers.delete(group);
        managers.length = 0;
      }
    },
    $clearSignal$: (signal: SubscriberSignal) => {
      const managers = groupToManagers.get(signal[SubscriptionProp.HOST]);
      if (managers) {
        for (const manager of managers) {
          manager.$unsubEntry$(signal);
        }
      }
    },
  };
  seal(manager);
  return manager;
};

export class LocalSubscriptionManager {
  readonly $subs$: Subscriptions[];

  constructor(
    private $groupToManagers$: GroupToManagersMap,
    private $containerState$: ContainerState,
    initialMap?: Subscriptions[]
  ) {
    this.$subs$ = [];

    if (initialMap) {
      this.$addSubs$(initialMap);
    }
    seal(this);
  }

  $addSubs$(subs: Subscriptions[]) {
    this.$subs$.push(...subs);
    for (const sub of this.$subs$) {
      this.$addToGroup$(sub[SubscriptionProp.HOST], this);
    }
  }

  $addToGroup$(group: Group, manager: LocalSubscriptionManager) {
    let managers = this.$groupToManagers$.get(group);
    if (!managers) {
      this.$groupToManagers$.set(group, (managers = []));
    }
    if (!managers.includes(manager)) {
      managers.push(manager);
    }
  }

  $unsubGroup$(group: Group) {
    const subs = this.$subs$;
    for (let i = 0; i < subs.length; i++) {
      const found = subs[i][SubscriptionProp.HOST] === group;
      if (found) {
        subs.splice(i, 1);
        i--;
      }
    }
  }

  $unsubEntry$(entry: SubscriberSignal) {
    const [type, group, signal, elm] = entry;
    const subs = this.$subs$;
    if (type === SubscriptionType.PROP_IMMUTABLE || type === SubscriptionType.PROP_MUTABLE) {
      const prop = entry[SubscriptionProp.ELEMENT_PROP];
      for (let i = 0; i < subs.length; i++) {
        const sub = subs[i];
        const match =
          sub[SubscriptionProp.TYPE] === type &&
          sub[SubscriptionProp.HOST] === group &&
          sub[SubscriptionProp.SIGNAL] === signal &&
          sub[SubscriptionProp.ELEMENT] === elm &&
          sub[SubscriptionProp.ELEMENT_PROP] === prop;
        if (match) {
          subs.splice(i, 1);
          i--;
        }
      }
    } else if (type === SubscriptionType.TEXT_IMMUTABLE || type === SubscriptionType.TEXT_MUTABLE) {
      for (let i = 0; i < subs.length; i++) {
        const sub = subs[i];
        const match =
          sub[SubscriptionProp.TYPE] === type &&
          sub[SubscriptionProp.HOST] === group &&
          sub[SubscriptionProp.SIGNAL] === signal &&
          sub[SubscriptionProp.ELEMENT] === elm;
        if (match) {
          subs.splice(i, 1);
          i--;
        }
      }
    }
  }

  $addSub$(sub: Subscriber, key?: string) {
    const subs = this.$subs$;
    const group = sub[SubscriptionProp.HOST];
    if (
      sub[SubscriptionProp.TYPE] === SubscriptionType.HOST &&
      subs.some(
        ([_type, _group, _key]) =>
          _type === SubscriptionType.HOST && _group === group && _key === key
      )
    ) {
      return;
    }
    subs.push((__lastSubscription = [...sub, key] as fixMeAny));
    this.$addToGroup$(group, this);
  }

  $notifySubs$(key?: string | undefined) {
    // TODO(HACK): we are resubscribing to the signal, so we are removing a sub, we need to iterate over a copy of subs
    const subs = [...this.$subs$];

    for (const sub of subs) {
      const compare = sub[sub.length - 1];
      if (key && compare && compare !== key) {
        continue;
      }
      if (isContainer2(this.$containerState$)) {
        const type = sub[SubscriptionProp.TYPE];
        const host = sub[SubscriptionProp.HOST];
        const scheduler = this.$containerState$.$scheduler$;
        if (type == SubscriptionType.HOST) {
          if (isTask(host)) {
            if (isComputedTask(host)) {
              scheduler(ChoreType.COMPUTED, host);
            } else {
              const task = host as Task;
              scheduler(
                task.$flags$ & TaskFlags.VISIBLE_TASK ? ChoreType.VISIBLE : ChoreType.TASK,
                task
              );
            }
          } else {
            const componentQrl = this.$containerState$.getHostProp<QRL<OnRenderFn<any>>>(
              host as fixMeAny,
              OnRenderProp
            )!;
            assertDefined(componentQrl, 'No Component found at this location');
            const componentProps = this.$containerState$.getHostProp<any>(
              host as fixMeAny,
              ELEMENT_PROPS
            );
            scheduler(ChoreType.COMPONENT, host as fixMeAny, componentQrl, componentProps);
          }
        } else {
          const signal = sub[SubscriptionProp.SIGNAL];
          /**
           * TODO(HACK): we need to resubscribe to the value. Example:
           *
           * ```
           * component$(() => {
           *  const first = useSignal('');
           *  const second = useSignal('');
           *
           *  return (
           *  <>
           *     <button
           *       onClick$={() => {
           *         first.value = 'foo';
           *         second.value = 'foo';
           *       }}
           *     ></button>
           *     <div>
           *       {first.value && second.value && first.value === second.value ? 'equal' : 'not-equal'}
           *      </div>
           *   </>
           *  );
           * });
           * ```
           *
           * If the first value is falsy then the `second.value` is never executing, so the
           * subscription is not created.
           */
          this.$containerState$.$subsManager$.$clearSignal$(sub);
          const value = trackSignal<fixMeAny>(signal, sub as fixMeAny);
          // end HACK

          if (type == SubscriptionType.PROP_IMMUTABLE || type == SubscriptionType.PROP_MUTABLE) {
            const target = sub[SubscriptionProp.ELEMENT] as fixMeAny as VirtualVNode;
            const propKey = sub[SubscriptionProp.ELEMENT_PROP];
            const styleScopedId = sub[SubscriptionProp.STYLE_ID];
            updateNodeProp(
              this.$containerState$ as fixMeAny as DomContainer,
              styleScopedId || null,
              target,
              propKey,
              // untrack(() => signal.value),
              value,
              type == SubscriptionType.PROP_IMMUTABLE
            );
          } else {
            scheduler(
              ChoreType.NODE_DIFF,
              host as fixMeAny,
              sub[SubscriptionProp.ELEMENT] as fixMeAny,
              // untrack(() => signal.value)
              value
            );
          }
        }
      } else {
        notifyChange(sub, this.$containerState$);
      }
    }
  }
}

function updateNodeProp(
  container: DomContainer,
  styleScopedId: string | null,
  target: VNode,
  propKey: string,
  propValue: any,
  immutable: boolean
) {
  let value = propValue;

  value = serializeAttribute(propKey, value, styleScopedId);

  if (!immutable) {
    vnode_setAttr(container.$journal$, target, propKey, value);
  } else {
    // the immutable attr/prop should not be saved into vnode props, so just push to the journal
    const element = target[ElementVNodeProps.element] as Element;
    container.$journal$.push(VNodeJournalOpCode.SetAttribute, element, propKey, value);
  }
  container.$scheduler$(ChoreType.JOURNAL_FLUSH);
}

let __lastSubscription: Subscriptions | undefined;

export function getLastSubscription(): Subscriptions | undefined {
  // HACK(misko): This is a hack to get the last subscription.
  // It is used by `executeSignalOperation` to update the target element
  // after the subscription has been created.
  return __lastSubscription;
}

const must = <T>(a: T): NonNullable<T> => {
  if (a == null) {
    throw logError('must be non null', a);
  }
  return a;
};
