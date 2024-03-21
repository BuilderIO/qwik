import { describe, expect, it } from 'vitest';
import { component$, componentQrl } from '../core/component/component.public';
import { inlinedQrl } from '../core/qrl/qrl';
import { useSignal } from '../core/use/use-signal';
import { ssrRenderToDom } from '../core/v2/rendering.unit-util';
import { encodeAsAlphanumeric } from './v2-vnode-data';
import { vnode_getProp, vnode_locate } from '../core/v2/client/vnode';
import { ELEMENT_PROPS, OnRenderProp } from '../core/util/markers';
import { type QRLInternal } from '../core/qrl/qrl-class';
import type { DomContainer } from '../core/v2/client/dom-container';

const debug = false;

describe('vnode data', () => {
  describe('encodeAsAlphanumeric', () => {
    it('should return A for 0', () => {
      expect(encodeAsAlphanumeric(0)).toEqual('A');
    });
    it('should return B for 1', () => {
      expect(encodeAsAlphanumeric(1)).toEqual('B');
    });
    it('should return K for 10', () => {
      expect(encodeAsAlphanumeric(10)).toEqual('K');
    });
    it('should return Z for 25', () => {
      expect(encodeAsAlphanumeric(25)).toEqual('Z');
    });
    it('should return bA for 26', () => {
      expect(encodeAsAlphanumeric(26)).toEqual('bA');
    });
    it('should return dW for 100', () => {
      expect(encodeAsAlphanumeric(100)).toEqual('dW');
    });
    it('should return bmM for 1000', () => {
      expect(encodeAsAlphanumeric(1000)).toEqual('bmM');
    });
    it('should return ouQ for 10000', () => {
      expect(encodeAsAlphanumeric(10000)).toEqual('ouQ');
    });
  });
  describe('integration tests', () => {
    it('components inside the div', async () => {
      const Component = component$<RefIdProp>(({ refId }) => {
        const data = useSignal(1);
        return (
          <div id={refId}>
            <span>{data.value}</span>
          </div>
        );
      });
      const Parent = componentQrl(
        inlinedQrl(() => {
          return (
            <div>
              <Component refId="1" />
              <Component refId="2" />
            </div>
          );
        }, 's_parent')
      );

      const { container } = await ssrRenderToDom(<Parent />, { debug });

      expectVNodeSymbol(container, '3A', 'parent');
      expectVNodeRefProp(container, '4A', '1');
      expectVNodeRefProp(container, '4B', '2');
    });

    it('components inside the fragments', async () => {
      const Component = component$<RefIdProp>(({ refId }) => {
        const data = useSignal(1);
        return (
          <div id={refId}>
            <span>{data.value}</span>
          </div>
        );
      });
      const Parent = componentQrl(
        inlinedQrl(() => {
          return (
            <>
              <Component refId="1" />
              <Component refId="2" />
            </>
          );
        }, 's_parent')
      );

      const { container } = await ssrRenderToDom(<Parent />, { debug });

      expectVNodeSymbol(container, '3A', 'parent');
      expectVNodeRefProp(container, '3AAA', '1');
      expectVNodeRefProp(container, '3AAB', '2');
    });

    it('components inside the fragments and divs', async () => {
      const Component = component$<RefIdProp>(({ refId }) => {
        const data = useSignal(1);
        return (
          <>
            <span id={refId}>{data.value}</span>
          </>
        );
      });
      const Parent = componentQrl(
        inlinedQrl(() => {
          return (
            <>
              <div>
                <Component refId="1" />
              </div>
              <Component refId="2" />
              <div>
                <div>
                  <Component refId="3" />
                </div>
              </div>
              <Component refId="4" />
            </>
          );
        }, 's_parent')
      );

      const { container } = await ssrRenderToDom(<Parent />, { debug });

      expectVNodeSymbol(container, '3A', 'parent');
      expectVNodeRefProp(container, '4A', '1');
      expectVNodeRefProp(container, '3AAB', '2');
      expectVNodeRefProp(container, '8A', '3');
      expectVNodeRefProp(container, '3AAD', '4');
    });

    it('nested components inside the fragments and the divs', async () => {
      const Nested = component$<RefIdProp>(({ refId }) => {
        const data = useSignal(2);
        return (
          <>
            <span id={refId}>{data.value}</span>
          </>
        );
      });

      const Component = component$<NestedRefIdProp>(({ hostRefId, nestedRefId }) => {
        const data = useSignal(1);
        return (
          <>
            <span id={hostRefId}>{data.value}</span>
            <Nested refId={nestedRefId} />
          </>
        );
      });

      const Parent = componentQrl(
        inlinedQrl(() => {
          return (
            <>
              <div>
                <Component hostRefId="1" nestedRefId="2" />
              </div>
              <Component hostRefId="3" nestedRefId="4" />
              <div>
                <div>
                  <Component hostRefId="5" nestedRefId="6" />
                </div>
              </div>
              <Component hostRefId="7" nestedRefId="8" />
            </>
          );
        }, 's_parent')
      );

      const { container } = await ssrRenderToDom(<Parent />, { debug });

      expectVNodeSymbol(container, '3A', 'parent');
      expectVNodeProps(container, '4A', { hostRefId: '1', nestedRefId: '2' });
      expectVNodeRefProp(container, '4AAB', '2');
      expectVNodeProps(container, '3AAB', { hostRefId: '3', nestedRefId: '4' });
      expectVNodeRefProp(container, '3AABAB', '4');
      expectVNodeProps(container, '10A', { hostRefId: '5', nestedRefId: '6' });
      expectVNodeRefProp(container, '10AAB', '6');
      expectVNodeProps(container, '3AAD', { hostRefId: '7', nestedRefId: '8' });
      expectVNodeRefProp(container, '3AADAB', '8');
    });
  });
  it('fragment as child of HTML', async () => {
    const { vNode } = await ssrRenderToDom(
      <>
        <head></head>
        <body></body>
      </>,
      { debug, raw: true }
    );

    expect(vNode).toMatchVDOM(
      <>
        <head></head>
        <body></body>
      </>
    );
  });
});

interface NestedRefIdProp {
  hostRefId: string;
  nestedRefId: string;
}

interface RefIdProp {
  refId: string;
}

function expectVNodeSymbol(container: DomContainer, vNodeId: string, cmpSymbol: string) {
  const vnode = vnode_locate(container.rootVNode, vNodeId);

  expect(
    vnode_getProp<QRLInternal>(vnode, OnRenderProp, container.$getObjectById$)?.$hash$
  ).toEqual(cmpSymbol);
}

function expectVNodeProps(container: DomContainer, vNodeId: string, props: any) {
  const vnode = vnode_locate(container.rootVNode, vNodeId);

  expect(vnode_getProp(vnode, ELEMENT_PROPS, container.$getObjectById$)).toEqual(props);
}

function expectVNodeRefProp(container: DomContainer, vNodeId: string, refIdPropValue: string) {
  const props: RefIdProp = {
    refId: refIdPropValue,
  };
  expectVNodeProps(container, vNodeId, props);
}
