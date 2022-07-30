# Qwik Examples

## Contribute new examples

The current folder includes all the examples present in: http://qwik.builder.io/examples/introduction/hello-world

### 1. Example category

The first level of folders are the categories. Feel free to add a new root level folder to create a new category if your new example does not fit one of the existing ones.

### 2. Create a new example folder

The easiest way to create a new example is copying the `hello-world` folder inside the `introduction` and renaming it with the name of your new app.

```
cp -r introduction/hello-world introduction/my-new-example
```

### 3. Add new example metadata

Open the `examples-menu.json` and add your new example in the right section:

```diff
[
  {
    "id": "introduction",
    "title": "Introduction",
    "apps": [
      {
        "id": "hello-world",
        "title": "Hello World",
        "description": "The simplest Qwik app.",
        "icon": "🌎"
      },
+      {
+        "id": "my-new-example",
+        "title": "New demo",
+        "description": "Just some text.",
+        "icon": "🙊"
+      }
    ]
  },
```

### 4. Run fmt

At the root of the qwik repo, run:

```bash
yarn
yarn build
yarn lint
```
