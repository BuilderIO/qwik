import { assertDefined, assertTrue } from '../assert/assert';
import { parseQRL } from '../import/qrl';
import { getContext, QContext, resumeIfNeeded } from '../props/props';
import { getContainer, getInvokeContext } from './use-core';
import { assertQrl } from '../import/qrl-class';

// <docs markdown="../readme.md#useLexicalScope">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!!
// (edit ../readme.md#useLexicalScope instead)
/**
 * Used by the Qwik Optimizer to restore the lexically scoped variables.
 *
 * This method should not be present in the application source code.
 *
 * NOTE: `useLexicalScope` method can only be used in the synchronous portion of the callback
 * (before any `await` statements.)
 *
 * @public
 */
// </docs>
export const useLexicalScope = <VARS extends any[]>(): VARS => {
  const context = getInvokeContext();
  const hostElement = context.$hostElement$;
  const qrl = context.$qrl$ ?? parseQRL(decodeURIComponent(String(context.$url$)), hostElement);
  assertQrl(qrl);

  if (qrl.$captureRef$ == null) {
    const el = context.$element$;
    assertDefined(el, 'invoke: element must be defined inside useLexicalScope()', context);
    assertDefined(
      qrl.$capture$,
      'invoke: qrl capture must be defined inside useLexicalScope()',
      qrl
    );

    const container = getContainer(el);
    assertDefined(container, `invoke: cant find parent q:container of`, el);

    resumeIfNeeded(container);
    const ctx = getContext(el);

    qrl.$captureRef$ = qrl.$capture$!.map((idx) => qInflate(idx, ctx));
  }
  const subscriber = context.$subscriber$;
  if (subscriber) {
    return qrl.$captureRef$ as VARS;
  }
  return qrl.$captureRef$ as VARS;
};

const qInflate = (ref: string, hostCtx: QContext) => {
  const int = parseInt(ref, 10);
  const obj = hostCtx.$refMap$[int];
  assertTrue(hostCtx.$refMap$.length > int, 'out of bounds infrate access', ref);
  return obj;
};
