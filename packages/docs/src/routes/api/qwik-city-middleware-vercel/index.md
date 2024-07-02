---
title: \@builder.io/qwik-city/middleware/vercel API Reference
---

# [API](/api) &rsaquo; @builder.io/qwik-city/middleware/vercel

## createQwikCity

```typescript
export declare function createQwikCity(
  opts: QwikCityVercelServerlessOptions,
): (
  req: IncomingMessage | Http2ServerRequest,
  res: ServerResponse,
  next: (err?: any) => void,
) => void;
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

[QwikCityVercelServerlessOptions](#qwikcityvercelserverlessoptions)

</td><td>

</td></tr>
</tbody></table>
**Returns:**

(req: IncomingMessage \| Http2ServerRequest, res: ServerResponse, next: (err?: any) =&gt; void) =&gt; void

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/middleware/vercel/serverless/index.ts)

## PlatformVercelServerless

```typescript
export interface PlatformVercelServerless
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/middleware/vercel/serverless/index.ts)

## QwikCityVercelServerlessOptions

```typescript
export interface QwikCityVercelServerlessOptions extends ServerRenderOptions
```

**Extends:** ServerRenderOptions

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/middleware/vercel/serverless/index.ts)
