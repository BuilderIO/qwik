import type { SnapshotResult } from '../core/object/store';
import type { QwikManifest, QwikBundle, QwikSymbol, GlobalInjections } from '../optimizer/src';
import type { SymbolMapperFn } from '../optimizer/src/types';

/**
 * Partial Document used by Qwik Framework.
 *
 * A set of properties which the Qwik Framework expects to find on document.
 * @public
 */
export interface QwikDocument extends Document {}

/**
 * @public
 */
export interface SerializeDocumentOptions {
  manifest?: QwikManifest;
  symbolMapper?: SymbolMapperFn;
  url?: URL | string;
  html?: string;
  debug?: boolean;
}

/**
 * @alpha
 */
export interface PrefetchStrategy {
  implementation?: PrefetchImplementation;
  symbolsToPrefetch?: SymbolsToPrefetch;
}

/**
 * @alpha
 */
export type PrefetchImplementation =
  | 'link-prefetch-html'
  | 'link-prefetch'
  | 'link-preload-html'
  | 'link-preload'
  | 'link-modulepreload-html'
  | 'link-modulepreload'
  | 'worker-fetch'
  | 'none';

/**
 * auto: Prefetch all possible QRLs used by the document. Default
 *
 * @alpha
 */
export type SymbolsToPrefetch = 'auto' | ((opts: { manifest: QwikManifest }) => PrefetchResource[]);

/**
 * @alpha
 */
export interface PrefetchResource {
  url: string;
  imports: PrefetchResource[];
}

export { QwikManifest, QwikBundle, QwikSymbol, GlobalInjections };

/**
 * @public
 */
export interface RenderToStreamResult extends RenderResult {}

/**
 * @public
 */
export interface RenderToStringResult extends RenderResult {
  html: string;
}

/**
 * @public
 */
export interface RenderResult {
  prefetchResources: PrefetchResource[];
  snapshotResult: SnapshotResult | null;
  timing: {
    createDocument: number;
    render: number;
    snapshot: number;
    toString: number;
  };
}

export { SnapshotResult };

/**
 * @public
 */
export interface QwikLoaderOptions {
  events?: string[];
  include?: 'always' | 'never' | 'auto';
  position?: 'top' | 'bottom';
}

/**
 * @public
 */
export interface RenderOptions extends SerializeDocumentOptions {
  /**
   * Defaults to `true`
   */
  snapshot?: boolean;

  /**
   * Specifies the root of the JS files of the client build.
   * Setting a base, will cause the render of the `q:base` attribute in the `q:container` element.
   */
  base?: string;

  /**
   * Specifies if the Qwik Loader script is added to the document or not. Defaults to `{ include: true }`.
   */
  qwikLoader?: QwikLoaderOptions;

  prefetchStrategy?: PrefetchStrategy | null;

  /**
   * When set, the app is serialized into a fragment. And the returned html is not a complete document.
   * Defaults to `undefined`
   */
  fragmentTagName?: string;

  userContext?: Record<string, any>;
}

/**
 * @public
 */
export interface RenderToStringOptions extends RenderOptions {}

/**
 * @public
 */
export interface RenderToStreamOptions extends RenderOptions {
  stream: StreamWriter;
}

/**
 * @public
 */
export type StreamWriter = {
  write: (chunk: string) => void | boolean | Promise<void> | Promise<boolean>;
};

/**
 * @public
 */
export type RenderToString = (opts: RenderToStringOptions) => Promise<RenderToStringResult>;

/**
 * @public
 */
export type RenderToStream = (opts: RenderToStreamOptions) => Promise<RenderToStreamResult>;

/**
 * @public
 */
export type Render = RenderToString | RenderToStream;

export interface RenderDocument extends Document {}

export interface RenderDocumentUserContext {
  _qwikUserCtx?: Record<string, any>;
}
