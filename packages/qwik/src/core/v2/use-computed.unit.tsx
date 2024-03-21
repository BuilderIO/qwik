import { describe, expect, it } from 'vitest';
import { trigger } from '../../testing/element-fixture';
import { component$, useSignal, useStore, useComputed$ } from '@builder.io/qwik';
import { domRender, ssrRenderToDom } from './rendering.unit-util';
import './vdom-diff.unit-util';

const debug = false; //true;
Error.stackTraceLimit = 100;

[
  ssrRenderToDom, //
  domRender, //
].forEach((render) => {
  describe(render.name + 'useComputed', () => {
    it('should update value based on signal', async () => {
      const DoubleCounter = component$((props: { initial: number }) => {
        const count = useSignal(props.initial);
        const doubleCount = useComputed$(() => count.value * 2);
        return (
          <button onClick$={() => count.value++}>
            Double count: {doubleCount.value}! {count.value}
          </button>
        );
      });

      const { vNode, container } = await render(<DoubleCounter initial={123} />, { debug });
      expect(vNode).toMatchVDOM(
        <>
          <button>
            Double count: {'246'}! {'123'}
          </button>
        </>
      );
      await trigger(container.element, 'button', 'click');
      expect(vNode).toMatchVDOM(
        <>
          <button>
            Double count: {'248'}! {'124'}
          </button>
        </>
      );
    });

    it('should update value based on another computed', async () => {
      const QuadrupleCounter = component$((props: { initial: number }) => {
        const count = useSignal(props.initial);
        const doubleCount = useComputed$(() => count.value * 2);
        const quadrupleCount = useComputed$(() => doubleCount.value * 2);
        return (
          <button onClick$={() => count.value++}>Double count: {quadrupleCount.value}!</button>
        );
      });

      const { vNode, container } = await render(<QuadrupleCounter initial={123} />, { debug });
      expect(vNode).toMatchVDOM(
        <>
          <button>Double count: {'492'}!</button>
        </>
      );
      await trigger(container.element, 'button', 'click');
      expect(vNode).toMatchVDOM(
        <>
          <button>Double count: {'496'}!</button>
        </>
      );
    });

    it('should not rerun if there are no signal dependencies', async () => {
      globalThis.runCount = 0;
      const DoubleCounter = component$((props: { initial: number }) => {
        const count = props.initial;
        const doubleCount = useComputed$(() => {
          globalThis.runCount++;
          return count * 2;
        });
        return (
          <button onClick$={() => (count as any)++}>Double count: {doubleCount.value}!</button>
        );
      });

      const { vNode, container } = await render(<DoubleCounter initial={123} />, { debug });
      expect(vNode).toMatchVDOM(
        <>
          <button>Double count: {'246'}!</button>
        </>
      );
      expect(globalThis.runCount).toBe(1);
      await trigger(container.element, 'button', 'click');
      expect(vNode).toMatchVDOM(
        <>
          <button>Double count: {'246'}!</button>
        </>
      );
      expect(globalThis.runCount).toBe(1);
    });

    it('should not rerun if value did not change', async () => {
      globalThis.runCount = 0;
      const DoubleCounter = component$(() => {
        const count = useSignal(1);
        const doubleCount = useComputed$(() => {
          globalThis.runCount++;
          return count.value * 2;
        });
        return (
          <button onClick$={() => (count.value = 1)}>Double count: {doubleCount.value}!</button>
        );
      });

      const { vNode, container } = await render(<DoubleCounter />, { debug });
      expect(vNode).toMatchVDOM(
        <>
          <button>Double count: {'2'}!</button>
        </>
      );
      expect(globalThis.runCount).toBe(1);
      await trigger(container.element, 'button', 'click');
      expect(vNode).toMatchVDOM(
        <>
          <button>Double count: {'2'}!</button>
        </>
      );
      expect(globalThis.runCount).toBe(1);
    });

    it('should allow return signal inside computed', async () => {
      const Counter = component$(() => {
        const foo = useSignal(1);
        const count = useComputed$(() => foo);
        return <button onClick$={() => count.value.value++}>Count: {count.value.value}!</button>;
      });

      const { vNode, container } = await render(<Counter />, { debug });
      expect(vNode).toMatchVDOM(
        <>
          <button>Count: {'1'}!</button>
        </>
      );
      await trigger(container.element, 'button', 'click');
      expect(vNode).toMatchVDOM(
        <>
          <button>Count: {'2'}!</button>
        </>
      );
    });

    it('#4979 - should work with inner computed', async () => {
      const InnerComponent = component$((props: { value: number }) => {
        const foo = useComputed$(() => props.value);
        return <div>{JSON.stringify(foo.value)}</div>;
      });

      const OuterComponent = component$(() => {
        const count = useSignal(123);
        return (
          <>
            <button onClick$={() => (count.value += 1)}>Next</button>
            {[count.value].map((o) => (
              <InnerComponent key={o} value={o} />
            ))}
          </>
        );
      });

      const { vNode } = await render(<OuterComponent />, { debug });
      expect(vNode).toMatchVDOM(
        <>
          <>
            <button>Next</button>
            <>
              <div>{'123'}</div>
            </>
          </>
        </>
      );
    });

    it.skip('#3294 - improvement(after v2): should lazily evaluate the function with useSignal', async () => {
      let useComputedCount = 0;
      const Issue3294 = component$(() => {
        const firstName = useSignal('Misko');
        const lastName = useSignal('Hevery');
        const execFirstUseComputed = useSignal(true);
        const firstUseComputed = useComputed$(() => {
          useComputedCount++;
          return lastName.value + ' ' + firstName.value;
        });
        const secondUseComputed = useComputed$(() => {
          useComputedCount++;
          return firstName.value + ' ' + lastName.value;
        });
        return (
          <div>
            {execFirstUseComputed.value ? (
              <span>{firstUseComputed.value}</span>
            ) : (
              <span>{secondUseComputed.value}</span>
            )}
          </div>
        );
      });

      const { vNode } = await render(<Issue3294 />, { debug });
      expect(vNode).toMatchVDOM(
        <>
          <div>
            <span>Hevery Misko</span>
          </div>
        </>
      );
      expect(useComputedCount).toBe(1);
    });

    it.skip('#3294 - improvement(after v2): should lazily evaluate the function with store', async () => {
      let useComputedCount = 0;
      const Issue3294 = component$(() => {
        const store = useStore({ firstName: 'Misko', lastName: 'Hevery' });
        const execFirstUseComputed = useSignal(true);
        const firstUseComputed = useComputed$(() => {
          useComputedCount++;
          return store.lastName + ' ' + store.firstName;
        });
        const secondUseComputed = useComputed$(() => {
          useComputedCount++;
          return store.firstName + ' ' + store.lastName;
        });
        return (
          <div>
            {execFirstUseComputed.value ? (
              <span>{firstUseComputed.value}</span>
            ) : (
              <span>{secondUseComputed.value}</span>
            )}
          </div>
        );
      });

      const { vNode } = await render(<Issue3294 />, { debug });
      expect(vNode).toMatchVDOM(
        <>
          <div>
            <span>Hevery Misko</span>
          </div>
        </>
      );
      expect(useComputedCount).toBe(1);
    });
  });
});
