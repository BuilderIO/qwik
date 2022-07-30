import { $, QRL } from '../import/qrl.public';
import type { JSXNode } from '../render/jsx/types/jsx-node';
import { OnRenderProp } from '../util/markers';
import type { ComponentBaseProps, JSXTagName } from '../render/jsx/types/jsx-qwik-attributes';
import type { FunctionComponent } from '../render/jsx/types/jsx-node';
import { jsx } from '../render/jsx/jsx-runtime';
import type { MutableWrapper } from '../object/q-object';
import { qTest } from '../util/qdev';

/**
 * Infers `Props` from the component.
 *
 * ```typescript
 * export const OtherComponent = component$(() => {
 *   return $(() => <Counter value={100} />);
 * });
 * ```
 *
 * @public
 */
// </docs>
export type PropsOf<COMP extends Component<any>> = COMP extends Component<infer PROPS>
  ? NonNullable<PROPS>
  : never;

/**
 * Declarative component options.
 *
 * @public
 */
export interface ComponentOptions {
  /**
   * Tag the name of the component's host element.
   *
   * Default value fo `tagName` is `div`. Override this value in situations where you want to use
   * a different tag name. Examples are:
   * - It is desirable to have component names directly in the HTML (WebComponent style)
   * - It is desirable to have a specific tag name for accessibility. For example, using `<button>`
   *   for `<MyCustomButton>` component.
   *
   * When a component is inserted into the render tree, the host element needs to be inserted
   * synchronously, while the component body is inserted asynchronously. The synchronous nature
   * of host element requires that the parent component needs to know the tag name of the child
   * component synchronously.
   */
  tagName?: JSXTagName;
}

/**
 * Type representing the Qwik component.
 *
 * `Component` is the type returned by invoking `component$`.
 *
 * ```
 * interface MyComponentProps {
 *   someProp: string;
 * }
 * const MyComponent: Component<MyComponentProps> = component$((props: MyComponentProps) => {
 *   return <span>{props.someProp}</span>;
 * });
 * ```
 *
 * @public
 */
export type Component<PROPS extends {}> = FunctionComponent<PublicProps<PROPS>>;

/**
 * @public
 */
export type PublicProps<PROPS extends {}> = MutableProps<PROPS> & ComponentBaseProps;

/**
 * @public
 */
export type MutableProps<PROPS extends {}> = {
  [K in keyof PROPS]: PROPS[K] | MutableWrapper<PROPS[K]>;
};

/**
 * @alpha
 */
export type EventHandler<T> = QRL<(value: T) => any>;

const ELEMENTS_SKIP_KEY: JSXTagName[] = ['html', 'body', 'head'];

// <docs markdown="../readme.md#component">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!!
// (edit ../readme.md#component instead)
/**
 * Declare a Qwik component that can be used to create UI.
 *
 * Use `component$` to declare a Qwik component. A Qwik component is a special kind of component
 * that allows the Qwik framework to lazy load and execute the component independently of other
 * Qwik components as well as lazy load the component's life-cycle hooks and event handlers.
 *
 * Side note: You can also declare regular (standard JSX) components that will have standard
 * synchronous behavior.
 *
 * Qwik component is a facade that describes how the component should be used without forcing the
 * implementation of the component to be eagerly loaded. A minimum Qwik definition consists of:
 *
 * ### Example:
 *
 * An example showing how to create a counter component:
 *
 * ```tsx
 * export interface CounterProps {
 *   initialValue?: number;
 *   step?: number;
 * }
 * export const Counter = component$((props: CounterProps) => {
 *   const state = useStore({ count: props.initialValue || 0 });
 *   return (
 *     <div>
 *       <span>{state.count}</span>
 *       <button onClick$={() => (state.count += props.step || 1)}>+</button>
 *     </div>
 *   );
 * });
 * ```
 *
 * - `component$` is how a component gets declared.
 * - `{ value?: number; step?: number }` declares the public (props) interface of the component.
 * - `{ count: number }` declares the private (state) interface of the component.
 *
 * The above can then be used like so:
 *
 * ```tsx
 * export const OtherComponent = component$(() => {
 *   return <Counter initialValue={100} />;
 * });
 * ```
 *
 * See also: `component`, `useCleanup`, `onResume`, `onPause`, `useOn`, `useOnDocument`,
 * `useOnWindow`, `useStyles`, `useScopedStyles`
 *
 * @public
 */
// </docs>
export const componentQrl = <PROPS extends {}>(
  onRenderQrl: QRL<OnRenderFn<PROPS>>,
  options: ComponentOptions = {}
): Component<PROPS> => {
  const tagName = options.tagName ?? 'div';
  const skipKey = ELEMENTS_SKIP_KEY.includes(tagName);

  // Return a QComponent Factory function.
  return function QSimpleComponent(props, key): JSXNode<PROPS> {
    const finalTag = props['host:tagName'] ?? tagName;
    const hash = qTest ? 'sX' : onRenderQrl.getHash();
    const finalKey = skipKey ? undefined : hash + ':' + (key ? key : '');
    return jsx(finalTag as string, { [OnRenderProp]: onRenderQrl, ...props }, finalKey) as any;
  };
};

// <docs markdown="../readme.md#component">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!!
// (edit ../readme.md#component instead)
/**
 * Declare a Qwik component that can be used to create UI.
 *
 * Use `component$` to declare a Qwik component. A Qwik component is a special kind of component
 * that allows the Qwik framework to lazy load and execute the component independently of other
 * Qwik components as well as lazy load the component's life-cycle hooks and event handlers.
 *
 * Side note: You can also declare regular (standard JSX) components that will have standard
 * synchronous behavior.
 *
 * Qwik component is a facade that describes how the component should be used without forcing the
 * implementation of the component to be eagerly loaded. A minimum Qwik definition consists of:
 *
 * ### Example:
 *
 * An example showing how to create a counter component:
 *
 * ```tsx
 * export interface CounterProps {
 *   initialValue?: number;
 *   step?: number;
 * }
 * export const Counter = component$((props: CounterProps) => {
 *   const state = useStore({ count: props.initialValue || 0 });
 *   return (
 *     <div>
 *       <span>{state.count}</span>
 *       <button onClick$={() => (state.count += props.step || 1)}>+</button>
 *     </div>
 *   );
 * });
 * ```
 *
 * - `component$` is how a component gets declared.
 * - `{ value?: number; step?: number }` declares the public (props) interface of the component.
 * - `{ count: number }` declares the private (state) interface of the component.
 *
 * The above can then be used like so:
 *
 * ```tsx
 * export const OtherComponent = component$(() => {
 *   return <Counter initialValue={100} />;
 * });
 * ```
 *
 * See also: `component`, `useCleanup`, `onResume`, `onPause`, `useOn`, `useOnDocument`,
 * `useOnWindow`, `useStyles`, `useScopedStyles`
 *
 * @public
 */
// </docs>
export const component$ = <PROPS extends {}>(
  onMount: OnRenderFn<PROPS>,
  options?: ComponentOptions
): Component<PROPS> => {
  return componentQrl<PROPS>($(onMount), options);
};

/**
 * @public
 */
export type OnRenderFn<PROPS> = (props: PROPS) => JSXNode<any> | null | (() => JSXNode<any>);

export interface RenderFactoryOutput<PROPS> {
  renderQRL: QRL<OnRenderFn<PROPS>>;
  waitOn: any[];
}
