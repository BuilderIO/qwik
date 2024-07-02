import { styleContent, styleKey } from '../style/qrl-styles';
import type { QRL } from '../qrl/qrl.public';
import { implicit$FirstArg } from '../util/implicit_dollar';
import { getScopedStyles } from '../style/scoped-stylesheet';
import { useSequentialScope } from './use-sequential-scope';
import { assertQrl } from '../qrl/qrl-class';
import { isPromise } from '../util/promises';
import { assertDefined } from '../error/assert';
import { ComponentStylesPrefixContent } from '../util/markers';

/** @public */
export interface UseStylesScoped {
  scopeId: string;
}

// <docs markdown="../readme.md#useStyles">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!!
// (edit ../readme.md#useStyles instead)
/**
 * A lazy-loadable reference to a component's styles.
 *
 * Component styles allow Qwik to lazy load the style information for the component only when
 * needed. (And avoid double loading it in case of SSR hydration.)
 *
 * ```tsx
 * import styles from './code-block.css?inline';
 *
 * export const CmpStyles = component$(() => {
 *   useStyles$(styles);
 *
 *   return <div>Some text</div>;
 * });
 * ```
 *
 * @public
 * @see `useStylesScoped`
 */
// </docs>
export const useStylesQrl = (styles: QRL<string>): void => {
  _useStyles(styles, (str) => str, false);
};

// <docs markdown="../readme.md#useStyles">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!!
// (edit ../readme.md#useStyles instead)
/**
 * A lazy-loadable reference to a component's styles.
 *
 * Component styles allow Qwik to lazy load the style information for the component only when
 * needed. (And avoid double loading it in case of SSR hydration.)
 *
 * ```tsx
 * import styles from './code-block.css?inline';
 *
 * export const CmpStyles = component$(() => {
 *   useStyles$(styles);
 *
 *   return <div>Some text</div>;
 * });
 * ```
 *
 * @public
 * @see `useStylesScoped`
 */
// </docs>
export const useStyles$ = /*#__PURE__*/ implicit$FirstArg(useStylesQrl);

// <docs markdown="../readme.md#useStylesScoped">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!!
// (edit ../readme.md#useStylesScoped instead)
/**
 * A lazy-loadable reference to a component's styles, that is scoped to the component.
 *
 * Component styles allow Qwik to lazy load the style information for the component only when
 * needed. (And avoid double loading it in case of SSR hydration.)
 *
 * ```tsx
 * import scoped from './code-block.css?inline';
 *
 * export const CmpScopedStyles = component$(() => {
 *   useStylesScoped$(scoped);
 *
 *   return <div>Some text</div>;
 * });
 * ```
 *
 * @public
 * @see `useStyles`
 */
// </docs>
export const useStylesScopedQrl = (styles: QRL<string>): UseStylesScoped => {
  return {
    scopeId: ComponentStylesPrefixContent + _useStyles(styles, getScopedStyles, true),
  };
};

// <docs markdown="../readme.md#useStylesScoped">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!!
// (edit ../readme.md#useStylesScoped instead)
/**
 * A lazy-loadable reference to a component's styles, that is scoped to the component.
 *
 * Component styles allow Qwik to lazy load the style information for the component only when
 * needed. (And avoid double loading it in case of SSR hydration.)
 *
 * ```tsx
 * import scoped from './code-block.css?inline';
 *
 * export const CmpScopedStyles = component$(() => {
 *   useStylesScoped$(scoped);
 *
 *   return <div>Some text</div>;
 * });
 * ```
 *
 * @public
 * @see `useStyles`
 */
// </docs>
export const useStylesScoped$ = /*#__PURE__*/ implicit$FirstArg(useStylesScopedQrl);

// <docs markdown="../readme.md#useStylesScoped">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!!
// (edit ../readme.md#useStylesScoped instead)
/**
 * A lazy-loadable reference to a component's styles, that is scoped to the component.
 *
 * Component styles allow Qwik to lazy load the style information for the component only when
 * needed. (And avoid double loading it in case of SSR hydration.)
 *
 * ```tsx
 * import scoped from './code-block.css?inline';
 *
 * export const CmpScopedStyles = component$(() => {
 *   useStylesWithScope$(scoped);
 *
 *   return <div>Some text</div>;
 * });
 * ```
 *
 * The scoped style can have `:scope` pseudo class to scope the styles to the component like this.
 *
 * ```css
 * :scope {
 *   color: red;
 *   background: blue;
 * }
 * ```
 *
 * @public
 * @see `useStylesScoped`
 */
// </docs>
export const useStylesWithScopeQrl = (styles: QRL<string>): void => {
  _useStyles(
    styles,
    (str, styleId) => {
      const scopeId = ComponentStylesPrefixContent + styleId;
      return str.replaceAll(/:scope\b/g, '.' + scopeId);
    },
    true
  );
};

// <docs markdown="../readme.md#useStylesScoped">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!!
// (edit ../readme.md#useStylesScoped instead)
/**
 * A lazy-loadable reference to a component's styles, that is scoped to the component.
 *
 * Component styles allow Qwik to lazy load the style information for the component only when
 * needed. (And avoid double loading it in case of SSR hydration.)
 *
 * ```tsx
 * import scoped from './code-block.css?inline';
 *
 * export const CmpScopedStyles = component$(() => {
 *   useStylesWithScope$(scoped);
 *
 *   return <div>Some text</div>;
 * });
 * ```
 *
 * The scoped style can have `:scope` pseudo class to scope the styles to the component like this.
 *
 * ```css
 * :scope {
 *   color: red;
 *   background: blue;
 * }
 * ```
 *
 * @public
 * @see `useStylesScoped`
 */
// </docs>
export const useStylesWithScope$ = /*#__PURE__*/ implicit$FirstArg(useStylesScopedQrl);

const _useStyles = (
  styleQrl: QRL<string>,
  transform: (str: string, styleId: string) => string,
  scoped: boolean
): string => {
  assertQrl(styleQrl);

  const { val, set, iCtx, i, elCtx } = useSequentialScope<string>();
  if (val) {
    return val;
  }
  const styleId = styleKey(styleQrl, i);
  const containerState = iCtx.$renderCtx$.$static$.$containerState$;
  set(styleId);

  if (!elCtx.$appendStyles$) {
    elCtx.$appendStyles$ = [];
  }
  if (!elCtx.$scopeIds$) {
    elCtx.$scopeIds$ = [];
  }
  if (scoped) {
    elCtx.$scopeIds$.push(styleContent(styleId));
  }
  if (containerState.$styleIds$.has(styleId)) {
    return styleId;
  }
  containerState.$styleIds$.add(styleId);
  const value = styleQrl.$resolveLazy$(containerState.$containerEl$);
  const appendStyle = (styleText: string) => {
    assertDefined(elCtx.$appendStyles$, 'appendStyles must be defined');
    elCtx.$appendStyles$.push({
      styleId,
      content: transform(styleText, styleId),
    });
  };
  if (isPromise(value)) {
    iCtx.$waitOn$.push(value.then(appendStyle));
  } else {
    appendStyle(value);
  }
  return styleId;
};
