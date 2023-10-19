---
title: \@builder.io/qwik-city/vite/vercel-serverless API Reference
---

# [API](/api) &rsaquo; @builder.io/qwik-city/vite/vercel-serverless

## vercelServerlessAdapter

```typescript
export declare function vercelServerlessAdapter(
  opts?: VercelServerlessAdapterOptions
): any;
```

| Parameter | Type                                                              | Description  |
| --------- | ----------------------------------------------------------------- | ------------ |
| opts      | [VercelServerlessAdapterOptions](#vercelserverlessadapteroptions) | _(Optional)_ |

**Returns:**

any

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/adapters/vercel-serverless/vite/index.ts)

## VercelServerlessAdapterOptions

```typescript
export interface VercelServerlessAdapterOptions extends ServerAdapterOptions
```

**Extends:** ServerAdapterOptions

| Property                        | Modifiers | Type                           | Description                                                                                                                                                                                                                                       |
| ------------------------------- | --------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [environment?](#)               |           | Record&lt;string, string&gt;[] | _(Optional)_ Map of additional environment variables that will be available to the Serverless Function, in addition to the env vars specified in the Project Settings.                                                                            |
| [maxDuration?](#)               |           | number                         | _(Optional)_ Maximum execution duration (in seconds) that will be allowed for the Serverless Function.                                                                                                                                            |
| [memory?](#)                    |           | number                         | _(Optional)_ Amount of memory (RAM in MB) that will be allocated to the Serverless Function.                                                                                                                                                      |
| [outputConfig?](#)              |           | boolean                        | <p>_(Optional)_ Determines if the build should auto-generate the <code>.vercel/output/config.json</code> config.</p><p>Defaults to <code>true</code>.</p>                                                                                         |
| [regions?](#)                   |           | string[]                       | _(Optional)_ List of Vercel Regions where the Serverless Function will be deployed to.                                                                                                                                                            |
| [runtime?](#)                   |           | string                         | _(Optional)_ Specifies which "runtime" will be used to execute the Serverless Function. Defaults to <code>nodejs18.x</code>.                                                                                                                      |
| [staticPaths?](#)               |           | string[]                       | _(Optional)_ Manually add pathnames that should be treated as static paths and not SSR. For example, when these pathnames are requested, their response should come from a static file, rather than a server-side rendered response.              |
| [supportsResponseStreaming?](#) |           | boolean                        | _(Optional)_ When true, the Serverless Function will stream the response to the client. Defaulted to true since Qwik streams its content.                                                                                                         |
| [supportsWrapper?](#)           |           | boolean                        | _(Optional)_ True if a custom runtime has support for Lambda runtime wrappers.                                                                                                                                                                    |
| [vcConfigEntryPoint?](#)        |           | string                         | <p>_(Optional)_ The <code>entrypoint</code> property in the <code>.vc-config.json</code> file. Indicates the initial file where code will be executed for the Serverless Function.</p><p>Defaults to <code>entry.vercel-serverless.js</code>.</p> |

[Edit this section](https://github.com/BuilderIO/qwik/tree/main/packages/qwik-city/adapters/vercel-serverless/vite/index.ts)
