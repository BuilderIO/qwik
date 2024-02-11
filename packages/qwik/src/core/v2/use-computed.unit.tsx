import { describe, expect, it } from 'vitest';
import { trigger } from '../../testing/element-fixture';
import { component$ } from '../component/component.public';
import { inlinedQrl } from '../qrl/qrl';
import { useLexicalScope } from '../use/use-lexical-scope.public';
import { useSignal } from '../use/use-signal';
import { useComputedQrl } from '../use/use-task';
import { domRender, ssrRenderToDom } from './rendering.unit-util';
import './vdom-diff.unit-util';

const debug = true; //true;
Error.stackTraceLimit = 100;

[
  ssrRenderToDom, //
  domRender, //
].forEach((render) => {
  describe('useComputed', () => {
    it('should update value based on signal', async () => {
      const DoubleCounter = component$((props: { initial: number }) => {
        const count = useSignal(props.initial);
        const doubleCount = useComputedQrl(
          inlinedQrl(() => useLexicalScope()[0].value * 2, 's_doubleCount', [count])
        );
        return (
          <button onClick$={inlinedQrl(() => useLexicalScope()[0].value++, 's_onClick', [count])}>
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
        const doubleCount = useComputedQrl(
          inlinedQrl(() => useLexicalScope()[0].value * 2, 's_doubleCount', [count])
        );
        const quadrupleCount = useComputedQrl(
          inlinedQrl(() => useLexicalScope()[0].value * 2, 's_quadrupleCount', [doubleCount])
        );
        return (
          <button onClick$={inlinedQrl(() => useLexicalScope()[0].value++, 's_onClick', [count])}>
            Double count: {quadrupleCount.value}!
          </button>
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
  });
});