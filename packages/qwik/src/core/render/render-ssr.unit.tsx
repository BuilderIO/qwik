import type { JSXNode } from '@builder.io/qwik/jsx-runtime';
import { suite } from 'uvu';
import { equal } from 'uvu/assert';
import { createSimpleDocument } from '../../server/document';

import type { StreamWriter } from '../../server/types';
import { component$ } from '../component/component.public';
import { $ } from '../import/qrl.public';
import { createContext, useContextProvider } from '../use/use-context';
import { useOn, useOnDocument, useOnWindow } from '../use/use-on';
import { Ref, useRef } from '../use/use-store.public';
import { useClientEffect$ } from '../use/use-watch';
import { delay } from '../util/promises';
import { Host } from './jsx/host.public';
import { Slot } from './jsx/slot.public';
import { renderSSR } from './render-ssr';

const renderSSRSuite = suite('renderSSR');
renderSSRSuite('render attributes', async () => {
  await testSSR(
    <div id="stuff" aria-required="true" role=""></div>,
    '<div id="stuff" aria-required="true" role></div>'
  );
});

renderSSRSuite('render className', async () => {
  await testSSR(<div className="stuff"></div>, '<div class="stuff"></div>');
});

renderSSRSuite('render class', async () => {
  await testSSR(
    <div
      class={{
        stuff: true,
        other: false,
      }}
    ></div>,
    '<div class="stuff"></div>'
  );
});

renderSSRSuite('render contentEditable', async () => {
  await testSSR(<div contentEditable="true"></div>, '<div contenteditable="true"></div>');
});

renderSSRSuite('self closing elements', async () => {
  await testSSR(<input></input>, '<input>');
});

renderSSRSuite('single simple children', async () => {
  await testSSR(<div>hola</div>, '<div>hola</div>');
  await testSSR(<div>{2}</div>, '<div>2</div>');
  await testSSR(<div>{true}</div>, '<div></div>');
  await testSSR(<div>{false}</div>, '<div></div>');
  await testSSR(<div>{null}</div>, '<div></div>');
  await testSSR(<div>{undefined}</div>, '<div></div>');
});

renderSSRSuite('events', async () => {
  await testSSR(
    <div onClick$={() => console.warn('hol')}>hola</div>,
    '<div q:id="0" on:click="/runtimeQRL#_">hola</div>'
  );
  await testSSR(
    <div document:onClick$={() => console.warn('hol')}>hola</div>,
    '<div q:id="0" on-document:click="/runtimeQRL#_">hola</div>'
  );
  await testSSR(
    <div window:onClick$={() => console.warn('hol')}>hola</div>,
    '<div q:id="0" on-window:click="/runtimeQRL#_">hola</div>'
  );
  await testSSR(
    <input onInput$={() => console.warn('hol')} />,
    '<input q:id="0" on:input="/runtimeQRL#_">'
  );
});

renderSSRSuite('ref', async () => {
  const ref = { current: undefined } as Ref<any>;
  await testSSR(<div ref={ref}></div>, '<div q:id="0"></div>');
});

renderSSRSuite('single complex children', async () => {
  await testSSR(
    <div>
      <p>hola</p>
    </div>,
    '<div><p>hola</p></div>'
  );
  await testSSR(
    <div>
      hola {2}
      <p>hola</p>
    </div>,
    '<div>hola 2<p>hola</p></div>'
  );
});

renderSSRSuite('single multiple children', async () => {
  await testSSR(
    <ul>
      <li>1</li>
      <li>2</li>
      <li>3</li>
      <li>4</li>
      <li>5</li>
      <li>6</li>
      <li>7</li>
      <li>8</li>
    </ul>,
    '<ul><li>1</li><li>2</li><li>3</li><li>4</li><li>5</li><li>6</li><li>7</li><li>8</li></ul>'
  );
});

renderSSRSuite('using fragment', async () => {
  await testSSR(
    <ul>
      <>
        <li>1</li>
        <li>2</li>
      </>
      <li>3</li>
      <>
        <li>4</li>
        <>
          <li>5</li>
          <>
            <>
              <li>6</li>
            </>
          </>
        </>
        <li>7</li>
      </>
      <li>8</li>
    </ul>,
    '<ul><li>1</li><li>2</li><li>3</li><li>4</li><li>5</li><li>6</li><li>7</li><li>8</li></ul>'
  );
});
renderSSRSuite.run();

renderSSRSuite('using promises', async () => {
  await testSSR(<div>{Promise.resolve('hola')}</div>, '<div>hola</div>');
  await testSSR(<div>{Promise.resolve(<p>hola</p>)}</div>, '<div><p>hola</p></div>');

  await testSSR(
    <ul>
      {Promise.resolve(<li>1</li>)}
      <li>2</li>
      {delay(100).then(() => (
        <li>3</li>
      ))}
      {delay(10).then(() => (
        <li>4</li>
      ))}
    </ul>,
    [
      '<ul',
      '>',
      '<li',
      '>',
      '1',
      '</li>',
      '<li',
      '>',
      '2',
      '</li>',
      '<li',
      '>',
      '3',
      '</li>',
      '<li',
      '>',
      '4',
      '</li>',
      '</ul>',
    ]
  );
});

renderSSRSuite('using component', async () => {
  await testSSR(
    <MyCmp />,
    '<section q:key="sX:" class="my-cmp" q:id="0" q:host><div>MyCmp{}</div></section>'
  );
});

renderSSRSuite('using component with key', async () => {
  await testSSR(
    <MyCmp key="hola" />,
    '<section q:key="sX:hola" class="my-cmp" q:id="0" q:host><div>MyCmp{}</div></section>'
  );
});

renderSSRSuite('using component props', async () => {
  await testSSR(
    <MyCmp id="12" host:prop="attribute" prop="12" />,
    '<section id="12" prop="attribute" q:key="sX:" class="my-cmp" q:id="0" q:host><div>MyCmp{"prop":"12"}</div></section>'
  );
});

renderSSRSuite('using component project content', async () => {
  await testSSR(
    <MyCmp>
      <div>slot</div>
    </MyCmp>,
    '<section q:key="sX:" class="my-cmp" q:id="0" q:host><div>MyCmp{}</div><q:template><div>slot</div></q:template></section>'
  );
});

renderSSRSuite('using complex component', async () => {
  await testSSR(
    <MyCmpComplex></MyCmpComplex>,
    '<div q:key="sX:" q:id="0" q:host on:click="/runtimeQRL#_"><div q:id="1"><button q:id="2" on:click="/runtimeQRL#_">Click</button><q:slot q:sref="0"><q:fallback></q:fallback></q:slot></div></div>'
  );
});

renderSSRSuite('using complex component with slot', async () => {
  await testSSR(
    <MyCmpComplex>Hola</MyCmpComplex>,
    '<div q:key="sX:" q:id="0" q:host on:click="/runtimeQRL#_"><div q:id="1"><button q:id="2" on:click="/runtimeQRL#_">Click</button><q:slot q:sref="0"><q:fallback></q:fallback>Hola</q:slot></div></div>'
  );
});

renderSSRSuite('<head>', async () => {
  await testSSR(
    <html>
      <head>
        <title>hola</title>
        <>
          <meta></meta>
          <div>
            <p>hola</p>
          </div>
        </>
      </head>
    </html>,
    `
  <html q:container="paused" q:version=undefined>
    <head>
      <title q:head>hola</title>
      <meta q:head>
      <div q:head>
        <p>hola</p>
      </div>
    </head>
  </html>`
  );
});

renderSSRSuite('nested slots', async () => {
  await testSSR(
    <SimpleSlot name="root">
      <SimpleSlot name="level 1">
        <SimpleSlot name="level 2">
          BEFORE CONTENT
          <div>Content</div>
          AFTER CONTENT
        </SimpleSlot>
      </SimpleSlot>
    </SimpleSlot>,
    `
  <div q:key="sX:" id="root" q:id="0" q:host>
    Before root
    <q:slot q:sref="0">
      <q:fallback></q:fallback>
      <div q:key="sX:" id="level 1" q:id="1" q:host>
        Before level 1
        <q:slot q:sref="1">
          <q:fallback></q:fallback>
          <div q:key="sX:" id="level 2" q:id="2" q:host>
            Before level 2
            <q:slot q:sref="2">
              <q:fallback></q:fallback>
              BEFORE CONTENT
              <div>Content</div>
              AFTER CONTENT
            </q:slot>
            After level 2
          </div>
        </q:slot>
        After level 1
      </div>
    </q:slot>
    After root
  </div>`
  );
});

renderSSRSuite('component useContextProvider()', async () => {
  await testSSR(<Context />, `<div q:key="sX:" q:id="0" q:host q:ctx="internal qwikcity"></div>`);
});

renderSSRSuite('component useOn()', async () => {
  await testSSR(
    <Events />,
    `<div q:key="sX:" q:id="0" q:host on:click="/runtimeQRL#_ /runtimeQRL#_" on-window:click="/runtimeQRL#_" on-document:click="/runtimeQRL#_"></div>`
  );
});

renderSSRSuite('component useClientEffect()', async () => {
  await testSSR(
    <UseClientEffect />,
    `<div q:key="sX:" q:id="0" q:host on:qvisible="/runtimeQRL#_[0]"></div>`
  );
});

// TODO
// Merge props on host
// - host events
// - class
// - style
// QContainer
// End-to-end with qwikcity
// SVG rendering
// useStyles
// useClientEffect()
// Performance metrics

renderSSRSuite.run();

export const MyCmp = component$(
  (props: Record<string, any>) => {
    return (
      <Host class="my-cmp">
        <div>
          MyCmp
          {JSON.stringify(props)}
        </div>
      </Host>
    );
  },
  {
    tagName: 'section',
  }
);

export const MyCmpComplex = component$((props: Record<string, any>) => {
  const ref = useRef();
  return (
    <Host onClick$={() => console.warn('from component')}>
      <div ref={ref}>
        <button onClick$={() => console.warn('click')}>Click</button>
        <Slot></Slot>
      </div>
    </Host>
  );
});

export const SimpleSlot = component$((props: { name: string }) => {
  return (
    <Host id={props.name}>
      Before {props.name}
      <Slot></Slot>
      After {props.name}
    </Host>
  );
});

export const Events = component$(() => {
  useOn(
    'click',
    $(() => console.warn('click'))
  );
  useOnWindow(
    'click',
    $(() => console.warn('window:click'))
  );
  useOnDocument(
    'click',
    $(() => console.warn('document:click'))
  );

  return <Host onClick$={() => console.warn('scroll')}></Host>;
});

const CTX_INTERNAL = createContext<{}>('internal');
const CTX_QWIK_CITY = createContext<{}>('qwikcity');

export const Context = component$(() => {
  useContextProvider(CTX_INTERNAL, {});
  useContextProvider(CTX_QWIK_CITY, {});
  return <Host></Host>;
});

export const UseClientEffect = component$(() => {
  useClientEffect$(() => {
    console.warn('client effect');
  });
  return <Host></Host>;
});

async function testSSR(node: JSXNode, expected: string | string[]) {
  const doc = createSimpleDocument() as Document;
  const chunks: string[] = [];
  const stream: StreamWriter = {
    write(chunk) {
      chunks.push(chunk);
    },
  };
  await renderSSR(doc, node, {
    stream,
  });
  if (typeof expected === 'string') {
    equal(chunks.join(''), expected.replace(/(\n|^)\s+/gm, ''));
  } else {
    equal(chunks, expected);
  }
}
