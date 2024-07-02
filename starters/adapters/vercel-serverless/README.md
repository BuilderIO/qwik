## Vercel Serverless

This starter site is configured to deploy to [Vercel Serverless Functions](https://vercel.com/docs/functions), which means it will be rendered at an edge location near to your users. Vercel supports two runtimes: Edge and Serverless. The Edge runtime is lightweight and web-compatible, while the Serverless runtime is based on Node.js.

## Installation

The adaptor will add a new `vite.config.ts` within the `adapters/` directory, and a new entry file will be created, such as:

```
└── adapters/
    └── vercel-serverless/
        └── vite.config.ts
└── src/
    └── entry.vercel-serverless.tsx
```

Additionally, within the `package.json`, the `build.server` script will be updated with the Vercel Edge build.

## Production build

To build the application for production, use the `build` command, this command will automatically run `npm run build.server` and `npm run build.client`:

```shell
npm run build
```

[Read the full guide here](https://github.com/QwikDev/qwik/blob/main/starters/adapters/vercel-serverless/README.md)

## Dev deploy

To deploy the application for development:

```shell
npm run deploy
```

Notice that you might need a [Vercel account](https://vercel.com/docs/getting-started-with-vercel) in order to complete this step!

## Production deploy

The project is ready to be deployed to Vercel. However, you will need to create a git repository and push the code to it.

You can [deploy your site to Vercel](https://vercel.com/docs/concepts/deployments/overview) either via a Git provider integration or through the Vercel CLI.
