import { assertDefined } from '../assert/assert';
import { copyRenderContext, RenderContext, setAttribute } from './cursor';
import { visitJsxNode } from './render';
import { ComponentScopedStyles, QCtxAttr, RenderEvent } from '../util/markers';
import { promiseAll, safeCall, then } from '../util/promises';
import { styleContent, styleHost } from '../component/qrl-styles';
import { newInvokeContext } from '../use/use-core';
import { processData } from './jsx/jsx-runtime';
import { logError } from '../util/log';
import { isFunction, ValueOrPromise } from '../util/types';
import type { QContext } from '../props/props';
import type { JSXNode } from '../render/jsx/types/jsx-node';
import { serializeInlineContexts } from '../use/use-context';
import { getDomListeners } from '../props/props-on';

export interface ExecuteComponentOutput {
  node: JSXNode;
  rctx: RenderContext;
}

export const renderComponent = (rctx: RenderContext, ctx: QContext): ValueOrPromise<void> => {
  const mounted = !ctx.$mounted$;
  if (!ctx.$listeners$) {
    ctx.$listeners$ = getDomListeners(ctx.$element$);
  }
  return then(executeComponent(rctx, ctx), (res) => {
    if (res) {
      const hostElement = ctx.$element$;
      const newCtx = res.rctx;
      const invocatinContext = newInvokeContext(rctx.$doc$, hostElement, hostElement);
      invocatinContext.$subscriber$ = hostElement;
      invocatinContext.$renderCtx$ = newCtx;
      if (mounted) {
        if (ctx.$component$?.$styleHostClass$) {
          hostElement.classList.add(ctx.$component$.$styleHostClass$);
        }
        if (ctx.$contexts$) {
          setAttribute(newCtx, hostElement, QCtxAttr, serializeInlineContexts(ctx.$contexts$));
        }
        if (ctx.$scopeId$) {
          setAttribute(newCtx, hostElement, ComponentScopedStyles, ctx.$scopeId$);
        }
      }
      const processedJSXNode = processData(res.node, invocatinContext);
      return then(processedJSXNode, (processedJSXNode) => {
        return visitJsxNode(newCtx, hostElement, processedJSXNode, false);
      });
    }
  });
};

export const executeComponent = (
  rctx: RenderContext,
  ctx: QContext
): ValueOrPromise<ExecuteComponentOutput | void> => {
  ctx.$dirty$ = false;
  ctx.$mounted$ = true;

  const hostElement = ctx.$element$;
  const onRenderQRL = ctx.$renderQrl$!;
  assertDefined(onRenderQRL, `render: host element to render must has a $renderQrl$:`, ctx);

  const props = ctx.$props$;
  assertDefined(props, `render: host element to render must has defined props`, ctx);

  // Component is not dirty any more
  rctx.$containerState$.$hostsStaging$.delete(hostElement);

  const newCtx = copyRenderContext(rctx);

  // Invoke render hook
  const invocatinContext = newInvokeContext(rctx.$doc$, hostElement, hostElement, RenderEvent);
  invocatinContext.$subscriber$ = hostElement;
  invocatinContext.$renderCtx$ = newCtx;
  const waitOn = (invocatinContext.$waitOn$ = [] as any[]);

  // Clean current subscription before render
  rctx.$containerState$.$subsManager$.$clearSub$(hostElement);

  // Resolve render function
  const onRenderFn = onRenderQRL.$invokeFn$(rctx.$containerEl$, invocatinContext);

  return safeCall(
    () => onRenderFn(props) as JSXNode | Function,
    (jsxNode) => {
      rctx.$hostElements$.add(hostElement);
      const waitOnPromise = promiseAll(waitOn);
      return then(waitOnPromise, () => {
        if (isFunction(jsxNode)) {
          ctx.$dirty$ = false;
          jsxNode = jsxNode();
        } else if (ctx.$dirty$) {
          return executeComponent(rctx, ctx);
        }

        let componentCtx = ctx.$component$;
        if (!componentCtx) {
          const scopedStyleId = ctx.$scopeId$;
          componentCtx = ctx.$component$ = {
            $hostElement$: hostElement,
            $slots$: [],
            $styleHostClass$: styleHost(scopedStyleId),
            $styleClass$: scopedStyleId && styleContent(scopedStyleId),
            $styleId$: scopedStyleId,
          };
        }
        componentCtx.$slots$ = [];
        newCtx.$contexts$.push(ctx);
        newCtx.$currentComponent$ = componentCtx;
        return {
          node: jsxNode as JSXNode,
          rctx: newCtx,
        };
      });
    },
    (err) => {
      logError(err);
    }
  );
};
