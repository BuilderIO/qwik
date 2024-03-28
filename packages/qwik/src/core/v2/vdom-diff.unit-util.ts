import { expect } from 'vitest';
import { Fragment, isJSXNode } from '../render/jsx/jsx-runtime';
import type { ElementVNode, QDocument, TextVNode, VNode } from './client/types';
import {
  vnode_applyJournal,
  vnode_getAttr,
  vnode_getAttrKeys,
  vnode_getElementName,
  vnode_getFirstChild,
  vnode_getNextSibling,
  vnode_getNode,
  vnode_getParent,
  vnode_getText,
  vnode_insertBefore,
  vnode_isElementVNode,
  vnode_isTextVNode,
  vnode_isVirtualVNode,
  vnode_newText,
  vnode_newUnMaterializedElement,
  vnode_setAttr,
  type VNodeJournal,
} from './client/vnode';
import { isStringifiable, type Stringifiable } from './shared-types';

import { createDocument } from '../../testing/document';
import type { JSXNode, JSXOutput } from '../render/jsx/types/jsx-node';
import type { VirtualVNode } from './client/types';
import { isHtmlAttributeAnEventName, isJsxPropertyAnEventName } from './shared/event-names';
import { format } from 'prettier';

interface CustomMatchers<R = unknown> {
  toMatchVDOM(expectedJSX: JSXOutput): R;
  toMatchDOM(expectedDOM: string): Promise<R>;
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

expect.extend({
  toMatchVDOM(this: { isNot: boolean }, received: VNode, expected: JSXNode) {
    const { isNot } = this;
    const diffs = diffJsxVNode(received, expected);
    return {
      pass: isNot ? diffs.length !== 0 : diffs.length === 0,
      message: () => diffs.join('\n'),
    };
  },
});

expect.extend({
  async toMatchDOM(this: { isNot: boolean }, received: HTMLElement, expected: string) {
    const { isNot } = this;
    const receivedString = received?.outerHTML || '';
    const diffs = await diffNode(receivedString, expected);
    return {
      pass: isNot ? diffs.length !== 0 : diffs.length === 0,
      message: () => diffs.join('\n'),
    };
  },
});

function diffJsxVNode(received: VNode, expected: JSXNode | string, path: string[] = []): string[] {
  if (!received) {
    return [path.join(' > ') + ' missing'];
  }
  const diffs: string[] = [];
  if (typeof expected === 'string') {
    const receivedText = vnode_isTextVNode(received) ? vnode_getText(received as TextVNode) : null;
    if (expected !== receivedText) {
      diffs.push(path.join(' > '));
      diffs.push('EXPECTED', JSON.stringify(expected));
      diffs.push('RECEIVED:', JSON.stringify(receivedText));
    }
  } else {
    path.push(tagToString(expected.type));
    const receivedTag = vnode_isElementVNode(received)
      ? vnode_getElementName(received as ElementVNode)
      : vnode_isVirtualVNode(received)
        ? Fragment
        : undefined;
    const isTagSame = String(expected.type).toLowerCase() == String(receivedTag).toLowerCase();
    if (!isTagSame) {
      diffs.push(path.join(' > ') + ' expecting=' + expected.type + ' received=' + receivedTag);
    }
    const allProps: string[] = [];
    expected.varProps && propsAdd(allProps, Object.keys(expected.varProps));
    expected.constProps && propsAdd(allProps, Object.keys(expected.constProps));
    const receivedElement = vnode_isElementVNode(received)
      ? (vnode_getNode(received) as Element)
      : null;
    propsAdd(allProps, vnode_isElementVNode(received) ? vnode_getAttrKeys(received).sort() : []);
    receivedElement && propsAdd(allProps, constPropsFromElement(receivedElement));
    allProps.sort();
    allProps.forEach((prop) => {
      if (isJsxPropertyAnEventName(prop) || isHtmlAttributeAnEventName(prop)) {
        return;
      }
      const receivedValue = vnode_getAttr(received, prop) || receivedElement?.getAttribute(prop);
      const expectedValue =
        prop === 'key' || prop === 'q:key' ? expected.key ?? receivedValue : expected.props[prop];
      if (expectedValue !== receivedValue) {
        diffs.push(`${path.join(' > ')}: [${prop}]`);
        diffs.push('  EXPECTED: ' + JSON.stringify(expectedValue));
        diffs.push('  RECEIVED: ' + JSON.stringify(receivedValue));
      }
    });
    const receivedChildren = getVNodeChildren(received);
    const expectedChildren = getJSXChildren(expected);
    if (receivedChildren.length === expectedChildren.length) {
      for (let i = 0; i < receivedChildren.length; i++) {
        const receivedChild = receivedChildren[i];
        const expectedChild = expectedChildren[i];
        diffs.push(...diffJsxVNode(receivedChild, expectedChild, path));
      }
    } else {
      diffs.push(
        `${path.join(' > ')} expecting ${expectedChildren.length} children but was ${
          receivedChildren.length
        }`
      );
      diffs.push('EXPECTED', jsxToHTML(expected, '  '));
      diffs.push('RECEIVED:', vnodeToHTML(received, '  '));
    }
    path.pop();
  }
  return diffs;
}
function getJSXChildren(jsx: JSXNode): JSXNode[] {
  const children = jsx.children;
  if (Array.isArray(children)) {
    return children as any;
  } else if (children != null) {
    return [children] as any;
  }
  return [];
}

function getVNodeChildren(vNode: VNode): VNode[] {
  const children: VNode[] = [];
  let child = vnode_getFirstChild(vNode);
  while (child) {
    if (!shouldSkip(child)) {
      children.push(child);
    }
    child = vnode_getNextSibling(child);
  }
  return children;
}
export function jsxToHTML(jsx: JSXNode, pad: string = ''): string {
  const html: string[] = [];
  if (jsx.type) {
    html.push(pad, '<', tagToString(jsx.type), '>\n');
    getJSXChildren(jsx).forEach((jsx) => {
      html.push(jsxToHTML(jsx, pad + '  '));
    });
    html.push(pad, '</', tagToString(jsx.type), '>\n');
  } else {
    html.push(pad, JSON.stringify(jsx), '\n');
  }
  return html.join('');
}

export function vnodeToHTML(vNode: VNode | null, pad: string = ''): string {
  const html: string[] = [];
  while (vNode) {
    html.push(
      pad +
        vNode
          .toString()
          .split('\n')
          .join('\n' + pad)
    );
    while (shouldSkip((vNode = vnode_getNextSibling(vNode!)))) {
      // skip
    }
  }
  return html.join('');
}

function tagToString(tag: any): string {
  if (tag === Fragment) {
    return 'Fragment';
  }
  return String(tag);
}

function shouldSkip(vNode: VNode | null) {
  if (vNode && vnode_isElementVNode(vNode)) {
    const tag = vnode_getElementName(vNode);
    if (
      tag === 'script' &&
      (vnode_getAttr(vNode, 'type') === 'qwik/vnode' ||
        vnode_getAttr(vNode, 'type') === 'qwik/state')
    ) {
      return true;
    }
  }
  return false;
}

export function walkJSX(
  jsx: JSXOutput,
  apply: {
    enter: (jsx: JSXNode) => void;
    leave: (jsx: JSXNode) => void;
    text: (text: Stringifiable) => void;
  }
) {
  if (isJSXNode(jsx)) {
    apply.enter(jsx);
    if (Array.isArray(jsx.children)) {
      for (const child of jsx.children) {
        processChild(child);
      }
    } else if (jsx.children) {
      processChild(jsx.children);
    }
    apply.leave(jsx);
  } else {
    throw new Error('unsupported');
  }

  function processChild(child: any) {
    if (isStringifiable(child)) {
      apply.text(child);
    } else if (isJSXNode(child)) {
      walkJSX(child, apply);
    } else {
      throw new Error('Unknown type: ' + child);
    }
  }
}

export function vnode_fromJSX(jsx: JSXOutput) {
  const doc = createDocument() as QDocument;
  doc.qVNodeData = new WeakMap();
  const vBody = vnode_newUnMaterializedElement(null, doc.body);
  let vParent: ElementVNode | VirtualVNode = vBody;
  const journal: VNodeJournal = [];
  walkJSX(jsx, {
    enter: (jsx) => {
      const type = jsx.type;
      if (typeof type === 'string') {
        const child = vnode_newUnMaterializedElement(vParent, doc.createElement(type));
        vnode_insertBefore(journal, vParent, child, null);

        // TODO(hack): jsx.props is an empty object
        const props = jsx.varProps;
        for (const key in props) {
          if (Object.prototype.hasOwnProperty.call(props, key)) {
            vnode_setAttr(journal, child, key, String(props[key]));
          }
        }
        if (jsx.key != null) {
          vnode_setAttr(journal, child, 'q:key', String(jsx.key));
        }
        vParent = child;
      } else {
        throw new Error('Unknown type:' + type);
      }
    },
    leave: (jsx) => {
      vParent = vnode_getParent(vParent) as any;
    },
    text: (value) => {
      vnode_insertBefore(
        journal,
        vParent,
        vnode_newText(vParent, doc.createTextNode(String(value)), String(value)),
        null
      );
    },
  });
  vnode_applyJournal(journal);
  return { vParent, vNode: vnode_getFirstChild(vParent), document: doc };
}
function constPropsFromElement(element: Element) {
  const props: string[] = [];
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    if (attr.name !== '' && attr.name !== ':') {
      props.push(attr.name);
    }
  }
  props.sort();
  return props;
}

function propsAdd(existing: string[], incoming: string[]) {
  for (const prop of incoming) {
    if (prop !== 'children') {
      let found = false;
      for (let i = 0; i < existing.length; i++) {
        if (existing[i].toLowerCase() === prop.toLowerCase()) {
          found = true;
          break;
        }
      }
      if (!found) {
        existing.push(prop);
      }
    }
  }
}

async function diffNode(received: string, expected: string): Promise<string[]> {
  const diff: string[] = [];

  received = received
    .replaceAll(':=""', '')
    .replaceAll('=""', '')
    .replaceAll(/on:(.*?)="(.*?)"\s/g, '')
    .replaceAll(/on-document:(.*?)="(.*?)"\s/g, '')
    .replaceAll(/on-window:(.*?)="(.*?)"\s/g, '');

  const options = { parser: 'html', htmlWhitespaceSensitivity: 'ignore' as const };
  const formattedReceivedHTMLString = await format(received, options);
  const formattedExpectedHTMLString = await format(expected, options);
  if (formattedReceivedHTMLString.toLowerCase() !== formattedExpectedHTMLString.toLowerCase()) {
    diff.push('EXPECTED:');
    diff.push(formattedExpectedHTMLString);
    diff.push('RECEIVED:');
    diff.push(formattedReceivedHTMLString);
  }

  return diff;
}
