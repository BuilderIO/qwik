---
title: \@builder.io/qwik API Reference
---

# [API](/api) &rsaquo; @builder.io/qwik

## \_qrlSync

> This API is provided as an alpha preview for developers and may change based on feedback that we receive. Do not use this API in a production environment.

Extract function into a synchronously loadable QRL.

NOTE: Synchronous QRLs functions can't close over any variables, including exports.

```typescript
_qrlSync: <TYPE extends Function>(fn: TYPE, serializedFn?: string) =>
  SyncQRL<TYPE>;
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

fn

</td><td>

TYPE

</td><td>

Extracted function

</td></tr>
<tr><td>

serializedFn

</td><td>

string

</td><td>

_(Optional)_ Serialized function in string form.

</td></tr>
</tbody></table>
**Returns:**

[SyncQRL](#syncqrl)&lt;TYPE&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/qrl/qrl.public.ts)

## "q:slot"

```typescript
'q:slot'?: string;
```

## "xlink:actuate"

```typescript
'xlink:actuate'?: string | undefined;
```

## "xlink:arcrole"

```typescript
'xlink:arcrole'?: string | undefined;
```

## "xlink:href"

```typescript
'xlink:href'?: string | undefined;
```

## "xlink:role"

```typescript
'xlink:role'?: string | undefined;
```

## "xlink:show"

```typescript
'xlink:show'?: string | undefined;
```

## "xlink:title"

```typescript
'xlink:title'?: string | undefined;
```

## "xlink:type"

```typescript
'xlink:type'?: string | undefined;
```

## "xml:base"

```typescript
'xml:base'?: string | undefined;
```

## "xml:lang"

```typescript
'xml:lang'?: string | undefined;
```

## "xml:space"

```typescript
'xml:space'?: string | undefined;
```

## "xmlns:xlink"

```typescript
'xmlns:xlink'?: string | undefined;
```

## $

Qwik Optimizer marker function.

Use `$(...)` to tell Qwik Optimizer to extract the expression in `$(...)` into a lazy-loadable resource referenced by `QRL`.

```typescript
$: <T>(expression: T) => QRL<T>;
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

expression

</td><td>

T

</td><td>

Expression which should be lazy loaded

</td></tr>
</tbody></table>
**Returns:**

[QRL](#qrl)&lt;T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/qrl/qrl.public.ts)

## AnchorHTMLAttributes

```typescript
export interface AnchorHTMLAttributes<T extends Element> extends Attrs<'a', T>
```

**Extends:** Attrs&lt;'a', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## AreaHTMLAttributes

```typescript
export interface AreaHTMLAttributes<T extends Element> extends Attrs<'area', T>
```

**Extends:** Attrs&lt;'area', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## AriaAttributes

TS defines these with the React syntax which is not compatible with Qwik. E.g. `ariaAtomic` instead of `aria-atomic`.

```typescript
export interface AriaAttributes
```

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

["aria-activedescendant"?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_ Identifies the currently active element when DOM focus is on a composite widget, textbox, group, or application.

</td></tr>
<tr><td>

["aria-atomic"?](#)

</td><td>

</td><td>

[Booleanish](#booleanish) \| undefined

</td><td>

_(Optional)_ Indicates whether assistive technologies will present all, or only parts of, the changed region based on the change notifications defined by the aria-relevant attribute.

</td></tr>
<tr><td>

["aria-autocomplete"?](#)

</td><td>

</td><td>

'none' \| 'inline' \| 'list' \| 'both' \| undefined

</td><td>

_(Optional)_ Indicates whether inputting text could trigger display of one or more predictions of the user's intended value for an input and specifies how predictions would be presented if they are made.

</td></tr>
<tr><td>

["aria-busy"?](#)

</td><td>

</td><td>

[Booleanish](#booleanish) \| undefined

</td><td>

_(Optional)_ Indicates an element is being modified and that assistive technologies MAY want to wait until the modifications are complete before exposing them to the user.

</td></tr>
<tr><td>

["aria-checked"?](#)

</td><td>

</td><td>

boolean \| 'false' \| 'mixed' \| 'true' \| undefined

</td><td>

_(Optional)_ Indicates the current "checked" state of checkboxes, radio buttons, and other widgets.

</td></tr>
<tr><td>

["aria-colcount"?](#)

</td><td>

</td><td>

number \| undefined

</td><td>

_(Optional)_ Defines the total number of columns in a table, grid, or treegrid.

</td></tr>
<tr><td>

["aria-colindex"?](#)

</td><td>

</td><td>

number \| undefined

</td><td>

_(Optional)_ Defines an element's column index or position with respect to the total number of columns within a table, grid, or treegrid.

</td></tr>
<tr><td>

["aria-colspan"?](#)

</td><td>

</td><td>

number \| undefined

</td><td>

_(Optional)_ Defines the number of columns spanned by a cell or gridcell within a table, grid, or treegrid.

</td></tr>
<tr><td>

["aria-controls"?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_ Identifies the element (or elements) whose contents or presence are controlled by the current element.

</td></tr>
<tr><td>

["aria-current"?](#)

</td><td>

</td><td>

boolean \| 'false' \| 'true' \| 'page' \| 'step' \| 'location' \| 'date' \| 'time' \| undefined

</td><td>

_(Optional)_ Indicates the element that represents the current item within a container or set of related elements.

</td></tr>
<tr><td>

["aria-describedby"?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_ Identifies the element (or elements) that describes the object.

</td></tr>
<tr><td>

["aria-details"?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_ Identifies the element that provides a detailed, extended description for the object.

</td></tr>
<tr><td>

["aria-disabled"?](#)

</td><td>

</td><td>

[Booleanish](#booleanish) \| undefined

</td><td>

_(Optional)_ Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable.

</td></tr>
<tr><td>

["aria-dropeffect"?](#)

</td><td>

</td><td>

'none' \| 'copy' \| 'execute' \| 'link' \| 'move' \| 'popup' \| undefined

</td><td>

_(Optional)_ Indicates what functions can be performed when a dragged object is released on the drop target.

</td></tr>
<tr><td>

["aria-errormessage"?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_ Identifies the element that provides an error message for the object.

</td></tr>
<tr><td>

["aria-expanded"?](#)

</td><td>

</td><td>

[Booleanish](#booleanish) \| undefined

</td><td>

_(Optional)_ Indicates whether the element, or another grouping element it controls, is currently expanded or collapsed.

</td></tr>
<tr><td>

["aria-flowto"?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_ Identifies the next element (or elements) in an alternate reading order of content which, at the user's discretion, allows assistive technology to override the general default of reading in document source order.

</td></tr>
<tr><td>

["aria-grabbed"?](#)

</td><td>

</td><td>

[Booleanish](#booleanish) \| undefined

</td><td>

_(Optional)_ Indicates an element's "grabbed" state in a drag-and-drop operation.

</td></tr>
<tr><td>

["aria-haspopup"?](#)

</td><td>

</td><td>

boolean \| 'false' \| 'true' \| 'menu' \| 'listbox' \| 'tree' \| 'grid' \| 'dialog' \| undefined

</td><td>

_(Optional)_ Indicates the availability and type of interactive popup element, such as menu or dialog, that can be triggered by an element.

</td></tr>
<tr><td>

["aria-hidden"?](#)

</td><td>

</td><td>

[Booleanish](#booleanish) \| undefined

</td><td>

_(Optional)_ Indicates whether the element is exposed to an accessibility API.

</td></tr>
<tr><td>

["aria-invalid"?](#)

</td><td>

</td><td>

boolean \| 'false' \| 'true' \| 'grammar' \| 'spelling' \| undefined

</td><td>

_(Optional)_ Indicates the entered value does not conform to the format expected by the application.

</td></tr>
<tr><td>

["aria-keyshortcuts"?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_ Indicates keyboard shortcuts that an author has implemented to activate or give focus to an element.

</td></tr>
<tr><td>

["aria-label"?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_ Defines a string value that labels the current element.

</td></tr>
<tr><td>

["aria-labelledby"?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_ Identifies the element (or elements) that labels the current element.

</td></tr>
<tr><td>

["aria-level"?](#)

</td><td>

</td><td>

number \| undefined

</td><td>

_(Optional)_ Defines the hierarchical level of an element within a structure.

</td></tr>
<tr><td>

["aria-live"?](#)

</td><td>

</td><td>

'off' \| 'assertive' \| 'polite' \| undefined

</td><td>

_(Optional)_ Indicates that an element will be updated, and describes the types of updates the user agents, assistive technologies, and user can expect from the live region.

</td></tr>
<tr><td>

["aria-modal"?](#)

</td><td>

</td><td>

[Booleanish](#booleanish) \| undefined

</td><td>

_(Optional)_ Indicates whether an element is modal when displayed.

</td></tr>
<tr><td>

["aria-multiline"?](#)

</td><td>

</td><td>

[Booleanish](#booleanish) \| undefined

</td><td>

_(Optional)_ Indicates whether a text box accepts multiple lines of input or only a single line.

</td></tr>
<tr><td>

["aria-multiselectable"?](#)

</td><td>

</td><td>

[Booleanish](#booleanish) \| undefined

</td><td>

_(Optional)_ Indicates that the user may select more than one item from the current selectable descendants.

</td></tr>
<tr><td>

["aria-orientation"?](#)

</td><td>

</td><td>

'horizontal' \| 'vertical' \| undefined

</td><td>

_(Optional)_ Indicates whether the element's orientation is horizontal, vertical, or unknown/ambiguous.

</td></tr>
<tr><td>

["aria-owns"?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_ Identifies an element (or elements) in order to define a visual, functional, or contextual parent/child relationship between DOM elements where the DOM hierarchy cannot be used to represent the relationship.

</td></tr>
<tr><td>

["aria-placeholder"?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_ Defines a short hint (a word or short phrase) intended to aid the user with data entry when the control has no value. A hint could be a sample value or a brief description of the expected format.

</td></tr>
<tr><td>

["aria-posinset"?](#)

</td><td>

</td><td>

number \| undefined

</td><td>

_(Optional)_ Defines an element's number or position in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.

</td></tr>
<tr><td>

["aria-pressed"?](#)

</td><td>

</td><td>

boolean \| 'false' \| 'mixed' \| 'true' \| undefined

</td><td>

_(Optional)_ Indicates the current "pressed" state of toggle buttons.

</td></tr>
<tr><td>

["aria-readonly"?](#)

</td><td>

</td><td>

[Booleanish](#booleanish) \| undefined

</td><td>

_(Optional)_ Indicates that the element is not editable, but is otherwise operable.

</td></tr>
<tr><td>

["aria-relevant"?](#)

</td><td>

</td><td>

'additions' \| 'additions removals' \| 'additions text' \| 'all' \| 'removals' \| 'removals additions' \| 'removals text' \| 'text' \| 'text additions' \| 'text removals' \| undefined

</td><td>

_(Optional)_ Indicates what notifications the user agent will trigger when the accessibility tree within a live region is modified.

</td></tr>
<tr><td>

["aria-required"?](#)

</td><td>

</td><td>

[Booleanish](#booleanish) \| undefined

</td><td>

_(Optional)_ Indicates that user input is required on the element before a form may be submitted.

</td></tr>
<tr><td>

["aria-roledescription"?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_ Defines a human-readable, author-localized description for the role of an element.

</td></tr>
<tr><td>

["aria-rowcount"?](#)

</td><td>

</td><td>

number \| undefined

</td><td>

_(Optional)_ Defines the total number of rows in a table, grid, or treegrid.

</td></tr>
<tr><td>

["aria-rowindex"?](#)

</td><td>

</td><td>

number \| undefined

</td><td>

_(Optional)_ Defines an element's row index or position with respect to the total number of rows within a table, grid, or treegrid.

</td></tr>
<tr><td>

["aria-rowspan"?](#)

</td><td>

</td><td>

number \| undefined

</td><td>

_(Optional)_ Defines the number of rows spanned by a cell or gridcell within a table, grid, or treegrid.

</td></tr>
<tr><td>

["aria-selected"?](#)

</td><td>

</td><td>

[Booleanish](#booleanish) \| undefined

</td><td>

_(Optional)_ Indicates the current "selected" state of various widgets.

</td></tr>
<tr><td>

["aria-setsize"?](#)

</td><td>

</td><td>

number \| undefined

</td><td>

_(Optional)_ Defines the number of items in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.

</td></tr>
<tr><td>

["aria-sort"?](#)

</td><td>

</td><td>

'none' \| 'ascending' \| 'descending' \| 'other' \| undefined

</td><td>

_(Optional)_ Indicates if items in a table or grid are sorted in ascending or descending order.

</td></tr>
<tr><td>

["aria-valuemax"?](#)

</td><td>

</td><td>

number \| undefined

</td><td>

_(Optional)_ Defines the maximum allowed value for a range widget.

</td></tr>
<tr><td>

["aria-valuemin"?](#)

</td><td>

</td><td>

number \| undefined

</td><td>

_(Optional)_ Defines the minimum allowed value for a range widget.

</td></tr>
<tr><td>

["aria-valuenow"?](#)

</td><td>

</td><td>

number \| undefined

</td><td>

_(Optional)_ Defines the current value for a range widget.

</td></tr>
<tr><td>

["aria-valuetext"?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_ Defines the human readable text alternative of aria-valuenow for a range widget.

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## AriaRole

```typescript
export type AriaRole =
  | "alert"
  | "alertdialog"
  | "application"
  | "article"
  | "banner"
  | "button"
  | "cell"
  | "checkbox"
  | "columnheader"
  | "combobox"
  | "complementary"
  | "contentinfo"
  | "definition"
  | "dialog"
  | "directory"
  | "document"
  | "feed"
  | "figure"
  | "form"
  | "grid"
  | "gridcell"
  | "group"
  | "heading"
  | "img"
  | "link"
  | "list"
  | "listbox"
  | "listitem"
  | "log"
  | "main"
  | "marquee"
  | "math"
  | "menu"
  | "menubar"
  | "menuitem"
  | "menuitemcheckbox"
  | "menuitemradio"
  | "navigation"
  | "none"
  | "note"
  | "option"
  | "presentation"
  | "progressbar"
  | "radio"
  | "radiogroup"
  | "region"
  | "row"
  | "rowgroup"
  | "rowheader"
  | "scrollbar"
  | "search"
  | "searchbox"
  | "separator"
  | "slider"
  | "spinbutton"
  | "status"
  | "switch"
  | "tab"
  | "table"
  | "tablist"
  | "tabpanel"
  | "term"
  | "textbox"
  | "timer"
  | "toolbar"
  | "tooltip"
  | "tree"
  | "treegrid"
  | "treeitem"
  | (string & {});
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## AudioHTMLAttributes

```typescript
export interface AudioHTMLAttributes<T extends Element> extends Attrs<'audio', T>
```

**Extends:** Attrs&lt;'audio', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## BaseHTMLAttributes

```typescript
export interface BaseHTMLAttributes<T extends Element> extends Attrs<'base', T>
```

**Extends:** Attrs&lt;'base', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## BlockquoteHTMLAttributes

```typescript
export interface BlockquoteHTMLAttributes<T extends Element> extends Attrs<'blockquote', T>
```

**Extends:** Attrs&lt;'blockquote', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## Booleanish

```typescript
export type Booleanish = boolean | `${boolean}`;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## ButtonHTMLAttributes

```typescript
export interface ButtonHTMLAttributes<T extends Element> extends Attrs<'button', T>
```

**Extends:** Attrs&lt;'button', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## cache

```typescript
cache(policyOrMilliseconds: number | 'immutable'): void;
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

policyOrMilliseconds

</td><td>

number \| 'immutable'

</td><td>

</td></tr>
</tbody></table>
**Returns:**

void

## CanvasHTMLAttributes

```typescript
export interface CanvasHTMLAttributes<T extends Element> extends Attrs<'canvas', T>
```

**Extends:** Attrs&lt;'canvas', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## ClassList

A class list can be a string, a boolean, an array, or an object.

If it's an array, each item is a class list and they are all added.

If it's an object, then the keys are class name strings, and the values are booleans that determine if the class name string should be added or not.

```typescript
export type ClassList =
  | string
  | undefined
  | null
  | false
  | Record<string, boolean | string | number | null | undefined>
  | ClassList[];
```

**References:** [ClassList](#classlist)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-attributes.ts)

## cleanup

```typescript
cleanup(): void;
```

**Returns:**

void

## ColgroupHTMLAttributes

```typescript
export interface ColgroupHTMLAttributes<T extends Element> extends Attrs<'colgroup', T>
```

**Extends:** Attrs&lt;'colgroup', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## ColHTMLAttributes

```typescript
export interface ColHTMLAttributes<T extends Element> extends Attrs<'col', T>
```

**Extends:** Attrs&lt;'col', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## Component

Type representing the Qwik component.

`Component` is the type returned by invoking `component$`.

```tsx
interface MyComponentProps {
  someProp: string;
}
const MyComponent: Component<MyComponentProps> = component$(
  (props: MyComponentProps) => {
    return <span>{props.someProp}</span>;
  },
);
```

```typescript
export type Component<PROPS = unknown> = FunctionComponent<PublicProps<PROPS>>;
```

**References:** [FunctionComponent](#functioncomponent), [PublicProps](#publicprops)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/component/component.public.ts)

## component$

Declare a Qwik component that can be used to create UI.

Use `component$` to declare a Qwik component. A Qwik component is a special kind of component that allows the Qwik framework to lazy load and execute the component independently of other Qwik components as well as lazy load the component's life-cycle hooks and event handlers.

Side note: You can also declare regular (standard JSX) components that will have standard synchronous behavior.

Qwik component is a facade that describes how the component should be used without forcing the implementation of the component to be eagerly loaded. A minimum Qwik definition consists of:

### Example

An example showing how to create a counter component:

```tsx
export interface CounterProps {
  initialValue?: number;
  step?: number;
}
export const Counter = component$((props: CounterProps) => {
  const state = useStore({ count: props.initialValue || 0 });
  return (
    <div>
      <span>{state.count}</span>
      <button onClick$={() => (state.count += props.step || 1)}>+</button>
    </div>
  );
});
```

- `component$` is how a component gets declared. - `{ value?: number; step?: number }` declares the public (props) interface of the component. - `{ count: number }` declares the private (state) interface of the component.

The above can then be used like so:

```tsx
export const OtherComponent = component$(() => {
  return <Counter initialValue={100} />;
});
```

See also: `component`, `useCleanup`, `onResume`, `onPause`, `useOn`, `useOnDocument`, `useOnWindow`, `useStyles`

```typescript
component$: <PROPS = unknown>(onMount: OnRenderFn<PROPS>) => Component<PROPS>;
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

onMount

</td><td>

[OnRenderFn](#onrenderfn)&lt;PROPS&gt;

</td><td>

</td></tr>
</tbody></table>
**Returns:**

[Component](#component)&lt;PROPS&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/component/component.public.ts)

## ComponentBaseProps

```typescript
export interface ComponentBaseProps
```

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

["q:slot"?](#componentbaseprops-_q_slot_)

</td><td>

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[key?](#)

</td><td>

</td><td>

string \| number \| null \| undefined

</td><td>

_(Optional)_

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-attributes.ts)

## componentQrl

Declare a Qwik component that can be used to create UI.

Use `component$` to declare a Qwik component. A Qwik component is a special kind of component that allows the Qwik framework to lazy load and execute the component independently of other Qwik components as well as lazy load the component's life-cycle hooks and event handlers.

Side note: You can also declare regular (standard JSX) components that will have standard synchronous behavior.

Qwik component is a facade that describes how the component should be used without forcing the implementation of the component to be eagerly loaded. A minimum Qwik definition consists of:

### Example

An example showing how to create a counter component:

```tsx
export interface CounterProps {
  initialValue?: number;
  step?: number;
}
export const Counter = component$((props: CounterProps) => {
  const state = useStore({ count: props.initialValue || 0 });
  return (
    <div>
      <span>{state.count}</span>
      <button onClick$={() => (state.count += props.step || 1)}>+</button>
    </div>
  );
});
```

- `component$` is how a component gets declared. - `{ value?: number; step?: number }` declares the public (props) interface of the component. - `{ count: number }` declares the private (state) interface of the component.

The above can then be used like so:

```tsx
export const OtherComponent = component$(() => {
  return <Counter initialValue={100} />;
});
```

See also: `component`, `useCleanup`, `onResume`, `onPause`, `useOn`, `useOnDocument`, `useOnWindow`, `useStyles`

```typescript
componentQrl: <PROPS extends Record<any, any>>(
  componentQrl: QRL<OnRenderFn<PROPS>>,
) => Component<PROPS>;
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

componentQrl

</td><td>

[QRL](#qrl)&lt;[OnRenderFn](#onrenderfn)&lt;PROPS&gt;&gt;

</td><td>

</td></tr>
</tbody></table>
**Returns:**

[Component](#component)&lt;PROPS&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/component/component.public.ts)

## ComputedFn

```typescript
export type ComputedFn<T> = () => T;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-task.ts)

## ContextId

ContextId is a typesafe ID for your context.

Context is a way to pass stores to the child components without prop-drilling.

Use `createContextId()` to create a `ContextId`. A `ContextId` is just a serializable identifier for the context. It is not the context value itself. See `useContextProvider()` and `useContext()` for the values. Qwik needs a serializable ID for the context so that the it can track context providers and consumers in a way that survives resumability.

### Example

```tsx
// Declare the Context type.
interface TodosStore {
  items: string[];
}
// Create a Context ID (no data is saved here.)
// You will use this ID to both create and retrieve the Context.
export const TodosContext = createContextId<TodosStore>("Todos");

// Example of providing context to child components.
export const App = component$(() => {
  useContextProvider(
    TodosContext,
    useStore<TodosStore>({
      items: ["Learn Qwik", "Build Qwik app", "Profit"],
    }),
  );

  return <Items />;
});

// Example of retrieving the context provided by a parent component.
export const Items = component$(() => {
  const todos = useContext(TodosContext);
  return (
    <ul>
      {todos.items.map((item) => (
        <li>{item}</li>
      ))}
    </ul>
  );
});
```

```typescript
export interface ContextId<STATE>
```

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[\_\_brand_context_type\_\_](#)

</td><td>

`readonly`

</td><td>

STATE

</td><td>

Design-time property to store type information for the context.

</td></tr>
<tr><td>

[id](#)

</td><td>

`readonly`

</td><td>

string

</td><td>

A unique ID for the context.

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-context.ts)

## CorePlatform

Low-level API for platform abstraction.

Different platforms (browser, node, service workers) may have different ways of handling things such as `requestAnimationFrame` and imports. To make Qwik platform-independent Qwik uses the `CorePlatform` API to access the platform API.

`CorePlatform` also is responsible for importing symbols. The import map is different on the client (browser) then on the server. For this reason, the server has a manifest that is used to map symbols to javascript chunks. The manifest is encapsulated in `CorePlatform`, for this reason, the `CorePlatform` can't be global as there may be multiple applications running at server concurrently.

This is a low-level API and there should not be a need for you to access this.

```typescript
export interface CorePlatform
```

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[chunkForSymbol](#)

</td><td>

</td><td>

(symbolName: string, chunk: string \| null, parent?: string) =&gt; readonly [symbol: string, chunk: string] \| undefined

</td><td>

Retrieve chunk name for the symbol.

When the application is running on the server the symbols may be imported from different files (as server build is typically a single javascript chunk.) For this reason, it is necessary to convert the chunks from server format to client (browser) format. This is done by looking up symbols (which are globally unique) in the manifest. (Manifest is the mapping of symbols to the client chunk names.)

</td></tr>
<tr><td>

[importSymbol](#)

</td><td>

</td><td>

(containerEl: Element \| undefined, url: string \| URL \| undefined \| null, symbol: string) =&gt; [ValueOrPromise](#valueorpromise)&lt;any&gt;

</td><td>

Retrieve a symbol value from QRL.

Qwik needs to lazy load data and closures. For this Qwik uses QRLs that are serializable references of resources that are needed. The QRLs contain all the information necessary to retrieve the reference using `importSymbol`.

Why not use `import()`? Because `import()` is relative to the current file, and the current file is always the Qwik framework. So QRLs have additional information that allows them to serialize imports relative to application base rather than the Qwik framework file.

</td></tr>
<tr><td>

[isServer](#)

</td><td>

</td><td>

boolean

</td><td>

True of running on the server platform.

</td></tr>
<tr><td>

[nextTick](#)

</td><td>

</td><td>

(fn: () =&gt; any) =&gt; Promise&lt;any&gt;

</td><td>

Perform operation on next tick.

</td></tr>
<tr><td>

[raf](#)

</td><td>

</td><td>

(fn: () =&gt; any) =&gt; Promise&lt;any&gt;

</td><td>

Perform operation on next request-animation-frame.

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/platform/types.ts)

## CorrectedToggleEvent

This corrects the TS definition for ToggleEvent

```typescript
export interface CorrectedToggleEvent extends Event
```

**Extends:** Event

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[newState](#)

</td><td>

`readonly`

</td><td>

'open' \| 'closed'

</td><td>

</td></tr>
<tr><td>

[prevState](#)

</td><td>

`readonly`

</td><td>

'open' \| 'closed'

</td><td>

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-attributes.ts)

## createComputed$

> Warning: This API is now obsolete.
>
> This is a technology preview

Returns read-only signal that updates when signals used in the `ComputedFn` change. Unlike useComputed$, this is not a hook and it always creates a new signal.

```typescript
createComputed$: <T>(qrl: ComputedFn<T>) => Signal<Awaited<T>>;
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

qrl

</td><td>

[ComputedFn](#computedfn)&lt;T&gt;

</td><td>

</td></tr>
</tbody></table>
**Returns:**

[Signal](#signal)&lt;Awaited&lt;T&gt;&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-task.ts)

## createComputedQrl

```typescript
createComputedQrl: <T>(qrl: QRL<ComputedFn<T>>) => Signal<Awaited<T>>;
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

qrl

</td><td>

[QRL](#qrl)&lt;[ComputedFn](#computedfn)&lt;T&gt;&gt;

</td><td>

</td></tr>
</tbody></table>
**Returns:**

[Signal](#signal)&lt;Awaited&lt;T&gt;&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-task.ts)

## createContextId

Create a context ID to be used in your application. The name should be written with no spaces.

Context is a way to pass stores to the child components without prop-drilling.

Use `createContextId()` to create a `ContextId`. A `ContextId` is just a serializable identifier for the context. It is not the context value itself. See `useContextProvider()` and `useContext()` for the values. Qwik needs a serializable ID for the context so that the it can track context providers and consumers in a way that survives resumability.

### Example

```tsx
// Declare the Context type.
interface TodosStore {
  items: string[];
}
// Create a Context ID (no data is saved here.)
// You will use this ID to both create and retrieve the Context.
export const TodosContext = createContextId<TodosStore>("Todos");

// Example of providing context to child components.
export const App = component$(() => {
  useContextProvider(
    TodosContext,
    useStore<TodosStore>({
      items: ["Learn Qwik", "Build Qwik app", "Profit"],
    }),
  );

  return <Items />;
});

// Example of retrieving the context provided by a parent component.
export const Items = component$(() => {
  const todos = useContext(TodosContext);
  return (
    <ul>
      {todos.items.map((item) => (
        <li>{item}</li>
      ))}
    </ul>
  );
});
```

```typescript
createContextId: <STATE = unknown>(name: string) => ContextId<STATE>;
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

name

</td><td>

string

</td><td>

The name of the context.

</td></tr>
</tbody></table>
**Returns:**

[ContextId](#contextid)&lt;STATE&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-context.ts)

## createSignal

> Warning: This API is now obsolete.
>
> This is a technology preview

Creates a signal.

If the initial state is a function, the function is invoked to calculate the actual initial state.

```typescript
createSignal: UseSignal;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-signal.ts)

## CSSProperties

```typescript
export interface CSSProperties extends CSS.Properties<string | number>, CSS.PropertiesHyphen<string | number>
```

**Extends:** CSS.Properties&lt;string \| number&gt;, CSS.PropertiesHyphen&lt;string \| number&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## DataHTMLAttributes

```typescript
export interface DataHTMLAttributes<T extends Element> extends Attrs<'data', T>
```

**Extends:** Attrs&lt;'data', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## DelHTMLAttributes

```typescript
export interface DelHTMLAttributes<T extends Element> extends Attrs<'del', T>
```

**Extends:** Attrs&lt;'del', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## DetailsHTMLAttributes

```typescript
export interface DetailsHTMLAttributes<T extends Element> extends Attrs<'details', T>
```

**Extends:** Attrs&lt;'details', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## DevJSX

```typescript
export interface DevJSX
```

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[columnNumber](#)

</td><td>

</td><td>

number

</td><td>

</td></tr>
<tr><td>

[fileName](#)

</td><td>

</td><td>

string

</td><td>

</td></tr>
<tr><td>

[lineNumber](#)

</td><td>

</td><td>

number

</td><td>

</td></tr>
<tr><td>

[stack?](#)

</td><td>

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-node.ts)

## DialogHTMLAttributes

```typescript
export interface DialogHTMLAttributes<T extends Element> extends Attrs<'dialog', T>
```

**Extends:** Attrs&lt;'dialog', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## DOMAttributes

The Qwik-specific attributes that DOM elements accept

```typescript
export interface DOMAttributes<EL extends Element> extends DOMAttributesBase<EL>, QwikEvents<EL>
```

**Extends:** DOMAttributesBase&lt;EL&gt;, QwikEvents&lt;EL&gt;

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[class?](#)

</td><td>

</td><td>

[ClassList](#classlist) \| [Signal](#signal)&lt;[ClassList](#classlist)&gt; \| undefined

</td><td>

_(Optional)_

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-attributes.ts)

## EagernessOptions

```typescript
export type EagernessOptions = "visible" | "load" | "idle";
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-task.ts)

## Element

```typescript
type Element = JSXOutput;
```

**References:** [JSXOutput](#jsxoutput)

## ElementChildrenAttribute

```typescript
interface ElementChildrenAttribute
```

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[children](#)

</td><td>

</td><td>

[JSXChildren](#jsxchildren)

</td><td>

</td></tr>
</tbody></table>

## ElementType

```typescript
type ElementType = string | FunctionComponent<Record<any, any>>;
```

**References:** [FunctionComponent](#functioncomponent)

## EmbedHTMLAttributes

```typescript
export interface EmbedHTMLAttributes<T extends Element> extends Attrs<'embed', T>
```

**Extends:** Attrs&lt;'embed', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## ErrorBoundaryStore

```typescript
export interface ErrorBoundaryStore
```

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[error](#)

</td><td>

</td><td>

any \| undefined

</td><td>

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/error-handling.ts)

## event$

```typescript
event$: <T>(qrl: T) => QRL<T>;
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

qrl

</td><td>

T

</td><td>

</td></tr>
</tbody></table>
**Returns:**

[QRL](#qrl)&lt;T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/qrl/qrl.public.ts)

## EventHandler

A DOM event handler

```typescript
export type EventHandler<EV = Event, EL = Element> = {
  bivarianceHack(event: EV, element: EL): any;
}["bivarianceHack"];
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-attributes.ts)

## eventQrl

```typescript
eventQrl: <T>(qrl: QRL<T>) => QRL<T>;
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

qrl

</td><td>

[QRL](#qrl)&lt;T&gt;

</td><td>

</td></tr>
</tbody></table>
**Returns:**

[QRL](#qrl)&lt;T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/qrl/qrl.public.ts)

## FieldsetHTMLAttributes

```typescript
export interface FieldsetHTMLAttributes<T extends Element> extends Attrs<'fieldset', T>
```

**Extends:** Attrs&lt;'fieldset', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## FormHTMLAttributes

```typescript
export interface FormHTMLAttributes<T extends Element> extends Attrs<'form', T>
```

**Extends:** Attrs&lt;'form', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## Fragment

```typescript
Fragment: FunctionComponent<{
  children?: any;
  key?: string | number | null;
}>;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/jsx-runtime.ts)

## FunctionComponent

Any function taking a props object that returns JSXOutput.

The `key`, `flags` and `dev` parameters are for internal use.

```typescript
export type FunctionComponent<P = unknown> = {
  renderFn(
    props: P,
    key: string | null,
    flags: number,
    dev?: DevJSX,
  ): JSXOutput;
}["renderFn"];
```

**References:** [DevJSX](#devjsx), [JSXOutput](#jsxoutput)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-node.ts)

## getPlatform

Retrieve the `CorePlatform`.

The `CorePlatform` is also responsible for retrieving the Manifest, that contains mappings from symbols to javascript import chunks. For this reason, `CorePlatform` can't be global, but is specific to the application currently running. On server it is possible that many different applications are running in a single server instance, and for this reason the `CorePlatform` is associated with the application document.

```typescript
getPlatform: () => CorePlatform;
```

**Returns:**

[CorePlatform](#coreplatform)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/platform/platform.ts)

## h

```typescript
export declare namespace h
```

<table><thead><tr><th>

Function

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[h(type)](#)

</td><td>

</td></tr>
<tr><td>

[h(type, data)](#)

</td><td>

</td></tr>
<tr><td>

[h(type, text)](#)

</td><td>

</td></tr>
<tr><td>

[h(type, children)](#)

</td><td>

</td></tr>
<tr><td>

[h(type, data, text)](#)

</td><td>

</td></tr>
<tr><td>

[h(type, data, children)](#)

</td><td>

</td></tr>
<tr><td>

[h(sel, data, children)](#)

</td><td>

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/factory.ts)

## h

```typescript
export declare namespace h
```

<table><thead><tr><th>

Function

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[h(type)](#)

</td><td>

</td></tr>
<tr><td>

[h(type, data)](#)

</td><td>

</td></tr>
<tr><td>

[h(type, text)](#)

</td><td>

</td></tr>
<tr><td>

[h(type, children)](#)

</td><td>

</td></tr>
<tr><td>

[h(type, data, text)](#)

</td><td>

</td></tr>
<tr><td>

[h(type, data, children)](#)

</td><td>

</td></tr>
<tr><td>

[h(sel, data, children)](#)

</td><td>

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/factory.ts)

## HrHTMLAttributes

```typescript
export interface HrHTMLAttributes<T extends Element> extends Attrs<'hr', T>
```

**Extends:** Attrs&lt;'hr', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## HTMLAttributeAnchorTarget

```typescript
export type HTMLAttributeAnchorTarget =
  | "_self"
  | "_blank"
  | "_parent"
  | "_top"
  | (string & {});
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## HTMLAttributeReferrerPolicy

```typescript
export type HTMLAttributeReferrerPolicy = ReferrerPolicy;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## HTMLAttributes

```typescript
export interface HTMLAttributes<E extends Element> extends HTMLElementAttrs, DOMAttributes<E>
```

**Extends:** [HTMLElementAttrs](#htmlelementattrs), [DOMAttributes](#domattributes)&lt;E&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## HTMLCrossOriginAttribute

```typescript
export type HTMLCrossOriginAttribute =
  | "anonymous"
  | "use-credentials"
  | ""
  | undefined;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## HTMLElementAttrs

```typescript
export interface HTMLElementAttrs extends HTMLAttributesBase, FilterBase<HTMLElement>
```

**Extends:** HTMLAttributesBase, FilterBase&lt;HTMLElement&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## HTMLFragment

```typescript
HTMLFragment: FunctionComponent<{
  dangerouslySetInnerHTML: string;
}>;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/jsx-runtime.ts)

## HtmlHTMLAttributes

```typescript
export interface HtmlHTMLAttributes<T extends Element> extends Attrs<'html', T>
```

**Extends:** Attrs&lt;'html', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## HTMLInputAutocompleteAttribute

```typescript
export type HTMLInputAutocompleteAttribute =
  | "on"
  | "off"
  | "billing"
  | "shipping"
  | "name"
  | "honorific-prefix"
  | "given-name"
  | "additional-name"
  | "family-name"
  | "honorific-suffix"
  | "nickname"
  | "username"
  | "new-password"
  | "current-password"
  | "one-time-code"
  | "organization-title"
  | "organization"
  | "street-address"
  | "address-line1"
  | "address-line2"
  | "address-line3"
  | "address-level4"
  | "address-level3"
  | "address-level2"
  | "address-level1"
  | "country"
  | "country-name"
  | "postal-code"
  | "cc-name"
  | "cc-given-name"
  | "cc-additional-name"
  | "cc-family-name"
  | "cc-number"
  | "cc-exp"
  | "cc-exp-month"
  | "cc-exp-year"
  | "cc-csc"
  | "cc-type"
  | "transaction-currency"
  | "transaction-amount"
  | "language"
  | "bday"
  | "bday-day"
  | "bday-month"
  | "bday-year"
  | "sex"
  | "url"
  | "photo";
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## HTMLInputTypeAttribute

```typescript
export type HTMLInputTypeAttribute =
  | "button"
  | "checkbox"
  | "color"
  | "date"
  | "datetime-local"
  | "email"
  | "file"
  | "hidden"
  | "image"
  | "month"
  | "number"
  | "password"
  | "radio"
  | "range"
  | "reset"
  | "search"
  | "submit"
  | "tel"
  | "text"
  | "time"
  | "url"
  | "week"
  | (string & {});
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## IframeHTMLAttributes

```typescript
export interface IframeHTMLAttributes<T extends Element> extends Attrs<'iframe', T>
```

**Extends:** Attrs&lt;'iframe', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## ImgHTMLAttributes

```typescript
export interface ImgHTMLAttributes<T extends Element> extends Attrs<'img', T>
```

**Extends:** Attrs&lt;'img', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## implicit$FirstArg

Create a `____$(...)` convenience method from `___(...)`.

It is very common for functions to take a lazy-loadable resource as a first argument. For this reason, the Qwik Optimizer automatically extracts the first argument from any function which ends in `$`.

This means that `foo$(arg0)` and `foo($(arg0))` are equivalent with respect to Qwik Optimizer. The former is just a shorthand for the latter.

For example, these function calls are equivalent:

- `component$(() => {...})` is same as `component($(() => {...}))`

```tsx
export function myApi(callback: QRL<() => void>): void {
  // ...
}

export const myApi$ = implicit$FirstArg(myApi);
// type of myApi$: (callback: () => void): void

// can be used as:
myApi$(() => console.log("callback"));

// will be transpiled to:
// FILE: <current file>
myApi(qrl("./chunk-abc.js", "callback"));

// FILE: chunk-abc.js
export const callback = () => console.log("callback");
```

```typescript
implicit$FirstArg: <FIRST, REST extends any[], RET>(
    fn: (qrl: QRL<FIRST>, ...rest: REST) => RET,
  ) =>
  (qrl: FIRST, ...rest: REST) =>
    RET;
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

fn

</td><td>

(qrl: [QRL](#qrl)&lt;FIRST&gt;, ...rest: REST) =&gt; RET

</td><td>

A function that should have its first argument automatically `$`.

</td></tr>
</tbody></table>
**Returns:**

((qrl: FIRST, ...rest: REST) =&gt; RET)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/util/implicit_dollar.ts)

## InputHTMLAttributes

```typescript
export type InputHTMLAttributes<T extends Element> = Attrs<
  "input",
  T,
  HTMLInputElement
>;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## InsHTMLAttributes

```typescript
export interface InsHTMLAttributes<T extends Element> extends Attrs<'ins', T>
```

**Extends:** Attrs&lt;'ins', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## IntrinsicAttributes

```typescript
interface IntrinsicAttributes extends QwikIntrinsicAttributes
```

**Extends:** QwikIntrinsicAttributes

## IntrinsicElements

```typescript
export interface IntrinsicElements extends IntrinsicHTMLElements, IntrinsicSVGElements
```

**Extends:** IntrinsicHTMLElements, IntrinsicSVGElements

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## isSignal

Checks if a given object is a `Signal`.

```typescript
isSignal: <T = unknown>(obj: any) => obj is Signal<T>
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

obj

</td><td>

any

</td><td>

The object to check if `Signal`.

</td></tr>
</tbody></table>
**Returns:**

obj is [Signal](#signal)&lt;T&gt;

Boolean - True if the object is a `Signal`.

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/state/signal.ts)

## jsx

Used by the JSX transpilers to create a JSXNode. Note that the optimizer will not use this, instead using \_jsxQ, \_jsxS, and \_jsxC directly.

```typescript
jsx: <T extends string | FunctionComponent<any>>(
  type: T,
  props: T extends FunctionComponent<infer PROPS>
    ? PROPS
    : Record<any, unknown>,
  key?: string | number | null,
) => JSXNode<T>;
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

type

</td><td>

T

</td><td>

</td></tr>
<tr><td>

props

</td><td>

T extends [FunctionComponent](#functioncomponent)&lt;infer PROPS&gt; ? PROPS : Record&lt;any, unknown&gt;

</td><td>

</td></tr>
<tr><td>

key

</td><td>

string \| number \| null

</td><td>

_(Optional)_

</td></tr>
</tbody></table>
**Returns:**

[JSXNode](#jsxnode)&lt;T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/jsx-runtime.ts)

## JSXChildren

```typescript
export type JSXChildren =
  | string
  | number
  | boolean
  | null
  | undefined
  | Function
  | RegExp
  | JSXChildren[]
  | Promise<JSXChildren>
  | Signal<JSXChildren>
  | JSXNode;
```

**References:** [JSXChildren](#jsxchildren), [Signal](#signal), [JSXNode](#jsxnode)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-attributes.ts)

## jsxDEV

```typescript
jsxDEV: <T extends string | FunctionComponent<Record<any, unknown>>>(
  type: T,
  props: T extends FunctionComponent<infer PROPS>
    ? PROPS
    : Record<any, unknown>,
  key: string | number | null | undefined,
  _isStatic: boolean,
  opts: JsxDevOpts,
  _ctx: unknown,
) => JSXNode<T>;
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

type

</td><td>

T

</td><td>

</td></tr>
<tr><td>

props

</td><td>

T extends [FunctionComponent](#functioncomponent)&lt;infer PROPS&gt; ? PROPS : Record&lt;any, unknown&gt;

</td><td>

</td></tr>
<tr><td>

key

</td><td>

string \| number \| null \| undefined

</td><td>

</td></tr>
<tr><td>

\_isStatic

</td><td>

boolean

</td><td>

</td></tr>
<tr><td>

opts

</td><td>

JsxDevOpts

</td><td>

</td></tr>
<tr><td>

\_ctx

</td><td>

unknown

</td><td>

</td></tr>
</tbody></table>
**Returns:**

[JSXNode](#jsxnode)&lt;T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/jsx-runtime.ts)

## JSXNode

A JSX Node, an internal structure. You probably want to use `JSXOutput` instead.

```typescript
export interface JSXNode<T extends string | FunctionComponent | unknown = unknown>
```

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[children](#)

</td><td>

</td><td>

[JSXChildren](#jsxchildren) \| null

</td><td>

</td></tr>
<tr><td>

[dev?](#)

</td><td>

</td><td>

[DevJSX](#devjsx)

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[flags](#)

</td><td>

</td><td>

number

</td><td>

</td></tr>
<tr><td>

[immutableProps](#)

</td><td>

</td><td>

Record&lt;any, unknown&gt; \| null

</td><td>

</td></tr>
<tr><td>

[key](#)

</td><td>

</td><td>

string \| null

</td><td>

</td></tr>
<tr><td>

[props](#)

</td><td>

</td><td>

T extends [FunctionComponent](#functioncomponent)&lt;infer P&gt; ? P : Record&lt;any, unknown&gt;

</td><td>

</td></tr>
<tr><td>

[type](#)

</td><td>

</td><td>

T

</td><td>

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-node.ts)

## JSXOutput

Any valid output for a component

```typescript
export type JSXOutput =
  | JSXNode
  | string
  | number
  | boolean
  | null
  | undefined
  | JSXOutput[];
```

**References:** [JSXNode](#jsxnode), [JSXOutput](#jsxoutput)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-node.ts)

## JSXTagName

```typescript
export type JSXTagName =
  | keyof HTMLElementTagNameMap
  | Omit<string, keyof HTMLElementTagNameMap>;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-attributes.ts)

## KeygenHTMLAttributes

> Warning: This API is now obsolete.
>
> in html5

```typescript
export interface KeygenHTMLAttributes<T extends Element> extends Attrs<'base', T>
```

**Extends:** Attrs&lt;'base', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## KnownEventNames

The names of events that Qwik knows about. They are all lowercase, but on the JSX side, they are PascalCase for nicer DX. (`onAuxClick$` vs `onauxclick$`)

```typescript
export type KnownEventNames = LiteralUnion<AllEventKeys, string>;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-events.ts)

## LabelHTMLAttributes

```typescript
export interface LabelHTMLAttributes<T extends Element> extends Attrs<'label', T>
```

**Extends:** Attrs&lt;'label', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## LiHTMLAttributes

```typescript
export interface LiHTMLAttributes<T extends Element> extends Attrs<'li', T>
```

**Extends:** Attrs&lt;'li', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## LinkHTMLAttributes

```typescript
export interface LinkHTMLAttributes<T extends Element> extends Attrs<'link', T>
```

**Extends:** Attrs&lt;'link', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## MapHTMLAttributes

```typescript
export interface MapHTMLAttributes<T extends Element> extends Attrs<'map', T>
```

**Extends:** Attrs&lt;'map', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## MediaHTMLAttributes

```typescript
export interface MediaHTMLAttributes<T extends Element> extends HTMLAttributes<T>, Augmented<HTMLMediaElement, {
    crossOrigin?: HTMLCrossOriginAttribute;
}>
```

**Extends:** [HTMLAttributes](#htmlattributes)&lt;T&gt;, Augmented&lt;HTMLMediaElement, { crossOrigin?: [HTMLCrossOriginAttribute](#htmlcrossoriginattribute); }&gt;

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[crossOrigin?](#)

</td><td>

</td><td>

[HTMLCrossOriginAttribute](#htmlcrossoriginattribute)

</td><td>

_(Optional)_

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## MenuHTMLAttributes

```typescript
export interface MenuHTMLAttributes<T extends Element> extends Attrs<'menu', T>
```

**Extends:** Attrs&lt;'menu', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## MetaHTMLAttributes

```typescript
export interface MetaHTMLAttributes<T extends Element> extends Attrs<'meta', T>
```

**Extends:** Attrs&lt;'meta', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## MeterHTMLAttributes

```typescript
export interface MeterHTMLAttributes<T extends Element> extends Attrs<'meter', T>
```

**Extends:** Attrs&lt;'meter', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## NativeAnimationEvent

> Warning: This API is now obsolete.
>
> Use `AnimationEvent` and use the second argument to the handler function for the current event target

```typescript
export type NativeAnimationEvent = AnimationEvent;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-events.ts)

## NativeClipboardEvent

> Warning: This API is now obsolete.
>
> Use `ClipboardEvent` and use the second argument to the handler function for the current event target

```typescript
export type NativeClipboardEvent = ClipboardEvent;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-events.ts)

## NativeCompositionEvent

> Warning: This API is now obsolete.
>
> Use `CompositionEvent` and use the second argument to the handler function for the current event target

```typescript
export type NativeCompositionEvent = CompositionEvent;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-events.ts)

## NativeDragEvent

> Warning: This API is now obsolete.
>
> Use `DragEvent` and use the second argument to the handler function for the current event target

```typescript
export type NativeDragEvent = DragEvent;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-events.ts)

## NativeFocusEvent

> Warning: This API is now obsolete.
>
> Use `FocusEvent` and use the second argument to the handler function for the current event target

```typescript
export type NativeFocusEvent = FocusEvent;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-events.ts)

## NativeKeyboardEvent

> Warning: This API is now obsolete.
>
> Use `KeyboardEvent` and use the second argument to the handler function for the current event target

```typescript
export type NativeKeyboardEvent = KeyboardEvent;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-events.ts)

## NativeMouseEvent

> Warning: This API is now obsolete.
>
> Use `MouseEvent` and use the second argument to the handler function for the current event target

```typescript
export type NativeMouseEvent = MouseEvent;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-events.ts)

## NativePointerEvent

> Warning: This API is now obsolete.
>
> Use `PointerEvent` and use the second argument to the handler function for the current event target

```typescript
export type NativePointerEvent = PointerEvent;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-events.ts)

## NativeTouchEvent

> Warning: This API is now obsolete.
>
> Use `TouchEvent` and use the second argument to the handler function for the current event target

```typescript
export type NativeTouchEvent = TouchEvent;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-events.ts)

## NativeTransitionEvent

> Warning: This API is now obsolete.
>
> Use `TransitionEvent` and use the second argument to the handler function for the current event target

```typescript
export type NativeTransitionEvent = TransitionEvent;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-events.ts)

## NativeUIEvent

> Warning: This API is now obsolete.
>
> Use `UIEvent` and use the second argument to the handler function for the current event target

```typescript
export type NativeUIEvent = UIEvent;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-events.ts)

## NativeWheelEvent

> Warning: This API is now obsolete.
>
> Use `WheelEvent` and use the second argument to the handler function for the current event target

```typescript
export type NativeWheelEvent = WheelEvent;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-events.ts)

## noSerialize

Returned type of the `noSerialize()` function. It will be TYPE or undefined.

```typescript
export type NoSerialize<T> =
  | (T & {
      __no_serialize__: true;
    })
  | undefined;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/state/common.ts)

## NoSerialize

Returned type of the `noSerialize()` function. It will be TYPE or undefined.

```typescript
export type NoSerialize<T> =
  | (T & {
      __no_serialize__: true;
    })
  | undefined;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/state/common.ts)

## Numberish

```typescript
export type Numberish = number | `${number}`;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## ObjectHTMLAttributes

```typescript
export interface ObjectHTMLAttributes<T extends Element> extends Attrs<'object', T>
```

**Extends:** Attrs&lt;'object', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## OlHTMLAttributes

```typescript
export interface OlHTMLAttributes<T extends Element> extends Attrs<'ol', T>
```

**Extends:** Attrs&lt;'ol', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## OnRenderFn

```typescript
export type OnRenderFn<PROPS> = (props: PROPS) => JSXOutput;
```

**References:** [JSXOutput](#jsxoutput)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/component/component.public.ts)

## OnVisibleTaskOptions

```typescript
export interface OnVisibleTaskOptions
```

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[strategy?](#)

</td><td>

</td><td>

[VisibleTaskStrategy](#visibletaskstrategy)

</td><td>

_(Optional)_ The strategy to use to determine when the "VisibleTask" should first execute.

- `intersection-observer`: the task will first execute when the element is visible in the viewport, under the hood it uses the IntersectionObserver API. - `document-ready`: the task will first execute when the document is ready, under the hood it uses the document `load` event. - `document-idle`: the task will first execute when the document is idle, under the hood it uses the requestIdleCallback API.

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-task.ts)

## OptgroupHTMLAttributes

```typescript
export interface OptgroupHTMLAttributes<T extends Element> extends Attrs<'optgroup', T>
```

**Extends:** Attrs&lt;'optgroup', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## OptionHTMLAttributes

```typescript
export interface OptionHTMLAttributes<T extends Element> extends Attrs<'option', T>
```

**Extends:** Attrs&lt;'option', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## OutputHTMLAttributes

```typescript
export interface OutputHTMLAttributes<T extends Element> extends Attrs<'output', T>
```

**Extends:** Attrs&lt;'output', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## ParamHTMLAttributes

> Warning: This API is now obsolete.
>
> Old DOM API

```typescript
export interface ParamHTMLAttributes<T extends Element> extends Attrs<'base', T, HTMLParamElement>
```

**Extends:** Attrs&lt;'base', T, HTMLParamElement&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## PrefetchGraph

> This API is provided as an alpha preview for developers and may change based on feedback that we receive. Do not use this API in a production environment.

Load the prefetch graph for the container.

Each Qwik container needs to include its own prefetch graph.

```typescript
PrefetchGraph: (opts?: {
  base?: string;
  manifestHash?: string;
  manifestURL?: string;
  nonce?: string;
}) => JSXNode<"script">;
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

opts

</td><td>

{ base?: string; manifestHash?: string; manifestURL?: string; nonce?: string; }

</td><td>

_(Optional)_ Options for the loading prefetch graph.

- `base` - Base of the graph. For a default installation this will default to `/build/`. But if more than one MFE is installed on the page, then each MFE needs to have its own base. - `manifestHash` - Hash of the manifest file to load. If not provided the hash will be extracted from the container attribute `q:manifest-hash` and assume the default build file `${base}/q-bundle-graph-${manifestHash}.json`. - `manifestURL` - URL of the manifest file to load if non-standard bundle graph location name.

</td></tr>
</tbody></table>
**Returns:**

[JSXNode](#jsxnode)&lt;"script"&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/components/prefetch.ts)

## PrefetchServiceWorker

> This API is provided as an alpha preview for developers and may change based on feedback that we receive. Do not use this API in a production environment.

Install a service worker which will prefetch the bundles.

There can only be one service worker per page. Because there can be many separate Qwik Containers on the page each container needs to load its prefetch graph using `PrefetchGraph` component.

```typescript
PrefetchServiceWorker: (opts: {
  base?: string;
  scope?: string;
  path?: string;
  verbose?: boolean;
  fetchBundleGraph?: boolean;
  nonce?: string;
}) => JSXNode<"script">;
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

opts

</td><td>

{ base?: string; scope?: string; path?: string; verbose?: boolean; fetchBundleGraph?: boolean; nonce?: string; }

</td><td>

Options for the prefetch service worker.

- `base` - Base URL for the service worker `import.meta.env.BASE_URL` or `/`. Default is `import.meta.env.BASE_URL` - `scope` - Base URL for when the service-worker will activate. Default is `/` - `path` - Path to the service worker. Default is `qwik-prefetch-service-worker.js` unless you pass a path that starts with a `/` then the base is ignored. Default is `qwik-prefetch-service-worker.js` - `verbose` - Verbose logging for the service worker installation. Default is `false` - `nonce` - Optional nonce value for security purposes, defaults to `undefined`.

</td></tr>
</tbody></table>
**Returns:**

[JSXNode](#jsxnode)&lt;'script'&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/components/prefetch.ts)

## ProgressHTMLAttributes

```typescript
export interface ProgressHTMLAttributes<T extends Element> extends Attrs<'progress', T>
```

**Extends:** Attrs&lt;'progress', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## PropFnInterface

> Warning: This API is now obsolete.
>
> Use `QRL<>` instead

```typescript
export type PropFnInterface<ARGS extends any[], RET> = {
  __qwik_serializable__?: any;
  (...args: ARGS): Promise<RET>;
};
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/qrl/qrl.public.ts)

## PropFunction

Alias for `QRL<T>`. Of historic relevance only.

```typescript
export type PropFunction<T> = QRL<T>;
```

**References:** [QRL](#qrl)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/qrl/qrl.public.ts)

## PropFunctionProps

> Warning: This API is now obsolete.
>
> Use `QRL<>` on your function props instead

```typescript
export type PropFunctionProps<PROPS extends Record<any, any>> = {
  [K in keyof PROPS]: PROPS[K] extends undefined
    ? PROPS[K]
    : PROPS[K] extends ((...args: infer ARGS) => infer RET) | undefined
      ? PropFnInterface<ARGS, Awaited<RET>>
      : PROPS[K];
};
```

**References:** [PropFnInterface](#propfninterface)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/component/component.public.ts)

## PropsOf

Infers `Props` from the component or tag.

```typescript
export type PropsOf<COMP> = COMP extends string
  ? COMP extends keyof QwikIntrinsicElements
    ? QwikIntrinsicElements[COMP]
    : QwikIntrinsicElements["span"]
  : NonNullable<COMP> extends never
    ? never
    : COMP extends FunctionComponent<infer PROPS>
      ? PROPS extends Record<any, infer V>
        ? IsAny<V> extends true
          ? never
          : ObjectProps<PROPS>
        : COMP extends Component<infer OrigProps>
          ? ObjectProps<OrigProps>
          : PROPS
      : never;
```

**References:** [QwikIntrinsicElements](#qwikintrinsicelements), [FunctionComponent](#functioncomponent), [Component](#component)

```tsx
const Desc = component$(
  ({ desc, ...props }: { desc: string } & PropsOf<"div">) => {
    return <div {...props}>{desc}</div>;
  },
);

const TitleBox = component$(
  ({ title, ...props }: { title: string } & PropsOf<Box>) => {
    return (
      <Box {...props}>
        <h1>{title}</h1>
      </Box>
    );
  },
);
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/component/component.public.ts)

## PublicProps

Extends the defined component PROPS, adding the default ones (children and q:slot) and allowing plain functions to QRL arguments.

```typescript
export type PublicProps<PROPS> = (PROPS extends Record<any, any>
  ? Omit<PROPS, `${string}$`> & _Only$<PROPS>
  : unknown extends PROPS
    ? {}
    : PROPS) &
  ComponentBaseProps &
  ComponentChildren<PROPS>;
```

**References:** [ComponentBaseProps](#componentbaseprops)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/component/component.public.ts)

## qrl

The `QRL` type represents a lazy-loadable AND serializable resource.

QRL stands for Qwik URL.

Use `QRL` when you want to refer to a lazy-loaded resource. `QRL`s are most often used for code (functions) but can also be used for other resources such as `string`s in the case of styles.

`QRL` is an opaque token that is generated by the Qwik Optimizer. (Do not rely on any properties in `QRL` as it may change between versions.)

\#\# Creating `QRL` references

Creating `QRL` is done using `$(...)` function. `$(...)` is a special marker for the Qwik Optimizer that marks that the code should be extracted into a lazy-loaded symbol.

```tsx
useOnDocument(
  "mousemove",
  $((event) => console.log("mousemove", event)),
);
```

In the above code, the Qwik Optimizer detects `$(...)` and transforms the code as shown below:

```tsx
// FILE: <current file>
useOnDocument("mousemove", qrl("./chunk-abc.js", "onMousemove"));

// FILE: chunk-abc.js
export const onMousemove = () => console.log("mousemove");
```

NOTE: `qrl(...)` is a result of Qwik Optimizer transformation. You should never have to invoke this function directly in your application. The `qrl(...)` function should be invoked only after the Qwik Optimizer transformation.

\#\# Using `QRL`s

Use `QRL` type in your application when you want to get a lazy-loadable reference to a resource (most likely a function).

```tsx
// Example of declaring a custom functions which takes callback as QRL.
export function useMyFunction(callback: QRL<() => void>) {
  doExtraStuff();
  // The callback passed to `onDocument` requires `QRL`.
  useOnDocument("mousemove", callback);
}
```

In the above example, the way to think about the code is that you are not asking for a callback function but rather a reference to a lazy-loadable callback function. Specifically, the function loading should be delayed until it is actually needed. In the above example, the function would not load until after a `mousemove` event on `document` fires.

\#\# Resolving `QRL` references

At times it may be necessary to resolve a `QRL` reference to the actual value. This can be performed using `QRL.resolve(..)` function.

```tsx
// Assume you have QRL reference to a greet function
const lazyGreet: QRL<() => void> = $(() => console.log("Hello World!"));

// Use `qrlImport` to load / resolve the reference.
const greet: () => void = await lazyGreet.resolve();

//  Invoke it
greet();
```

NOTE: `element` is needed because `QRL`s are relative and need a base location to resolve against. The base location is encoded in the HTML in the form of `<div q:base="/url">`.

\#\# `QRL.resolved`

Once `QRL.resolve()` returns, the value is stored under `QRL.resolved`. This allows the value to be used without having to await `QRL.resolve()` again.

\#\# Question: Why not just use `import()`?

At first glance, `QRL` serves the same purpose as `import()`. However, there are three subtle differences that need to be taken into account.

1. `QRL`s must be serializable into HTML. 2. `QRL`s must be resolved by framework relative to `q:base`. 3. `QRL`s must be able to capture lexically scoped variables. 4. `QRL`s encapsulate the difference between running with and without Qwik Optimizer. 5. `QRL`s allow expressing lazy-loaded boundaries without thinking about chunk and symbol names.

Let's assume that you intend to write code such as this:

```tsx
return <button onClick={() => (await import('./chunk-abc.js')).onClick}>
```

The above code needs to be serialized into DOM such as:

```
<div q:base="/build/">
  <button on:click="./chunk-abc.js#onClick">...</button>
</div>
```

1. Notice there is no easy way to extract chunk (`./chunk-abc.js`) and symbol (`onClick`) into HTML. 2. Notice that even if you could extract it, the `import('./chunk-abc.js')` would become relative to where the `import()` file is declared. Because it is our framework doing the load, the `./chunk-abc.js` would become relative to the framework file. This is not correct, as it should be relative to the original file generated by the bundler. 3. Next, the framework needs to resolve the `./chunk-abc.js` and needs a base location that is encoded in the HTML. 4. The QRL needs to be able to capture lexically scoped variables. (`import()` only allows loading top-level symbols which don't capture variables.) 5. As a developer, you don't want to think about `import` and naming the chunks and symbols. You just want to say: "this should be lazy."

These are the main reasons why Qwik introduces its own concept of `QRL`.

```typescript
export type QRL<TYPE = unknown> = {
  __qwik_serializable__?: any;
  __brand__QRL__: TYPE;
  resolve(): Promise<TYPE>;
  resolved: undefined | TYPE;
  getCaptured(): unknown[] | null;
  getSymbol(): string;
  getHash(): string;
  dev: QRLDev | null;
} & BivariantQrlFn<QrlArgs<TYPE>, QrlReturn<TYPE>>;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/qrl/qrl.ts)

## QRL

The `QRL` type represents a lazy-loadable AND serializable resource.

QRL stands for Qwik URL.

Use `QRL` when you want to refer to a lazy-loaded resource. `QRL`s are most often used for code (functions) but can also be used for other resources such as `string`s in the case of styles.

`QRL` is an opaque token that is generated by the Qwik Optimizer. (Do not rely on any properties in `QRL` as it may change between versions.)

\#\# Creating `QRL` references

Creating `QRL` is done using `$(...)` function. `$(...)` is a special marker for the Qwik Optimizer that marks that the code should be extracted into a lazy-loaded symbol.

```tsx
useOnDocument(
  "mousemove",
  $((event) => console.log("mousemove", event)),
);
```

In the above code, the Qwik Optimizer detects `$(...)` and transforms the code as shown below:

```tsx
// FILE: <current file>
useOnDocument("mousemove", qrl("./chunk-abc.js", "onMousemove"));

// FILE: chunk-abc.js
export const onMousemove = () => console.log("mousemove");
```

NOTE: `qrl(...)` is a result of Qwik Optimizer transformation. You should never have to invoke this function directly in your application. The `qrl(...)` function should be invoked only after the Qwik Optimizer transformation.

\#\# Using `QRL`s

Use `QRL` type in your application when you want to get a lazy-loadable reference to a resource (most likely a function).

```tsx
// Example of declaring a custom functions which takes callback as QRL.
export function useMyFunction(callback: QRL<() => void>) {
  doExtraStuff();
  // The callback passed to `onDocument` requires `QRL`.
  useOnDocument("mousemove", callback);
}
```

In the above example, the way to think about the code is that you are not asking for a callback function but rather a reference to a lazy-loadable callback function. Specifically, the function loading should be delayed until it is actually needed. In the above example, the function would not load until after a `mousemove` event on `document` fires.

\#\# Resolving `QRL` references

At times it may be necessary to resolve a `QRL` reference to the actual value. This can be performed using `QRL.resolve(..)` function.

```tsx
// Assume you have QRL reference to a greet function
const lazyGreet: QRL<() => void> = $(() => console.log("Hello World!"));

// Use `qrlImport` to load / resolve the reference.
const greet: () => void = await lazyGreet.resolve();

//  Invoke it
greet();
```

NOTE: `element` is needed because `QRL`s are relative and need a base location to resolve against. The base location is encoded in the HTML in the form of `<div q:base="/url">`.

\#\# `QRL.resolved`

Once `QRL.resolve()` returns, the value is stored under `QRL.resolved`. This allows the value to be used without having to await `QRL.resolve()` again.

\#\# Question: Why not just use `import()`?

At first glance, `QRL` serves the same purpose as `import()`. However, there are three subtle differences that need to be taken into account.

1. `QRL`s must be serializable into HTML. 2. `QRL`s must be resolved by framework relative to `q:base`. 3. `QRL`s must be able to capture lexically scoped variables. 4. `QRL`s encapsulate the difference between running with and without Qwik Optimizer. 5. `QRL`s allow expressing lazy-loaded boundaries without thinking about chunk and symbol names.

Let's assume that you intend to write code such as this:

```tsx
return <button onClick={() => (await import('./chunk-abc.js')).onClick}>
```

The above code needs to be serialized into DOM such as:

```
<div q:base="/build/">
  <button on:click="./chunk-abc.js#onClick">...</button>
</div>
```

1. Notice there is no easy way to extract chunk (`./chunk-abc.js`) and symbol (`onClick`) into HTML. 2. Notice that even if you could extract it, the `import('./chunk-abc.js')` would become relative to where the `import()` file is declared. Because it is our framework doing the load, the `./chunk-abc.js` would become relative to the framework file. This is not correct, as it should be relative to the original file generated by the bundler. 3. Next, the framework needs to resolve the `./chunk-abc.js` and needs a base location that is encoded in the HTML. 4. The QRL needs to be able to capture lexically scoped variables. (`import()` only allows loading top-level symbols which don't capture variables.) 5. As a developer, you don't want to think about `import` and naming the chunks and symbols. You just want to say: "this should be lazy."

These are the main reasons why Qwik introduces its own concept of `QRL`.

```typescript
export type QRL<TYPE = unknown> = {
  __qwik_serializable__?: any;
  __brand__QRL__: TYPE;
  resolve(): Promise<TYPE>;
  resolved: undefined | TYPE;
  getCaptured(): unknown[] | null;
  getSymbol(): string;
  getHash(): string;
  dev: QRLDev | null;
} & BivariantQrlFn<QrlArgs<TYPE>, QrlReturn<TYPE>>;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/qrl/qrl.public.ts)

## QRLEventHandlerMulti

> This API is provided as a beta preview for developers and may change based on feedback that we receive. Do not use this API in a production environment.

An event handler for Qwik events, can be a handler QRL or an array of handler QRLs.

```typescript
export type QRLEventHandlerMulti<EV extends Event, EL> =
  | QRL<EventHandler<EV, EL>>
  | undefined
  | null
  | QRLEventHandlerMulti<EV, EL>[]
  | EventHandler<EV, EL>;
```

**References:** [QRL](#qrl), [EventHandler](#eventhandler), [QRLEventHandlerMulti](#qrleventhandlermulti)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-attributes.ts)

## QuoteHTMLAttributes

```typescript
export interface QuoteHTMLAttributes<T extends Element> extends Attrs<'q', T>
```

**Extends:** Attrs&lt;'q', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## QwikAnimationEvent

> Warning: This API is now obsolete.
>
> Use `AnimationEvent` and use the second argument to the handler function for the current event target

```typescript
export type QwikAnimationEvent<T = Element> = NativeAnimationEvent;
```

**References:** [NativeAnimationEvent](#nativeanimationevent)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-events.ts)

## QwikAttributes

The Qwik DOM attributes without plain handlers, for use as function parameters

```typescript
export interface QwikAttributes<EL extends Element> extends DOMAttributesBase<EL>, QwikEvents<EL, false>
```

**Extends:** DOMAttributesBase&lt;EL&gt;, QwikEvents&lt;EL, false&gt;

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[class?](#)

</td><td>

</td><td>

[ClassList](#classlist) \| undefined

</td><td>

_(Optional)_

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-attributes.ts)

## QwikChangeEvent

> Warning: This API is now obsolete.
>
> Use `Event` and use the second argument to the handler function for the current event target. Also note that in Qwik, onInput$ with the InputEvent is the event that behaves like onChange in React.

```typescript
export type QwikChangeEvent<T = Element> = Event;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-events.ts)

## QwikClipboardEvent

> Warning: This API is now obsolete.
>
> Use `ClipboardEvent` and use the second argument to the handler function for the current event target

```typescript
export type QwikClipboardEvent<T = Element> = NativeClipboardEvent;
```

**References:** [NativeClipboardEvent](#nativeclipboardevent)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-events.ts)

## QwikCompositionEvent

> Warning: This API is now obsolete.
>
> Use `CompositionEvent` and use the second argument to the handler function for the current event target

```typescript
export type QwikCompositionEvent<T = Element> = NativeCompositionEvent;
```

**References:** [NativeCompositionEvent](#nativecompositionevent)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-events.ts)

## QwikDOMAttributes

```typescript
export interface QwikDOMAttributes extends DOMAttributes<Element>
```

**Extends:** [DOMAttributes](#domattributes)&lt;Element&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik.ts)

## QwikDragEvent

> Warning: This API is now obsolete.
>
> Use `DragEvent` and use the second argument to the handler function for the current event target

```typescript
export type QwikDragEvent<T = Element> = NativeDragEvent;
```

**References:** [NativeDragEvent](#nativedragevent)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-events.ts)

## QwikFocusEvent

> Warning: This API is now obsolete.
>
> Use `FocusEvent` and use the second argument to the handler function for the current event target

```typescript
export type QwikFocusEvent<T = Element> = NativeFocusEvent;
```

**References:** [NativeFocusEvent](#nativefocusevent)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-events.ts)

## QwikHTMLElements

The DOM props without plain handlers, for use inside functions

```typescript
export type QwikHTMLElements = {
  [tag in keyof HTMLElementTagNameMap]: Augmented<
    HTMLElementTagNameMap[tag],
    SpecialAttrs[tag]
  > &
    HTMLElementAttrs &
    QwikAttributes<HTMLElementTagNameMap[tag]>;
};
```

**References:** [HTMLElementAttrs](#htmlelementattrs), [QwikAttributes](#qwikattributes)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## QwikIdleEvent

Emitted by qwik-loader on document when the document first becomes idle

```typescript
export type QwikIdleEvent = CustomEvent<{}>;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-events.ts)

## QwikInitEvent

Emitted by qwik-loader on document when the document first becomes interactive

```typescript
export type QwikInitEvent = CustomEvent<{}>;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-events.ts)

## QwikIntrinsicElements

The interface holds available attributes of both native DOM elements and custom Qwik elements. An example showing how to define a customizable wrapper component:

```tsx
import { component$, Slot, type QwikIntrinsicElements } from "@builder.io/qwik";

type WrapperProps = {
  attributes?: QwikIntrinsicElements["div"];
};

export default component$<WrapperProps>(({ attributes }) => {
  return (
    <div {...attributes} class="p-2">
      <Slot />
    </div>
  );
});
```

Note: It is shorter to use `PropsOf<'div'>`

```typescript
export interface QwikIntrinsicElements extends QwikHTMLElements, QwikSVGElements
```

**Extends:** [QwikHTMLElements](#qwikhtmlelements), [QwikSVGElements](#qwiksvgelements)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-elements.ts)

## QwikInvalidEvent

> Warning: This API is now obsolete.
>
> Use `Event` and use the second argument to the handler function for the current event target

```typescript
export type QwikInvalidEvent<T = Element> = Event;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-events.ts)

## QwikJSX

```typescript
export declare namespace QwikJSX
```

<table><thead><tr><th>

Interface

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[ElementChildrenAttribute](#qwikjsx-elementchildrenattribute)

</td><td>

</td></tr>
<tr><td>

[IntrinsicAttributes](#qwikjsx-intrinsicattributes)

</td><td>

</td></tr>
<tr><td>

[IntrinsicElements](#)

</td><td>

</td></tr>
</tbody></table>

<table><thead><tr><th>

Type Alias

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[Element](#qwikjsx-element)

</td><td>

</td></tr>
<tr><td>

[ElementType](#qwikjsx-elementtype)

</td><td>

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik.ts)

## QwikKeyboardEvent

> Warning: This API is now obsolete.
>
> Use `KeyboardEvent` and use the second argument to the handler function for the current event target

```typescript
export type QwikKeyboardEvent<T = Element> = NativeKeyboardEvent;
```

**References:** [NativeKeyboardEvent](#nativekeyboardevent)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-events.ts)

## QwikMouseEvent

> Warning: This API is now obsolete.
>
> Use `MouseEvent` and use the second argument to the handler function for the current event target

```typescript
export type QwikMouseEvent<T = Element, E = NativeMouseEvent> = E;
```

**References:** [NativeMouseEvent](#nativemouseevent)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-events.ts)

## QwikPointerEvent

> Warning: This API is now obsolete.
>
> Use `PointerEvent` and use the second argument to the handler function for the current event target

```typescript
export type QwikPointerEvent<T = Element> = NativePointerEvent;
```

**References:** [NativePointerEvent](#nativepointerevent)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-events.ts)

## QwikSubmitEvent

> Warning: This API is now obsolete.
>
> Use `SubmitEvent` and use the second argument to the handler function for the current event target

```typescript
export type QwikSubmitEvent<T = Element> = SubmitEvent;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-events.ts)

## QwikSVGElements

The SVG props without plain handlers, for use inside functions

```typescript
export type QwikSVGElements = {
  [K in keyof Omit<
    SVGElementTagNameMap,
    keyof HTMLElementTagNameMap
  >]: SVGProps<SVGElementTagNameMap[K]>;
};
```

**References:** [SVGProps](#svgprops)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## QwikSymbolEvent

Emitted by qwik-loader when a module was lazily loaded

```typescript
export type QwikSymbolEvent = CustomEvent<{
  symbol: string;
  element: Element;
  reqTime: number;
}>;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-events.ts)

## QwikTouchEvent

> Warning: This API is now obsolete.
>
> Use `TouchEvent` and use the second argument to the handler function for the current event target

```typescript
export type QwikTouchEvent<T = Element> = NativeTouchEvent;
```

**References:** [NativeTouchEvent](#nativetouchevent)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-events.ts)

## QwikTransitionEvent

> Warning: This API is now obsolete.
>
> Use `TransitionEvent` and use the second argument to the handler function for the current event target

```typescript
export type QwikTransitionEvent<T = Element> = NativeTransitionEvent;
```

**References:** [NativeTransitionEvent](#nativetransitionevent)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-events.ts)

## QwikUIEvent

> Warning: This API is now obsolete.
>
> Use `UIEvent` and use the second argument to the handler function for the current event target

```typescript
export type QwikUIEvent<T = Element> = NativeUIEvent;
```

**References:** [NativeUIEvent](#nativeuievent)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-events.ts)

## QwikVisibleEvent

Emitted by qwik-loader when an element becomes visible. Used by `useVisibleTask$`

```typescript
export type QwikVisibleEvent = CustomEvent<IntersectionObserverEntry>;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-events.ts)

## QwikWheelEvent

> Warning: This API is now obsolete.
>
> Use `WheelEvent` and use the second argument to the handler function for the current event target

```typescript
export type QwikWheelEvent<T = Element> = NativeWheelEvent;
```

**References:** [NativeWheelEvent](#nativewheelevent)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-qwik-events.ts)

## ReadonlySignal

```typescript
export type ReadonlySignal<T = unknown> = Readonly<Signal<T>>;
```

**References:** [Signal](#signal)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/state/signal.ts)

## render

Render JSX.

Use this method to render JSX. This function does reconciling which means it always tries to reuse what is already in the DOM (rather then destroy and recreate content.) It returns a cleanup function you could use for cleaning up subscriptions.

```typescript
render: (
  parent: Element | Document,
  jsxOutput: JSXOutput | FunctionComponent<any>,
  opts?: RenderOptions,
) => Promise<RenderResult>;
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

parent

</td><td>

Element \| Document

</td><td>

Element which will act as a parent to `jsxNode`. When possible the rendering will try to reuse existing nodes.

</td></tr>
<tr><td>

jsxOutput

</td><td>

[JSXOutput](#jsxoutput) \| [FunctionComponent](#functioncomponent)&lt;any&gt;

</td><td>

JSX to render

</td></tr>
<tr><td>

opts

</td><td>

[RenderOptions](#renderoptions)

</td><td>

_(Optional)_

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;[RenderResult](#renderresult)&gt;

An object containing a cleanup function.

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/dom/render.public.ts)

## RenderOnce

```typescript
RenderOnce: FunctionComponent<{
  children?: unknown;
  key?: string | number | null | undefined;
}>;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/jsx-runtime.ts)

## RenderOptions

```typescript
export interface RenderOptions
```

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[serverData?](#)

</td><td>

</td><td>

Record&lt;string, any&gt;

</td><td>

_(Optional)_

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/dom/render.public.ts)

## RenderResult

```typescript
export interface RenderResult
```

<table><thead><tr><th>

Method

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[cleanup()](#renderresult-cleanup)

</td><td>

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/dom/render.public.ts)

## RenderSSROptions

```typescript
export interface RenderSSROptions
```

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[base?](#)

</td><td>

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[beforeClose?](#)

</td><td>

</td><td>

(contexts: QContext[], containerState: ContainerState, containsDynamic: boolean, textNodes: Map&lt;string, string&gt;) =&gt; Promise&lt;[JSXNode](#jsxnode)&gt;

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[beforeContent?](#)

</td><td>

</td><td>

[JSXNode](#jsxnode)&lt;string&gt;[]

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[containerAttributes](#)

</td><td>

</td><td>

Record&lt;string, string&gt;

</td><td>

</td></tr>
<tr><td>

[containerTagName](#)

</td><td>

</td><td>

string

</td><td>

</td></tr>
<tr><td>

[manifestHash](#)

</td><td>

</td><td>

string

</td><td>

</td></tr>
<tr><td>

[serverData?](#)

</td><td>

</td><td>

Record&lt;string, any&gt;

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[stream](#)

</td><td>

</td><td>

[StreamWriter](#streamwriter)

</td><td>

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/ssr/render-ssr.ts)

## Resource

This method works like an async memoized function that runs whenever some tracked value changes and returns some data.

`useResource` however returns immediate a `ResourceReturn` object that contains the data and a state that indicates if the data is available or not.

The status can be one of the following:

- 'pending' - the data is not yet available. - 'resolved' - the data is available. - 'rejected' - the data is not available due to an error or timeout.

### Example

Example showing how `useResource` to perform a fetch to request the weather, whenever the input city name changes.

```tsx
const Cmp = component$(() => {
  const cityS = useSignal("");

  const weatherResource = useResource$(async ({ track, cleanup }) => {
    const cityName = track(cityS);
    const abortController = new AbortController();
    cleanup(() => abortController.abort("cleanup"));
    const res = await fetch(`http://weatherdata.com?city=${cityName}`, {
      signal: abortController.signal,
    });
    const data = await res.json();
    return data as { temp: number };
  });

  return (
    <div>
      <input name="city" bind:value={cityS} />
      <Resource
        value={weatherResource}
        onResolved={(weather) => {
          return <div>Temperature: {weather.temp}</div>;
        }}
      />
    </div>
  );
});
```

```typescript
Resource: <T>(props: ResourceProps<T>) => JSXOutput;
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

props

</td><td>

[ResourceProps](#resourceprops)&lt;T&gt;

</td><td>

</td></tr>
</tbody></table>
**Returns:**

[JSXOutput](#jsxoutput)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-resource.ts)

## ResourceCtx

```typescript
export interface ResourceCtx<T>
```

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[previous](#)

</td><td>

`readonly`

</td><td>

T \| undefined

</td><td>

</td></tr>
<tr><td>

[track](#)

</td><td>

`readonly`

</td><td>

[Tracker](#tracker)

</td><td>

</td></tr>
</tbody></table>

<table><thead><tr><th>

Method

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[cache(policyOrMilliseconds)](#resourcectx-cache)

</td><td>

</td></tr>
<tr><td>

[cleanup(callback)](#)

</td><td>

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-task.ts)

## ResourceFn

```typescript
export type ResourceFn<T> = (ctx: ResourceCtx<unknown>) => ValueOrPromise<T>;
```

**References:** [ResourceCtx](#resourcectx), [ValueOrPromise](#valueorpromise)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-task.ts)

## ResourceOptions

Options to pass to `useResource$()`

```typescript
export interface ResourceOptions
```

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[timeout?](#)

</td><td>

</td><td>

number

</td><td>

_(Optional)_ Timeout in milliseconds. If the resource takes more than the specified millisecond, it will timeout. Resulting on a rejected resource.

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-resource.ts)

## ResourcePending

```typescript
export interface ResourcePending<T>
```

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[loading](#)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

</td></tr>
<tr><td>

[value](#)

</td><td>

`readonly`

</td><td>

Promise&lt;T&gt;

</td><td>

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-task.ts)

## ResourceProps

```typescript
export interface ResourceProps<T>
```

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[onPending?](#)

</td><td>

</td><td>

() =&gt; [JSXOutput](#jsxoutput)

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[onRejected?](#)

</td><td>

</td><td>

(reason: Error) =&gt; [JSXOutput](#jsxoutput)

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[onResolved](#)

</td><td>

</td><td>

(value: T) =&gt; [JSXOutput](#jsxoutput)

</td><td>

</td></tr>
<tr><td>

[value](#)

</td><td>

`readonly`

</td><td>

[ResourceReturn](#resourcereturn)&lt;T&gt; \| [Signal](#signal)&lt;Promise&lt;T&gt; \| T&gt; \| Promise&lt;T&gt;

</td><td>

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-resource.ts)

## ResourceRejected

```typescript
export interface ResourceRejected<T>
```

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[loading](#)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

</td></tr>
<tr><td>

[value](#)

</td><td>

`readonly`

</td><td>

Promise&lt;T&gt;

</td><td>

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-task.ts)

## ResourceResolved

```typescript
export interface ResourceResolved<T>
```

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[loading](#)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

</td></tr>
<tr><td>

[value](#)

</td><td>

`readonly`

</td><td>

Promise&lt;T&gt;

</td><td>

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-task.ts)

## ResourceReturn

```typescript
export type ResourceReturn<T> =
  | ResourcePending<T>
  | ResourceResolved<T>
  | ResourceRejected<T>;
```

**References:** [ResourcePending](#resourcepending), [ResourceResolved](#resourceresolved), [ResourceRejected](#resourcerejected)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-task.ts)

## ScriptHTMLAttributes

```typescript
export interface ScriptHTMLAttributes<T extends Element> extends Attrs<'script', T>
```

**Extends:** Attrs&lt;'script', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## SelectHTMLAttributes

```typescript
export interface SelectHTMLAttributes<T extends Element> extends Attrs<'select', T>
```

**Extends:** Attrs&lt;'select', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## setPlatform

Sets the `CorePlatform`.

This is useful to override the platform in tests to change the behavior of, `requestAnimationFrame`, and import resolution.

```typescript
setPlatform: (plt: CorePlatform) => CorePlatform;
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

plt

</td><td>

[CorePlatform](#coreplatform)

</td><td>

</td></tr>
</tbody></table>
**Returns:**

[CorePlatform](#coreplatform)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/platform/platform.ts)

## Signal

A signal is a reactive value which can be read and written. When the signal is written, all tasks which are tracking the signal will be re-run and all components that read the signal will be re-rendered.

Furthermore, when a signal value is passed as a prop to a component, the optimizer will automatically forward the signal. This means that `return <div title={signal.value}>hi</div>` will update the `title` attribute when the signal changes without having to re-render the component.

```typescript
export interface Signal<T = any>
```

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[value](#)

</td><td>

</td><td>

T

</td><td>

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/state/signal.ts)

## Size

```typescript
export type Size = number | string;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## SkipRender

```typescript
SkipRender: JSXNode;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/utils.public.ts)

## Slot

Allows to project the children of the current component. <Slot/> can only be used within the context of a component defined with `component$`.

```typescript
Slot: FunctionComponent<{
  name?: string;
}>;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/slot.public.ts)

## SlotHTMLAttributes

```typescript
export interface SlotHTMLAttributes<T extends Element> extends Attrs<'slot', T>
```

**Extends:** Attrs&lt;'slot', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## SnapshotListener

```typescript
export interface SnapshotListener
```

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[el](#)

</td><td>

</td><td>

Element

</td><td>

</td></tr>
<tr><td>

[key](#)

</td><td>

</td><td>

string

</td><td>

</td></tr>
<tr><td>

[qrl](#)

</td><td>

</td><td>

[QRL](#qrl)&lt;any&gt;

</td><td>

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/container/container.ts)

## SnapshotMeta

```typescript
export type SnapshotMeta = Record<string, SnapshotMetaValue>;
```

**References:** [SnapshotMetaValue](#snapshotmetavalue)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/container/container.ts)

## SnapshotMetaValue

```typescript
export interface SnapshotMetaValue
```

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[c?](#)

</td><td>

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[h?](#)

</td><td>

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[s?](#)

</td><td>

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[w?](#)

</td><td>

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/container/container.ts)

## SnapshotResult

```typescript
export interface SnapshotResult
```

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[funcs](#)

</td><td>

</td><td>

string[]

</td><td>

</td></tr>
<tr><td>

[mode](#)

</td><td>

</td><td>

'render' \| 'listeners' \| 'static'

</td><td>

</td></tr>
<tr><td>

[objs](#)

</td><td>

</td><td>

any[]

</td><td>

</td></tr>
<tr><td>

[qrls](#)

</td><td>

</td><td>

[QRL](#qrl)[]

</td><td>

</td></tr>
<tr><td>

[resources](#)

</td><td>

</td><td>

ResourceReturnInternal&lt;any&gt;[]

</td><td>

</td></tr>
<tr><td>

[state](#)

</td><td>

</td><td>

[SnapshotState](#snapshotstate)

</td><td>

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/container/container.ts)

## SnapshotState

```typescript
export interface SnapshotState
```

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[ctx](#)

</td><td>

</td><td>

[SnapshotMeta](#snapshotmeta)

</td><td>

</td></tr>
<tr><td>

[objs](#)

</td><td>

</td><td>

any[]

</td><td>

</td></tr>
<tr><td>

[refs](#)

</td><td>

</td><td>

Record&lt;string, string&gt;

</td><td>

</td></tr>
<tr><td>

[subs](#)

</td><td>

</td><td>

any[]

</td><td>

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/container/container.ts)

## SourceHTMLAttributes

```typescript
export interface SourceHTMLAttributes<T extends Element> extends Attrs<'source', T>
```

**Extends:** Attrs&lt;'source', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## SSRComment

```typescript
SSRComment: FunctionComponent<{
  data: string;
}>;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/utils.public.ts)

## SSRHint

> Warning: This API is now obsolete.
>
> - It has no effect

```typescript
SSRHint: FunctionComponent<SSRHintProps>;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/utils.public.ts)

## SSRHintProps

```typescript
export type SSRHintProps = {
  dynamic?: boolean;
};
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/utils.public.ts)

## SSRRaw

```typescript
SSRRaw: FunctionComponent<{
  data: string;
}>;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/utils.public.ts)

## SSRStream

```typescript
SSRStream: FunctionComponent<SSRStreamProps>;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/utils.public.ts)

## SSRStreamBlock

```typescript
SSRStreamBlock: FunctionComponent<{
  children?: any;
}>;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/utils.public.ts)

## SSRStreamProps

```typescript
export type SSRStreamProps = {
  children:
    | AsyncGenerator<JSXChildren, void, any>
    | ((stream: StreamWriter) => Promise<void>)
    | (() => AsyncGenerator<JSXChildren, void, any>);
};
```

**References:** [JSXChildren](#jsxchildren), [StreamWriter](#streamwriter)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/utils.public.ts)

## StreamWriter

```typescript
export type StreamWriter = {
  write: (chunk: string) => void;
};
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/ssr/render-ssr.ts)

## StyleHTMLAttributes

```typescript
export interface StyleHTMLAttributes<T extends Element> extends Attrs<'style', T>
```

**Extends:** Attrs&lt;'style', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## SVGAttributes

The TS types don't include the SVG attributes so we have to define them ourselves

NOTE: These props are probably not complete

```typescript
export interface SVGAttributes<T extends Element = Element> extends AriaAttributes
```

**Extends:** [AriaAttributes](#ariaattributes)

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

["accent-height"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["alignment-baseline"?](#)

</td><td>

</td><td>

'auto' \| 'baseline' \| 'before-edge' \| 'text-before-edge' \| 'middle' \| 'central' \| 'after-edge' \| 'text-after-edge' \| 'ideographic' \| 'alphabetic' \| 'hanging' \| 'mathematical' \| 'inherit' \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["arabic-form"?](#)

</td><td>

</td><td>

'initial' \| 'medial' \| 'terminal' \| 'isolated' \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["baseline-shift"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["cap-height"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["clip-path"?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["clip-rule"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["color-interpolation-filters"?](#)

</td><td>

</td><td>

'auto' \| 's-rGB' \| 'linear-rGB' \| 'inherit' \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["color-interpolation"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["color-profile"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["color-rendering"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["dominant-baseline"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["edge-mode"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["enable-background"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["fill-opacity"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["fill-rule"?](#)

</td><td>

</td><td>

'nonzero' \| 'evenodd' \| 'inherit' \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["flood-color"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["flood-opacity"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["font-family"?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["font-size-adjust"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["font-size"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["font-stretch"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["font-style"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["font-variant"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["font-weight"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["glyph-name"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["glyph-orientation-horizontal"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["glyph-orientation-vertical"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["horiz-adv-x"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["horiz-origin-x"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["image-rendering"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["letter-spacing"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["lighting-color"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["marker-end"?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["marker-mid"?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["marker-start"?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["overline-position"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["overline-thickness"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["paint-order"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["pointer-events"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["rendering-intent"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["shape-rendering"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["stop-color"?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["stop-opacity"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["strikethrough-position"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["strikethrough-thickness"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["stroke-dasharray"?](#)

</td><td>

</td><td>

string \| number \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["stroke-dashoffset"?](#)

</td><td>

</td><td>

string \| number \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["stroke-linecap"?](#)

</td><td>

</td><td>

'butt' \| 'round' \| 'square' \| 'inherit' \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["stroke-linejoin"?](#)

</td><td>

</td><td>

'miter' \| 'round' \| 'bevel' \| 'inherit' \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["stroke-miterlimit"?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["stroke-opacity"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["stroke-width"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["text-anchor"?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["text-decoration"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["text-rendering"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["underline-position"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["underline-thickness"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["unicode-bidi"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["unicode-range"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["units-per-em"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["v-alphabetic"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["v-hanging"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["v-ideographic"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["v-mathematical"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["vector-effect"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["vert-adv-y"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["vert-origin-x"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["vert-origin-y"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["word-spacing"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["writing-mode"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["x-channel-selector"?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["x-height"?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["xlink:actuate"?](#svgattributes-_xlink_actuate_)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["xlink:arcrole"?](#svgattributes-_xlink_arcrole_)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["xlink:href"?](#svgattributes-_xlink_href_)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["xlink:role"?](#svgattributes-_xlink_role_)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["xlink:show"?](#svgattributes-_xlink_show_)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["xlink:title"?](#svgattributes-_xlink_title_)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["xlink:type"?](#svgattributes-_xlink_type_)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["xml:base"?](#svgattributes-_xml_base_)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["xml:lang"?](#svgattributes-_xml_lang_)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["xml:space"?](#svgattributes-_xml_space_)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

["xmlns:xlink"?](#svgattributes-_xmlns_xlink_)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[accumulate?](#)

</td><td>

</td><td>

'none' \| 'sum' \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[additive?](#)

</td><td>

</td><td>

'replace' \| 'sum' \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[allowReorder?](#)

</td><td>

</td><td>

'no' \| 'yes' \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[alphabetic?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[amplitude?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[ascent?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[attributeName?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[attributeType?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[autoReverse?](#)

</td><td>

</td><td>

[Booleanish](#booleanish) \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[azimuth?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[baseFrequency?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[baseProfile?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[bbox?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[begin?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[bias?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[by?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[calcMode?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[clip?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[clipPathUnits?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[color?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[contentScriptType?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[contentStyleType?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[crossOrigin?](#)

</td><td>

</td><td>

[HTMLCrossOriginAttribute](#htmlcrossoriginattribute)

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[cursor?](#)

</td><td>

</td><td>

number \| string

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[cx?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[cy?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[d?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[decelerate?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[descent?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[diffuseConstant?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[direction?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[display?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[divisor?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[dur?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[dx?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[dy?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[elevation?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[end?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[exponent?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[externalResourcesRequired?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[fill?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[filter?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[filterRes?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[filterUnits?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[focusable?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[format?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[fr?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[from?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[fx?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[fy?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[g1?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[g2?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[glyphRef?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[gradientTransform?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[gradientUnits?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[hanging?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[height?](#)

</td><td>

</td><td>

[Size](#size) \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[href?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[id?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[ideographic?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[in?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[in2?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[intercept?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[k?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[k1?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[k2?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[k3?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[k4?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[kernelMatrix?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[kernelUnitLength?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[kerning?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[keyPoints?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[keySplines?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[keyTimes?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[lang?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[lengthAdjust?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[limitingConeAngle?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[local?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[markerHeight?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[markerUnits?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[markerWidth?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[mask?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[maskContentUnits?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[maskUnits?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[mathematical?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[max?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[media?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[method?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[min?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[mode?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[name?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[numOctaves?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[offset?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[opacity?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[operator?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[order?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[orient?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[orientation?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[origin?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[overflow?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[panose1?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[path?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[pathLength?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[patternContentUnits?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[patternTransform?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[patternUnits?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[points?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[pointsAtX?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[pointsAtY?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[pointsAtZ?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[preserveAlpha?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[preserveAspectRatio?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[primitiveUnits?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[r?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[radius?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[refX?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[refY?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[repeatCount?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[repeatDur?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[requiredextensions?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[requiredFeatures?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[restart?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[result?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[role?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[rotate?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[rx?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[ry?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[scale?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[seed?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[slope?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[spacing?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[specularConstant?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[specularExponent?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[speed?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[spreadMethod?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[startOffset?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[stdDeviation?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[stemh?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[stemv?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[stitchTiles?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[string?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[stroke?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[style?](#)

</td><td>

</td><td>

[CSSProperties](#cssproperties) \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[surfaceScale?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[systemLanguage?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[tabindex?](#)

</td><td>

</td><td>

number \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[tableValues?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[target?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[targetX?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[targetY?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[textLength?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[to?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[transform?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[type?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[u1?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[u2?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[unicode?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[values?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[version?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[viewBox?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[viewTarget?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[visibility?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[width?](#)

</td><td>

</td><td>

[Size](#size) \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[widths?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[x?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[x1?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[x2?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[xmlns?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[y?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[y1?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[y2?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[yChannelSelector?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[z?](#)

</td><td>

</td><td>

number \| string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[zoomAndPan?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## SVGProps

```typescript
export interface SVGProps<T extends Element> extends SVGAttributes, QwikAttributes<T>
```

**Extends:** [SVGAttributes](#svgattributes), [QwikAttributes](#qwikattributes)&lt;T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## sync$

> This API is provided as an alpha preview for developers and may change based on feedback that we receive. Do not use this API in a production environment.

Extract function into a synchronously loadable QRL.

NOTE: Synchronous QRLs functions can't close over any variables, including exports.

```typescript
sync$: <T extends Function>(fn: T) => SyncQRL<T>;
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

fn

</td><td>

T

</td><td>

Function to extract.

</td></tr>
</tbody></table>
**Returns:**

[SyncQRL](#syncqrl)&lt;T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/qrl/qrl.public.ts)

## SyncQRL

> This API is provided as an alpha preview for developers and may change based on feedback that we receive. Do not use this API in a production environment.

```typescript
export interface SyncQRL<TYPE extends Function = any> extends QRL<TYPE>
```

**Extends:** [QRL](#qrl)&lt;TYPE&gt;

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[\_\_brand\_\_SyncQRL\_\_](#)

</td><td>

</td><td>

TYPE

</td><td>

**_(ALPHA)_**

</td></tr>
<tr><td>

[dev](#)

</td><td>

</td><td>

QRLDev \| null

</td><td>

**_(ALPHA)_**

</td></tr>
<tr><td>

[resolved](#)

</td><td>

</td><td>

TYPE

</td><td>

**_(ALPHA)_**

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/qrl/qrl.public.ts)

## TableHTMLAttributes

```typescript
export interface TableHTMLAttributes<T extends Element> extends Attrs<'table', T>
```

**Extends:** Attrs&lt;'table', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## TaskCtx

```typescript
export interface TaskCtx
```

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[track](#)

</td><td>

</td><td>

[Tracker](#tracker)

</td><td>

</td></tr>
</tbody></table>

<table><thead><tr><th>

Method

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[cleanup(callback)](#)

</td><td>

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-task.ts)

## TaskFn

```typescript
export type TaskFn = (ctx: TaskCtx) => ValueOrPromise<void | (() => void)>;
```

**References:** [TaskCtx](#taskctx), [ValueOrPromise](#valueorpromise)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-task.ts)

## TdHTMLAttributes

```typescript
export interface TdHTMLAttributes<T extends Element> extends Attrs<'td', T>
```

**Extends:** Attrs&lt;'td', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## TextareaHTMLAttributes

```typescript
export interface TextareaHTMLAttributes<T extends Element> extends Attrs<'textarea', T>
```

**Extends:** Attrs&lt;'textarea', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## ThHTMLAttributes

```typescript
export interface ThHTMLAttributes<T extends Element> extends Attrs<'tr', T>
```

**Extends:** Attrs&lt;'tr', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## TimeHTMLAttributes

```typescript
export interface TimeHTMLAttributes<T extends Element> extends Attrs<'time', T>
```

**Extends:** Attrs&lt;'time', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## TitleHTMLAttributes

```typescript
export interface TitleHTMLAttributes<T extends Element> extends Attrs<'title', T>
```

**Extends:** Attrs&lt;'title', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## Tracker

Used to signal to Qwik which state should be watched for changes.

The `Tracker` is passed into the `taskFn` of `useTask`. It is intended to be used to wrap state objects in a read proxy which signals to Qwik which properties should be watched for changes. A change to any of the properties causes the `taskFn` to rerun.

### Example

The `obs` passed into the `taskFn` is used to mark `state.count` as a property of interest. Any changes to the `state.count` property will cause the `taskFn` to rerun.

```tsx
const Cmp = component$(() => {
  const store = useStore({ count: 0, doubleCount: 0 });
  const signal = useSignal(0);
  useTask$(({ track }) => {
    // Any signals or stores accessed inside the task will be tracked
    const count = track(() => store.count);
    // You can also pass a signal to track() directly
    const signalCount = track(signal);
    store.doubleCount = count + signalCount;
  });
  return (
    <div>
      <span>
        {store.count} / {store.doubleCount}
      </span>
      <button
        onClick$={() => {
          store.count++;
          signal.value++;
        }}
      >
        +
      </button>
    </div>
  );
});
```

```typescript
export interface Tracker
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-task.ts)

## TrackHTMLAttributes

```typescript
export interface TrackHTMLAttributes<T extends Element> extends Attrs<'track', T>
```

**Extends:** Attrs&lt;'track', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## untrack

Don't track listeners for this callback

```typescript
untrack: <T>(fn: () => T) => T;
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

fn

</td><td>

() =&gt; T

</td><td>

</td></tr>
</tbody></table>
**Returns:**

T

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-core.ts)

## useComputed$

Hook that returns a read-only signal that updates when signals used in the `ComputedFn` change.

```typescript
useComputed$: <T>(qrl: ComputedFn<T>) => Signal<Awaited<T>>;
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

qrl

</td><td>

[ComputedFn](#computedfn)&lt;T&gt;

</td><td>

</td></tr>
</tbody></table>
**Returns:**

[Signal](#signal)&lt;Awaited&lt;T&gt;&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-task.ts)

## useComputedQrl

```typescript
useComputedQrl: <T>(qrl: QRL<ComputedFn<T>>) => Signal<Awaited<T>>;
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

qrl

</td><td>

[QRL](#qrl)&lt;[ComputedFn](#computedfn)&lt;T&gt;&gt;

</td><td>

</td></tr>
</tbody></table>
**Returns:**

[Signal](#signal)&lt;Awaited&lt;T&gt;&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-task.ts)

## useConstant

> Warning: This API is now obsolete.
>
> This is a technology preview

Stores a value which is retained for the lifetime of the component.

If the value is a function, the function is invoked to calculate the actual value.

```typescript
useConstant: <T>(value: (() => T) | T) => T;
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

value

</td><td>

(() =&gt; T) \| T

</td><td>

</td></tr>
</tbody></table>
**Returns:**

T

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-signal.ts)

## useContext

Retrieve Context value.

Use `useContext()` to retrieve the value of context in a component. To retrieve a value a parent component needs to invoke `useContextProvider()` to assign a value.

### Example

```tsx
// Declare the Context type.
interface TodosStore {
  items: string[];
}
// Create a Context ID (no data is saved here.)
// You will use this ID to both create and retrieve the Context.
export const TodosContext = createContextId<TodosStore>("Todos");

// Example of providing context to child components.
export const App = component$(() => {
  useContextProvider(
    TodosContext,
    useStore<TodosStore>({
      items: ["Learn Qwik", "Build Qwik app", "Profit"],
    }),
  );

  return <Items />;
});

// Example of retrieving the context provided by a parent component.
export const Items = component$(() => {
  const todos = useContext(TodosContext);
  return (
    <ul>
      {todos.items.map((item) => (
        <li>{item}</li>
      ))}
    </ul>
  );
});
```

```typescript
useContext: UseContext;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-context.ts)

## useContextProvider

Assign a value to a Context.

Use `useContextProvider()` to assign a value to a context. The assignment happens in the component's function. Once assigned, use `useContext()` in any child component to retrieve the value.

Context is a way to pass stores to the child components without prop-drilling. Note that scalar values are allowed, but for reactivity you need signals or stores.

### Example

```tsx
// Declare the Context type.
interface TodosStore {
  items: string[];
}
// Create a Context ID (no data is saved here.)
// You will use this ID to both create and retrieve the Context.
export const TodosContext = createContextId<TodosStore>("Todos");

// Example of providing context to child components.
export const App = component$(() => {
  useContextProvider(
    TodosContext,
    useStore<TodosStore>({
      items: ["Learn Qwik", "Build Qwik app", "Profit"],
    }),
  );

  return <Items />;
});

// Example of retrieving the context provided by a parent component.
export const Items = component$(() => {
  const todos = useContext(TodosContext);
  return (
    <ul>
      {todos.items.map((item) => (
        <li>{item}</li>
      ))}
    </ul>
  );
});
```

```typescript
useContextProvider: <STATE>(context: ContextId<STATE>, newValue: STATE) => void
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

context

</td><td>

[ContextId](#contextid)&lt;STATE&gt;

</td><td>

The context to assign a value to.

</td></tr>
<tr><td>

newValue

</td><td>

STATE

</td><td>

</td></tr>
</tbody></table>
**Returns:**

void

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-context.ts)

## useErrorBoundary

```typescript
useErrorBoundary: () => Readonly<ErrorBoundaryStore>;
```

**Returns:**

Readonly&lt;[ErrorBoundaryStore](#errorboundarystore)&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-error-boundary.ts)

## useId

```typescript
useId: () => string;
```

**Returns:**

string

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-id.ts)

## useOn

Register a listener on the current component's host element.

Used to programmatically add event listeners. Useful from custom `use*` methods, which do not have access to the JSX. Otherwise, it's adding a JSX listener in the `<div>` is a better idea.

```typescript
useOn: <T extends KnownEventNames>(event: T | T[], eventQrl: EventQRL<T>) => void
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

event

</td><td>

T \| T[]

</td><td>

</td></tr>
<tr><td>

eventQrl

</td><td>

EventQRL&lt;T&gt;

</td><td>

</td></tr>
</tbody></table>
**Returns:**

void

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-on.ts)

## useOnDocument

Register a listener on `document`.

Used to programmatically add event listeners. Useful from custom `use*` methods, which do not have access to the JSX.

```typescript
useOnDocument: <T extends KnownEventNames>(event: T | T[], eventQrl: EventQRL<T>) => void
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

event

</td><td>

T \| T[]

</td><td>

</td></tr>
<tr><td>

eventQrl

</td><td>

EventQRL&lt;T&gt;

</td><td>

</td></tr>
</tbody></table>
**Returns:**

void

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-on.ts)

## useOnWindow

Register a listener on `window`.

Used to programmatically add event listeners. Useful from custom `use*` methods, which do not have access to the JSX.

```typescript
useOnWindow: <T extends KnownEventNames>(event: T | T[], eventQrl: EventQRL<T>) => void
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

event

</td><td>

T \| T[]

</td><td>

</td></tr>
<tr><td>

eventQrl

</td><td>

EventQRL&lt;T&gt;

</td><td>

</td></tr>
</tbody></table>
**Returns:**

void

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-on.ts)

## useResource$

This method works like an async memoized function that runs whenever some tracked value changes and returns some data.

`useResource` however returns immediate a `ResourceReturn` object that contains the data and a state that indicates if the data is available or not.

The status can be one of the following:

- 'pending' - the data is not yet available. - 'resolved' - the data is available. - 'rejected' - the data is not available due to an error or timeout.

### Example

Example showing how `useResource` to perform a fetch to request the weather, whenever the input city name changes.

```tsx
const Cmp = component$(() => {
  const cityS = useSignal("");

  const weatherResource = useResource$(async ({ track, cleanup }) => {
    const cityName = track(cityS);
    const abortController = new AbortController();
    cleanup(() => abortController.abort("cleanup"));
    const res = await fetch(`http://weatherdata.com?city=${cityName}`, {
      signal: abortController.signal,
    });
    const data = await res.json();
    return data as { temp: number };
  });

  return (
    <div>
      <input name="city" bind:value={cityS} />
      <Resource
        value={weatherResource}
        onResolved={(weather) => {
          return <div>Temperature: {weather.temp}</div>;
        }}
      />
    </div>
  );
});
```

```typescript
useResource$: <T>(generatorFn: ResourceFn<T>, opts?: ResourceOptions) =>
  ResourceReturn<T>;
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

generatorFn

</td><td>

[ResourceFn](#resourcefn)&lt;T&gt;

</td><td>

</td></tr>
<tr><td>

opts

</td><td>

[ResourceOptions](#resourceoptions)

</td><td>

_(Optional)_

</td></tr>
</tbody></table>
**Returns:**

[ResourceReturn](#resourcereturn)&lt;T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-resource.ts)

## useResourceQrl

This method works like an async memoized function that runs whenever some tracked value changes and returns some data.

`useResource` however returns immediate a `ResourceReturn` object that contains the data and a state that indicates if the data is available or not.

The status can be one of the following:

- `pending` - the data is not yet available. - `resolved` - the data is available. - `rejected` - the data is not available due to an error or timeout.

Avoid using a `try/catch` statement in `useResource$`. If you catch the error instead of passing it, the resource status will never be `rejected`.

### Example

Example showing how `useResource` to perform a fetch to request the weather, whenever the input city name changes.

```tsx
const Cmp = component$(() => {
  const cityS = useSignal("");

  const weatherResource = useResource$(async ({ track, cleanup }) => {
    const cityName = track(cityS);
    const abortController = new AbortController();
    cleanup(() => abortController.abort("cleanup"));
    const res = await fetch(`http://weatherdata.com?city=${cityName}`, {
      signal: abortController.signal,
    });
    const data = await res.json();
    return data as { temp: number };
  });

  return (
    <div>
      <input name="city" bind:value={cityS} />
      <Resource
        value={weatherResource}
        onResolved={(weather) => {
          return <div>Temperature: {weather.temp}</div>;
        }}
      />
    </div>
  );
});
```

```typescript
useResourceQrl: <T>(qrl: QRL<ResourceFn<T>>, opts?: ResourceOptions) =>
  ResourceReturn<T>;
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

qrl

</td><td>

[QRL](#qrl)&lt;[ResourceFn](#resourcefn)&lt;T&gt;&gt;

</td><td>

</td></tr>
<tr><td>

opts

</td><td>

[ResourceOptions](#resourceoptions)

</td><td>

_(Optional)_

</td></tr>
</tbody></table>
**Returns:**

[ResourceReturn](#resourcereturn)&lt;T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-resource.ts)

## useServerData

```typescript
export declare function useServerData<T>(key: string): T | undefined;
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

key

</td><td>

string

</td><td>

</td></tr>
</tbody></table>
**Returns:**

T \| undefined

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-env-data.ts)

## useSignal

Hook that creates a signal that is retained for the lifetime of the component.

```typescript
useSignal: UseSignal;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-signal.ts)

## UseSignal

Hook that creates a signal that is retained for the lifetime of the component.

```typescript
useSignal: UseSignal;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-signal.ts)

## useStore

Creates an object that Qwik can track across serializations.

Use `useStore` to create a state for your application. The returned object is a proxy that has a unique ID. The ID of the object is used in the `QRL`s to refer to the store.

### Example

Example showing how `useStore` is used in Counter example to keep track of the count.

```tsx
const Stores = component$(() => {
  const counter = useCounter(1);

  // Reactivity happens even for nested objects and arrays
  const userData = useStore({
    name: "Manu",
    address: {
      address: "",
      city: "",
    },
    orgs: [],
  });

  // useStore() can also accept a function to calculate the initial value
  const state = useStore(() => {
    return {
      value: expensiveInitialValue(),
    };
  });

  return (
    <div>
      <div>Counter: {counter.value}</div>
      <Child userData={userData} state={state} />
    </div>
  );
});

function useCounter(step: number) {
  // Multiple stores can be created in custom hooks for convenience and composability
  const counterStore = useStore({
    value: 0,
  });
  useVisibleTask$(() => {
    // Only runs in the client
    const timer = setInterval(() => {
      counterStore.value += step;
    }, 500);
    return () => {
      clearInterval(timer);
    };
  });
  return counterStore;
}
```

```typescript
useStore: <STATE extends object>(
  initialState: STATE | (() => STATE),
  opts?: UseStoreOptions,
) => STATE;
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

initialState

</td><td>

STATE \| (() =&gt; STATE)

</td><td>

</td></tr>
<tr><td>

opts

</td><td>

[UseStoreOptions](#usestoreoptions)

</td><td>

_(Optional)_

</td></tr>
</tbody></table>
**Returns:**

STATE

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-store.public.ts)

## UseStoreOptions

```typescript
export interface UseStoreOptions
```

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[deep?](#)

</td><td>

</td><td>

boolean

</td><td>

_(Optional)_ If `true` then all nested objects and arrays will be tracked as well. Default is `true`.

</td></tr>
<tr><td>

[reactive?](#)

</td><td>

</td><td>

boolean

</td><td>

_(Optional)_ If `false` then the object will not be tracked for changes. Default is `true`.

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-store.public.ts)

## useStyles$

A lazy-loadable reference to a component's styles.

Component styles allow Qwik to lazy load the style information for the component only when needed. (And avoid double loading it in case of SSR hydration.)

```tsx
import styles from "./code-block.css?inline";

export const CmpStyles = component$(() => {
  useStyles$(styles);

  return <div>Some text</div>;
});
```

```typescript
useStyles$: (qrl: string) => void
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

qrl

</td><td>

string

</td><td>

</td></tr>
</tbody></table>
**Returns:**

void

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-styles.ts)

## useStylesQrl

A lazy-loadable reference to a component's styles.

Component styles allow Qwik to lazy load the style information for the component only when needed. (And avoid double loading it in case of SSR hydration.)

```tsx
import styles from "./code-block.css?inline";

export const CmpStyles = component$(() => {
  useStyles$(styles);

  return <div>Some text</div>;
});
```

```typescript
useStylesQrl: (styles: QRL<string>) => void
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

styles

</td><td>

[QRL](#qrl)&lt;string&gt;

</td><td>

</td></tr>
</tbody></table>
**Returns:**

void

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-styles.ts)

## UseStylesScoped

```typescript
export interface UseStylesScoped
```

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[scopeId](#)

</td><td>

</td><td>

string

</td><td>

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-styles.ts)

## useStylesScoped$

A lazy-loadable reference to a component's styles, that is scoped to the component.

Component styles allow Qwik to lazy load the style information for the component only when needed. (And avoid double loading it in case of SSR hydration.)

```tsx
import scoped from "./code-block.css?inline";

export const CmpScopedStyles = component$(() => {
  useStylesScoped$(scoped);

  return <div>Some text</div>;
});
```

```typescript
useStylesScoped$: (qrl: string) => UseStylesScoped;
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

qrl

</td><td>

string

</td><td>

</td></tr>
</tbody></table>
**Returns:**

[UseStylesScoped](#usestylesscoped)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-styles.ts)

## useStylesScopedQrl

A lazy-loadable reference to a component's styles, that is scoped to the component.

Component styles allow Qwik to lazy load the style information for the component only when needed. (And avoid double loading it in case of SSR hydration.)

```tsx
import scoped from "./code-block.css?inline";

export const CmpScopedStyles = component$(() => {
  useStylesScoped$(scoped);

  return <div>Some text</div>;
});
```

```typescript
useStylesScopedQrl: (styles: QRL<string>) => UseStylesScoped;
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

styles

</td><td>

[QRL](#qrl)&lt;string&gt;

</td><td>

</td></tr>
</tbody></table>
**Returns:**

[UseStylesScoped](#usestylesscoped)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-styles.ts)

## useTask$

Reruns the `taskFn` when the observed inputs change.

Use `useTask` to observe changes on a set of inputs, and then re-execute the `taskFn` when those inputs change.

The `taskFn` only executes if the observed inputs change. To observe the inputs, use the `obs` function to wrap property reads. This creates subscriptions that will trigger the `taskFn` to rerun.

```typescript
useTask$: (qrl: TaskFn, opts?: UseTaskOptions | undefined) => void
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

qrl

</td><td>

[TaskFn](#taskfn)

</td><td>

</td></tr>
<tr><td>

opts

</td><td>

[UseTaskOptions](#usetaskoptions) \| undefined

</td><td>

_(Optional)_

</td></tr>
</tbody></table>
**Returns:**

void

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-task.ts)

## UseTaskOptions

```typescript
export interface UseTaskOptions
```

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[eagerness?](#)

</td><td>

</td><td>

[EagernessOptions](#eagernessoptions)

</td><td>

_(Optional)_ - `visible`: run the effect when the element is visible. - `load`: eagerly run the effect when the application resumes.

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-task.ts)

## useTaskQrl

Reruns the `taskFn` when the observed inputs change.

Use `useTask` to observe changes on a set of inputs, and then re-execute the `taskFn` when those inputs change.

The `taskFn` only executes if the observed inputs change. To observe the inputs, use the `obs` function to wrap property reads. This creates subscriptions that will trigger the `taskFn` to rerun.

```typescript
useTaskQrl: (qrl: QRL<TaskFn>, opts?: UseTaskOptions) => void
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

qrl

</td><td>

[QRL](#qrl)&lt;[TaskFn](#taskfn)&gt;

</td><td>

</td></tr>
<tr><td>

opts

</td><td>

[UseTaskOptions](#usetaskoptions)

</td><td>

_(Optional)_

</td></tr>
</tbody></table>
**Returns:**

void

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-task.ts)

## useVisibleTask$

```tsx
const Timer = component$(() => {
  const store = useStore({
    count: 0,
  });

  useVisibleTask$(() => {
    // Only runs in the client
    const timer = setInterval(() => {
      store.count++;
    }, 500);
    return () => {
      clearInterval(timer);
    };
  });

  return <div>{store.count}</div>;
});
```

```typescript
useVisibleTask$: (qrl: TaskFn, opts?: OnVisibleTaskOptions | undefined) => void
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

qrl

</td><td>

[TaskFn](#taskfn)

</td><td>

</td></tr>
<tr><td>

opts

</td><td>

[OnVisibleTaskOptions](#onvisibletaskoptions) \| undefined

</td><td>

_(Optional)_

</td></tr>
</tbody></table>
**Returns:**

void

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-task.ts)

## useVisibleTaskQrl

```tsx
const Timer = component$(() => {
  const store = useStore({
    count: 0,
  });

  useVisibleTask$(() => {
    // Only runs in the client
    const timer = setInterval(() => {
      store.count++;
    }, 500);
    return () => {
      clearInterval(timer);
    };
  });

  return <div>{store.count}</div>;
});
```

```typescript
useVisibleTaskQrl: (qrl: QRL<TaskFn>, opts?: OnVisibleTaskOptions) => void
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

qrl

</td><td>

[QRL](#qrl)&lt;[TaskFn](#taskfn)&gt;

</td><td>

</td></tr>
<tr><td>

opts

</td><td>

[OnVisibleTaskOptions](#onvisibletaskoptions)

</td><td>

_(Optional)_

</td></tr>
</tbody></table>
**Returns:**

void

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-task.ts)

## ValueOrPromise

Type representing a value which is either resolve or a promise.

```typescript
export type ValueOrPromise<T> = T | Promise<T>;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/util/types.ts)

## version

QWIK_VERSION

```typescript
version: string;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/version.ts)

## VideoHTMLAttributes

```typescript
export interface VideoHTMLAttributes<T extends Element> extends Attrs<'video', T>
```

**Extends:** Attrs&lt;'video', T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)

## VisibleTaskStrategy

```typescript
export type VisibleTaskStrategy =
  | "intersection-observer"
  | "document-ready"
  | "document-idle";
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/use/use-task.ts)

## WebViewHTMLAttributes

> Warning: This API is now obsolete.
>
> This is the type for a React Native WebView. It doesn't belong in Qwik (yet?) but we're keeping it for backwards compatibility.

```typescript
export interface WebViewHTMLAttributes<T extends Element> extends HTMLAttributes<T>
```

**Extends:** [HTMLAttributes](#htmlattributes)&lt;T&gt;

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[allowFullScreen?](#)

</td><td>

</td><td>

boolean \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[allowpopups?](#)

</td><td>

</td><td>

boolean \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[autoFocus?](#)

</td><td>

</td><td>

boolean \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[autosize?](#)

</td><td>

</td><td>

boolean \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[blinkfeatures?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[disableblinkfeatures?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[disableguestresize?](#)

</td><td>

</td><td>

boolean \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[disablewebsecurity?](#)

</td><td>

</td><td>

boolean \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[guestinstance?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[httpreferrer?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[nodeintegration?](#)

</td><td>

</td><td>

boolean \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[partition?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[plugins?](#)

</td><td>

</td><td>

boolean \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[preload?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[src?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[useragent?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[webpreferences?](#)

</td><td>

</td><td>

string \| undefined

</td><td>

_(Optional)_

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik/src/core/render/jsx/types/jsx-generated.ts)
