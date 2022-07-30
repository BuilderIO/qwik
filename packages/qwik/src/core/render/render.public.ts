import { isDocument } from '../util/element';
import { createRenderContext, executeContext, printRenderStats } from './cursor';
import { isJSXNode, jsx, processData } from './jsx/jsx-runtime';
import type { JSXNode, FunctionComponent } from './jsx/types/jsx-node';
import { visitJsxNode } from './render';
import { ContainerState, getContainerState, postRendering } from './notify-render';
import { getDocument } from '../util/dom';
import { qDev, qTest } from '../util/qdev';
import { version } from '../version';
import { QContainerAttr } from '../util/markers';
import { logWarn } from '../util/log';
import { appendQwikDevTools } from '../props/props';
import { qError, QError_cannotRenderOverExistingContainer } from '../error/error';
import { directSetAttribute } from './fast-calls';

/**
 * @alpha
 */
export interface RenderOptions {
  allowRerender?: boolean;
  userContext?: Record<string, any>;
}

/**
 * Render JSX.
 *
 * Use this method to render JSX. This function does reconciling which means
 * it always tries to reuse what is already in the DOM (rather then destroy and
 * recreate content.)
 *
 * @param parent - Element which will act as a parent to `jsxNode`. When
 *     possible the rendering will try to reuse existing nodes.
 * @param jsxNode - JSX to render
 * @alpha
 */
export const render = async (
  parent: Element | Document,
  jsxNode: JSXNode<unknown> | FunctionComponent<any>,
  opts?: RenderOptions
): Promise<void> => {
  // If input is not JSX, convert it
  if (!isJSXNode(jsxNode)) {
    jsxNode = jsx(jsxNode, null);
  }
  const doc = getDocument(parent);
  const containerEl = getElement(parent);
  if (qDev && containerEl.hasAttribute(QContainerAttr)) {
    throw qError(QError_cannotRenderOverExistingContainer, containerEl);
  }
  injectQContainer(containerEl);

  const containerState = getContainerState(containerEl);
  const userContext = opts?.userContext;
  if (userContext) {
    Object.assign(containerState.$userContext$, userContext);
  }
  containerState.$hostsRendering$ = new Set();
  containerState.$renderPromise$ = renderRoot(parent, jsxNode, doc, containerState, containerEl);

  const renderCtx = await containerState.$renderPromise$;
  const allowRerender = opts?.allowRerender ?? true;
  if (allowRerender) {
    await postRendering(containerState, renderCtx);
  } else {
    containerState.$hostsRendering$ = undefined;
    containerState.$renderPromise$ = undefined;

    const next =
      containerState.$hostsNext$.size +
      containerState.$hostsStaging$.size +
      containerState.$watchNext$.size +
      containerState.$watchStaging$.size;
    if (next > 0) {
      logWarn('State changed and a rerender is required, skipping');
    }
  }
};

const renderRoot = async (
  parent: Element | Document,
  jsxNode: JSXNode<unknown> | FunctionComponent<any>,
  doc: Document,
  containerState: ContainerState,
  containerEl: Element
) => {
  const ctx = createRenderContext(doc, containerState);
  ctx.$roots$.push(parent as Element);

  const processedNodes = await processData(jsxNode);
  await visitJsxNode(ctx, parent as Element, processedNodes, false);

  executeContext(ctx);
  if (!qTest) {
    injectQwikSlotCSS(parent);
  }

  if (qDev) {
    appendQwikDevTools(containerEl);
    printRenderStats(ctx);
  }
  return ctx;
};
export const injectQwikSlotCSS = (docOrElm: Document | Element) => {
  const doc = getDocument(docOrElm);
  const isDoc = isDocument(docOrElm);
  const style = doc.createElement('style');
  directSetAttribute(style, 'id', 'qwik/base-styles');
  style.textContent = `q\\:slot{display:contents}q\\:fallback,q\\:template{display:none}q\\:fallback:last-child{display:contents}`;
  if (isDoc) {
    docOrElm.head.appendChild(style);
  } else {
    docOrElm.insertBefore(style, docOrElm.firstChild);
  }
};

export const getElement = (docOrElm: Document | Element): Element => {
  return isDocument(docOrElm) ? docOrElm.documentElement : docOrElm;
};

export const injectQContainer = (containerEl: Element) => {
  directSetAttribute(containerEl, 'q:version', version || '');
  directSetAttribute(containerEl, QContainerAttr, 'resumed');
};
