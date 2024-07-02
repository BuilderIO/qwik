---
title: \@builder.io/qwik-city/vite/vercel API Reference
---

# [API](/api) &rsaquo; @builder.io/qwik-city/vite/vercel

## FUNCTION_DIRECTORY

```typescript
FUNCTION_DIRECTORY = "_qwik-city-serverless";
```

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/adapters/vercel/serverless/index.ts)

## ServerlessFunctionConfig

```typescript
export interface ServerlessFunctionConfig
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

[environment?](#)

</td><td>

</td><td>

Record&lt;string, string&gt;[]

</td><td>

_(Optional)_ Map of additional environment variables that will be available to the Serverless Function, in addition to the env vars specified in the Project Settings.

Required: No

</td></tr>
<tr><td>

[handler](#)

</td><td>

</td><td>

string

</td><td>

Indicates the initial file where code will be executed for the Serverless Function.

Required: Yes

</td></tr>
<tr><td>

[maxDuration?](#)

</td><td>

</td><td>

number

</td><td>

_(Optional)_ Maximum duration (in seconds) that will be allowed for the Serverless Function.

Required: No

</td></tr>
<tr><td>

[memory?](#)

</td><td>

</td><td>

number

</td><td>

_(Optional)_ Amount of memory (RAM in MB) that will be allocated to the Serverless Function.

Required: No

</td></tr>
<tr><td>

[regions?](#)

</td><td>

</td><td>

string[]

</td><td>

_(Optional)_ List of Vercel Regions where the Serverless Function will be deployed to.

Required: No

</td></tr>
<tr><td>

[runtime](#)

</td><td>

</td><td>

string

</td><td>

Specifies which "runtime" will be used to execute the Serverless Function.

Required: Yes

</td></tr>
<tr><td>

[supportsResponseStreaming?](#)

</td><td>

</td><td>

boolean

</td><td>

_(Optional)_ When true, the Serverless Function will stream the response to the client.

Required: No

</td></tr>
<tr><td>

[supportsWrapper?](#)

</td><td>

</td><td>

boolean

</td><td>

_(Optional)_ True if a custom runtime has support for Lambda runtime wrappers.

Required: No

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/adapters/vercel/serverless/index.ts)

## vercelServerlessAdapter

```typescript
export declare function vercelServerlessAdapter(
  opts?: VercelServerlessAdapterOptions,
): any;
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

[VercelServerlessAdapterOptions](#vercelserverlessadapteroptions)

</td><td>

_(Optional)_

</td></tr>
</tbody></table>
**Returns:**

any

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/adapters/vercel/serverless/index.ts)

## VercelServerlessAdapterOptions

```typescript
export interface VercelServerlessAdapterOptions extends ServerAdapterOptions
```

**Extends:** ServerAdapterOptions

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

[awsLambdaHandler?](#)

</td><td>

</td><td>

string

</td><td>

_(Optional)_ AWS Handler Value for when the serverless function uses AWS Lambda syntax.

Required: No

</td></tr>
<tr><td>

[environment?](#)

</td><td>

</td><td>

{ [key: string]: string; }

</td><td>

_(Optional)_ Specifies environment variables for the serverless function.

Required: No

</td></tr>
<tr><td>

[maxDuration?](#)

</td><td>

</td><td>

number

</td><td>

_(Optional)_ Specifies the maximum duration that the serverless function can run.

Required: No

</td></tr>
<tr><td>

[memory?](#)

</td><td>

</td><td>

number

</td><td>

_(Optional)_ Specifies the memory allocation for the serverless function.

Required: No

</td></tr>
<tr><td>

[outputConfig?](#)

</td><td>

</td><td>

boolean

</td><td>

_(Optional)_ Determines if the build should auto-generate the `.vercel/output/config.json` config.

Defaults to `true`.

</td></tr>
<tr><td>

[regions?](#)

</td><td>

</td><td>

string[]

</td><td>

_(Optional)_ Specifies the regions in which the serverless function should run.

Required: No

</td></tr>
<tr><td>

[runtime?](#)

</td><td>

</td><td>

string

</td><td>

_(Optional)_ Specifies the runtime environment for the function, for example, Node.js, Deno, etc.

Required: No

</td></tr>
<tr><td>

[shouldAddHelpers?](#)

</td><td>

</td><td>

boolean

</td><td>

_(Optional)_ Enables request and response helpers methods.

Required: No Default: false

</td></tr>
<tr><td>

[shouldAddSourceMapSupport?](#)

</td><td>

</td><td>

boolean

</td><td>

_(Optional)_ Enables source map generation.

Required: No Default: false

</td></tr>
<tr><td>

[staticPaths?](#)

</td><td>

</td><td>

string[]

</td><td>

_(Optional)_ Manually add pathnames that should be treated as static paths and not SSR. For example, when these pathnames are requested, their response should come from a static file, rather than a server-side rendered response.

</td></tr>
<tr><td>

[target?](#)

</td><td>

</td><td>

string

</td><td>

_(Optional)_ Specifies the target platform for the deployment, such as Vercel, AWS, etc.

Required: No

</td></tr>
<tr><td>

[vcConfigEntryPoint?](#)

</td><td>

</td><td>

string

</td><td>

_(Optional)_ The `entrypoint` property in the `.vc-config.json` file. Indicates the initial file where code will be executed for the Edge Function.

Defaults to `entry.vercel-edge.js`.

</td></tr>
</tbody></table>

[Edit this section](https://github.com/QwikDev/qwik/tree/main/packages/qwik-city/adapters/vercel/serverless/index.ts)
