# Starters

This folder stores "starter" projects for the CLI. The idea is that during the CLI execution, the developer can choose a particular starter app and combine it with a specific server and features.

All starters are based on `starters/apps/base`, including the `package.json` and `tsconfig.json`. Depending on the options the user selects, their starter merges into the `base` app.

## Developer

Here are steps to try out the CLI in a local environment.

1. Build CLI:

   ```
   # pnpm build.cli
   ```

1. Run CLI:

   ```
   # node ./packages/create-qwik/dist/create-qwik.cjs
   💫 Let's create a Qwik project 💫

   ✔ Project name … todo-express
   ✔ Select a starter › Todo
   ✔ Select a server › Express

   ⭐️ Success! Project saved in todo-express directory

   📟 Next steps:
   cd todo-express
   npm install
   npm start
   ```

1. Change to generated location
   ```
   cd todo-express
   npm install
   npm start
   ```

## Publishing `create-qwik` CLI Package

The starter CLI is published at the same time as `@builder.io/qwik`. When published, the CLI will update the `base` app's package.json to point to the published version of Qwik.

The base app's package.json's devDependencies are updated with:

```json
{
  "devDependencies": {
    "@builder.io/qwik": "<QWIK_VERSION_BEING_PUBLISHED>",
    "typescript": "<SAME_AS_ROOT_PACKAGE>",
    "vite": "<SAME_AS_ROOT_PACKAGE>"
  }
}
```
