export interface BuildContext {
  rootDir: string;
  opts: NormalizedPluginOptions;
  routes: BuildRoute[];
  fallbackRoutes: BuildFallbackRoute[];
  layouts: BuildLayout[];
  entries: BuildEntry[];
  menus: BuildMenu[];
  frontmatter: Map<string, string[]>;
  diagnostics: Diagnostic[];
  target: 'ssr' | 'client';
  isDevServer: boolean;
  isDevServerClientOnly: boolean;
}

export interface Diagnostic {
  type: 'error' | 'warn';
  message: string;
}

export interface RouteSourceFile {
  type: 'page' | 'endpoint' | 'layout' | 'entry' | 'menu' | '404' | '500';
  dirPath: string;
  dirName: string;
  filePath: string;
  fileName: string;
  ext: string;
}

export interface BuildRoute {
  type: 'page' | 'endpoint';
  /**
   * Unique id built from its relative file system path
   */
  id: string;
  /**
   * Local file system path
   */
  filePath: string;
  /**
   * URL Pathname
   */
  pathname: string;
  pattern: RegExp;
  paramNames: string[];
  layouts: BuildLayout[];
}

export interface BuildFallbackRoute extends BuildRoute {
  status: '404' | '500';
}

export interface ParsedLayoutId {
  layoutType: 'top' | 'nested';
  layoutName: string;
}

export interface BuildLayout extends ParsedLayoutId {
  filePath: string;
  dirPath: string;
  id: string;
}

export interface BuildEntry {
  chunkFileName: string;
  filePath: string;
}

export interface BuildMenu {
  pathname: string;
  filePath: string;
}

export interface ParsedMenuItem {
  text: string;
  href?: string;
  items?: ParsedMenuItem[];
}

/**
 * @alpha
 */
export interface PluginOptions {
  /**
   * Directory of the `routes`. Defaults to `src/routes`.
   */
  routesDir?: string;
  /**
   * Ensure a trailing slash ends page urls. Defaults to `false`.
   */
  trailingSlash?: boolean;
  /**
   * MDX Options https://mdxjs.com/
   */
  mdx?: any;
}

export interface NormalizedPluginOptions extends Required<PluginOptions> {}

export interface MarkdownAttributes {
  [name: string]: string;
}
