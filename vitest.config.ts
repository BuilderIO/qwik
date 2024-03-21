import { defineConfig } from 'vitest/config';
import { qwikVite } from '@builder.io/qwik/optimizer';
import tsconfigPaths from 'vite-tsconfig-paths';

const __dirname = new URL('.', import.meta.url).pathname;
export default defineConfig({
  plugins: [
    qwikVite({
      // debug: true,
      srcDir: `${__dirname}/packages/qwik/src`,
    }),
    tsconfigPaths({ ignoreConfigErrors: true }),
  ],
  test: {
    include: ['packages/**/*.unit.?(c|m)[jt]s?(x)'],
    setupFiles: ['./vitest-setup.ts'],
  },
});
