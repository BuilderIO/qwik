---
title: \@builder.io/qwik-city API Reference
---

# [API](/api) &rsaquo; @builder.io/qwik-city

## Action

```typescript
export type Action<
  RETURN,
  INPUT = Record<string, unknown>,
  OPTIONAL extends boolean = true,
> = {
  (): ActionStore<RETURN, INPUT, OPTIONAL>;
};
```

**References:** [ActionStore](#actionstore)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## ActionConstructor

```typescript
export type ActionConstructor = {
  <
    OBJ extends Record<string, any> | void | null,
    VALIDATOR extends TypedDataValidator,
    REST extends [DataValidator, ...DataValidator[]],
  >(
    actionQrl: (
      data: GetValidatorType<VALIDATOR>,
      event: RequestEventAction,
    ) => ValueOrPromise<OBJ>,
    options: {
      readonly id?: string;
      readonly validation: [VALIDATOR, ...REST];
    },
  ): Action<
    StrictUnion<
      | OBJ
      | FailReturn<ValidatorErrorType<GetValidatorType<VALIDATOR>>>
      | FailReturn<FailOfRest<REST>>
    >,
    GetValidatorType<VALIDATOR>,
    false
  >;
  <
    OBJ extends Record<string, any> | void | null,
    VALIDATOR extends TypedDataValidator,
  >(
    actionQrl: (
      data: GetValidatorType<VALIDATOR>,
      event: RequestEventAction,
    ) => ValueOrPromise<OBJ>,
    options: {
      readonly id?: string;
      readonly validation: [VALIDATOR];
    },
  ): Action<
    StrictUnion<
      OBJ | FailReturn<ValidatorErrorType<GetValidatorType<VALIDATOR>>>
    >,
    GetValidatorType<VALIDATOR>,
    false
  >;
  <
    OBJ extends Record<string, any> | void | null,
    REST extends [DataValidator, ...DataValidator[]],
  >(
    actionQrl: (
      data: JSONObject,
      event: RequestEventAction,
    ) => ValueOrPromise<OBJ>,
    options: {
      readonly id?: string;
      readonly validation: REST;
    },
  ): Action<StrictUnion<OBJ | FailReturn<FailOfRest<REST>>>>;
  <
    OBJ extends Record<string, any> | void | null,
    VALIDATOR extends TypedDataValidator,
    REST extends [DataValidator, ...DataValidator[]],
  >(
    actionQrl: (
      data: GetValidatorType<VALIDATOR>,
      event: RequestEventAction,
    ) => ValueOrPromise<OBJ>,
    options: VALIDATOR,
    ...rest: REST
  ): Action<
    StrictUnion<
      | OBJ
      | FailReturn<ValidatorErrorType<GetValidatorType<VALIDATOR>>>
      | FailReturn<FailOfRest<REST>>
    >,
    GetValidatorType<VALIDATOR>,
    false
  >;
  <
    OBJ extends Record<string, any> | void | null,
    VALIDATOR extends TypedDataValidator,
  >(
    actionQrl: (
      data: GetValidatorType<VALIDATOR>,
      event: RequestEventAction,
    ) => ValueOrPromise<OBJ>,
    options: VALIDATOR,
  ): Action<
    StrictUnion<
      OBJ | FailReturn<ValidatorErrorType<GetValidatorType<VALIDATOR>>>
    >,
    GetValidatorType<VALIDATOR>,
    false
  >;
  <
    OBJ extends Record<string, any> | void | null,
    REST extends [DataValidator, ...DataValidator[]],
  >(
    actionQrl: (
      form: JSONObject,
      event: RequestEventAction,
    ) => ValueOrPromise<OBJ>,
    ...rest: REST
  ): Action<StrictUnion<OBJ | FailReturn<FailOfRest<REST>>>>;
  <OBJ>(
    actionQrl: (
      form: JSONObject,
      event: RequestEventAction,
    ) => ValueOrPromise<OBJ>,
    options?: {
      readonly id?: string;
    },
  ): Action<StrictUnion<OBJ>>;
};
```

**References:** [TypedDataValidator](#typeddatavalidator), [DataValidator](#datavalidator), [GetValidatorType](#getvalidatortype), [Action](#action), [StrictUnion](#strictunion), [FailReturn](#failreturn), [ValidatorErrorType](#validatorerrortype), [FailOfRest](#failofrest), [JSONObject](#jsonobject)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## ActionReturn

```typescript
export type ActionReturn<RETURN> = {
  readonly status?: number;
  readonly value: RETURN;
};
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## ActionStore

```typescript
export type ActionStore<RETURN, INPUT, OPTIONAL extends boolean = true> = {
  readonly actionPath: string;
  readonly isRunning: boolean;
  readonly status?: number;
  readonly formData: FormData | undefined;
  readonly value: RETURN | undefined;
  readonly submit: QRL<
    OPTIONAL extends true
      ? (form?: INPUT | FormData | SubmitEvent) => Promise<ActionReturn<RETURN>>
      : (form: INPUT | FormData | SubmitEvent) => Promise<ActionReturn<RETURN>>
  >;
  readonly submitted: boolean;
};
```

**References:** [ActionReturn](#actionreturn)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## ContentHeading

```typescript
export interface ContentHeading
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

[id](#)

</td><td>

`readonly`

</td><td>

string

</td><td>

</td></tr>
<tr><td>

[level](#)

</td><td>

`readonly`

</td><td>

number

</td><td>

</td></tr>
<tr><td>

[text](#)

</td><td>

`readonly`

</td><td>

string

</td><td>

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## ContentMenu

```typescript
export interface ContentMenu
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

[href?](#)

</td><td>

`readonly`

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[items?](#)

</td><td>

`readonly`

</td><td>

[ContentMenu](#contentmenu)[]

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[text](#)

</td><td>

`readonly`

</td><td>

string

</td><td>

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## DataValidator

```typescript
export type DataValidator<T extends Record<string, any> = {}> = {
  validate(ev: RequestEvent, data: unknown): Promise<ValidatorReturn<T>>;
};
```

**References:** [ValidatorReturn](#validatorreturn)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## DocumentHead

```typescript
export type DocumentHead =
  | DocumentHeadValue
  | ((props: DocumentHeadProps) => DocumentHeadValue);
```

**References:** [DocumentHeadValue](#documentheadvalue), [DocumentHeadProps](#documentheadprops)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## DocumentHeadProps

```typescript
export interface DocumentHeadProps extends RouteLocation
```

**Extends:** [RouteLocation](#routelocation)

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

[head](#)

</td><td>

`readonly`

</td><td>

[ResolvedDocumentHead](#resolveddocumenthead)

</td><td>

</td></tr>
<tr><td>

[resolveValue](#)

</td><td>

`readonly`

</td><td>

ResolveSyncValue

</td><td>

</td></tr>
<tr><td>

[withLocale](#)

</td><td>

`readonly`

</td><td>

&lt;T&gt;(fn: () =&gt; T) =&gt; T

</td><td>

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## DocumentHeadValue

```typescript
export interface DocumentHeadValue<FrontMatter extends Record<string, any> = Record<string, unknown>>
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

[frontmatter?](#)

</td><td>

`readonly`

</td><td>

Readonly&lt;FrontMatter&gt;

</td><td>

_(Optional)_ Arbitrary object containing custom data. When the document head is created from markdown files, the frontmatter attributes that are not recognized as a well-known meta names (such as title, description, author, etc...), are stored in this property.

</td></tr>
<tr><td>

[links?](#)

</td><td>

`readonly`

</td><td>

readonly [DocumentLink](#documentlink)[]

</td><td>

_(Optional)_ Used to manually append `<link>` elements to the `<head>`.

</td></tr>
<tr><td>

[meta?](#)

</td><td>

`readonly`

</td><td>

readonly [DocumentMeta](#documentmeta)[]

</td><td>

_(Optional)_ Used to manually set meta tags in the head. Additionally, the `data` property could be used to set arbitrary data which the `<head>` component could later use to generate `<meta>` tags.

</td></tr>
<tr><td>

[scripts?](#)

</td><td>

`readonly`

</td><td>

readonly [DocumentScript](#documentscript)[]

</td><td>

_(Optional)_ Used to manually append `<script>` elements to the `<head>`.

</td></tr>
<tr><td>

[styles?](#)

</td><td>

`readonly`

</td><td>

readonly [DocumentStyle](#documentstyle)[]

</td><td>

_(Optional)_ Used to manually append `<style>` elements to the `<head>`.

</td></tr>
<tr><td>

[title?](#)

</td><td>

`readonly`

</td><td>

string

</td><td>

_(Optional)_ Sets `document.title`.

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## DocumentLink

```typescript
export interface DocumentLink
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

[as?](#)

</td><td>

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[crossorigin?](#)

</td><td>

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[disabled?](#)

</td><td>

</td><td>

boolean

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[href?](#)

</td><td>

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[hreflang?](#)

</td><td>

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[id?](#)

</td><td>

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[imagesizes?](#)

</td><td>

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[imagesrcset?](#)

</td><td>

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[integrity?](#)

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

string

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[media?](#)

</td><td>

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[prefetch?](#)

</td><td>

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[referrerpolicy?](#)

</td><td>

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[rel?](#)

</td><td>

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[sizes?](#)

</td><td>

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[title?](#)

</td><td>

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[type?](#)

</td><td>

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## DocumentMeta

```typescript
export interface DocumentMeta
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

[content?](#)

</td><td>

`readonly`

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[httpEquiv?](#)

</td><td>

`readonly`

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[itemprop?](#)

</td><td>

`readonly`

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[key?](#)

</td><td>

`readonly`

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[media?](#)

</td><td>

`readonly`

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[name?](#)

</td><td>

`readonly`

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[property?](#)

</td><td>

`readonly`

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## DocumentScript

> This API is provided as an alpha preview for developers and may change based on feedback that we receive. Do not use this API in a production environment.

```typescript
export interface DocumentScript
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

[key?](#)

</td><td>

`readonly`

</td><td>

string

</td><td>

**_(ALPHA)_** _(Optional)_

</td></tr>
<tr><td>

[props?](#)

</td><td>

`readonly`

</td><td>

Readonly&lt;QwikIntrinsicElements['script']&gt;

</td><td>

**_(ALPHA)_** _(Optional)_

</td></tr>
<tr><td>

[script?](#)

</td><td>

`readonly`

</td><td>

string

</td><td>

**_(ALPHA)_** _(Optional)_

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## DocumentStyle

```typescript
export interface DocumentStyle
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

[key?](#)

</td><td>

`readonly`

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[props?](#)

</td><td>

`readonly`

</td><td>

Readonly&lt;QwikIntrinsicElements['style']&gt;

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[style](#)

</td><td>

`readonly`

</td><td>

string

</td><td>

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## FailOfRest

```typescript
export type FailOfRest<REST extends readonly DataValidator[]> =
  REST extends readonly DataValidator<infer ERROR>[] ? ERROR : never;
```

**References:** [DataValidator](#datavalidator)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## FailReturn

```typescript
export type FailReturn<T> = T & Failed;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## Form

```typescript
Form: <O, I>(
  { action, spaReset, reloadDocument, onSubmit$, ...rest }: FormProps<O, I>,
  key: string | null,
) => import("@builder.io/qwik").JSXOutput;
```

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

{ action, spaReset, reloadDocument, onSubmit$, ...rest }

</td><td>

[FormProps](#formprops)&lt;O, I&gt;

</td><td>

</td></tr>
<tr><td>

key

</td><td>

string \| null

</td><td>

</td></tr>
</tbody></table>
**Returns:**

import("@builder.io/qwik").JSXOutput

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/form-component.tsx)

## FormProps

```typescript
export interface FormProps<O, I> extends Omit<QwikJSX.IntrinsicElements['form'], 'action' | 'method'>
```

**Extends:** Omit&lt;QwikJSX.IntrinsicElements['form'], 'action' \| 'method'&gt;

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

[action?](#)

</td><td>

</td><td>

[ActionStore](#actionstore)&lt;O, I, true \| false&gt;

</td><td>

_(Optional)_ Reference to the action returned by `action()`.

</td></tr>
<tr><td>

[key?](#)

</td><td>

</td><td>

string \| number \| null

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[onSubmit$?](#)

</td><td>

</td><td>

QRLEventHandlerMulti&lt;SubmitEvent, HTMLFormElement&gt; \| undefined

</td><td>

_(Optional)_ Event handler executed right when the form is submitted.

</td></tr>
<tr><td>

[onSubmitCompleted$?](#)

</td><td>

</td><td>

QRLEventHandlerMulti&lt;CustomEvent&lt;[FormSubmitCompletedDetail](#formsubmitsuccessdetail)&lt;O&gt;&gt;, HTMLFormElement&gt; \| undefined

</td><td>

_(Optional)_ Event handler executed right after the action is executed successfully and returns some data.

</td></tr>
<tr><td>

[reloadDocument?](#)

</td><td>

</td><td>

boolean

</td><td>

_(Optional)_ When `true` the form submission will cause a full page reload, even if SPA mode is enabled and JS is available.

</td></tr>
<tr><td>

[spaReset?](#)

</td><td>

</td><td>

boolean

</td><td>

_(Optional)_ When `true` all the form inputs will be reset in SPA mode, just like happens in a full page form submission.

Defaults to `false`

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/form-component.tsx)

## FormSubmitSuccessDetail

```typescript
export interface FormSubmitCompletedDetail<T>
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

[status](#)

</td><td>

</td><td>

number

</td><td>

</td></tr>
<tr><td>

[value](#)

</td><td>

</td><td>

T

</td><td>

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/form-component.tsx)

## GetValidatorType

```typescript
export type GetValidatorType<VALIDATOR extends TypedDataValidator> =
  VALIDATOR extends TypedDataValidator<infer TYPE> ? zod.infer<TYPE> : never;
```

**References:** [TypedDataValidator](#typeddatavalidator)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## globalAction$

```typescript
globalAction$: ActionConstructor;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/server-functions.ts)

## globalActionQrl

```typescript
globalActionQrl: ActionConstructorQRL;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/server-functions.ts)

## JSONObject

```typescript
export type JSONObject = {
  [x: string]: JSONValue;
};
```

**References:** [JSONValue](#jsonvalue)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## JSONValue

```typescript
export type JSONValue =
  | string
  | number
  | boolean
  | {
      [x: string]: JSONValue;
    }
  | Array<JSONValue>;
```

**References:** [JSONValue](#jsonvalue)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## Link

```typescript
Link: import("@builder.io/qwik").Component<LinkProps>;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/link-component.tsx)

## LinkProps

```typescript
export interface LinkProps extends AnchorAttributes
```

**Extends:** AnchorAttributes

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

[prefetch?](#)

</td><td>

</td><td>

boolean \| 'js'

</td><td>

_(Optional)_ \*\*Defaults to \_true\_.\*\*

Whether Qwik should prefetch and cache the target page of this \*\*`Link`\*\*, this includes invoking any \*\*`routeLoader$`\*\*, \*\*`onGet`\*\*, etc.

This \*\*improves UX performance\*\* for client-side (\*\*SPA\*\*) navigations.

Prefetching occurs when a the Link enters the viewport in production (\*\*`on:qvisibile`\*\*), or with \*\*`mouseover`/`focus`\*\* during dev.

Prefetching will not occur if the user has the \*\*data saver\*\* setting enabled.

Setting this value to \*\*`"js"`\*\* will prefetch only javascript bundles required to render this page on the client, \*\*`false`\*\* will disable prefetching altogether.

</td></tr>
<tr><td>

[reload?](#)

</td><td>

</td><td>

boolean

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[replaceState?](#)

</td><td>

</td><td>

boolean

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[scroll?](#)

</td><td>

</td><td>

boolean

</td><td>

_(Optional)_

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/link-component.tsx)

## Loader_2

```typescript
export type Loader<RETURN> = {
  (): LoaderSignal<RETURN>;
};
```

**References:** [LoaderSignal](#loadersignal)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## LoaderSignal

```typescript
export type LoaderSignal<TYPE> = TYPE extends () => ValueOrPromise<
  infer VALIDATOR
>
  ? ReadonlySignal<ValueOrPromise<VALIDATOR>>
  : ReadonlySignal<TYPE>;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## MenuData

```typescript
export type MenuData = [pathname: string, menuLoader: MenuModuleLoader];
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## NavigationType

```typescript
export type NavigationType = "initial" | "form" | "link" | "popstate";
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## PageModule

```typescript
export interface PageModule extends RouteModule
```

**Extends:** RouteModule

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

[default](#)

</td><td>

`readonly`

</td><td>

unknown

</td><td>

</td></tr>
<tr><td>

[head?](#)

</td><td>

`readonly`

</td><td>

ContentModuleHead

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[headings?](#)

</td><td>

`readonly`

</td><td>

[ContentHeading](#contentheading)[]

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[onStaticGenerate?](#)

</td><td>

`readonly`

</td><td>

[StaticGenerateHandler](#staticgeneratehandler)

</td><td>

_(Optional)_

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## PathParams

```typescript
export declare type PathParams = Record<string, string>;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## QWIK_CITY_SCROLLER

```typescript
QWIK_CITY_SCROLLER = "_qCityScroller";
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/qwik-city-component.tsx)

## QwikCityMockProps

```typescript
export interface QwikCityMockProps
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

[goto?](#)

</td><td>

</td><td>

[RouteNavigate](#routenavigate)

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[params?](#)

</td><td>

</td><td>

Record&lt;string, string&gt;

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[url?](#)

</td><td>

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/qwik-city-component.tsx)

## QwikCityMockProvider

```typescript
QwikCityMockProvider: import("@builder.io/qwik").Component<QwikCityMockProps>;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/qwik-city-component.tsx)

## QwikCityPlan

```typescript
export interface QwikCityPlan
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

[basePathname?](#)

</td><td>

`readonly`

</td><td>

string

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[cacheModules?](#)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[menus?](#)

</td><td>

`readonly`

</td><td>

[MenuData](#menudata)[]

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[routes](#)

</td><td>

`readonly`

</td><td>

[RouteData](#routedata)[]

</td><td>

</td></tr>
<tr><td>

[serverPlugins?](#)

</td><td>

`readonly`

</td><td>

RouteModule[]

</td><td>

_(Optional)_

</td></tr>
<tr><td>

[trailingSlash?](#)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

_(Optional)_

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## QwikCityProps

```typescript
export interface QwikCityProps
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

[viewTransition?](#)

</td><td>

</td><td>

boolean

</td><td>

_(Optional)_ Enable the ViewTransition API

Default: `true`

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/qwik-city-component.tsx)

## QwikCityProvider

```typescript
QwikCityProvider: import("@builder.io/qwik").Component<QwikCityProps>;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/qwik-city-component.tsx)

## ResolvedDocumentHead

```typescript
export type ResolvedDocumentHead<
  FrontMatter extends Record<string, any> = Record<string, unknown>,
> = Required<DocumentHeadValue<FrontMatter>>;
```

**References:** [DocumentHeadValue](#documentheadvalue)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## routeAction$

```typescript
routeAction$: ActionConstructor;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/server-functions.ts)

## routeActionQrl

```typescript
routeActionQrl: ActionConstructorQRL;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/server-functions.ts)

## RouteData

```typescript
export type RouteData =
  | [routeName: string, loaders: ModuleLoader[]]
  | [
      routeName: string,
      loaders: ModuleLoader[],
      originalPathname: string,
      routeBundleNames: string[],
    ];
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## routeLoader$

```typescript
routeLoader$: LoaderConstructor;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/server-functions.ts)

## routeLoaderQrl

```typescript
routeLoaderQrl: LoaderConstructorQRL;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/server-functions.ts)

## RouteLocation

```typescript
export interface RouteLocation
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

[isNavigating](#)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

</td></tr>
<tr><td>

[params](#)

</td><td>

`readonly`

</td><td>

Readonly&lt;Record&lt;string, string&gt;&gt;

</td><td>

</td></tr>
<tr><td>

[prevUrl](#)

</td><td>

`readonly`

</td><td>

URL \| undefined

</td><td>

</td></tr>
<tr><td>

[url](#)

</td><td>

`readonly`

</td><td>

URL

</td><td>

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## RouteNavigate

```typescript
export type RouteNavigate = QRL<
  (
    path?: string | number,
    options?:
      | {
          type?: Exclude<NavigationType, "initial">;
          forceReload?: boolean;
          replaceState?: boolean;
          scroll?: boolean;
        }
      | boolean,
  ) => Promise<void>
>;
```

**References:** [NavigationType](#navigationtype)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## RouterOutlet

```typescript
RouterOutlet: import("@builder.io/qwik").Component<unknown>;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/router-outlet-component.tsx)

## server$

```typescript
server$: <T extends ServerFunction>(
  qrl: T,
  options?: ServerConfig | undefined,
) => ServerQRL<T>;
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
<tr><td>

options

</td><td>

ServerConfig \| undefined

</td><td>

_(Optional)_

</td></tr>
</tbody></table>
**Returns:**

[ServerQRL](#serverqrl)&lt;T&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/server-functions.ts)

## ServerFunction

```typescript
export type ServerFunction = {
  (this: RequestEventBase, ...args: any[]): any;
  options?: ServerConfig;
};
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## serverQrl

You can pass an AbortSignal as the first argument of a `server$` function and it will use it to abort the fetch when fired.

```typescript
export type ServerQRL<T extends ServerFunction> = QRL<
  | ((abort: AbortSignal, ...args: Parameters<T>) => ReturnType<T>)
  | ((...args: Parameters<T>) => ReturnType<T>)
>;
```

**References:** [ServerFunction](#serverfunction)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/server-functions.ts)

## ServerQRL

You can pass an AbortSignal as the first argument of a `server$` function and it will use it to abort the fetch when fired.

```typescript
export type ServerQRL<T extends ServerFunction> = QRL<
  | ((abort: AbortSignal, ...args: Parameters<T>) => ReturnType<T>)
  | ((...args: Parameters<T>) => ReturnType<T>)
>;
```

**References:** [ServerFunction](#serverfunction)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## ServiceWorkerRegister

```typescript
ServiceWorkerRegister: (props: { nonce?: string }) =>
  import("@builder.io/qwik").JSXNode<"script">;
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

{ nonce?: string; }

</td><td>

</td></tr>
</tbody></table>
**Returns:**

import("@builder.io/qwik").JSXNode&lt;"script"&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/sw-component.tsx)

## StaticGenerate

```typescript
export interface StaticGenerate
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

[params?](#)

</td><td>

</td><td>

[PathParams](#pathparams)[]

</td><td>

_(Optional)_

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## StaticGenerateHandler

```typescript
export type StaticGenerateHandler = ({
  env,
}: {
  env: EnvGetter;
}) => Promise<StaticGenerate> | StaticGenerate;
```

**References:** [StaticGenerate](#staticgenerate)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## StrictUnion

```typescript
export type StrictUnion<T> = Prettify<StrictUnionHelper<T, T>>;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## TypedDataValidator

```typescript
export type TypedDataValidator<T extends zod.ZodType = zod.ZodType> = {
  __zod: zod.ZodSchema<T>;
  validate(
    ev: RequestEvent,
    data: unknown,
  ): Promise<zod.SafeParseReturnType<T, T>>;
};
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## useContent

```typescript
useContent: () => import("./types").ContentState;
```

**Returns:**

import("./types").ContentState

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/use-functions.ts)

## useDocumentHead

Returns the document head for the current page. The generic type describes the front matter.

```typescript
useDocumentHead: <
  FrontMatter extends Record<string, unknown> = Record<string, any>,
>() => Required<ResolvedDocumentHead<FrontMatter>>;
```

**Returns:**

Required&lt;[ResolvedDocumentHead](#resolveddocumenthead)&lt;FrontMatter&gt;&gt;

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/use-functions.ts)

## useLocation

```typescript
useLocation: () => RouteLocation;
```

**Returns:**

[RouteLocation](#routelocation)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/use-functions.ts)

## useNavigate

```typescript
useNavigate: () => RouteNavigate;
```

**Returns:**

[RouteNavigate](#routenavigate)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/use-functions.ts)

## validator$

```typescript
validator$: ValidatorConstructor;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/server-functions.ts)

## ValidatorErrorKeyDotNotation

```typescript
export type ValidatorErrorKeyDotNotation<
  T,
  Prefix extends string = "",
> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends (infer U)[]
        ? U extends object
          ?
              | `${Prefix}${K}[]`
              | `${Prefix}${K}[]${ValidatorErrorKeyDotNotation<U, ".">}`
          : `${Prefix}${K}[]`
        : T[K] extends object
          ? ValidatorErrorKeyDotNotation<T[K], `${Prefix}${K}.`>
          : `${Prefix}${K}`;
    }[keyof T & string]
  : never;
```

**References:** [ValidatorErrorKeyDotNotation](#validatorerrorkeydotnotation)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## ValidatorErrorType

```typescript
export type ValidatorErrorType<T, U = string> = {
  formErrors: U[];
  fieldErrors: Partial<{
    [K in ValidatorErrorKeyDotNotation<T>]: K extends `${infer _Prefix}[]${infer _Suffix}`
      ? U[]
      : U;
  }>;
};
```

**References:** [ValidatorErrorKeyDotNotation](#validatorerrorkeydotnotation)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## validatorQrl

```typescript
validatorQrl: ValidatorConstructorQRL;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/server-functions.ts)

## ValidatorReturn

```typescript
export type ValidatorReturn<T extends Record<string, any> = {}> =
  | ValidatorReturnSuccess
  | ValidatorReturnFail<T>;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## zod$

```typescript
zod$: ZodConstructor;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/server-functions.ts)

## ZodConstructor

```typescript
export type ZodConstructor = {
  <T extends zod.ZodRawShape>(schema: T): TypedDataValidator<zod.ZodObject<T>>;
  <T extends zod.ZodRawShape>(
    schema: (z: typeof zod, ev: RequestEvent) => T,
  ): TypedDataValidator<zod.ZodObject<T>>;
  <T extends zod.Schema>(schema: T): TypedDataValidator<T>;
  <T extends zod.Schema>(
    schema: (z: typeof zod, ev: RequestEvent) => T,
  ): TypedDataValidator<T>;
};
```

**References:** [TypedDataValidator](#typeddatavalidator)

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## zodQrl

```typescript
zodQrl: ZodConstructorQRL;
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/runtime/src/server-functions.ts)
