import { defineConfig } from 'vite';
import { qwikVite } from '@builder.io/qwik/optimizer';

export default defineConfig(({ mode }) => {
v
  return {
    build: {
      sourcemap: !isProductionMode,
      minify: false,
      target: 'es2020',
      lib: {
        entry: './src/index.ts',
        formats: ['es', 'cjs'],
        fileName: (format) => `index.qwik.${format === 'es' ? 'mjs' : 'cjs'}`,
      },
      rollupOptions: {
        external: [
          '@emotion/server',
          '@emotion/cache',
          '@emotion/core',
          '@emotion/react',
          '@emotion/react/jsx-runtime',
          '@emotion/server/create-instance',
          'react/jsx-runtime',
          'react',
          'react-dom/client',
          'react-dom/server',
        ],
      },
    },
    plugins: [qwikVite()],
  };
});
