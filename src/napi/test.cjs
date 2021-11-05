//  node src/napi/test.cjs

async function run() {
  const { Optimizer } = require('../../dist-dev/@builder.io-qwik/optimizer/index.cjs');
  const optimizer = new Optimizer();

  const result = await optimizer.transformFs({
    rootDir: "/Users/manualmeida/repos/builderio/qwik/integration/todo/src",
    sourceMaps: false,
    transpile: false,
    minify: false,
    entryStrategy: "PerHook"
  });

  console.log(result);

}

run();
