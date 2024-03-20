import { describe, expect, it } from 'vitest';
import { component$, componentQrl } from '../component/component.public';
import { inlinedQrl } from '../qrl/qrl';
import {
  Fragment as Component,
  Fragment as InlineComponent,
  Fragment as Projection,
  Fragment,
} from '../render/jsx/jsx-runtime';
import { Slot } from '../render/jsx/slot.public';
import { vnode_getNextSibling } from './client/vnode';
import { domRender, ssrRenderToDom } from './rendering.unit-util';
import './vdom-diff.unit-util';
import { trigger } from '../../testing/element-fixture';
import { useLexicalScope } from '../use/use-lexical-scope.public';
import { useSignal } from '../use/use-signal';
import { useStore } from '../use/use-store.public';

const debug = true;

[
  ssrRenderToDom, // SSR
  // domRender, // Client
].forEach((render) => {
  describe(render.name + ': projection', () => {
    it('should render basic projection', async () => {
      const Child = component$(() => {
        return (
          <div>
            <Slot />
          </div>
        );
      });
      const Parent = component$(() => {
        return <Child>parent-content</Child>;
      });
      const { vNode } = await render(<Parent>render-content</Parent>, { debug });
      expect(vNode).toMatchVDOM(
        <Fragment>
          <Fragment>
            <div>
              <Fragment>parent-content</Fragment>
            </div>
          </Fragment>
        </Fragment>
      );
    });
    it('should render unused projection into template', async () => {
      const Child = component$(() => {
        return <span>no-projection</span>;
      });
      const Parent = component$(() => {
        return <Child>parent-content</Child>;
      });
      const { vNode } = await render(<Parent>render-content</Parent>, { debug });
      expect(vNode).toMatchVDOM(
        <Fragment>
          <Fragment>
            <span>no-projection</span>
          </Fragment>
        </Fragment>
      );
      if (render === ssrRenderToDom) {
        expect(vnode_getNextSibling(vNode!)).toMatchVDOM(
          <q:template style="display:none">
            <Fragment>parent-content</Fragment>
            <Fragment>render-content</Fragment>
          </q:template>
        );
      }
    });
    it('should render default projection', async () => {
      const Child = component$(() => {
        return <Slot>default-value</Slot>;
      });
      const Parent = component$(() => {
        return <Child />;
      });
      const { vNode } = await render(<Parent />, { debug });
      expect(vNode).toMatchVDOM(
        <Fragment>
          <Fragment>
            <Fragment>default-value</Fragment>
          </Fragment>
        </Fragment>
      );
    });
    it('should save default value in q:template if not used', async () => {
      const Child = component$(() => {
        return <Slot>default-value</Slot>;
      });
      const Parent = component$(() => {
        return <Child>projection-value</Child>;
      });
      const { vNode } = await render(<Parent />, { debug });
      expect(vNode).toMatchVDOM(
        <Fragment>
          <Fragment>
            <Fragment>projection-value</Fragment>
          </Fragment>
        </Fragment>
      );
      if (render === ssrRenderToDom) {
        expect(vnode_getNextSibling(vNode!)).toMatchVDOM(
          <q:template style="display:none">
            <Fragment>default-value</Fragment>
          </q:template>
        );
      }
    });
    it('should render nested projection', async () => {
      const Child = component$(() => {
        return (
          <div>
            <Slot />
          </div>
        );
      });
      const Parent = component$(() => {
        return (
          <Child>
            before
            <Child>inner</Child>
            after
          </Child>
        );
      });
      const { vNode } = await render(<Parent>second 3</Parent>, { debug });
      expect(vNode).toMatchVDOM(
        <Component>
          <Component>
            <div>
              <Fragment>
                before
                <Component>
                  <div>
                    <Fragment>inner</Fragment>
                  </div>
                </Component>
                after
              </Fragment>
            </div>
          </Component>
        </Component>
      );
    });
    it('should project projected', async () => {
      const Child = componentQrl(
        inlinedQrl(() => {
          return (
            <span>
              <Slot name="child" />
            </span>
          );
        }, 's_child')
      );
      const Parent = componentQrl(
        inlinedQrl(() => {
          return (
            <Child>
              <div q:slot="child">
                <Slot name="parent" />
              </div>
            </Child>
          );
        }, 's_parent')
      );
      const { vNode } = await render(
        <Parent>
          <b q:slot="parent">parent</b>
        </Parent>,
        { debug }
      );
      expect(vNode).toMatchVDOM(
        <Component>
          <Component>
            <span>
              <Fragment>
                <div q:slot="child">
                  <Fragment>
                    <b q:slot="parent">parent</b>
                  </Fragment>
                </div>
              </Fragment>
            </span>
          </Component>
        </Component>
      );
    });
    it('should project default content', async () => {
      const Child = componentQrl(
        inlinedQrl(() => {
          return (
            <span>
              <Slot name="child">Default Child</Slot>
            </span>
          );
        }, 's_child')
      );
      const Parent = componentQrl(
        inlinedQrl(() => {
          return (
            <Child>
              <div q:slot="child">
                <Slot name="parent">Default parent</Slot>
              </div>
            </Child>
          );
        }, 's_parent')
      );
      const { vNode } = await render(<Parent />, { debug });
      expect(vNode).toMatchVDOM(
        <Component>
          <Component>
            <span>
              <Fragment>
                <div q:slot="child">
                  <Fragment>Default parent</Fragment>
                </div>
              </Fragment>
            </span>
          </Component>
        </Component>
      );
      if (render === ssrRenderToDom) {
        expect(vnode_getNextSibling(vNode!)).toMatchVDOM(
          <q:template style="display:none">
            <Fragment>Default Child</Fragment>
          </q:template>
        );
      }
    });
    it('should render conditional projection', async () => {
      const Child = component$(() => {
        const show = useSignal(false);
        return (
          <button
            onClick$={inlinedQrl(() => (useLexicalScope()[0].value = true), 's_onClick', [show])}
          >
            {show.value && <Slot />}
          </button>
        );
      });
      const Parent = component$(() => {
        return <Child>parent-content</Child>;
      });
      const { vNode, container } = await render(<Parent>render-content</Parent>, { debug });
      expect(vNode).toMatchVDOM(
        <Fragment>
          <Fragment>
            <button>{''}</button>
          </Fragment>
        </Fragment>
      );
      await trigger(container.element, 'button', 'click');
      expect(vNode).toMatchVDOM(
        <Fragment>
          <Fragment>
            <button>
              <Fragment>parent-content</Fragment>
            </button>
          </Fragment>
        </Fragment>
      );
    });
    it('should ignore Slot inside inline-component', async () => {
      const Child = (props: { children: any }) => {
        return (
          <span>
            <Slot />({props.children})
          </span>
        );
      };
      const { vNode } = await render(<Child>render-content</Child>, { debug });
      expect(vNode).toMatchVDOM(
        <InlineComponent>
          <span>
            <Projection />
            {'('}render-content{')'}
          </span>
        </InlineComponent>
      );
    });
    it('should project Slot inside inline-component', async () => {
      const Parent = component$(() => {
        return <Child>child-content</Child>;
      });
      const Child = (props: { children: any }) => {
        return (
          <span>
            <Slot />({props.children})
          </span>
        );
      };
      const { vNode } = await render(<Parent>parent-content</Parent>, { debug });
      expect(vNode).toMatchVDOM(
        <Component>
          <InlineComponent>
            <span>
              <Projection>{'parent-content'}</Projection>
              {'('}child-content{')'}
            </span>
          </InlineComponent>
        </Component>
      );
    });
    describe.skip('ensureProjectionResolved', () => {
      const Child = component$<{ show: boolean }>((props) => {
        const show = useSignal(props.show);
        return (
          <span
            class="child"
            onClick$={inlinedQrl(
              () => {
                console.log('child.click');
                const [show] = useLexicalScope();
                show.value = !show.value;
              },
              's_onClickChild',
              [show]
            )}
          >
            {show.value && <Slot />}
          </span>
        );
      });
      const Parent = component$<{ show: boolean; childShow: boolean }>((props) => {
        const show = useSignal(props.show);
        return (
          <div
            class="parent"
            onClick$={inlinedQrl(
              () => {
                console.log('parent.click');
                const [show] = useLexicalScope();
                show.value = !show.value;
              },
              's_onClickParent',
              [show]
            )}
          >
            <Child show={props.childShow}>{show.value && 'child-content'}</Child>
          </div>
        );
      });
      it.todo('should work when parent removes content', async () => {
        const { vNode, document } = await render(<Parent show={true} childShow={true} />, {
          debug,
        });
        expect(vNode).toMatchVDOM(
          <Component>
            <div class="parent">
              <Component>
                <span class="child">
                  <Projection>child-content</Projection>
                </span>
              </Component>
            </div>
          </Component>
        );
        await trigger(document.body, 'button.parent', 'click');
        console.log(String(vNode));
        expect(vNode).toMatchVDOM(
          <Component>
            <div class="parent">
              <Component>
                <span class="child">
                  <Projection>{''}</Projection>
                </span>
              </Component>
            </div>
          </Component>
        );
      });
      it.todo('should work when child removes projection', async () => {});
      it.todo('should work when parent adds content', async () => {});
      it.todo('should work when child adds projection', async () => {});
    });
    describe('regression', () => {
      it('#1630', async () => {
        const Child = component$(() => <b>CHILD</b>);
        const Issue1630 = component$((props) => {
          const store = useStore({ open: true });
          return (
            <>
              <button
                onClick$={inlinedQrl(
                  () => {
                    const [store] = useLexicalScope();
                    store.open = !store.open;
                  },
                  's_click',
                  [store]
                )}
              ></button>
              <Slot name="static" />
              {store.open && <Slot />}
            </>
          );
        });
        const { vNode, document } = await render(
          <Issue1630>
            <Child />
            <p q:slot="static"></p>
            DYNAMIC
          </Issue1630>,
          { debug }
        );
        expect(document.body.innerHTML).toContain('</p><b>CHILD</b>DYNAMIC');
        await trigger(document.body, 'button', 'click');
        expect(vNode).toMatchVDOM(
          <Component>
            <Fragment>
              <button></button>
              <Projection q:slot="static">
                <p q:slot="static"></p>
              </Projection>
              {''}
            </Fragment>
          </Component>
        );
        expect(document.body.innerHTML).not.toContain('<b>CHILD</b>DYNAMIC');
        await trigger(document.body, 'button', 'click');
        expect(vNode).toMatchVDOM(
          <Component>
            <Fragment>
              <button></button>
              <Projection q:slot="static">
                <p q:slot="static"></p>
              </Projection>
              <Projection q:slot="">
                <Component>
                  <b>{'CHILD'}</b>
                </Component>
                {'DYNAMIC'}
              </Projection>
            </Fragment>
          </Component>
        );
        expect(document.body.innerHTML).toContain('</p><b>CHILD</b>DYNAMIC');
      });

      it('#2688', async () => {
        const Switch = component$((props: { name: string }) => {
          return <Slot name={props.name} />;
        });

        const Issue2688 = component$(({ count }: { count: number }) => {
          const store = useStore({ flip: false });

          return (
            <>
              <button
                onClick$={inlinedQrl(
                  () => {
                    const [store] = useLexicalScope();
                    store.flip = !store.flip;
                  },
                  's_click',
                  [store]
                )}
              >
                Toggle
              </button>
              <div>
                <Switch name={store.flip ? 'b' : 'a'}>
                  <div q:slot="a">Alpha {count}</div>
                  <div q:slot="b">Bravo {count}</div>
                </Switch>
              </div>
            </>
          );
        });

        const { vNode, document } = await render(
          <section>
            <Issue2688 count={123} />
          </section>,
          { debug }
        );
        expect(vNode).toMatchVDOM(
          <section>
            <Component>
              <Fragment>
                <button>Toggle</button>
                <div>
                  <Component>
                    <Projection>
                      <div q:slot="a">Alpha {'123'}</div>
                    </Projection>
                  </Component>
                </div>
              </Fragment>
            </Component>
          </section>
        );
        await trigger(document.body, 'button', 'click');
        expect(vNode).toMatchVDOM(
          <section>
            <Component>
              <Fragment>
                <button>Toggle</button>
                <div>
                  <Component>
                    <Projection>
                      <div q:slot="b">Bravo {'123'}</div>
                    </Projection>
                  </Component>
                </div>
              </Fragment>
            </Component>
          </section>
        );
      });
    });
  });
});
