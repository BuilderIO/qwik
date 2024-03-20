import {
  Fragment as Component,
  Fragment,
  Fragment as Projection,
} from '@builder.io/qwik/jsx-runtime';
import { describe, expect, it } from 'vitest';
import { trigger } from '../../testing/element-fixture';
import { component$, componentQrl } from '../component/component.public';
import { inlinedQrl } from '../qrl/qrl';
import { useLexicalScope } from '../use/use-lexical-scope.public';
import { useSignal } from '../use/use-signal';
import { domRender, ssrRenderToDom } from './rendering.unit-util';
import './vdom-diff.unit-util';
import type { JSXOutput } from '../render/jsx/types/jsx-node';
import { Slot } from '../render/jsx/slot.public';

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
      const Parent = component$((props: { salutation: string; name: string }) => {
        return (
          <>
            {props.salutation} <Child name={props.name} />
          </>
        );
      });

      const Child = component$((props: { name: string }) => {
        return <>{props.name}</>;
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
                onClick$={inlinedQrl(
                  () => {
                    const [showChild] = useLexicalScope();
                    showChild.value = !showChild.value;
                  },
                  's_onClick',
                  [showChild]
                )}
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
      const Component1 = componentQrl(
        inlinedQrl(() => {
          const signal1 = useSignal(1);
          return (
            <div>
              <span>Component 1</span>
              {signal1.value}
            </div>
          );
        }, 's_cmp1')
      );
      const Component2 = componentQrl(
        inlinedQrl(() => {
          const signal2 = useSignal(2);
          return (
            <div>
              <span>Component 2</span>
              {signal2.value}
            </div>
          );
        }, 's_cmp2')
      );
      const Parent = componentQrl(
        inlinedQrl(() => {
          const show = useSignal(true);
          return (
            <div
              class="parent"
              onClick$={inlinedQrl(() => (useLexicalScope()[0].value = false), 's_onClick', [show])}
            >
              {show.value && <Component1 />}
              {show.value && <Component1 />}
              <Component2 />
            </div>
          );
        }, 's_parent')
      );
      const { vNode, container } = await render(<Parent />, { debug });
      expect(vNode).toMatchVDOM(
        <>
          <div class="parent">
            <Component>
              <div>
                <span>Component 1</span>1
              </div>
            </Component>
            <Component>
              <div>
                <span>Component 1</span>1
              </div>
            </Component>
            <Component>
              <div>
                <span>Component 2</span>2
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
                <span>Component 2</span>2
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
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <feGaussianBlur></feGaussianBlur>
              <circle cx="50" cy="50" r="50" />
            </svg>
          );
        });
        const { vNode } = await render(<SvgComp />, { debug });
        expect(vNode).toMatchVDOM(
          <Component>
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <feGaussianBlur></feGaussianBlur>
              <circle cx="50" cy="50" r="50" />
            </svg>
          </Component>
        );
      });
      it('should write attributes to svg', async () => {
        const SvgComp = component$((props: { cx: string; cy: string }) => {
          return (
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle {...props} r="50" />
            </svg>
          );
        });
        const { vNode } = await render(<SvgComp cx="10" cy="10" />, { debug });
        expect(vNode).toMatchVDOM(
          <Component>
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="50" />
            </svg>
          </Component>
        );
      });
      it('should rerender svg', async () => {
        const SvgComp = component$((props: { cx: string; cy: string }) => {
          return (
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle cx={props.cx} cy={props.cy} r="50" />
            </svg>
          );
        });
        const Parent = component$(() => {
          const show = useSignal(false);
          return (
            <button
              onClick$={inlinedQrl(
                () => {
                  const [show] = useLexicalScope();
                  show.value = !show.value;
                },
                's_click',
                [show]
              )}
            >
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

        await trigger(container.element, 'button', 'click');
        expect(vNode).toMatchVDOM(
          <Component>
            <button>
              <Component>
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="10" cy="10" r="50" />
                </svg>
              </Component>
            </button>
          </Component>
        );

        await trigger(container.element, 'button', 'click');
        expect(vNode).toMatchVDOM(
          <Component>
            <button>{''}</button>
          </Component>
        );
      });
      it('should rerender svg child elements', async () => {
        const SvgComp = component$((props: { child: JSXOutput }) => {
          return (
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle cx="15" cy="15" r="50" />
              {props.child}
            </svg>
          );
        });
        const Parent = component$(() => {
          const show = useSignal(false);
          return (
            <button
              onClick$={inlinedQrl(
                () => {
                  const [show] = useLexicalScope();
                  show.value = !show.value;
                },
                's_click',
                [show]
              )}
            >
              <SvgComp
                child={show.value ? <line x1="0" y1="80" x2="100" y2="20" stroke="black" /> : <></>}
              />
            </button>
          );
        });
        const { vNode, container } = await render(<Parent />, { debug });
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

        await trigger(container.element, 'button', 'click');
        expect(vNode).toMatchVDOM(
          <Component>
            <button>
              <Component>
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="15" cy="15" r="50"></circle>
                  <line x1="0" y1="80" x2="100" y2="20" stroke="black"></line>
                </svg>
              </Component>
            </button>
          </Component>
        );

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
      });
    });
  });

  describe(render.name + ': regression', () => {
    it('#5647', async () => {
      const Issue5647 = componentQrl(
        inlinedQrl(() => {
          return (
            <>
              <Child1 refId="first" ele={<span>Hi, this doesn't work...</span>} />
              <Child1 refId="second" ele={<ChildNested />} />
            </>
          );
        }, 's_issue5647')
      );
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
              onClick$={inlinedQrl(
                () => {
                  const [isShow] = useLexicalScope();
                  isShow.value = !isShow.value;
                },
                's_onClick',
                [isShow]
              )}
            >
              Toggle
            </button>
          </div>
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
                  {'true'}
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
                  {'true'}
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
                  {'false'}
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
                  {'true'}
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
                  {'false'}
                </p>
                <button id="first">Toggle</button>
              </div>
            </Component>
            <Component>
              <div>
                {''}
                <p>
                  {'isShow value: '}
                  {'false'}
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
                  {'true'}
                </p>
                <button id="first">Toggle</button>
              </div>
            </Component>
            <Component>
              <div>
                {''}
                <p>
                  {'isShow value: '}
                  {'false'}
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
