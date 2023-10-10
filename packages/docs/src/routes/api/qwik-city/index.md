---
title: \@builder.io/qwik-city API Reference
---

# [API](/api) &rsaquo; @builder.io/qwik-city

## Action

```typescript
export interface Action<RETURN, INPUT = Record<string, any>, OPTIONAL extends boolean = true>
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## ActionConstructor

```typescript
export interface ActionConstructor
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## ActionStore

```typescript
export interface ActionStore<RETURN, INPUT, OPTIONAL extends boolean = true>
```

| Property        | Modifiers             | Type   | Description                                                                                                    |
| --------------- | --------------------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| [actionPath](#) | <code>readonly</code> | string | <p>It's the "action" path that a native <code>&lt;form&gt;</code> should have in order to call the action.</p> |

```tsx
<form action={action.actionPath} />
```

<p>Most of the time this property should not be used directly, instead use the <code>Form</code> component:</p>
```tsx
import {action$, Form} from '@builder.io/qwik-city';

export const useAddUser = action$(() => { ... });

export default component$(() => {
const action = useAddUser();
return (
<Form action={action}/>
);
});

````
 |
|  [formData](#) | <code>readonly</code> | FormData \| undefined | <p>When calling an action through a <code>&lt;form&gt;</code>, this property contains the previously submitted <code>FormData</code>.</p><p>This is useful to keep the filled form data even after a full page reload.</p><p>It's <code>undefined</code> before the action is first called.</p> |
|  [isRunning](#) | <code>readonly</code> | boolean | <p>Reactive property that becomes <code>true</code> only in the browser, when a form is submitted and switched back to false when the action finish, ie, it describes if the action is actively running.</p><p>This property is specially useful to disable the submit button while the action is processing, to prevent multiple submissions, and to inform visually to the user that the action is actively running.</p><p>It will be always <code>false</code> in the server, and only becomes <code>true</code> briefly while the action is running.</p> |
|  [status?](#) | <code>readonly</code> | number | <p>_(Optional)_ Returned HTTP status code of the action after its last execution.</p><p>It's <code>undefined</code> before the action is first called.</p> |
|  [submit](#) | <code>readonly</code> | QRL&lt;OPTIONAL extends true ? (form?: INPUT \| FormData \| SubmitEvent) =&gt; Promise&lt;ActionReturn&lt;RETURN&gt;&gt; : (form: INPUT \| FormData \| SubmitEvent) =&gt; Promise&lt;ActionReturn&lt;RETURN&gt;&gt;&gt; | Method to execute the action programmatically from the browser. Ie, instead of using a <code>&lt;form&gt;</code>, a 'click' handle can call the <code>run()</code> method of the action in order to execute the action in the server. |
|  [value](#) | <code>readonly</code> | RETURN \| undefined | <p>Returned successful data of the action. This reactive property will contain the data returned inside the <code>action$</code> function.</p><p>It's <code>undefined</code> before the action is first called.</p> |

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## ContentHeading

```typescript
export interface ContentHeading
````

| Property   | Modifiers             | Type   | Description |
| ---------- | --------------------- | ------ | ----------- |
| [id](#)    | <code>readonly</code> | string |             |
| [level](#) | <code>readonly</code> | number |             |
| [text](#)  | <code>readonly</code> | string |             |

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## ContentMenu

```typescript
export interface ContentMenu
```

| Property    | Modifiers             | Type                          | Description  |
| ----------- | --------------------- | ----------------------------- | ------------ |
| [href?](#)  | <code>readonly</code> | string                        | _(Optional)_ |
| [items?](#) | <code>readonly</code> | [ContentMenu](#contentmenu)[] | _(Optional)_ |
| [text](#)   | <code>readonly</code> | string                        |              |

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## DocumentHead

```typescript
export type DocumentHead =
  | DocumentHeadValue
  | ((props: DocumentHeadProps) => DocumentHeadValue);
```

**References:** [DocumentHeadValue](#documentheadvalue), [DocumentHeadProps](#documentheadprops)

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## DocumentHeadProps

```typescript
export interface DocumentHeadProps extends RouteLocation
```

**Extends:** [RouteLocation](#routelocation)

| Property          | Modifiers             | Type                                          | Description |
| ----------------- | --------------------- | --------------------------------------------- | ----------- |
| [head](#)         | <code>readonly</code> | [ResolvedDocumentHead](#resolveddocumenthead) |             |
| [resolveValue](#) | <code>readonly</code> | ResolveSyncValue                              |             |
| [withLocale](#)   | <code>readonly</code> | &lt;T&gt;(fn: () =&gt; T) =&gt; T             |             |

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## DocumentHeadValue

```typescript
export interface DocumentHeadValue
```

| Property          | Modifiers             | Type                                       | Description                                                                                                                                                                                                                                                           |
| ----------------- | --------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [frontmatter?](#) | <code>readonly</code> | Readonly&lt;Record&lt;string, any&gt;&gt;  | _(Optional)_ Arbitrary object containing custom data. When the document head is created from markdown files, the frontmatter attributes that are not recognized as a well-known meta names (such as title, description, author, etc...), are stored in this property. |
| [links?](#)       | <code>readonly</code> | readonly [DocumentLink](#documentlink)[]   | _(Optional)_ Used to manually append <code>&lt;link&gt;</code> elements to the <code>&lt;head&gt;</code>.                                                                                                                                                             |
| [meta?](#)        | <code>readonly</code> | readonly [DocumentMeta](#documentmeta)[]   | _(Optional)_ Used to manually set meta tags in the head. Additionally, the <code>data</code> property could be used to set arbitrary data which the <code>&lt;head&gt;</code> component could later use to generate <code>&lt;meta&gt;</code> tags.                   |
| [scripts?](#)     | <code>readonly</code> | readonly DocumentScript[]                  | _(Optional)_ Used to manually append <code>&lt;script&gt;</code> elements to the <code>&lt;head&gt;</code>.                                                                                                                                                           |
| [styles?](#)      | <code>readonly</code> | readonly [DocumentStyle](#documentstyle)[] | _(Optional)_ Used to manually append <code>&lt;style&gt;</code> elements to the <code>&lt;head&gt;</code>.                                                                                                                                                            |
| [title?](#)       | <code>readonly</code> | string                                     | _(Optional)_ Sets <code>document.title</code>.                                                                                                                                                                                                                        |

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## DocumentLink

```typescript
export interface DocumentLink
```

| Property             | Modifiers | Type    | Description  |
| -------------------- | --------- | ------- | ------------ |
| [as?](#)             |           | string  | _(Optional)_ |
| [crossorigin?](#)    |           | string  | _(Optional)_ |
| [disabled?](#)       |           | boolean | _(Optional)_ |
| [href?](#)           |           | string  | _(Optional)_ |
| [hreflang?](#)       |           | string  | _(Optional)_ |
| [id?](#)             |           | string  | _(Optional)_ |
| [imagesizes?](#)     |           | string  | _(Optional)_ |
| [imagesrcset?](#)    |           | string  | _(Optional)_ |
| [integrity?](#)      |           | string  | _(Optional)_ |
| [key?](#)            |           | string  | _(Optional)_ |
| [media?](#)          |           | string  | _(Optional)_ |
| [prefetch?](#)       |           | string  | _(Optional)_ |
| [referrerpolicy?](#) |           | string  | _(Optional)_ |
| [rel?](#)            |           | string  | _(Optional)_ |
| [sizes?](#)          |           | string  | _(Optional)_ |
| [title?](#)          |           | string  | _(Optional)_ |
| [type?](#)           |           | string  | _(Optional)_ |

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## DocumentMeta

```typescript
export interface DocumentMeta
```

| Property        | Modifiers             | Type   | Description  |
| --------------- | --------------------- | ------ | ------------ |
| [content?](#)   | <code>readonly</code> | string | _(Optional)_ |
| [httpEquiv?](#) | <code>readonly</code> | string | _(Optional)_ |
| [itemprop?](#)  | <code>readonly</code> | string | _(Optional)_ |
| [key?](#)       | <code>readonly</code> | string | _(Optional)_ |
| [media?](#)     | <code>readonly</code> | string | _(Optional)_ |
| [name?](#)      | <code>readonly</code> | string | _(Optional)_ |
| [property?](#)  | <code>readonly</code> | string | _(Optional)_ |

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## DocumentStyle

```typescript
export interface DocumentStyle
```

| Property    | Modifiers             | Type                                           | Description  |
| ----------- | --------------------- | ---------------------------------------------- | ------------ |
| [key?](#)   | <code>readonly</code> | string                                         | _(Optional)_ |
| [props?](#) | <code>readonly</code> | Readonly&lt;QwikIntrinsicElements['style']&gt; | _(Optional)_ |
| [style](#)  | <code>readonly</code> | string                                         |              |

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## FailReturn

```typescript
export type FailReturn<T> = T & Failed;
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## Form

```typescript
Form: <O, I>(
  { action, spaReset, reloadDocument, onSubmit$, ...rest }: FormProps<O, I>,
  key: string | null,
) => QwikJSX.Element;
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/form-component.tsx)

## FormProps

```typescript
export interface FormProps<O, I> extends Omit<QwikJSX.IntrinsicElements['form'], 'action' | 'method'>
```

**Extends:** Omit&lt;QwikJSX.IntrinsicElements['form'], 'action' \| 'method'&gt;

| Property                 | Modifiers | Type                                                                                                                                               | Description                                                                                                                                                                      |
| ------------------------ | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [action?](#)             |           | [ActionStore](#actionstore)&lt;O, I, true \| false&gt;                                                                                             | _(Optional)_ Reference to the action returned by <code>action()</code>.                                                                                                          |
| [key?](#)                |           | string \| number \| null                                                                                                                           | _(Optional)_                                                                                                                                                                     |
| [onSubmit$?](#)          |           | (event: Event, form: HTMLFormElement) =&gt; ValueOrPromise&lt;void&gt;                                                                             | _(Optional)_ Event handler executed right when the form is submitted.                                                                                                            |
| [onSubmitCompleted$?](#) |           | (event: CustomEvent&lt;[FormSubmitCompletedDetail](#formsubmitsuccessdetail)&lt;O&gt;&gt;, form: HTMLFormElement) =&gt; ValueOrPromise&lt;void&gt; | _(Optional)_ Event handler executed right after the action is executed successfully and returns some data.                                                                       |
| [reloadDocument?](#)     |           | boolean                                                                                                                                            | _(Optional)_ When <code>true</code> the form submission will cause a full page reload, even if SPA mode is enabled and JS is available.                                          |
| [spaReset?](#)           |           | boolean                                                                                                                                            | <p>_(Optional)_ When <code>true</code> all the form inputs will be reset in SPA mode, just like happens in a full page form submission.</p><p>Defaults to <code>false</code></p> |

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/form-component.tsx)

## FormSubmitSuccessDetail

```typescript
export interface FormSubmitCompletedDetail<T>
```

| Property    | Modifiers | Type   | Description |
| ----------- | --------- | ------ | ----------- |
| [status](#) |           | number |             |
| [value](#)  |           | T      |             |

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/form-component.tsx)

## globalAction$

```typescript
globalAction$: ActionConstructor;
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/server-functions.ts)

## globalActionQrl

```typescript
globalActionQrl: ActionConstructorQRL;
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/server-functions.ts)

## JSONObject

```typescript
export type JSONObject = {
  [x: string]: JSONValue;
};
```

**References:** [JSONValue](#jsonvalue)

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

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

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## Link

```typescript
Link: import("@builder.io/qwik").Component<LinkProps>;
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/link-component.tsx)

## LinkProps

```typescript
export interface LinkProps extends AnchorAttributes
```

**Extends:** AnchorAttributes

| Property           | Modifiers | Type    | Description  |
| ------------------ | --------- | ------- | ------------ |
| [prefetch?](#)     |           | boolean | _(Optional)_ |
| [reload?](#)       |           | boolean | _(Optional)_ |
| [replaceState?](#) |           | boolean | _(Optional)_ |
| [scroll?](#)       |           | boolean | _(Optional)_ |

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/link-component.tsx)

## Loader

```typescript
export interface Loader<RETURN>
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## LoaderSignal

```typescript
export type LoaderSignal<TYPE> = TYPE extends () => ValueOrPromise<
  infer VALIDATOR
>
  ? ReadonlySignal<ValueOrPromise<VALIDATOR>>
  : ReadonlySignal<TYPE>;
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## MenuData

```typescript
export type MenuData = [pathname: string, menuLoader: MenuModuleLoader];
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## NavigationType

```typescript
export type NavigationType = "initial" | "form" | "link" | "popstate";
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## PageModule

```typescript
export interface PageModule extends RouteModule
```

**Extends:** RouteModule

| Property               | Modifiers             | Type                                            | Description  |
| ---------------------- | --------------------- | ----------------------------------------------- | ------------ |
| [default](#)           | <code>readonly</code> | any                                             |              |
| [head?](#)             | <code>readonly</code> | ContentModuleHead                               | _(Optional)_ |
| [headings?](#)         | <code>readonly</code> | [ContentHeading](#contentheading)[]             | _(Optional)_ |
| [onStaticGenerate?](#) | <code>readonly</code> | [StaticGenerateHandler](#staticgeneratehandler) | _(Optional)_ |

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## PathParams

```typescript
export declare type PathParams = Record<string, string>;
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## QwikCityMockProps

```typescript
export interface QwikCityMockProps
```

| Property     | Modifiers | Type                         | Description  |
| ------------ | --------- | ---------------------------- | ------------ |
| [params?](#) |           | Record&lt;string, string&gt; | _(Optional)_ |
| [url?](#)    |           | string                       | _(Optional)_ |

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/qwik-city-component.tsx)

## QwikCityMockProvider

```typescript
QwikCityMockProvider: import("@builder.io/qwik").Component<QwikCityMockProps>;
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/qwik-city-component.tsx)

## QwikCityPlan

```typescript
export interface QwikCityPlan
```

| Property            | Modifiers             | Type                      | Description  |
| ------------------- | --------------------- | ------------------------- | ------------ |
| [basePathname?](#)  | <code>readonly</code> | string                    | _(Optional)_ |
| [cacheModules?](#)  | <code>readonly</code> | boolean                   | _(Optional)_ |
| [menus?](#)         | <code>readonly</code> | [MenuData](#menudata)[]   | _(Optional)_ |
| [routes](#)         | <code>readonly</code> | [RouteData](#routedata)[] |              |
| [serverPlugins?](#) | <code>readonly</code> | RouteModule[]             | _(Optional)_ |
| [trailingSlash?](#) | <code>readonly</code> | boolean                   | _(Optional)_ |

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## QwikCityProps

```typescript
export interface QwikCityProps
```

| Property             | Modifiers | Type    | Description                                                                        |
| -------------------- | --------- | ------- | ---------------------------------------------------------------------------------- |
| [viewTransition?](#) |           | boolean | <p>_(Optional)_ Enable the ViewTransition API</p><p>Default: <code>true</code></p> |

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/qwik-city-component.tsx)

## QwikCityProvider

```typescript
QwikCityProvider: import("@builder.io/qwik").Component<QwikCityProps>;
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/qwik-city-component.tsx)

## ResolvedDocumentHead

```typescript
export type ResolvedDocumentHead = Required<DocumentHeadValue>;
```

**References:** [DocumentHeadValue](#documentheadvalue)

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## routeAction$

```typescript
routeAction$: ActionConstructor;
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/server-functions.ts)

## routeActionQrl

```typescript
routeActionQrl: ActionConstructorQRL;
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/server-functions.ts)

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

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## routeLoader$

```typescript
routeLoader$: LoaderConstructor;
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/server-functions.ts)

## routeLoaderQrl

```typescript
routeLoaderQrl: LoaderConstructorQRL;
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/server-functions.ts)

## RouteLocation

```typescript
export interface RouteLocation
```

| Property          | Modifiers             | Type                                         | Description |
| ----------------- | --------------------- | -------------------------------------------- | ----------- |
| [isNavigating](#) | <code>readonly</code> | boolean                                      |             |
| [params](#)       | <code>readonly</code> | Readonly&lt;Record&lt;string, string&gt;&gt; |             |
| [prevUrl](#)      | <code>readonly</code> | URL \| undefined                             |             |
| [url](#)          | <code>readonly</code> | URL                                          |             |

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## RouteNavigate

```typescript
export type RouteNavigate = QRL<
  (
    path?: string,
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

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## RouterOutlet

```typescript
RouterOutlet: import("@builder.io/qwik").Component<{}>;
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/router-outlet-component.tsx)

## server$

```typescript
server$: <T extends import("./types").ServerFunction>(first: T) => QRL<T>;
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/server-functions.ts)

## serverQrl

```typescript
serverQrl: ServerConstructorQRL;
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/server-functions.ts)

## ServiceWorkerRegister

```typescript
ServiceWorkerRegister: (props: { nonce?: string }) =>
  import("@builder.io/qwik").JSXNode<"script">;
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/sw-component.tsx)

## StaticGenerate

```typescript
export interface StaticGenerate
```

| Property     | Modifiers | Type                        | Description  |
| ------------ | --------- | --------------------------- | ------------ |
| [params?](#) |           | [PathParams](#pathparams)[] | _(Optional)_ |

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## StaticGenerateHandler

```typescript
export type StaticGenerateHandler = ({
  env,
}: {
  env: EnvGetter;
}) => Promise<StaticGenerate> | StaticGenerate;
```

**References:** [StaticGenerate](#staticgenerate)

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## useContent

```typescript
useContent: () => import("./types").ContentState;
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/use-functions.ts)

## useDocumentHead

```typescript
useDocumentHead: () => Required<ResolvedDocumentHead>;
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/use-functions.ts)

## useLocation

```typescript
useLocation: () => RouteLocation;
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/use-functions.ts)

## useNavigate

```typescript
useNavigate: () => RouteNavigate;
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/use-functions.ts)

## valibot$

```typescript
valibot$: (
  first:
    | ValibotObjectShapeOrSchema
    | ((ev: RequestEvent) => ValibotObjectShapeOrSchema),
) => DataValidator<{}>;
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/server-functions.ts)

## valibotQrl

```typescript
valibotQrl: (
  qrl: QRL<
    | ValibotObjectShapeOrSchema
    | ((ev: RequestEvent) => ValibotObjectShapeOrSchema)
  >,
) => DataValidator;
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/server-functions.ts)

## validator$

```typescript
validator$: ValidatorConstructor;
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/server-functions.ts)

## validatorQrl

```typescript
validatorQrl: ValidatorConstructorQRL;
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/server-functions.ts)

## zod$

```typescript
zod$: ZodConstructor;
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/server-functions.ts)

## ZodConstructor

```typescript
export interface ZodConstructor
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/types.ts)

## zodQrl

```typescript
zodQrl: ZodConstructorQRL;
```

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/runtime/src/server-functions.ts)
