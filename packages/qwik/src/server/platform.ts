import type { CorePlatform } from '@builder.io/qwik';
import { setPlatform } from '@builder.io/qwik';
import { getSymbolHash } from '../core/import/qrl-class';
import { logError } from '../core/util/log';
import type { SymbolMapper } from '../optimizer/src/types';
import type { SerializeDocumentOptions } from './types';

declare const require: (module: string) => Record<string, any>;

function createPlatform(
  document: any,
  opts: SerializeDocumentOptions,
  mapper: SymbolMapper | undefined
) {
  if (!document || (document as Document).nodeType !== 9) {
    throw new Error(`Invalid Document implementation`);
  }
  const mapperFn = opts.symbolMapper
    ? opts.symbolMapper
    : (symbolName: string) => {
        if (mapper) {
          const hash = getSymbolHash(symbolName);
          const result = mapper[hash];
          if (!result) {
            logError('Cannot resolve symbol', symbolName, 'in', mapper);
          }
          return result;
        }
      };

  const serverPlatform: CorePlatform = {
    isServer: true,
    async importSymbol(_element, qrl, symbolName) {
      let [modulePath] = String(qrl).split('#');
      if (!modulePath.endsWith('.js')) {
        modulePath += '.js';
      }
      const module = require(modulePath); // eslint-disable-line  @typescript-eslint/no-var-requires
      const symbol = module[symbolName];
      if (!symbol) {
        throw new Error(`Q-ERROR: missing symbol '${symbolName}' in module '${modulePath}'.`);
      }
      return symbol;
    },
    raf: () => {
      logError('server can not rerender');
      return Promise.resolve();
    },
    nextTick: (fn) => {
      return new Promise((resolve) => {
        // Do not use process.nextTick, as this will execute at same priority as promises.
        // We need to execute after promises.
        setTimeout(() => {
          resolve(fn());
        });
      });
    },
    chunkForSymbol(symbolName: string) {
      return mapperFn(symbolName, mapper);
    },
  };
  return serverPlatform;
}

/**
 * Applies NodeJS specific platform APIs to the passed in document instance.
 * @public
 */
export async function setServerPlatform(
  document: any,
  opts: SerializeDocumentOptions,
  mapper: SymbolMapper | undefined
) {
  const platform = createPlatform(document, opts, mapper);
  setPlatform(document, platform);
}
