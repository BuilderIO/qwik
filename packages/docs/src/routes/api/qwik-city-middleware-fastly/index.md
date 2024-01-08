---
title: \@builder.io/qwik-city/middleware/fastly API Reference
---

# [API](/api) &rsaquo; @builder.io/qwik-city/middleware/fastly

## createQwikCity

```typescript
export declare function createQwikCity(
  opts: QwikCityFastlyOptions,
): (
  event: FetchEvent,
  staticContentServer: PublisherServer,
) => Promise<Response | import("fastly:cache").SimpleCacheEntry | null>;
```

| Parameter | Type                                            | Description |
| --------- | ----------------------------------------------- | ----------- |
| opts      | [QwikCityFastlyOptions](#qwikcityfastlyoptions) |             |

**Returns:**

(event: FetchEvent, staticContentServer: PublisherServer) =&gt; Promise&lt;Response \| import("fastly:cache").SimpleCacheEntry \| null&gt;

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/middleware/fastly/index.ts)

## PlatformFastly

```typescript
export interface PlatformFastly
```

| Property       | Modifiers | Type                    | Description |
| -------------- | --------- | ----------------------- | ----------- |
| [env](#)       |           | typeof env              |             |
| [fetch](#)     |           | typeof fetch            |             |
| [request](#)   |           | FetchEvent['request']   |             |
| [waitUntil](#) |           | FetchEvent['waitUntil'] |             |

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/middleware/fastly/index.ts)

## QwikCityFastlyOptions

```typescript
export interface QwikCityFastlyOptions extends ServerRenderOptions
```

**Extends:** ServerRenderOptions

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/middleware/fastly/index.ts)
