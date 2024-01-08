---
title: \@builder.io/qwik-city/vite/fastly API Reference
---

# [API](/api) &rsaquo; @builder.io/qwik-city/vite/fastly

## fastlyAdapter

```typescript
export declare function fastlyAdapter(opts?: FastlyAdapterOptions): any;
```

| Parameter | Type                                          | Description  |
| --------- | --------------------------------------------- | ------------ |
| opts      | [FastlyAdapterOptions](#fastlyadapteroptions) | _(Optional)_ |

**Returns:**

any

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/adapters/fastly/vite/index.ts)

## FastlyAdapterOptions

```typescript
export interface FastlyAdapterOptions extends ServerAdapterOptions
```

**Extends:** ServerAdapterOptions

| Property          | Modifiers | Type     | Description                                                                                                                                                                                                                          |
| ----------------- | --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [staticPaths?](#) |           | string[] | _(Optional)_ Manually add pathnames that should be treated as static paths and not SSR. For example, when these pathnames are requested, their response should come from a static file, rather than a server-side rendered response. |

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/adapters/fastly/vite/index.ts)
