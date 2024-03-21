import { createDocument } from '../../testing/document';
import { describe, expect, it } from 'vitest';
import { trigger } from '../../testing/element-fixture';
import { Fragment as Component, component$, type JSXOutput, useSignal } from '@builder.io/qwik';
import { render2 } from './client/dom-render';
import type { ContainerElement } from './client/types';
import { vnode_getFirstChild } from './client/vnode';
import './vdom-diff.unit-util';
import { getTestPlatform } from '../../testing/platform';

describe('v2 client render', () => {
  it('should render jsx', async () => {
    const { vNode } = await clientRender(<span>Hello World!</span>);
    expect(vnode_getFirstChild(vNode)).toMatchVDOM(<span>Hello World!</span>);
  });
  it('should render void element correctly', async () => {
    const { vNode, container } = await clientRender(
      <meta content="dark light" name="color-scheme" />
    );
    expect(vnode_getFirstChild(vNode)).toMatchVDOM(
      <meta content="dark light" name="color-scheme" />
    );
    expect(container.document.documentElement.outerHTML).toContain(
      '<meta content="dark light" name="color-scheme">'
    );
    expect(container.document.documentElement.outerHTML).not.toContain(
      '<meta content="dark light" name="color-scheme"></meta>'
    );
  });
  it('should render Components', async () => {
    const Display = component$((props: { text: string }) => {
      return <b>{props.text}</b>;
    });
    const Greeter = component$((props: { salutation: string; name: string }) => {
      return (
        <span>
          {props.salutation} <Display text={props.name} />!
        </span>
      );
    });
    const { vNode } = await clientRender(<Greeter salutation="Hello" name="World" />);
    expect(vnode_getFirstChild(vNode)).toMatchVDOM(
      <Component>
        <span>
          {'Hello'}{' '}
          <Component>
            <b>World</b>
          </Component>
          {'!'}
        </span>
      </Component>
    );
  });
  it('should render counter and increment', async (async) => {
    const Counter = component$(() => {
      const count = useSignal(123);
      return <button onClick$={() => count.value++}>{count.value}</button>;
    });
    const { vNode, container } = await clientRender(<Counter />);
    expect(vnode_getFirstChild(vNode)).toMatchVDOM(
      <Component>
        <button>123</button>
      </Component>
    );
    await trigger(container.element, 'button', 'click');
    expect(vnode_getFirstChild(vNode)).toMatchVDOM(
      <Component>
        <button>124</button>
      </Component>
    );
  });
  it('should show hide component', async () => {
    const Child = component$(() => {
      return <span>CHILD</span>;
    });
    const Counter = component$(() => {
      const show = useSignal(false);
      return (
        <>
          <button onClick$={() => (show.value = true)}>{String(show.value)}</button>
          {show.value && <Child />}
        </>
      );
    });
    const { vNode, container } = await clientRender(<Counter />);
    expect(vnode_getFirstChild(vNode)).toMatchVDOM(
      <Component>
        <>
          <button>false</button>
          {''}
        </>
      </Component>
    );
    await trigger(container.element, 'button', 'click');
    expect(vnode_getFirstChild(vNode)).toMatchVDOM(
      <Component>
        <>
          <button>true</button>
          <Component>
            <span>CHILD</span>
          </Component>
        </>
      </Component>
    );
  });
  it('should update loop', async () => {
    const Counter = component$(() => {
      const signal = useSignal([1]);
      return (
        <>
          <button onClick$={() => (signal.value = [3, 2, 1])}></button>
          {signal.value.map((i) => (
            <b>{i}</b>
          ))}
        </>
      );
    });
    const { vNode, container } = await clientRender(<Counter />);
    expect(vnode_getFirstChild(vNode)).toMatchVDOM(
      <Component>
        <>
          <button></button>
          <b>1</b>
        </>
      </Component>
    );
    await trigger(container.element, 'button', 'click');
    expect(vnode_getFirstChild(vNode)).toMatchVDOM(
      <Component>
        <>
          <button></button>
          <b>3</b>
          <b>2</b>
          <b>1</b>
        </>
      </Component>
    );
  });
});

async function clientRender(jsx: JSXOutput) {
  const document = createDocument();
  await render2(document.body, jsx);
  await getTestPlatform().flush();
  const containerElement = document.body as ContainerElement;
  const container = containerElement.qContainer!;
  return {
    container,
    vNode: container.rootVNode,
  };
}
