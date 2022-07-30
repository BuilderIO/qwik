import { ElementFixture, trigger } from '../../testing/element-fixture';
import { expectDOM } from '../../testing/expect-dom.unit';
import { getTestPlatform } from '../../testing/platform';
import { component$ } from '../component/component.public';
import { runtimeQrl } from '../import/qrl';
import { pauseContainer } from '../object/store';
import { useLexicalScope } from '../use/use-lexical-scope.public';
import { useRef, useStore } from '../use/use-store.public';
import { ComponentScopedStyles, ComponentStylesPrefixContent } from '../util/markers';
import { useClientEffect$, useServerMount$, useWatch$ } from '../use/use-watch';
import { useCleanup$ } from '../use/use-on';
import { Slot } from './jsx/slot.public';
import { notifyChange } from './notify-render';
import { render } from './render.public';
import { useStyles$ } from '../use/use-styles';
import { equal, ok, match } from 'uvu/assert';
import { suite } from 'uvu';
import { Host } from './jsx/host.public';
import type { h } from './jsx/factory';

const renderSuite = suite('render');
renderSuite('should render basic content', async () => {
  const fixture = new ElementFixture();
  await render(fixture.host, <div></div>);
  await expectRendered(fixture, <div></div>);
  equal(fixture.host.getAttribute('q:version'), '');
  equal(fixture.host.getAttribute('q:container'), 'resumed');

  await pauseContainer(fixture.host);
  equal(fixture.host.getAttribute('q:container'), 'paused');
});

renderSuite('should only render string/number', async () => {
  const fixture = new ElementFixture();
  await render(
    fixture.host,
    <div>
      {'string'}
      {123}
      {false}
      {true}
      {null}
      {undefined}
      {[]}
      {function () {}}
    </div>
  );
  await expectRendered(
    fixture,
    <div>
      {'string'}
      {'123'}
    </div>
  );
});

renderSuite('should serialize events correctly', async () => {
  const fixture = new ElementFixture();
  await render(
    fixture.host,
    <div
      onMouseDown$={() => {}}
      onKeyUp$={() => {}}
      onDblClick$={() => {}}
      on-DblClick$={() => {}}
      onQVisible$={() => {}}
      document:onLoad$={() => {}}
      document:onThing$={() => {}}
      document:on-Thing$={() => {}}
      window:onScroll$={() => {}}
      window:on-Scroll$={() => {}}
    ></div>
  );
  const Div = 'div' as any;
  await expectRendered(
    fixture,
    <Div
      on:mousedown="/runtimeQRL#*"
      on:keyup="/runtimeQRL#*"
      on:dblclick="/runtimeQRL#*"
      on:qvisible="/runtimeQRL#*"
      on-document:load="/runtimeQRL#*"
      on-document:thing="/runtimeQRL#*"
      on-window:scroll="/runtimeQRL#*"
      {...{
        'on:-dbl-click': '/runtimeQRL#*',
        'on-document:-thing': '/runtimeQRL#*',
        'on-window:-scroll': '/runtimeQRL#*',
      }}
    ></Div>
  );
});
renderSuite('should serialize boolean attributes correctly', async () => {
  const fixture = new ElementFixture();
  await render(fixture.host, <input required={true} disabled={false}></input>);
  await expectRendered(fixture, <input required></input>);
});
renderSuite('should render into a document', async () => {
  const fixture = new ElementFixture();
  await render(
    fixture.document,
    <html>
      <head></head>
      <body>WORKS</body>
    </html>
  );
  equal(fixture.document.body.innerHTML, 'WORKS');
});
renderSuite('should accept and render host:tagName', async () => {
  const fixture = new ElementFixture();
  const tag: keyof HTMLElementTagNameMap = 'article';
  await render(fixture.host, <HelloWorld host:tagName={tag} />);
  equal(getFirstNode(fixture.host).tagName, tag.toUpperCase());
});
renderSuite('should render attributes', async () => {
  const fixture = new ElementFixture();
  await render(fixture.host, <div id="abc" title="bar" preventdefault:click></div>);
  await expectRendered(fixture, <div title="bar" id="abc" preventdefault:click></div>);
});

renderSuite('should render style only for defined attributes', async () => {
  const fixture = new ElementFixture();
  await render(
    fixture.host,
    <div id="both" style={{ color: 'red', display: 'block' }}>
      <div id="only-color" style={{ display: undefined as unknown as string, color: 'red' }}></div>
      <div id="no-style" style={{ display: undefined as unknown as string }}></div>
    </div>
  );
  await expectRendered(
    fixture,
    <div id="both" style="color:red;display:block">
      <div id="only-color" style="color:red"></div>
      <div id="no-style"></div>
    </div>
  );
});

renderSuite('should render children', async () => {
  const fixture = new ElementFixture();
  await render(
    fixture.host,
    <div>
      <span>text</span>
    </div>
  );
  await expectRendered(
    fixture,
    <div>
      <span>text</span>
    </div>
  );
});

renderSuite('should render svg', async () => {
  const fixture = new ElementFixture();
  await render(
    fixture.host,
    <svg viewBox="0 0 100 100">
      <span>text</span>
    </svg>
  );
  await expectRendered(
    fixture,
    <svg viewBox="0 0 100 100">
      <span>text</span>
    </svg>
  );
});

renderSuite('should render a component', async () => {
  const fixture = new ElementFixture();

  await render(fixture.host, <HelloWorld name="World" preventdefault:click />);
  await expectRendered(
    fixture,
    <hello-world preventdefault:click>
      <span>
        {'Hello'} {'World'}
      </span>
    </hello-world>
  );
});

renderSuite('should render component external props', async () => {
  const fixture = new ElementFixture();

  await render(
    fixture.host,
    <RenderProps
      thing="World"
      class="foo"
      id="123"
      q:slot="start"
      aria-hidden="true"
      data-value="hello world"
      key={'special'}
      href="/path"
      host:title="Custom title"
      host:onClick$={() => {}}
      host:on-ClicK$={() => {}}
      document:onLoad$={() => {}}
      window:onScroll$={() => {}}
      preventDefault:click
    />
  );
  await expectRendered(
    fixture,
    <render-props
      q:host=""
      q:slot="start"
      class="foo"
      id="123"
      href="/path"
      aria-hidden="true"
      data-value="hello world"
      title="Custom title"
      on:click="/runtimeQRL#*"
      on-document:load="/runtimeQRL#*"
      on-window:scroll="/runtimeQRL#*"
      preventdefault:click
      {...{
        'on:-clic-k': '/runtimeQRL#*',
      }}
    >
      <span>{'{"thing":"World","href":"/path"}'}</span>
    </render-props>
  );
});

renderSuite('should render a blank component', async () => {
  const fixture = new ElementFixture();

  await render(fixture.host, <InnerHTMLComponent />);
  await expectRendered(
    fixture,
    <div>
      <div>
        <span>WORKS</span>
      </div>
    </div>
  );
  notifyChange(getFirstNode(fixture.host));
  await getTestPlatform(fixture.document).flush();
  await expectRendered(
    fixture,
    <div>
      <div>
        <span>WORKS</span>
      </div>
    </div>
  );
});

renderSuite('should render a div then a component', async () => {
  const fixture = new ElementFixture();

  await render(fixture.host, <ToggleRootComponent />);
  await expectRendered(
    fixture,
    <div q:host="" aria-hidden="false">
      <div class="normal">Normal div</div>
      <button>toggle</button>
    </div>
  );
  await trigger(fixture.host, 'button', 'click');
  await expectRendered(
    fixture,
    <div q:host="" aria-hidden="true">
      <div q:host="">
        <div>this is ToggleChild</div>
      </div>
      <button>toggle</button>
    </div>
  );
});

renderSuite('should process clicks', async () => {
  const fixture = new ElementFixture();

  await render(fixture.host, <Counter step={5} />);
  await expectRendered(
    fixture,
    <div>
      <button>-</button>
      <span>0</span>
      <button>+</button>
    </div>
  );
  await trigger(fixture.host, 'button.increment', 'click');
  await expectRendered(
    fixture,
    <div>
      <button>-</button>
      <span>5</span>
      <button>+</button>
    </div>
  );
});

renderSuite('should project no content', async () => {
  const fixture = new ElementFixture();

  await render(fixture.host, <Project></Project>);
  await expectRendered(
    fixture,
    <project>
      <section>
        <q:slot>
          <q:fallback>..default..</q:fallback>
        </q:slot>
        <q:slot name="details">
          <q:fallback>..details..</q:fallback>
        </q:slot>
        <q:slot name="description">
          <q:fallback>..description..</q:fallback>
        </q:slot>
      </section>
    </project>
  );
});

renderSuite('should project un-named slot text', async () => {
  const fixture = new ElementFixture();

  await render(fixture.host, <Project>projection</Project>);
  await expectRendered(
    fixture,
    <project>
      <section>
        <q:slot>
          <q:fallback>..default..</q:fallback>
          projection
        </q:slot>
        <q:slot name="details">
          <q:fallback>..details..</q:fallback>
        </q:slot>
        <q:slot name="description">
          <q:fallback>..description..</q:fallback>
        </q:slot>
      </section>
    </project>
  );
});

renderSuite('should project un-named slot component', async () => {
  const fixture = new ElementFixture();

  await render(
    fixture.host,
    <Project>
      <HelloWorld />
    </Project>
  );
});

renderSuite('should project named slot component', async () => {
  const fixture = new ElementFixture();

  await render(
    fixture.host,
    <Project>
      PROJECTION
      <span q:slot="details">DETAILS</span>
      <span q:slot="description">DESCRIPTION</span>
    </Project>
  );
  await expectRendered(
    fixture,
    <project>
      <section>
        <q:slot>
          <q:fallback>..default..</q:fallback>
          PROJECTION
        </q:slot>
        <q:slot name="details">
          <q:fallback>..details..</q:fallback>
          <span q:slot="details">DETAILS</span>
        </q:slot>
        <q:slot name="description">
          <q:fallback>..description..</q:fallback>
          <span q:slot="description">DESCRIPTION</span>
        </q:slot>
      </section>
    </project>
  );
});

renderSuite('should project multiple slot with same name', async () => {
  const fixture = new ElementFixture();

  await render(
    fixture.host,
    <Project>
      <span q:slot="details">DETAILS1</span>
      <span q:slot="details">DETAILS2</span>
      <span q:slot="ignore">IGNORE</span>
    </Project>
  );
  await expectRendered(
    fixture,
    <project>
      <q:template q:slot="ignore" aria-hidden="true" hidden>
        <span q:slot="ignore">IGNORE</span>
      </q:template>
      <section>
        <q:slot>
          <q:fallback>..default..</q:fallback>
        </q:slot>
        <q:slot name="details">
          <q:fallback>..details..</q:fallback>
          <span q:slot="details">DETAILS1</span>
          <span q:slot="details">DETAILS2</span>
        </q:slot>
        <q:slot name="description">
          <q:fallback>..description..</q:fallback>
        </q:slot>
      </section>
    </project>
  );
});
renderSuite('should not destroy projection when <Project> reruns', async () => {
  const fixture = new ElementFixture();

  await render(
    fixture.host,
    <SimpleProject>
      <span>PROJECTION</span>
    </SimpleProject>
  );
  await expectRendered(
    fixture,
    <project>
      <section>
        <q:slot>
          <q:fallback>..default..</q:fallback>
          <span>PROJECTION</span>
        </q:slot>
      </section>
    </project>
  );
  notifyChange(getFirstNode(fixture.host));
  await getTestPlatform(fixture.document).flush();
  await expectRendered(
    fixture,
    <project>
      <section>
        <q:slot>
          <q:fallback>..default..</q:fallback>
          <span>PROJECTION</span>
        </q:slot>
      </section>
    </project>
  );
});

renderSuite('should render into host component', async () => {
  const fixture = new ElementFixture();

  await render(
    fixture.host,
    <HostFixture
      hostAttrs={JSON.stringify({
        id: 'TEST',
        class: { thing: true },
        name: 'NAME',
      })}
      content="CONTENT"
    />
  );
  await expectRendered(
    fixture,
    <host-fixture id="TEST" name="NAME" class="thing">
      CONTENT
    </host-fixture>
  );
});

renderSuite('should render a promise', async () => {
  const fixture = new ElementFixture();
  await render(fixture.host, <div>{Promise.resolve('WORKS')}</div>);
  await expectRendered(fixture, <div>WORKS</div>);
});

renderSuite('should render a component with hooks', async () => {
  const fixture = new ElementFixture();

  await render(fixture.host, <Hooks />);
  await expectRendered(
    fixture,
    <div>
      <div id="effect"></div>
      <div id="effect-destroy"></div>

      <div id="watch">true</div>
      <div id="watch-destroy"></div>

      <div id="server-mount">true</div>
      <div id="cleanup"></div>

      <div id="reference">true</div>
    </div>
  );

  await pauseContainer(fixture.host);
  await expectRendered(
    fixture,
    <div>
      <div id="effect"></div>
      <div id="effect-destroy"></div>

      <div id="watch">true</div>
      <div id="watch-destroy">true</div>

      <div id="server-mount">true</div>
      <div id="cleanup">true</div>

      <div id="reference">true</div>
    </div>
  );
});

renderSuite('should insert a style', async () => {
  const fixture = new ElementFixture();

  await render(fixture.host, <HelloWorld name="World" />);
  const hellWorld = fixture.host.querySelector('hello-world')!;
  const scopedStyleId = hellWorld.getAttribute(ComponentScopedStyles);
  ok(scopedStyleId);
  const style = fixture.document.querySelector(`style[q\\:style="${scopedStyleId}"]`);
  match(style!.textContent!, 'color: red');
  await expectRendered(
    fixture,
    <hello-world>
      <span class={ComponentStylesPrefixContent + scopedStyleId}>
        {'Hello'} {'World'}
      </span>
    </hello-world>
  );
});
renderSuite('should render #text nodes', async () => {
  const fixture = new ElementFixture();

  const lines = ['hola', 'adios'];
  await render(
    fixture.host,
    <svg viewBox="0 0 100 4" class={'svg-container'}>
      {lines.map((a) => {
        return (
          <text class={'svg-text'} style={{ color: a }}>
            Hola {a}
          </text>
        );
      })}
    </svg>
  );
  await expectRendered(
    fixture,
    <svg viewBox="0 0 100 4" class="svg-container">
      <text class={'svg-text'} style="color:hola">
        Hola {'hola'}
      </text>
      <text class={'svg-text'} style="color:adios">
        Hola {'adios'}
      </text>
    </svg>
  );

  // Ensure all SVG elements have the SVG namespace
  const namespaces = Array.from(fixture.host.querySelectorAll('text')).map(
    (e: any) => e.namespaceURI
  );
  equal(namespaces, ['http://www.w3.org/2000/svg', 'http://www.w3.org/2000/svg']);
});

renderSuite('should render camelCase attributes', async () => {
  const fixture = new ElementFixture();

  await render(
    fixture.host,
    <svg id="my-svg" viewBox="0 0 100 4" preserveAspectRatio="none">
      <a href="/path"></a>
    </svg>
  );
  await expectRendered(
    fixture,
    <svg id="my-svg" preserveAspectRatio="none" viewBox="0 0 100 4">
      <a href="/path"></a>
    </svg>
  );
});

renderSuite('should render path', async () => {
  const fixture = new ElementFixture();

  await render(
    fixture.host,
    <div>
      <a href="#">Dude!!</a>
      <svg id="my-svg" viewBox="0 0 100 4" preserveAspectRatio="none">
        <path
          id="my-svg-path"
          d="M 0,2 L 100,2"
          stroke="#FFEA82"
          stroke-width="4"
          fill-opacity="0"
        />
      </svg>
    </div>
  );
  await expectRendered(
    fixture,
    <div>
      <a href="#">Dude!!</a>
      <svg id="my-svg" viewBox="0 0 100 4" preserveAspectRatio="none">
        <path
          id="my-svg-path"
          d="M 0,2 L 100,2"
          stroke="#FFEA82"
          stroke-width="4"
          fill-opacity="0"
        />
      </svg>
    </div>
  );
});

renderSuite('should render foreignObject properly', async () => {
  const fixture = new ElementFixture();

  const Text = 'text' as any;
  await render(
    fixture.host,
    <div class="is-html">
      <Text class="is-html" shouldKebab="true">
        Start
      </Text>
      <svg class="is-svg" preserveAspectRatio="true">
        <Text class="is-svg" shouldCamelCase="true">
          start
        </Text>
        <foreignObject class="is-svg">
          <div class="is-html">hello</div>
          <svg class="is-svg">
            <feGaussianBlur class="is-svg"></feGaussianBlur>
            <foreignObject class="is-svg">
              <foreignObject class="is-html"></foreignObject>
              <div class="is-html">Still outside svg</div>
            </foreignObject>
          </svg>
          <feGaussianBlur class="is-html">bye</feGaussianBlur>
        </foreignObject>
        <text className="is-svg">Hello</text>
        <text className="is-svg">Bye</text>
      </svg>
      <text class="is-html">end</text>
    </div>
  );
  for (const el of Array.from(fixture.host.querySelectorAll('.is-html'))) {
    equal(el.namespaceURI, 'http://www.w3.org/1999/xhtml');
  }
  for (const el of Array.from(fixture.host.querySelectorAll('.is-svg'))) {
    equal(el.namespaceURI, 'http://www.w3.org/2000/svg');
  }

  await expectRendered(
    fixture,
    <div class="is-html">
      <Text class="is-html" shouldkebab="true">
        Start
      </Text>
      <svg class="is-svg" preserveAspectRatio="true">
        <Text class="is-svg" shouldCamelCase="true">
          start
        </Text>
        <foreignObject class="is-svg">
          <div class="is-html">hello</div>
          <svg class="is-svg">
            <feGaussianBlur class="is-svg"></feGaussianBlur>
            <foreignObject class="is-svg">
              <foreignobject class="is-html"></foreignobject>
              <div class="is-html">Still outside svg</div>
            </foreignObject>
          </svg>
          <fegaussianblur class="is-html">bye</fegaussianblur>
        </foreignObject>
        <text class="is-svg">Hello</text>
        <text class="is-svg">Bye</text>
      </svg>
      <text class="is-html">end</text>
    </div>
  );
});

async function expectRendered(
  fixture: ElementFixture,
  expected: h.JSX.Element,
  expectedErrors: string[] = []
) {
  const firstNode = getFirstNode(fixture.host);
  return await expectDOM(firstNode, expected, expectedErrors);
}

function getFirstNode(el: Element) {
  let firstNode = el.firstElementChild!;
  while (firstNode.nodeName === 'STYLE') {
    firstNode = firstNode.nextElementSibling!;
  }
  return firstNode;
}
//////////////////////////////////////////////////////////////////////////////////////////
// Hello World
//////////////////////////////////////////////////////////////////////////////////////////
export const HelloWorld = component$(
  (props: { name?: string }) => {
    useStyles$(`span.� { color: red; }`);
    const state = useStore({ salutation: 'Hello' });
    return (
      <span>
        {state.salutation} {props.name || 'World'}
      </span>
    );
  },
  {
    tagName: 'hello-world',
  }
);

//////////////////////////////////////////////////////////////////////////////////////////
// Hello World
//////////////////////////////////////////////////////////////////////////////////////////
export const RenderProps = component$(
  (props: { thing?: string; href?: string }) => {
    return (
      <Host href={props.href}>
        <span>{JSON.stringify(props)}</span>
      </Host>
    );
  },
  {
    tagName: 'render-props',
  }
);

//////////////////////////////////////////////////////////////////////////////////////////
// Counter
//////////////////////////////////////////////////////////////////////////////////////////

export const Counter = component$((props: { step?: number }) => {
  const state = useStore({ count: 0 });
  const step = Number(props.step || 1);
  return (
    <>
      <button class="decrement" onClick$={runtimeQrl(Counter_add, [state, { value: -step }])}>
        -
      </button>
      <span>{state.count}</span>
      <button class="increment" onClick$={runtimeQrl(Counter_add, [state, { value: step }])}>
        +
      </button>
    </>
  );
});
export const Counter_add = () => {
  const [state, args] = useLexicalScope();
  state.count += args.value;
};

//////////////////////////////////////////////////////////////////////////////////////////
// Project
//////////////////////////////////////////////////////////////////////////////////////////
export const Project = component$(
  () => {
    return (
      <section>
        <Slot>..default..</Slot>
        <Slot name="details">..details..</Slot>
        <Slot name="description">..description..</Slot>
      </section>
    );
  },
  {
    tagName: 'project',
  }
);

export const SimpleProject = component$(
  () => {
    return (
      <section>
        <Slot>..default..</Slot>
      </section>
    );
  },
  {
    tagName: 'project',
  }
);

//////////////////////////////////////////////////////////////////////////////////////////
// HostFixture
//////////////////////////////////////////////////////////////////////////////////////////
export const HostFixture = component$(
  (props: { hostAttrs?: string; content?: string }) => {
    return <Host {...JSON.parse(props.hostAttrs || '{}')}>{props.content}</Host>;
  },
  {
    tagName: 'host-fixture',
  }
);

//////////////////////////////////////////////////////////////////////////////////////////
export const InnerHTMLComponent = component$(() => {
  const html = '<span>WORKS</span>';
  return (
    <div innerHTML={html}>
      <div>not rendered</div>
    </div>
  );
});

//////////////////////////////////////////////////////////////////////////////////////////

export const ToggleRootComponent = component$(() => {
  const state = useStore({
    cond: false,
  });
  return (
    <Host aria-hidden={state.cond ? 'true' : 'false'}>
      {state.cond ? <ToggleChild /> : <div class="normal">Normal div</div>}
      <button onClick$={() => (state.cond = !state.cond)}>toggle</button>
    </Host>
  );
});

export const ToggleChild = component$(() => {
  return (
    <Host>
      <div>this is ToggleChild</div>
    </Host>
  );
});

//////////////////////////////////////////////////////////////////////////////////////////
export const Hooks = component$(() => {
  const watchDestroyDiv = useRef();
  const effectDiv = useRef();
  const effectDestroyDiv = useRef();
  const cleanupDiv = useRef();

  const state = useStore({
    watch: 'false',
    server: 'false',
  });

  useCleanup$(() => {
    cleanupDiv.current!.textContent = 'true';
  });

  useWatch$(() => {
    state.watch = 'true';
    return () => {
      watchDestroyDiv.current!.textContent = 'true';
    };
  });

  useClientEffect$(() => {
    effectDiv.current!.textContent = 'true';
    return () => {
      effectDestroyDiv.current!.textContent = 'true';
    };
  });

  useServerMount$(() => {
    state.server = 'true';
  });

  return (
    <Host>
      <div id="effect" ref={effectDiv}></div>
      <div id="effect-destroy" ref={effectDestroyDiv}></div>

      <div id="watch">{state.watch}</div>
      <div id="watch-destroy" ref={watchDestroyDiv}></div>

      <div id="server-mount">{state.server}</div>
      <div id="cleanup" ref={cleanupDiv}></div>

      <div id="reference">true</div>
    </Host>
  );
});

renderSuite.run();
