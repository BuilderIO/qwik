import { partytownVite } from '@builder.io/partytown/utils';
import { qwikCity } from '@builder.io/qwik-city/vite';
import { qwikInsights } from '@builder.io/qwik-labs/vite';
import { qwikReact } from '@builder.io/qwik-react/vite';
import { qwikVite } from '@builder.io/qwik/optimizer';
import path, { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import Inspect from 'vite-plugin-inspect';
import { examplesData, playgroundData, tutorialData } from './vite.repl-apps';
import { sourceResolver } from './vite.source-resolver';

export const PUBLIC_QWIK_INSIGHT_KEY = loadEnv('', '.', 'PUBLIC').PUBLIC_QWIK_INSIGHTS_KEY;
const docsDir = new URL(import.meta.url).pathname;

export default defineConfig(async () => {
  const { default: rehypePrettyCode } = await import('rehype-pretty-code');

  const routesDir = resolve('src', 'routes');
  return {
    dev: {
      headers: {
        'Cache-Control': 'public, max-age=0',
      },
    },
    preview: {
      headers: {
        'Cache-Control': 'public, max-age=600',
      },
    },
    resolve: {
      alias: [
        {
          find: '~',
          replacement: path.resolve(__dirname, 'src'),
        },
        {
          // HACK: For some reason supabase imports node-fetch but only in CloudFlare build
          // This hack is here to prevent the import from happening since we don't need to
          // polyfill fetch in the edge.
          find: '@supabase/node-fetch',
          replacement: path.resolve(__dirname, 'src', 'empty.ts'),
        },
      ],
    },
    ssr: {
      noExternal: [
        '@mui/material',
        '@mui/system',
        '@emotion/react',
        '@algolia/autocomplete-core/dist/esm/resolve',
        '@algolia/autocomplete-core',
        '@algolia/autocomplete-shared',
        'algoliasearch/lite',
        'algoliasearch',
        '@algolia/autocomplete-core/dist/esm/reshape',
        'algoliasearch/dist/algoliasearch-lite.esm.browser',
      ],
    },

    plugins: [
      {
        name: 'spy',
        enforce: 'pre',
        resolveId: {
          order: 'pre',
          handler(id, importer) {
            console.log('===================== spy resolveId', id, importer);
          },
        },
        load: {
          order: 'pre',
          handler(id, options) {
            console.log('===================== spy load', id, options);
          },
        },
        transform: {
          order: 'pre',
          handler(code, id, options) {
            console.log('===================== spy transform', id, options);
          },
        },
      },
      qwikCity({
        mdxPlugins: {
          rehypeSyntaxHighlight: false,
          remarkGfm: true,
          rehypeAutolinkHeadings: true,
        },
        mdx: {
          rehypePlugins: [
            [
              rehypePrettyCode as any,
              {
                theme: 'dark-plus',
                onVisitLine(node: any) {
                  // Prevent lines from collapsing in `display: grid` mode, and
                  // allow empty lines to be copy/pasted
                  if (node.children.length === 0) {
                    node.children = [{ type: 'text', value: ' ' }];
                  }
                },
                onVisitHighlightedLine(node: any) {
                  // Each line node by default has `class="line"`.
                  if (node.properties.className) {
                    node.properties.className.push('line--highlighted');
                  }
                },
                onVisitHighlightedWord(node: any, id: string) {
                  // Each word node has no className by default.
                  node.properties.className = ['word'];
                  if (id) {
                    const backgroundColor = {
                      a: 'rgb(196 42 94 / 59%)',
                      b: 'rgb(0 103 163 / 56%)',
                      c: 'rgb(100 50 255 / 35%)',
                    }[id];

                    const color = {
                      a: 'rgb(255 225 225 / 100%)',
                      b: 'rgb(175 255 255 / 100%)',
                      c: 'rgb(225 200 255 / 100%)',
                    }[id];
                    if (node.properties['data-rehype-pretty-code-wrapper']) {
                      node.children.forEach((childNode: any) => {
                        childNode.properties.style = ``;
                        childNode.properties.className = '';
                      });
                    }
                    node.properties.style = `background-color: ${backgroundColor}; color: ${color};`;
                  }
                },
              },
            ],
          ],
        },
      }),
      qwikVite({ debug: true }),
      partytownVite({
        dest: resolve('dist', '~partytown'),
      }),
      examplesData(routesDir),
      playgroundData(routesDir),
      tutorialData(routesDir),
      sourceResolver(docsDir),
      qwikReact(),
      Inspect(),
      qwikInsights({ publicApiKey: loadEnv('', docsDir, '').PUBLIC_QWIK_INSIGHTS_KEY }),
    ],
    build: {
      sourcemap: true,
      rollupOptions: {
        // For some unknown reason, types don't work from tsc
        // Try removing these any casts and see if it works
        onLog(level: any, log: any, defaultHandler: any) {
          if (level == 'warn' && log.code === 'MODULE_LEVEL_DIRECTIVE') {
            // Suppress errors like these:
            // FILE Module level directives cause errors when bundled, "use client" in FILE was ignored.
            return;
          }
          defaultHandler(level, log);
        },
        output: {
          assetFileNames: 'assets/[hash].[ext]',
        },
      },
    },
    clearScreen: false,
    server: {
      port: 3000,
    },
  };
});
