import { createDocument } from '../../testing/document';
import { describe, expect, it } from 'vitest';
import { renderToString } from '../../server/render';
import { component$ } from '../component/component.public';
import { getPlatform, setPlatform } from '../platform/platform';
import { notifyChange } from '../render/dom/notify-render';
import type { JSXOutput } from '../render/jsx/types/jsx-node';
import type { Subscriptions } from '../state/common';
import { OnRenderProp } from '../util/markers';
import { DomContainer, getDomContainer } from './client/dom-container';
import type { VNode } from './client/types';
import {
  vnode_getAttr,
  vnode_getFirstChild,
  vnode_getParent,
  vnode_getVNodeForChildNode,
  vnode_locate,
  vnode_toString,
} from './client/vnode';
import { codeToName } from './shared-serialization';
import type { fixMeAny } from './shared/types';
import { ssrCreateContainer } from './ssr/ssr-container';
import { ssrRenderToContainer } from './ssr/ssr-render';
import './vdom-diff.unit';
import { render2 } from './client/render2';
import { Fragment } from '../render/jsx/jsx-runtime';

describe('v2 ssr render', () => {
  it('should render jsx', async () => {
    const { vNode } = await ssrRenderToDom(
      <span>
        <>Hello</> <b>World</b>!
      </span>
    );
    expect(vNode).toMatchVDOM(
      <span>
        <>Hello</> <b>World</b>!
      </span>
    );
  });
  describe('component', () => {
    describe('inline', () => {
      it('should render inline component', async () => {
        const HelloWorld = (props: { name: string }) => {
          return <span>Hello {props.name}!</span>;
        };

        const { vNode } = await ssrRenderToDom(<HelloWorld name="World" />);
        expect(vNode).toMatchVDOM(<span>Hello {'World'}!</span>);
      });
    });
    describe('component$', () => {
      it('should render simple component', async () => {
        const HelloWorld = component$((props: { name: string }) => {
          return <span>Hello {props.name}!</span>;
        });

        const { vNode } = await ssrRenderToDom(<HelloWorld name="World" />);
        expect(vNode).toMatchVDOM(
          <Fragment>
            <span>Hello {'World'}!</span>
          </Fragment>
        );
      });
    });
    it('should render nested components', async () => {
      const Child = component$((props: { name: string }) => {
        return <span>Hello Child: {props.name}</span>;
      });
      const Parent = component$((props: { name: string }) => {
        return <Child name={props.name} />;
      });

      const { vNode } = await ssrRenderToDom(<Parent name="World" />, { debug: false });
      expect(vNode).toMatchVDOM(
        <Fragment>
          <Fragment>
            <span>Hello Child: {'World'}</span>
          </Fragment>
        </Fragment>
      );
    });
  });
});

export async function domRender(
  jsx: JSXOutput,
  opts: {
    /// Print debug information to console.
    debug?: boolean;
    /// Use old SSR rendering ond print out debug state. Useful for comparing difference between serialization.
    oldSSR?: boolean;
  } = {}
) {
  const document = createDocument();
  await render2(document.body, jsx);
  const container = getDomContainer(document.body);
  if (opts.debug) {
    console.log(container.rootVNode.toString());
  }
  return {
    document,
    container,
    vNode: container.rootVNode,
  };
}

export async function ssrRenderToDom(
  jsx: JSXOutput,
  opts: {
    /// Print debug information to console.
    debug?: boolean;
    /// Use old SSR rendering ond print out debug state. Useful for comparing difference between serialization.
    oldSSR?: boolean;
  } = {}
) {
  if (opts.oldSSR) {
    const platform = getPlatform();
    try {
      const ssr = await renderToString([
        <head>
          <title>{expect.getState().testPath}</title>
        </head>,
        <body>{jsx}</body>,
      ]);
      // restore platform
      console.log('LEGACY HTML', ssr.html);
    } finally {
      setPlatform(platform);
    }
  }
  const ssrContainer = ssrCreateContainer({ tagName: 'html' });
  await ssrRenderToContainer(ssrContainer, [
    <head>
      <title>{expect.getState().testPath}</title>
    </head>,
    <body>{jsx}</body>,
  ]);
  const html = ssrContainer.writer.toString();
  const document = createDocument(html);
  const container = getDomContainer(document.body.parentElement as HTMLElement) as DomContainer;
  if (opts.debug) {
    console.log('HTML:', html);
    console.log(vnode_toString.call(container.rootVNode, Number.MAX_SAFE_INTEGER, '', true));
    console.log('CONTAINER: [');
    const state = container.$rawStateData$;
    for (let i = 0; i < state.length; i++) {
      console.log(('    ' + i + ':').substr(-4), qwikJsonStringify(state[i]));
    }
    console.log(']');
    if (false as boolean) {
      console.log('CONTAINER PROXY: [');
      const proxyState = container.stateData;
      for (let i = 0; i < state.length; i++) {
        console.log(('    ' + i + ':').substr(-4), proxyState[i]);
      }
      console.log(']');
    }
  }
  const bodyVNode = vnode_getVNodeForChildNode(container.rootVNode, document.body);
  return { container, document, vNode: vnode_getFirstChild(bodyVNode) };
}

export async function rerenderComponent(element: HTMLElement) {
  const container = getDomContainer(element);
  const vElement = vnode_locate(container.rootVNode, element);
  const host = getHostVNode(vElement)!;
  const subAction: Subscriptions = [0, host as fixMeAny, undefined];
  notifyChange(subAction, container as fixMeAny);
}

function getHostVNode(vElement: VNode | null) {
  while (vElement != null) {
    if (typeof vnode_getAttr(vElement, OnRenderProp) == 'string') {
      return vElement;
    }
    vElement = vnode_getParent(vElement);
  }
  return vElement;
}

function qwikJsonStringify(value: any): string {
  const RED = '\x1b[31m';
  const RESET = '\x1b[0m';
  let json = JSON.stringify(value);
  json = json.replace(/"\\u00([0-9a-f][0-9a-f])/gm, (_, value) => {
    return '"' + RED + codeToName(parseInt(value, 16)) + ': ' + RESET;
  });
  return json;
}
