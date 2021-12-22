import { nodeResolve } from '@rollup/plugin-node-resolve';
import { qwikRollup } from '@builder.io/qwik/optimizer';
import { terser } from "rollup-plugin-terser";
import { outputJSON } from "fs-extra";

export default async function () {
  return {
    input: [
      'src/index.server.tsx',
      'src/components.tsx'
    ],
    plugins: [
      nodeResolve(),
      qwikRollup({
        symbolsOutput: (data) => {
          outputJSON('./server/build/q-symbols.json', data);
        },
      }),
      terser(),
    ],
    output: [
      {
        chunkFileNames: 'q-[hash].js',
        dir: 'public/build',
        format: 'es',
      },
      {
        dir: 'server/build',
        format: 'cjs',
      },
    ],
  };
}
