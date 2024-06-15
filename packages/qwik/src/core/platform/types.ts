import type { ValueOrPromise } from '../util/types';

// <docs markdown="./readme.md#CorePlatform">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!!
// (edit ./readme.md#CorePlatform instead)
/**
 * Low-level API for platform abstraction.
 *
 * Different platforms (browser, node, service workers) may have different ways of handling things
 * such as `requestAnimationFrame` and imports. To make Qwik platform-independent Qwik uses the
 * `CorePlatform` API to access the platform API.
 *
 * `CorePlatform` also is responsible for importing symbols. The import map is different on the
 * client (browser) then on the server. For this reason, the server has a manifest that is used to
 * map symbols to javascript chunks. The manifest is encapsulated in `CorePlatform`, for this
 * reason, the `CorePlatform` can't be global as there may be multiple applications running at
 * server concurrently.
 *
 * This is a low-level API and there should not be a need for you to access this.
 *
 * @public
 */
// </docs>
export interface CorePlatform {
  // <docs markdown="./readme.md#CorePlatform.isServer">
  // !!DO NOT EDIT THIS COMMENT DIRECTLY!!!
  // (edit ./readme.md#CorePlatform.isServer instead)
  /**
   * True of running on the server platform.
   *
   * @returns True if we are running on the server (not the browser.)
   */
  // </docs>
  isServer: boolean;
  // <docs markdown="./readme.md#CorePlatform.importSymbol">
  // !!DO NOT EDIT THIS COMMENT DIRECTLY!!!
  // (edit ./readme.md#CorePlatform.importSymbol instead)
  /**
   * Retrieve a symbol value from QRL.
   *
   * Qwik needs to lazy load data and closures. For this Qwik uses QRLs that are serializable
   * references of resources that are needed. The QRLs contain all the information necessary to
   * retrieve the reference using `importSymbol`.
   *
   * Why not use `import()`? Because `import()` is relative to the current file, and the current
   * file is always the Qwik framework. So QRLs have additional information that allows them to
   * serialize imports relative to application base rather than the Qwik framework file.
   *
   * @param element - The element against which the `url` is resolved. Used to locate the container
   *   root and `q:base` attribute.
   * @param url - Relative URL retrieved from the attribute that needs to be resolved against the
   *   container `q:base` attribute.
   * @param symbol - The name of the symbol to import.
   * @returns A promise that resolves to the imported symbol.
   */
  // </docs>
  importSymbol: (
    containerEl: Element | undefined,
    url: string | URL | undefined | null,
    symbol: string
  ) => ValueOrPromise<any>;
  // <docs markdown="./readme.md#CorePlatform.raf">
  // !!DO NOT EDIT THIS COMMENT DIRECTLY!!!
  // (edit ./readme.md#CorePlatform.raf instead)
  /**
   * Perform operation on next request-animation-frame.
   *
   * @param fn - The function to call when the next animation frame is ready.
   */
  // </docs>
  raf: (fn: () => any) => Promise<any>;
  // <docs markdown="./readme.md#CorePlatform.nextTick">
  // !!DO NOT EDIT THIS COMMENT DIRECTLY!!!
  // (edit ./readme.md#CorePlatform.nextTick instead)
  /**
   * Perform operation on next tick.
   *
   * @param fn - The function to call when the tick is ready.
   */
  // </docs>
  nextTick: (fn: () => any) => Promise<any>;
  // <docs markdown="./readme.md#CorePlatform.chunkForSymbol">
  // !!DO NOT EDIT THIS COMMENT DIRECTLY!!!
  // (edit ./readme.md#CorePlatform.chunkForSymbol instead)
  /**
   * Retrieve chunk name for the symbol.
   *
   * When the application is running on the server the symbols may be imported from different files
   * (as server build is typically a single javascript chunk.) For this reason, it is necessary to
   * convert the chunks from server format to client (browser) format. This is done by looking up
   * symbols (which are globally unique) in the manifest. (Manifest is the mapping of symbols to the
   * client chunk names.)
   *
   * @param symbolName - Resolve `symbolName` against the manifest and return the chunk that
   *   contains the symbol.
   */
  // </docs>
  chunkForSymbol: (
    symbolName: string,
    chunk: string | null,
    parent?: string
  ) => readonly [symbol: string, chunk: string] | undefined;
}

export interface CorePlatformServer extends CorePlatform {
  isServer: true;
}
