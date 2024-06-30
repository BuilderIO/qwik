import type { OutputFormat, ImageMetadata } from 'vite-imagetools';
import type { PluginOption } from 'vite';
import { optimize } from 'svgo';
import fs from 'node:fs';
import path from 'node:path';
import { parseId } from '../../../qwik/src/optimizer/src/plugins/plugin';
import type { QwikCityVitePluginOptions } from './types';
import type { Config as SVGOConfig } from 'svgo';

/** Normalizes the format for use in mime-type */
const getFormat = (m: ImageMetadata) => {
  if (!m.format) {
    throw new Error(`Could not determine image format`);
  }
  return m.format.replace('jpg', 'jpeg');
};

/** @public */
export function imagePlugin(userOpts?: QwikCityVitePluginOptions): PluginOption[] {
  const supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.tiff'];
  return [
    import('vite-imagetools')
      .then(({ imagetools }) =>
        imagetools({
          exclude: [],
          extendOutputFormats(builtins) {
            const jsx: OutputFormat = () => (metadatas) => {
              const fallbackFormat = [...new Set(metadatas.map((m) => getFormat(m)))].pop();

              let largestFallback;
              let largestFallbackSize = 0;
              let fallbackFormatCount = 0;
              for (let i = 0; i < metadatas.length; i++) {
                const m = metadatas[i];
                if (getFormat(m) === fallbackFormat) {
                  fallbackFormatCount++;
                  if ((m.width as number) > largestFallbackSize) {
                    largestFallback = m;
                    largestFallbackSize = m.width as number;
                  }
                }
              }

              const sourceMetadatas: Record<string, ImageMetadata[]> = {};
              for (let i = 0; i < metadatas.length; i++) {
                const m = metadatas[i];
                const f = getFormat(m);
                // we don't need to create a source tag for the fallback format if there is
                // only a single image in that format
                if (f === fallbackFormat && fallbackFormatCount < 2) {
                  continue;
                }
                if (sourceMetadatas[f]) {
                  sourceMetadatas[f].push(m);
                } else {
                  sourceMetadatas[f] = [m];
                }
              }
              const sources: Record<string, string>[] = [];
              for (const [key, value] of Object.entries(sourceMetadatas)) {
                sources.push({
                  srcSet: value.map((meta) => `${meta.src} ${meta.width}w`).join(', '),
                  type: `image/${key}`,
                });
              }
              return {
                sources,
                img: {
                  src: largestFallback?.src as string,
                  width: largestFallback?.width as number,
                  height: largestFallback?.height as number,
                },
              };
            };
            return {
              ...builtins,
              jsx,
            };
          },
          defaultDirectives: (url) => {
            if (url.searchParams.has('jsx')) {
              // userOpts format
              const { format: userOptsImgFormat, ...userOptsImageOptimization } = userOpts?.imageOptimization?.jsxDirectives ?? {};
              // default format
              let format = 'webp';
              // image extname
              const extname = path.extname(url.pathname).slice(1);
              if (userOptsImgFormat) {
                if (typeof userOptsImgFormat === 'function') {
                  format = userOptsImgFormat(extname);
                } else {
                  format = userOptsImgFormat;
                }
              }
              const { jsx, ...params } = Object.fromEntries(url.searchParams.entries());
              return new URLSearchParams({
                format,
                quality: '75',
                w: '200;400;600;800;1200',
                withoutEnlargement: '',
                ...userOptsImageOptimization,
                ...params,
                as: 'jsx',
              });
            }
            return new URLSearchParams();
          },
        })
      )
      .catch((err) => {
        console.error('Error loading vite-imagetools, image imports are not available', err);
        return null;
      }),
    {
      name: 'qwik-city-image-jsx',
      load: {
        order: 'pre',
        handler: async (id) => {
          const { params, pathId } = parseId(id);
          const extension = path.extname(pathId).toLowerCase();
          if (extension === '.svg' && params.has('jsx')) {
            const code = await fs.promises.readFile(pathId, 'utf-8');
            return {
              code,
              moduleSideEffects: false,
            };
          }
        },
      },
      transform(code, id) {
        id = id.toLowerCase();
        const { params, pathId } = parseId(id);
        if (params.has('jsx')) {
          const extension = path.extname(pathId).toLowerCase();

          if (supportedExtensions.includes(extension)) {
            if (!code.includes('sources')) {
              this.error(`Image '${id}' could not be optimized to JSX`);
            }
            const index = code.indexOf('export default');
            return (
              code.slice(0, index) +
              `
  import { _jsxQ } from '@builder.io/qwik';
  const PROPS = {...img};
  export default function (props, key, _, dev) {
    if(!sources?.length) return null;
    if(sources.length < 2){
      // Single format directly returns the <img />
      return _jsxQ('img', {...{decoding: 'async', loading: 'lazy'}, ...props}, sources[0], undefined, 3, key, dev);
    }
    return _jsxQ('picture', null, null,
      [...sources.map((source) => _jsxQ('source', {...source}, null, undefined, 3, key, dev)),
      _jsxQ('img', {...{decoding: 'async', loading: 'lazy'}, ...props}, PROPS, undefined, 3, key, dev)]
    );
  }`
            );
          } else if (extension === '.svg') {
            const { svgAttributes } = optimizeSvg({ code, path: pathId }, userOpts);
            return `
  import { _jsxQ } from '@builder.io/qwik';
  const PROPS = ${JSON.stringify(svgAttributes)};
  export default function (props, key, _, dev) {
    return _jsxQ('svg', props, PROPS, undefined, 3, key, dev);
  }`;
          }
        }
        return null;
      },
    },
  ];
}

export function optimizeSvg(
  { code, path }: { code: string; path: string },
  userOpts?: QwikCityVitePluginOptions
) {
  const svgAttributes: Record<string, string> = {};
  const prefixIdsConfiguration = userOpts?.imageOptimization?.svgo?.prefixIds;
  const maybePrefixIdsPlugin: SVGOConfig['plugins'] =
    prefixIdsConfiguration !== false ? [{ name: 'prefixIds', params: prefixIdsConfiguration }] : [];

  const userPlugins =
    userOpts?.imageOptimization?.svgo?.plugins?.filter((plugin) => {
      if (
        plugin === 'preset-default' ||
        (typeof plugin === 'object' && plugin.name === 'preset-default')
      ) {
        console.warn(
          `You are trying to use the preset-default SVGO plugin. This plugin is already included by default, you can customize it through the defaultPresetOverrides option.`
        );
        return false;
      }

      if (plugin === 'prefixIds' || (typeof plugin === 'object' && plugin.name === 'prefixIds')) {
        console.warn(
          `You are trying to use the preset-default SVGO plugin. This plugin is already included by default, you can customize it through the prefixIds option.`
        );
        return false;
      }

      return true;
    }) || [];

  const data = optimize(code, {
    floatPrecision: userOpts?.imageOptimization?.svgo?.floatPrecision,
    multipass: userOpts?.imageOptimization?.svgo?.multipass,
    path: path,
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            removeViewBox: false,
            ...userOpts?.imageOptimization?.svgo?.defaultPresetOverrides,
          },
        },
      },
      {
        name: 'customPluginName',
        fn: () => {
          return {
            element: {
              exit: (node) => {
                if (node.name === 'svg') {
                  node.name = 'g';
                  Object.assign(svgAttributes, node.attributes);
                  node.attributes = {};
                }
              },
            },
          };
        },
      },
      ...maybePrefixIdsPlugin,
      ...userPlugins,
    ],
  }).data;

  svgAttributes.dangerouslySetInnerHTML = data.slice(3, -4);

  return {
    data,
    svgAttributes,
  };
}
