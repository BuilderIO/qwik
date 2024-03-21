import { inflateQrl, parseQRL } from '../qrl/qrl';
import { assertQrl, isQrl, type QRLInternal } from '../qrl/qrl-class';
import { dollar } from '../qrl/qrl.public';
import { isArray } from '../util/types';
import { assertTrue } from '../error/assert';
import { EMPTY_ARRAY } from '../util/flyweight';
import { qRuntimeQrl, qSerialize } from '../util/qdev';
import { fromCamelToKebabCase } from '../util/case';
import type { QContext } from './context';
import type { PossibleEvents } from '../use/use-core';

const ON_PROP_REGEX = /^(on|window:|document:)/;

/** A QRL that will be called when the event occurs */
export type Listener = [
  eventName: string,
  qrl: QRLInternal<(event: PossibleEvents, elem?: Element) => any>,
];

export const PREVENT_DEFAULT = 'preventdefault:';

export const isOnProp = (prop: string): boolean => {
  return prop.endsWith('$') && ON_PROP_REGEX.test(prop);
};

export const groupListeners = (listeners: Listener[]): Readonly<[string, Listener[1][]][]> => {
  if (listeners.length === 0) {
    return EMPTY_ARRAY as any;
  }
  if (listeners.length === 1) {
    const listener = listeners[0];
    return [[listener[0], [listener[1]]]];
  }

  const keys: string[] = [];
  for (let i = 0; i < listeners.length; i++) {
    const eventName = listeners[i][0];
    if (!keys.includes(eventName)) {
      keys.push(eventName);
    }
  }
  return keys.map((eventName) => {
    return [eventName, listeners.filter((l) => l[0] === eventName).map((a) => a[1])];
  });
};

export const setEvent = (
  existingListeners: Listener[],
  prop: string,
  input: any,
  containerEl: Element | undefined
) => {
  assertTrue(prop.endsWith('$'), 'render: event property does not end with $', prop);
  prop = normalizeOnProp(prop.slice(0, -1));
  if (input) {
    if (isArray(input)) {
      const processed = input
        .flat(Infinity)
        .filter((q) => q != null)
        .map((q) => [prop, ensureQrl(q, containerEl)] as Listener);
      existingListeners.push(...processed);
    } else {
      existingListeners.push([prop, ensureQrl(input, containerEl)]);
    }
  }
  return prop;
};

const PREFIXES = ['on', 'window:on', 'document:on'];
const SCOPED = ['on', 'on-window', 'on-document'];

export const normalizeOnProp = (prop: string) => {
  let scope = 'on';
  for (let i = 0; i < PREFIXES.length; i++) {
    const prefix = PREFIXES[i];
    if (prop.startsWith(prefix)) {
      scope = SCOPED[i];
      prop = prop.slice(prefix.length);
      break;
    }
  }
  if (prop.startsWith('-')) {
    prop = fromCamelToKebabCase(prop.slice(1));
  } else {
    prop = prop.toLowerCase();
  }
  return scope + ':' + prop;
};

const ensureQrl = <T = unknown>(value: any, containerEl: Element | undefined) => {
  if (qSerialize && !qRuntimeQrl) {
    assertQrl<T>(value);
    value.$setContainer$(containerEl);
    return value;
  }
  const qrl = isQrl<T>(value) ? value : (dollar(value) as QRLInternal<T>);
  qrl.$setContainer$(containerEl);
  return qrl;
};

export const getDomListeners = (elCtx: QContext, containerEl: Element): Listener[] => {
  const attributes = (elCtx.$element$ as Element).attributes;
  const listeners: Listener[] = [];
  for (let i = 0; i < attributes.length; i++) {
    const { name, value } = attributes.item(i)!;
    if (
      name.startsWith('on:') ||
      name.startsWith('on-window:') ||
      name.startsWith('on-document:')
    ) {
      const urls = value.split('\n');
      for (const url of urls) {
        const qrl = parseQRL(url, containerEl) as Listener[1];
        if (qrl.$capture$) {
          inflateQrl(qrl, elCtx);
        }
        listeners.push([name, qrl]);
      }
    }
  }
  return listeners;
};
