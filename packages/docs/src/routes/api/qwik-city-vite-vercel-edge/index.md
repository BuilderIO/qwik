---
title: \@builder.io/qwik-city/vite/vercel-edge API Reference
---

# [API](/api) &rsaquo; @builder.io/qwik-city/vite/vercel-edge

## vercelEdgeAdapter

```typescript
export declare function vercelEdgeAdapter(opts?: VercelEdgeAdapterOptions): any;
```

| Parameter | Type                                                  | Description  |
| --------- | ----------------------------------------------------- | ------------ |
| opts      | [VercelEdgeAdapterOptions](#verceledgeadapteroptions) | _(Optional)_ |

**Returns:**

any

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/adapters/vercel-edge/vite/index.ts)

## VercelEdgeAdapterOptions

```typescript
export interface VercelEdgeAdapterOptions extends ServerAdapterOptions
```

**Extends:** ServerAdapterOptions

| Property                   | Modifiers | Type     | Description                                                                                                                                                                                                                                |
| -------------------------- | --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [outputConfig?](#)         |           | boolean  | <p>_(Optional)_ Determines if the build should auto-generate the <code>.vercel/output/config.json</code> config.</p><p>Defaults to <code>true</code>.</p>                                                                                  |
| [staticPaths?](#)          |           | string[] | _(Optional)_ Manually add pathnames that should be treated as static paths and not SSR. For example, when these pathnames are requested, their response should come from a static file, rather than a server-side rendered response.       |
| [vcConfigEntryPoint?](#)   |           | string   | <p>_(Optional)_ The <code>entrypoint</code> property in the <code>.vc-config.json</code> file. Indicates the initial file where code will be executed for the Edge Function.</p><p>Defaults to <code>entry.vercel-edge.js</code>.</p>      |
| [vcConfigEnvVarsInUse?](#) |           | string[] | <p>_(Optional)_ The <code>envVarsInUse</code> property in the <code>.vc-config.json</code> file. List of environment variable names that will be available for the Edge Function to utilize.</p><p>Defaults to <code>undefined</code>.</p> |

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/adapters/vercel-edge/vite/index.ts)
