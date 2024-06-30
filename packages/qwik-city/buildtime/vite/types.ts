import type { CompileOptions } from '@mdx-js/mdx';
import type { MdxTransform } from '../markdown/mdx';
import type { BuildContext, BuildEntry, BuildRoute, PluginOptions, MdxPlugins } from '../types';
import type { Config as SVGOConfig } from 'svgo';
import type { BuiltinsWithOptionalParams as SVGOBuiltinPluginsWithOptionalParams } from 'svgo/plugins/plugins-types';

/** @public */
export interface ImageOptimizationOptions {
  jsxDirectives?: {
    quality?: `${number}`;
    /**
     * Specifies the format(s) of the image. You can set multiple formats by separating them with a semicolon (`;`).
     * Alternatively, you can pass a function that takes the original format extension name as a parameter and returns the desired format.
     * 
     * @example
     * // Setting multiple formats
     * format: "avif;webp"
     * 
     * @example
     * // Using a function to determine the format
     * format: (extname: string) => `avif;webp;${extname}`
     */
    format?: string | ((extname: string) => string);
    w?: string;
    h?: string;
    [key: string]: any;
  };
  svgo?: Pick<SVGOConfig, 'floatPrecision' | 'multipass' | 'plugins'> & {
    defaultPresetOverrides?: SVGOBuiltinPluginsWithOptionalParams['preset-default']['overrides'];
    prefixIds?: SVGOBuiltinPluginsWithOptionalParams['prefixIds'] | false;
  };
  enabled?: boolean | 'only-production';
}

/** @public */
export interface QwikCityVitePluginOptions extends Omit<PluginOptions, 'basePathname'> {
  mdxPlugins?: MdxPlugins;
  mdx?: MdxOptions;
  platform?: Record<string, unknown>;
  imageOptimization?: ImageOptimizationOptions;
}

/** @public */

export type MdxOptions = CompileOptions;

export interface PluginContext {
  buildCtx: BuildContext | null;
  rootDir: string;
  cityPlanCode: string | null;
  mdxTransform: MdxTransform | null;
}

/** @public */
export interface QwikCityPlugin {
  name: 'vite-plugin-qwik-city';
  api: QwikCityPluginApi;
}

/** @public */
export interface QwikCityPluginApi {
  getBasePathname: () => string;
  getRoutes: () => BuildRoute[];
  getServiceWorkers: () => BuildEntry[];
}
