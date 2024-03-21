import { describe, expect, it } from 'vitest';
import { trigger } from '../../testing/element-fixture';
import {
  $,
  component$,
  useOn,
  useOnDocument,
  useOnWindow,
  useSignal,
  useVisibleTask$,
} from '@builder.io/qwik';
import { domRender, ssrRenderToDom } from './rendering.unit-util';
import './vdom-diff.unit-util';

const debug = false; //true;
Error.stackTraceLimit = 100;

[
  ssrRenderToDom, //
  domRender, //
].forEach((render) => {
  describe(render.name + ': useOn', () => {
    it('should update value', async () => {
      const Counter = component$((props: { initial: number }) => {
        const count = useSignal(props.initial);
        useOn(
          'click',
          $(() => count.value++)
        );
        return <button>Count: {count.value}!</button>;
      });

      const { vNode, container } = await render(<Counter initial={123} />, { debug });
      expect(vNode).toMatchVDOM(
        <>
          <button>Count: {'123'}!</button>
        </>
      );
      await trigger(container.element, 'button', 'click');
      expect(vNode).toMatchVDOM(
        <>
          <button>Count: {'124'}!</button>
        </>
      );
    });

    it('should update value with multiple useOn', async () => {
      const Counter = component$((props: { initial: number }) => {
        const count = useSignal(props.initial);
        useOn(
          'click',
          $(() => count.value++)
        );
        useOn(
          'focus',
          $(() => {
            count.value += 2;
          })
        );
        useVisibleTask$(() => {
          count.value += 2;
        });
        return <button>Count: {count.value}!</button>;
      });

      const { vNode, container } = await render(<Counter initial={123} />, { debug });
      if (render === ssrRenderToDom) {
        expect(vNode).toMatchVDOM(
          <>
            <button>Count: {'123'}!</button>
          </>
        );
        await trigger(container.element, 'button', 'qvisible');
      }
      expect(vNode).toMatchVDOM(
        <>
          <button>Count: {'125'}!</button>
        </>
      );
      await trigger(container.element, 'button', 'click');
      expect(vNode).toMatchVDOM(
        <>
          <button>Count: {'126'}!</button>
        </>
      );
      await trigger(container.element, 'button', 'focus');
      expect(vNode).toMatchVDOM(
        <>
          <button>Count: {'128'}!</button>
        </>
      );
    });

    it('should update value with mixed listeners', async () => {
      const Counter = component$((props: { initial: number }) => {
        const count = useSignal(props.initial);
        useOn(
          'click',
          $(() => count.value++)
        );
        return <button onFocus$={$(() => (count.value += 2))}>Count: {count.value}!</button>;
      });

      const { vNode, container } = await render(<Counter initial={123} />, { debug });
      expect(vNode).toMatchVDOM(
        <>
          <button>Count: {'123'}!</button>
        </>
      );
      await trigger(container.element, 'button', 'click');
      expect(vNode).toMatchVDOM(
        <>
          <button>Count: {'124'}!</button>
        </>
      );
      await trigger(container.element, 'button', 'focus');
      expect(vNode).toMatchVDOM(
        <>
          <button>Count: {'126'}!</button>
        </>
      );
    });
  });

  describe(render.name + ': useOnDocument', () => {
    it('should update value', async () => {
      const Counter = component$((props: { initial: number }) => {
        const count = useSignal(props.initial);
        useOnDocument(
          'click',
          $(() => count.value++)
        );
        return <button>Count: {count.value}!</button>;
      });

      const { vNode, container } = await render(<Counter initial={123} />, { debug });
      expect(vNode).toMatchVDOM(
        <>
          <button>Count: {'123'}!</button>
        </>
      );

      await trigger(container.element, 'button', ':document:click');
      expect(vNode).toMatchVDOM(
        <>
          <button>Count: {'124'}!</button>
        </>
      );
    });

    it('should update value with multiple useOnDocument', async () => {
      const Counter = component$((props: { initial: number }) => {
        const count = useSignal(props.initial);
        useOnDocument(
          'click',
          $(() => count.value++)
        );
        useOnDocument(
          'focus',
          $(() => {
            count.value += 2;
          })
        );
        useVisibleTask$(() => {
          count.value += 2;
        });
        return <button>Count: {count.value}!</button>;
      });

      const { vNode, container } = await render(<Counter initial={123} />, { debug });
      if (render === ssrRenderToDom) {
        expect(vNode).toMatchVDOM(
          <>
            <button>Count: {'123'}!</button>
          </>
        );
        await trigger(container.element, 'button', 'qvisible');
      }
      expect(vNode).toMatchVDOM(
        <>
          <button>Count: {'125'}!</button>
        </>
      );
      await trigger(container.element, 'button', ':document:click');
      expect(vNode).toMatchVDOM(
        <>
          <button>Count: {'126'}!</button>
        </>
      );
      await trigger(container.element, 'button', ':document:focus');
      expect(vNode).toMatchVDOM(
        <>
          <button>Count: {'128'}!</button>
        </>
      );
    });

    it('should update value with mixed listeners', async () => {
      const Counter = component$((props: { initial: number }) => {
        const count = useSignal(props.initial);
        useOnWindow(
          'click',
          $(() => count.value++)
        );
        return <button onFocus$={$(() => (count.value += 2))}>Count: {count.value}!</button>;
      });

      const { vNode, container } = await render(<Counter initial={123} />, { debug });
      expect(vNode).toMatchVDOM(
        <>
          <button>Count: {'123'}!</button>
        </>
      );
      await trigger(container.element, 'button', ':window:click');
      expect(vNode).toMatchVDOM(
        <>
          <button>Count: {'124'}!</button>
        </>
      );
      await trigger(container.element, 'button', 'focus');
      expect(vNode).toMatchVDOM(
        <>
          <button>Count: {'126'}!</button>
        </>
      );
    });
  });

  describe(render.name + ': useOnWindow', () => {
    it('should update value', async () => {
      const Counter = component$((props: { initial: number }) => {
        const count = useSignal(props.initial);
        useOnWindow(
          'click',
          $(() => count.value++)
        );
        return <button>Count: {count.value}!</button>;
      });

      const { vNode, container } = await render(<Counter initial={123} />, { debug });
      expect(vNode).toMatchVDOM(
        <>
          <button>Count: {'123'}!</button>
        </>
      );

      await trigger(container.element, 'button', ':window:click');
      expect(vNode).toMatchVDOM(
        <>
          <button>Count: {'124'}!</button>
        </>
      );
    });

    it('should update value with multiple useOnWindow', async () => {
      const Counter = component$((props: { initial: number }) => {
        const count = useSignal(props.initial);
        useOnWindow(
          'click',
          $(() => count.value++)
        );
        useOnWindow(
          'focus',
          $(() => {
            count.value += 2;
          })
        );
        useVisibleTask$(() => {
          count.value += 2;
        });
        return <button>Count: {count.value}!</button>;
      });

      const { vNode, container } = await render(<Counter initial={123} />, { debug });
      if (render === ssrRenderToDom) {
        expect(vNode).toMatchVDOM(
          <>
            <button>Count: {'123'}!</button>
          </>
        );
        await trigger(container.element, 'button', 'qvisible');
      }
      expect(vNode).toMatchVDOM(
        <>
          <button>Count: {'125'}!</button>
        </>
      );
      await trigger(container.element, 'button', ':window:click');
      expect(vNode).toMatchVDOM(
        <>
          <button>Count: {'126'}!</button>
        </>
      );
      await trigger(container.element, 'button', ':window:focus');
      expect(vNode).toMatchVDOM(
        <>
          <button>Count: {'128'}!</button>
        </>
      );
    });

    it('should update value with mixed listeners', async () => {
      const Counter = component$((props: { initial: number }) => {
        const count = useSignal(props.initial);
        useOnDocument(
          'click',
          $(() => count.value++)
        );
        return <button onFocus$={$(() => (count.value += 2))}>Count: {count.value}!</button>;
      });

      const { vNode, container } = await render(<Counter initial={123} />, { debug });
      expect(vNode).toMatchVDOM(
        <>
          <button>Count: {'123'}!</button>
        </>
      );
      await trigger(container.element, 'button', ':document:click');
      expect(vNode).toMatchVDOM(
        <>
          <button>Count: {'124'}!</button>
        </>
      );
      await trigger(container.element, 'button', 'focus');
      expect(vNode).toMatchVDOM(
        <>
          <button>Count: {'126'}!</button>
        </>
      );
    });
  });

  it(render.name + ': should update value with useOn, useOnDocument and useOnWindow', async () => {
    const Counter = component$((props: { initial: number }) => {
      const count = useSignal(props.initial);
      useOn(
        'click',
        $(() => count.value++)
      );
      useOnWindow(
        'focus',
        $(() => {
          count.value += 2;
        })
      );
      useOnDocument(
        'blur',
        $(() => {
          count.value += 3;
        })
      );
      useVisibleTask$(() => {
        count.value += 2;
      });
      return <button onResize$={$(() => (count.value += 4))}>Count: {count.value}!</button>;
    });

    const { vNode, container } = await render(<Counter initial={123} />, { debug });
    if (render === ssrRenderToDom) {
      expect(vNode).toMatchVDOM(
        <>
          <button>Count: {'123'}!</button>
        </>
      );
      await trigger(container.element, 'button', 'qvisible');
    }
    expect(vNode).toMatchVDOM(
      <>
        <button>Count: {'125'}!</button>
      </>
    );
    await trigger(container.element, 'button', 'click');
    expect(vNode).toMatchVDOM(
      <>
        <button>Count: {'126'}!</button>
      </>
    );
    await trigger(container.element, 'button', ':window:focus');
    expect(vNode).toMatchVDOM(
      <>
        <button>Count: {'128'}!</button>
      </>
    );
    await trigger(container.element, 'button', ':document:blur');
    expect(vNode).toMatchVDOM(
      <>
        <button>Count: {'131'}!</button>
      </>
    );
    await trigger(container.element, 'button', 'resize');
    expect(vNode).toMatchVDOM(
      <>
        <button>Count: {'135'}!</button>
      </>
    );
  });
});
