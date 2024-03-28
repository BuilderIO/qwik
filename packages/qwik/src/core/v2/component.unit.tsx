import { Fragment as Component, Fragment, Fragment as Signal } from '@builder.io/qwik/jsx-runtime';
import { describe, expect, it } from 'vitest';
import { trigger } from '../../testing/element-fixture';
import { component$ } from '../component/component.public';
import { useSignal } from '../use/use-signal';
import { domRender, ssrRenderToDom } from './rendering.unit-util';
import './vdom-diff.unit-util';
import type { JSXOutput } from '../render/jsx/types/jsx-node';
import type { QDocument } from './client/types';

const debug = false; //true;
Error.stackTraceLimit = 100;

[
  ssrRenderToDom, //
  domRender, //
].forEach((render) => {
  describe(`${render.name}: component`, () => {
    it('should render component', async () => {
      const MyComp = component$(() => {
        return <>Hello World!</>;
      });

      const { vNode } = await render(<MyComp />, { debug });
      expect(vNode).toMatchVDOM(
        <>
          <>Hello World!</>
        </>
      );
    });
    it('should render nested component', async () => {
      const Child = component$((props: { name: string }) => {
        return <>{props.name}</>;
      });

      const Parent = component$((props: { salutation: string; name: string }) => {
        return (
          <>
            {props.salutation} <Child name={props.name} />
          </>
        );
      });

      const { vNode } = await render(<Parent salutation="Hello" name="World" />, {
        debug,
      });
      expect(vNode).toMatchVDOM(
        <Component>
          <Fragment>
            {'Hello'}{' '}
            <Component>
              <Fragment>World</Fragment>
            </Component>
          </Fragment>
        </Component>
      );
    });

    it('should handle null as empty string', async () => {
      const MyComp = component$(() => {
        return (
          <div>
            <span>Hello world</span>
            {null}
          </div>
        );
      });

      const { vNode } = await render(<MyComp />, { debug });
      expect(vNode).toMatchVDOM(
        <Component>
          <div>
            <span>Hello world</span>
            {''}
          </div>
        </Component>
      );
    });

    it('should show Child Component', async () => {
      const Child = component$(() => {
        return <div>Child</div>;
      });
      const Parent = component$(() => {
        const showChild = useSignal(false);
        return (
          <>
            <div>Parent</div>
            <div>
              <button
                onClick$={() => {
                  showChild.value = !showChild.value;
                }}
              >
                Show child
              </button>
              {showChild.value && <Child />}
            </div>
          </>
        );
      });

      const { vNode, document } = await render(<Parent />, { debug });
      expect(vNode).toMatchVDOM(
        <Component>
          <Fragment>
            <div>Parent</div>
            <div>
              <button>Show child</button>
              {''}
            </div>
          </Fragment>
        </Component>
      );
      await trigger(document.body, 'button', 'click');
      expect(vNode).toMatchVDOM(
        <Component>
          <Fragment>
            <div>Parent</div>
            <div>
              <button>Show child</button>
              <Component>
                <div>Child</div>
              </Component>
            </div>
          </Fragment>
        </Component>
      );
    });

    it('should rerender components correctly', async () => {
      const Component1 = component$(() => {
        const signal1 = useSignal(1);
        return (
          <div>
            <span>Component 1</span>
            {signal1.value}
          </div>
        );
      });
      const Component2 = component$(() => {
        const signal2 = useSignal(2);
        return (
          <div>
            <span>Component 2</span>
            {signal2.value}
          </div>
        );
      });
      const Parent = component$(() => {
        const show = useSignal(true);
        return (
          <div class="parent" onClick$={() => (show.value = false)}>
            {show.value && <Component1 />}
            {show.value && <Component1 />}
            <Component2 />
          </div>
        );
      });
      const { vNode, container } = await render(<Parent />, { debug });
      expect(vNode).toMatchVDOM(
        <>
          <div class="parent">
            <Component>
              <div>
                <span>Component 1</span>
                <Signal>1</Signal>
              </div>
            </Component>
            <Component>
              <div>
                <span>Component 1</span>
                <Signal>1</Signal>
              </div>
            </Component>
            <Component>
              <div>
                <span>Component 2</span>
                <Signal>2</Signal>
              </div>
            </Component>
          </div>
        </>
      );
      await trigger(container.element, 'div.parent', 'click');
      expect(vNode).toMatchVDOM(
        <>
          <div class="parent">
            {''}
            {''}
            <Component>
              <div>
                <span>Component 2</span>
                <Signal>2</Signal>
              </div>
            </Component>
          </div>
        </>
      );
    });

    it('should remove children from component$', async () => {
      const log: string[] = [];
      const MyComp = component$((props: any) => {
        log.push('children' in props ? 'children' : 'no children');
        return <span>Hello world</span>;
      });

      const { vNode } = await render(<MyComp>CHILDREN</MyComp>, { debug });
      expect(vNode).toMatchVDOM(
        <Component>
          <span>Hello world</span>
        </Component>
      );
      expect(log).toEqual(['no children']);
    });

    it('should NOT remove children from inline component', async () => {
      const log: string[] = [];
      const MyComp = (props: any) => {
        log.push('children' in props ? 'has children' : 'no children');
        return <span>Hello world</span>;
      };

      const { vNode } = await render(<MyComp>CHILDREN</MyComp>, { debug });
      expect(vNode).toMatchVDOM(
        <Component>
          <span>Hello world</span>
        </Component>
      );
      expect(log).toEqual(['has children']);
    });

    describe('svg', () => {
      it('should render svg', async () => {
        const SvgComp = component$(() => {
          return (
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" key="ka">
              <feGaussianBlur></feGaussianBlur>
              <circle cx="50" cy="50" r="50" />
            </svg>
          );
        });
        const { vNode, container } = await render(<SvgComp />, { debug });
        expect(vNode).toMatchVDOM(
          <Component>
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <feGaussianBlur></feGaussianBlur>
              <circle cx="50" cy="50" r="50" />
            </svg>
          </Component>
        );
        await expect(container.document.body.firstChild).toMatchDOM(`
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" q:key="ka">
            <fegaussianblur></fegaussianblur>
            <circle cx="50" cy="50" r="50"></circle>
          </svg>
        `);
      });
      // PropsProxy is an empty object, so this does not work!
      it.skip('should write attributes to svg', async () => {
        const SvgComp = component$((props: { cx: string; cy: string }) => {
          return (
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" key="0">
              {/* <circle cx={props.cx} cy={props.cy} r="50" /> */}
              {/* TODO(hack): PropsProxy is an empty object, so this does not work: */}
              <circle {...props} r="50" />
            </svg>
          );
        });
        const { vNode, container } = await render(<SvgComp cx="10" cy="10" />, { debug });
        expect(vNode).toMatchVDOM(
          <Component>
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="50" />
            </svg>
          </Component>
        );
        await expect(container.document.body).toMatchDOM(`
          <svg viewbox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" q:key="0">
            <circle cx="10" cy="10" r="50"></circle>
          </svg>
        `);
      });
      it('should rerender svg', async () => {
        const SvgComp = component$((props: { cx: string; cy: string }) => {
          return (
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" key="0">
              <circle cx={props.cx} cy={props.cy} r="50" />
            </svg>
          );
        });
        const Parent = component$(() => {
          const show = useSignal(false);
          return (
            <button onClick$={() => (show.value = !show.value)}>
              {show.value && <SvgComp cx="10" cy="10" />}
            </button>
          );
        });
        const { vNode, container } = await render(<Parent />, { debug });
        expect(vNode).toMatchVDOM(
          <Component>
            <button>{''}</button>
          </Component>
        );

        await expect(container.document.body.firstChild?.textContent).toMatchDOM('');
        await trigger(container.element, 'button', 'click');
        expect(vNode).toMatchVDOM(
          <Component>
            <button>
              <Component>
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" key="0">
                  <circle cx="10" cy="10" r="50" />
                </svg>
              </Component>
            </button>
          </Component>
        );

        await expect(container.document.body.firstChild?.firstChild).toMatchDOM(`
          <svg viewbox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" q:key="0">
            <circle r="50" cx="10" cy="10"></circle>
          </svg>
        `);

        await trigger(container.element, 'button', 'click');
        expect(vNode).toMatchVDOM(
          <Component>
            <button>{''}</button>
          </Component>
        );

        await expect(container.document.body.firstChild?.textContent).toMatchDOM('');
      });
      it('should rerender svg child elements', async () => {
        const SvgComp = component$((props: { child: JSXOutput }) => {
          return (
            <svg key="hi" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle cx="15" cy="15" r="50" />
              {props.child}
            </svg>
          );
        });
        const Parent = component$(() => {
          const show = useSignal(false);
          return (
            <button onClick$={() => (show.value = !show.value)}>
              <SvgComp
                child={
                  show.value ? (
                    <line x1="0" y1="80" x2="100" y2="20" stroke="black" key="1" />
                  ) : (
                    <></>
                  )
                }
              />
            </button>
          );
        });
        const { vNode, container } = await render(<Parent />, { debug });
        expect(vNode).toMatchVDOM(
          <Component>
            <button>
              <Component>
                <svg key="hi" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="15" cy="15" r="50"></circle>
                  <Fragment></Fragment>
                </svg>
              </Component>
            </button>
          </Component>
        );
        await expect(container.document.body.firstChild?.firstChild).toMatchDOM(`
          <svg viewbox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" q:key="hi">
            <circle cx="15" cy="15" r="50"></circle>
          </svg>
        `);

        await trigger(container.element, 'button', 'click');
        expect(vNode).toMatchVDOM(
          <Component>
            <button>
              <Component>
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="15" cy="15" r="50"></circle>
                  <line x1="0" y1="80" x2="100" y2="20" stroke="black" key="1"></line>
                </svg>
              </Component>
            </button>
          </Component>
        );

        await expect(container.document.body.firstChild?.firstChild).toMatchDOM(`
          <svg viewbox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" q:key="hi">
            <circle cx="15" cy="15" r="50"></circle>
            <line x1="0" y1="80" x2="100" y2="20" stroke="black" q:key="1"></line>
          </svg>
        `);

        await trigger(container.element, 'button', 'click');
        expect(vNode).toMatchVDOM(
          <Component>
            <button>
              <Component>
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="15" cy="15" r="50"></circle>
                  <Fragment></Fragment>
                </svg>
              </Component>
            </button>
          </Component>
        );
        await expect(container.document.body.firstChild?.firstChild).toMatchDOM(`
          <svg viewbox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" q:key="hi">
            <circle cx="15" cy="15" r="50"></circle>
          </svg>
        `);
      });
    });
  });

  describe(render.name + ': regression', () => {
    it('#5647', async () => {
      const ChildNested = component$(() => {
        return <div>Nested</div>;
      });
      const Child1 = component$<{ refId: string; ele: JSXOutput }>((props) => {
        const isShow = useSignal(true);
        return (
          <div>
            {isShow.value && props.ele}
            <p>isShow value: {`${isShow.value}`}</p>
            <button
              id={props.refId}
              onClick$={() => {
                isShow.value = !isShow.value;
              }}
            >
              Toggle
            </button>
          </div>
        );
      });
      const Issue5647 = component$(() => {
        return (
          <>
            <Child1 refId="first" ele={<span>Hi, this doesn't work...</span>} />
            <Child1 refId="second" ele={<ChildNested />} />
          </>
        );
      });
      const { vNode, container } = await render(<Issue5647 />, { debug });
      expect(vNode).toMatchVDOM(
        <Component>
          <Fragment>
            <Component>
              <div>
                <span>Hi, this doesn't work...</span>
                <p>
                  {'isShow value: '}
                  <Signal>{'true'}</Signal>
                </p>
                <button id="first">Toggle</button>
              </div>
            </Component>
            <Component>
              <div>
                <Component>
                  <div>Nested</div>
                </Component>
                <p>
                  {'isShow value: '}
                  <Signal>{'true'}</Signal>
                </p>
                <button id="second">Toggle</button>
              </div>
            </Component>
          </Fragment>
        </Component>
      );
      await trigger(container.element, 'button#first', 'click');
      expect(vNode).toMatchVDOM(
        <Component>
          <Fragment>
            <Component>
              <div>
                {''}
                <p>
                  {'isShow value: '}
                  <Signal>{'false'}</Signal>
                </p>
                <button id="first">Toggle</button>
              </div>
            </Component>
            <Component>
              <div>
                <Component>
                  <div>Nested</div>
                </Component>
                <p>
                  {'isShow value: '}
                  <Signal>{'true'}</Signal>
                </p>
                <button id="second">Toggle</button>
              </div>
            </Component>
          </Fragment>
        </Component>
      );
      await trigger(container.element, 'button#second', 'click');
      expect(vNode).toMatchVDOM(
        <Component>
          <Fragment>
            <Component>
              <div>
                {''}
                <p>
                  {'isShow value: '}
                  <Signal>{'false'}</Signal>
                </p>
                <button id="first">Toggle</button>
              </div>
            </Component>
            <Component>
              <div>
                {''}
                <p>
                  {'isShow value: '}
                  <Signal>{'false'}</Signal>
                </p>
                <button id="second">Toggle</button>
              </div>
            </Component>
          </Fragment>
        </Component>
      );
      await trigger(container.element, 'button#first', 'click');
      expect(vNode).toMatchVDOM(
        <Component>
          <Fragment>
            <Component>
              <div>
                <span>Hi, this doesn't work...</span>
                <p>
                  {'isShow value: '}
                  <Signal>{'true'}</Signal>
                </p>
                <button id="first">Toggle</button>
              </div>
            </Component>
            <Component>
              <div>
                {''}
                <p>
                  {'isShow value: '}
                  <Signal>{'false'}</Signal>
                </p>
                <button id="second">Toggle</button>
              </div>
            </Component>
          </Fragment>
        </Component>
      );
    });
  });
});
