import { parseQRL } from '../import/qrl';
import { isQrl, isSameQRL, QRLInternal } from '../import/qrl-class';
import { EMPTY_ARRAY } from '../util/flyweight';
import type { QContext } from './props';
import { isArray } from '../util/types';
import { $ } from '../import/qrl.public';

const ON_PROP_REGEX = /^(window:|document:|)on([A-Z]|-.).*\$$/;

export const isOnProp = (prop: string): boolean => {
  return ON_PROP_REGEX.test(prop);
};

export const addQRLListener = (
  ctx: QContext,
  prop: string,
  input: any
): QRLInternal<any>[] | undefined => {
  if (!input) {
    return undefined;
  }
  const value = isArray(input) ? input.map(ensureQrl) : ensureQrl(input);

  if (!ctx.$listeners$) {
    ctx.$listeners$ = new Map();
  }
  let existingListeners = ctx.$listeners$.get(prop);
  if (!existingListeners) {
    ctx.$listeners$.set(prop, (existingListeners = []));
  }
  const newQRLs = isArray(value) ? value : [value];
  for (const value of newQRLs) {
    const cp = value.$copy$();
    cp.$setContainer$(ctx.$element$);

    const capture = cp.$capture$;
    if (capture == null) {
      // we need to serialize the lexical scope references
      const captureRef = cp.$captureRef$;
      cp.$capture$ =
        captureRef && captureRef.length
          ? captureRef.map((ref) => String(addToArray(ctx.$refMap$, ref)))
          : EMPTY_ARRAY;
    }

    // Important we modify the array as it is cached.
    for (let i = 0; i < existingListeners.length; i++) {
      const qrl = existingListeners[i];
      if (isSameQRL(qrl as any, cp)) {
        existingListeners.splice(i, 1);
        i--;
      }
    }
    existingListeners.push(cp);
  }
  return existingListeners;
};

const addToArray = (array: any[], obj: any) => {
  const index = array.indexOf(obj);
  if (index === -1) {
    array.push(obj);
    return array.length - 1;
  }
  return index;
};

const ensureQrl = (value: any) => {
  return isQrl(value) ? value : ($(value) as QRLInternal);
};

export const getDomListeners = (el: Element): Map<string, QRLInternal[]> => {
  const attributes = el.attributes;
  const listeners: Map<string, QRLInternal[]> = new Map();
  for (let i = 0; i < attributes.length; i++) {
    const { name, value } = attributes.item(i)!;
    if (
      name.startsWith('on:') ||
      name.startsWith('on-window:') ||
      name.startsWith('on-document:')
    ) {
      let array = listeners.get(name);
      if (!array) {
        listeners.set(name, (array = []));
      }
      array.push(parseQRL(value, el));
    }
  }
  return listeners;
};
