import { beforeEach, describe, expect, it } from 'vitest';
import { trigger } from '../../testing/element-fixture';
import { component$, componentQrl } from '../component/component.public';
import { _fnSignal, _jsxC, _jsxQ } from '../internal';
import { inlinedQrl } from '../qrl/qrl';
import {
  Fragment as Component,
  Fragment,
  Fragment as InlineComponent,
  Fragment as Projection,
  Fragment as Signal,
} from '../render/jsx/jsx-runtime';
import { Slot } from '../render/jsx/slot.public';
import { useLexicalScope } from '../use/use-lexical-scope.public';
import { useSignal } from '../use/use-signal';
import { useStore } from '../use/use-store.public';
import { useTask$ } from '../use/use-task';
import { vnode_getNextSibling } from './client/vnode';
import { domRender, ssrRenderToDom } from './rendering.unit-util';
import './vdom-diff.unit-util';

const debug = false;

/**
 * Below are helper components that are constant. They have to be in the top level scope so that the
 * optimizer doesn't consider them as captured scope. It would be great if the optimizer could
 * detect that these are constant and don't require capturing.
 */
const ChildSlotInline = (props: { children: any }) => {
  return (
    <span>
      <Slot />({props.children})
    </span>
  );
};

describe.each([
  // { render: ssrRenderToDom }, //
  { render: domRender }, //
])('$render.name: projection', ({ render }) => {
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
      return <ChildSlotInline>child-content</ChildSlotInline>;
    });
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
  describe('ensureProjectionResolved', () => {
    (globalThis as any).log = [] as string[];
    beforeEach(() => {
      (globalThis as any).log.length = 0;
    });
    const Child = component$<{ show: boolean }>((props) => {
      (globalThis as any).log.push('render:Child');
      const show = useSignal(props.show);
      return (
        <span
          class="child"
          onClick$={() => {
            (globalThis as any).log.push('click:Child');
            show.value = !show.value;
          }}
        >
          {show.value && <Slot />}
        </span>
      );
    });
    const Parent = component$<{ content: boolean; slot: boolean }>((props) => {
      (globalThis as any).log.push('render:Parent');
      const show = useSignal(props.content);
      return (
        <div
          class="parent"
          onClick$={() => {
            (globalThis as any).log.push('click:Parent');
            show.value = !show.value;
          }}
        >
          <Child show={props.slot}>{show.value && 'child-content'}</Child>
        </div>
      );
    });
    it('should work when parent removes content', async () => {
      const { vNode, document } = await render(<Parent content={true} slot={true} />, {
        debug,
      });
      expect(vNode).toMatchVDOM(
        <Component>
          <div class="parent">
            <Component>
              <span class="child">
                <Projection>
                  <Signal>child-content</Signal>
                </Projection>
              </span>
            </Component>
          </div>
        </Component>
      );
      (globalThis as any).log.length = 0;
      await trigger(document.body, '.parent', 'click');
      expect(vNode).toMatchVDOM(
        <Component>
          <div class="parent">
            <Component>
              <span class="child">
                <Projection>
                  <Signal>{''}</Signal>
                </Projection>
              </span>
            </Component>
          </div>
        </Component>
      );
      expect((globalThis as any).log).toEqual(['click:Parent']);
    });
    it('should work when child removes projection', async () => {
      const { vNode, document } = await render(<Parent content={true} slot={true} />, {
        debug,
      });
      expect(vNode).toMatchVDOM(
        <Component>
          <div class="parent">
            <Component>
              <span class="child">
                <Projection>
                  <Signal>child-content</Signal>
                </Projection>
              </span>
            </Component>
          </div>
        </Component>
      );
      await expect(document.querySelector('.parent')).toMatchDOM(
        <div class="parent">
          <span class="child">child-content</span>
        </div>
      );
      (globalThis as any).log.length = 0;
      // console.log('--- HIDE PROJECTION ---');
      await trigger(document.body, '.child', 'click'); // hide projection
      // console.log('---');
      expect((globalThis as any).log).toEqual(['click:Child', 'render:Child']);
      expect(vNode).toMatchVDOM(
        <Component>
          <div class="parent">
            <Component>
              <span class="child">{''}</span>
            </Component>
          </div>
        </Component>
      );
      await expect(document.querySelector('.parent')).toMatchDOM(
        <div class="parent">
          <span class="child">{''}</span>
        </div>
      );
      (globalThis as any).log.length = 0;
      // console.log('--- HIDE CONTENT ---');
      await trigger(document.body, '.parent', 'click'); // hide content
      // console.log('---');
      expect((globalThis as any).log).toEqual(['click:Parent']);
      expect(vNode).toMatchVDOM(
        <Component>
          <div class="parent">
            <Component>
              <span class="child">{''}</span>
            </Component>
          </div>
        </Component>
      );
      await expect(document.querySelector('.parent')).toMatchDOM(
        <div class="parent">
          <span class="child">{''}</span>
        </div>
      );
      (globalThis as any).log.length = 0;
      // console.log('--- UN-HIDE PROJECTION (no content) ---');
      await trigger(document.body, '.child', 'click'); // un-hide projection (no content)
      // console.log('---');
      expect((globalThis as any).log).toEqual(['click:Child', 'render:Child']);
      expect(vNode).toMatchVDOM(
        <Component>
          <div class="parent">
            <Component>
              <span class="child">
                <Projection>
                  <Signal>{''}</Signal>
                </Projection>
              </span>
            </Component>
          </div>
        </Component>
      );
      await expect(document.querySelector('.parent')).toMatchDOM(
        <div class="parent">
          <span class="child">{''}</span>
        </div>
      );
      (globalThis as any).log.length = 0;
      // console.log('--- RE-ADD CONTENT ---');
      await trigger(document.body, '.parent', 'click');
      // console.log('---');
      expect((globalThis as any).log).toEqual(['click:Parent']);
      expect(vNode).toMatchVDOM(
        <Component>
          <div class="parent">
            <Component>
              <span class="child">
                <Projection>
                  <Signal>child-content</Signal>
                </Projection>
              </span>
            </Component>
          </div>
        </Component>
      );
    });
    it('should work when parent adds content', async () => {
      const { vNode, document } = await render(<Parent content={false} slot={true} />, {
        debug,
      });
      expect(vNode).toMatchVDOM(
        <Component>
          <div class="parent">
            <Component>
              <span class="child">
                <Projection>
                  <Signal>{''}</Signal>
                </Projection>
              </span>
            </Component>
          </div>
        </Component>
      );
      (globalThis as any).log.length = 0;
      await trigger(document.body, '.parent', 'click');
      expect(vNode).toMatchVDOM(
        <Component>
          <div class="parent">
            <Component>
              <span class="child">
                <Projection>
                  <Signal>{'child-content'}</Signal>
                </Projection>
              </span>
            </Component>
          </div>
        </Component>
      );
      expect((globalThis as any).log).toEqual(['click:Parent']);
    });
    it('should work when child adds projection', async () => {
      const { vNode, document } = await render(<Parent content={true} slot={false} />, {
        debug,
      });
      expect(vNode).toMatchVDOM(
        <Component>
          <div class="parent">
            <Component>
              <span class="child">{''}</span>
            </Component>
          </div>
        </Component>
      );
      (globalThis as any).log.length = 0;
      await trigger(document.body, '.child', 'click');
      expect(vNode).toMatchVDOM(
        <Component>
          <div class="parent">
            <Component>
              <span class="child">
                <Projection>
                  <Signal>child-content</Signal>
                </Projection>
              </span>
            </Component>
          </div>
        </Component>
      );
      expect((globalThis as any).log).toEqual(['click:Child', 'render:Child']);
    });
    it('should render projection and insert dangerouslySetInnerHTML', async () => {
      const htmlString = '<strong>A variable here!</strong>';
      const Child = component$(() => {
        return (
          <div>
            <Slot name="content-1" />
            <Slot name="content-2" />
          </div>
        );
      });
      const Parent = component$(() => {
        return (
          <Child>
            <div id="first" q:slot="content-1" dangerouslySetInnerHTML={htmlString} />
            <div
              q:slot="content-2"
              id="second"
              dangerouslySetInnerHTML="<span>here my raw HTML</span>"
              class="after"
            />
          </Child>
        );
      });
      const { document } = await render(<Parent />, { debug });
      await expect(document.querySelector('#first')).toMatchDOM(
        <div id="first" q:slot="content-1">
          <strong>A variable here!</strong>
        </div>
      );
      await expect(document.querySelector('#second')).toMatchDOM(
        <div q:slot="content-2" id="second" class="after">
          <span>here my raw HTML</span>
        </div>
      );
    });

    it('should add and delete projection content inside q:template if slot is initially not visible', async () => {
      const Cmp = component$(() => {
        const show = useSignal(false);
        return (
          <>
            <button onClick$={() => (show.value = !show.value)}></button>
            {show.value && <Slot />}
          </>
        );
      });

      const content = <span>Some content</span>;

      const { document, vNode } = await render(<Cmp>{content}</Cmp>, { debug });
      await expect(document.querySelector('q\\:template')).toMatchDOM(
        <q:template>{content}</q:template>
      );
      expect(vNode).toMatchVDOM(
        <Component>
          <Fragment>
            <button></button>
            {''}
          </Fragment>
        </Component>
      );

      await trigger(document.body, 'button', 'click');
      await expect(document.querySelector('q\\:template')).toMatchDOM(<q:template></q:template>);
      expect(vNode).toMatchVDOM(
        <Component>
          <Fragment>
            <button></button>
            <Projection>{content}</Projection>
          </Fragment>
        </Component>
      );

      await trigger(document.body, 'button', 'click');
      await expect(document.querySelector('q\\:template')).toMatchDOM(
        <q:template>{content}</q:template>
      );
      expect(vNode).toMatchVDOM(
        <Component>
          <Fragment>
            <button></button>
            {''}
          </Fragment>
        </Component>
      );

      await trigger(document.body, 'button', 'click');
      await expect(document.querySelector('q\\:template')).toMatchDOM(<q:template></q:template>);
      expect(vNode).toMatchVDOM(
        <Component>
          <Fragment>
            <button></button>
            <Projection>{content}</Projection>
          </Fragment>
        </Component>
      );
    });

    it('should add and delete projection content inside q:template if slot is initially visible', async () => {
      const Cmp = component$(() => {
        const show = useSignal(true);
        return (
          <>
            <button onClick$={() => (show.value = !show.value)}></button>
            {show.value && <Slot />}
          </>
        );
      });

      const content = <span>Some content</span>;

      const { document } = await render(<Cmp>{content}</Cmp>, { debug });
      expect(document.querySelector('q\\:template')).toBeUndefined();

      await trigger(document.body, 'button', 'click');
      await expect(document.querySelector('q\\:template')).toMatchDOM(
        <q:template>{content}</q:template>
      );

      await trigger(document.body, 'button', 'click');
      await expect(document.querySelector('q\\:template')).toMatchDOM(<q:template></q:template>);

      await trigger(document.body, 'button', 'click');
      await expect(document.querySelector('q\\:template')).toMatchDOM(
        <q:template>{content}</q:template>
      );

      await trigger(document.body, 'button', 'click');
      await expect(document.querySelector('q\\:template')).toMatchDOM(<q:template></q:template>);
    });

    it('should add and delete projection content inside q:template for CSR rerender after SSR', async () => {
      const Child = component$(() => {
        const show = useSignal(false);
        return (
          <>
            <button id="slot" onClick$={() => (show.value = !show.value)}></button>
            {show.value && <Slot />}
          </>
        );
      });

      const content = <span>Some content</span>;

      const Parent = component$(() => {
        const reload = useSignal(0);
        return (
          <>
            <button id="reload" data-v={reload.value} onClick$={() => reload.value++}>
              Reload
            </button>
            <Child key={reload.value}>{content}</Child>
          </>
        );
      });

      const { document } = await render(<Parent />, { debug });
      await expect(document.querySelector('q\\:template')).toMatchDOM(
        <q:template>{content}</q:template>
      );

      await trigger(document.body, '#reload', 'click');
      await trigger(document.body, '#slot', 'click');
      await expect(document.querySelector('q\\:template')).toMatchDOM(<q:template></q:template>);

      await trigger(document.body, '#slot', 'click');
      await expect(document.querySelector('q\\:template')).toMatchDOM(
        <q:template>{content}</q:template>
      );

      await trigger(document.body, '#slot', 'click');
      await expect(document.querySelector('q\\:template')).toMatchDOM(<q:template></q:template>);

      await trigger(document.body, '#slot', 'click');
      await expect(document.querySelector('q\\:template')).toMatchDOM(
        <q:template>{content}</q:template>
      );
    });
  });
  describe('regression', () => {
    it('#1630', async () => {
      const Child = component$(() => <b>CHILD</b>);
      const Issue1630 = component$((props) => {
        const store = useStore({ open: true });
        return (
          <div key="123">
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
          </div>
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
      expect(removeKeyAttrs(document.querySelector('div')?.innerHTML || '')).toContain(
        '</p><b>CHILD</b>DYNAMIC'
      );
      await trigger(document.body, 'button', 'click');
      expect(vNode).toMatchVDOM(
        <Component>
          <div key="123">
            <button></button>
            <Projection>
              <p q:slot="static"></p>
            </Projection>
            {''}
          </div>
        </Component>
      );
      expect(removeKeyAttrs(document.querySelector('div')?.innerHTML || '')).not.toContain(
        '<b>CHILD</b>DYNAMIC'
      );
      await trigger(document.body, 'button', 'click');
      expect(vNode).toMatchVDOM(
        <Component>
          <div key="123">
            <button></button>
            <Projection>
              <p q:slot="static"></p>
            </Projection>
            <Projection>
              <Component>
                <b>{'CHILD'}</b>
              </Component>
              {'DYNAMIC'}
            </Projection>
          </div>
        </Component>
      );
      expect(removeKeyAttrs(document.querySelector('div')?.innerHTML || '')).toContain(
        '</p><b>CHILD</b>DYNAMIC'
      );
    });

    it.skip('#2688', async () => {
      const Switch = component$((props: { name: string }) => {
        return _jsxQ(
          Slot,
          null,
          {
            name: _fnSignal((p0) => p0.name, [props], 'p0.name'),
          },
          null,
          3,
          null
        );
      });

      const Issue2688 = component$<{ count: number }>((props) => {
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
            ></button>
            <div>
              {_jsxC(
                Switch as any,
                {
                  children: [
                    <div q:slot="a">Alpha {props.count}</div>,
                    <div q:slot="b">Bravo {props.count}</div>,
                  ],
                },
                {
                  name: _fnSignal((p0) => (p0.flip ? 'b' : 'a'), [store], 'p0.flip?"b":"a"'),
                },
                1,
                'ub_1'
              )}
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
              <button></button>
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
              <button></button>
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
  it('should cleanup functions inside projection', async () => {
    (globalThis as any).log = [];
    const Child = component$(() => {
      return <Slot />;
    });
    const Cleanup = component$(() => {
      useTask$(() => {
        (globalThis as any).log.push('task');
        return () => {
          (globalThis as any).log.push('cleanup');
        };
      });
      return <div></div>;
    });
    const Parent = component$(() => {
      const show = useSignal(true);
      return (
        <>
          <button onClick$={() => (show.value = false)} />
          {show.value && (
            <Child>
              <Cleanup />
            </Child>
          )}
        </>
      );
    });
    const log = (globalThis as any).log;
    const { document } = await render(<Parent />, { debug });
    const isSsr = render === ssrRenderToDom;
    expect(log).toEqual(isSsr ? ['task', 'cleanup'] : ['task']);
    log.length = 0;
    await trigger(document.body, 'button', 'click');
    expect(log).toEqual(isSsr ? [] : ['cleanup']);
  });
});

function removeKeyAttrs(innerHTML: string): any {
  return innerHTML.replaceAll(/ q:key="[^"]+"/g, '');
}
