import { defineConfig } from 'vite';
import { qwikVite } from '@builder.io/qwik/optimizer';
import { qwikCity } from 'packages/qwik-city/buildtime/vite';

export default defineConfig(() => {
  return {
    ssr: {
      target: 'webworker',
    },
    plugins: [qwikCity(), qwikVite()],
    optimizeDeps: {
      exclude: [
        '@builder.io/qwik',
        '@builder.io/qwik/optimizer',
        '@builder.io/qwik/server',
        '@builder.io/qwik-city',
        '@builder.io/qwik-city/adaptors/cloudflare-pages',
        '@builder.io/qwik-city/adaptors/express',
        '@builder.io/qwik-city/vite',
      ],
    },
    clearScreen: false,
  };
});
