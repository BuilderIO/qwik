import { createDocument } from '@builder.io/qwik/testing';
import { isPromise } from 'util/types';
import { beforeEach, describe, expect, it } from 'vitest';
import type { QRLInternal } from '../../qrl/qrl-class';
import type { QRL } from '../../qrl/qrl.public';
import type { VirtualElement } from '../../render/dom/virtual-element';
import { SubscriptionType, type Subscriber } from '../../state/common';
import { invoke, newInvokeContext } from '../../use/use-core';
import { Task } from '../../use/use-task';
import { implicit$FirstArg } from '../../util/implicit_dollar';
import { getDomContainer } from '../client/dom-container';
import { ChoreType } from '../shared/scheduler';
import type { Container2 } from '../shared/types';
import { createComputed2$, createSignal2 } from './v2-signal.public';
import type { ValueOrPromise } from '../../util/types';

describe('v2-signal', () => {
  const log: any[] = [];
  let container: Container2 = null!;
  beforeEach(() => {
    log.length = 0;
    const document = createDocument({ html: '<html><body q:container="paused"></body></html>' });
    container = getDomContainer(document.body);
  });

  describe('primitive', () => {
    it('basic read operation', async () => {
      await withScheduler(() => {
        const signal = createSignal2(123);
        expect(signal.value).toEqual(123);
      });
    });

    it('basic subscription operation', async () => {
      await withScheduler(async () => {
        const signal = createSignal2(123);
        expect(signal.value).toEqual(123);
        await effect$(() => log.push(signal.value));
        expect(log).toEqual([123]);
        signal.value++;
        expect(log).toEqual([123]);
        await flushSignals();
        expect(log).toEqual([123, 124]);
      });
    });
  });

  describe('computed', () => {
    it('basic subscription operation', async () => {
      await withScheduler(async () => {
        const a = createSignal2(2);
        const b = createSignal2(10);
        await retry(() => {
          const signal = createComputed2$(() => a.value + b.value);
          expect((signal as any).$untrackedValue$).not.toEqual(12);
          // This won't register a subscriber because there isn't any,
          // but it will update the value and store the container.
          expect(signal.value).toEqual(12);
          expect((signal as any).$untrackedValue$).toEqual(12);
          effect$(() => log.push(signal.value));
          expect(log).toEqual([12]);
          a.value++;
          b.value += 10;
          // effects must run async
          expect(log).toEqual([12]);
        });
        await flushSignals();
        expect(log).toEqual([12, 23]);
      });
    });
    // using .only because otherwise there's a function-not-the-same issue
    it.only('force', () =>
      withScheduler(async () => {
        const obj = { count: 0 };
        const signal = createComputed2$(() => {
          obj.count++;
          return obj;
        });
        expect(signal.value).toBe(obj);
        expect(obj.count).toBe(1);
        effect$(() => log.push(signal.value.count));
        await flushSignals();
        expect(log).toEqual([1]);
        expect(obj.count).toBe(1);
        // mark dirty but value remains shallow same after calc
        (signal as any).$isDirty$ = true;
        signal.value.count;
        await flushSignals();
        expect(log).toEqual([1]);
        expect(obj.count).toBe(2);
        // force recalculation+notify
        signal.force();
        await flushSignals();
        expect(log).toEqual([1, 3]);
      }));
  });
  ////////////////////////////////////////

  function withScheduler(fn: () => ValueOrPromise<void>) {
    const ctx = newInvokeContext();
    ctx.$container2$ = container;
    return invoke(ctx, fn);
  }

  function flushSignals() {
    console.log('flushSignals()');
    return container.$scheduler$(ChoreType.WAIT_FOR_ALL);
  }
});

async function effectQrl(fnQrl: QRL<() => void>) {
  const element: VirtualElement = null!;
  const task = new Task(0, 0, element, fnQrl as QRLInternal, undefined, null);
  const subscriber: Subscriber = [SubscriptionType.HOST, task] as any;
  const fn = (fnQrl as QRLInternal<() => void>).$resolveLazy$();
  if (isPromise(fn)) {
    throw fn;
  } else {
    const ctx = newInvokeContext();
    ctx.$subscriber$ = subscriber;
    invoke(ctx, fn);
  }
}

const effect$ = /*#__PURE__*/ implicit$FirstArg(effectQrl);

function retry(fn: () => void) {
  fn();
}
