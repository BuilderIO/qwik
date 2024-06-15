import type { SerializeDocumentOptions } from './types';
import { setPlatform } from '@builder.io/qwik';
import type { ResolvedManifest } from '@builder.io/qwik/optimizer';
import type { CorePlatformServer } from '../core/platform/types';

declare const require: (module: string) => Record<string, any>;

// Make sure this value is same as value in `qrl-class.ts`
const SYNC_QRL = '<sync>';

export function createPlatform(
  opts: SerializeDocumentOptions,
  resolvedManifest: ResolvedManifest | undefined
) {
  const mapper = resolvedManifest?.mapper;
  const mapperFn = opts.symbolMapper
    ? opts.symbolMapper
    : (symbolName: string, _chunk: any, parent?: string): readonly [string, string] | undefined => {
        if (mapper) {
          const hash = getSymbolHash(symbolName);
          const result = mapper[hash];
          if (!result) {
            if (hash === SYNC_QRL) {
              return [hash, ''] as const;
            }
            const isRegistered = (globalThis as any).__qwik_reg_symbols?.has(hash);
            if (isRegistered) {
              return [symbolName, '_'] as const;
            }
            if (parent) {
              // In dev mode, SSR may need to refer to a symbol that wasn't built yet on the client
              return [symbolName, `${parent}?qrl=${symbolName}`] as const;
            }
            console.error('Cannot resolve symbol', symbolName, 'in', mapper, parent);
          }
          return result;
        }
      };

  const serverPlatform: CorePlatformServer = {
    isServer: true,
    async importSymbol(_containerEl, url, symbolName) {
      const hash = getSymbolHash(symbolName);
      const regSym = (globalThis as any).__qwik_reg_symbols?.get(hash);
      if (regSym) {
        return regSym;
      }

      // eslint-disable-next-line prefer-const
      let [modulePath, attr] = String(url).split('#')[0];
      if (!modulePath.endsWith('.js')) {
        modulePath += '.js';
      }
      let module = require(modulePath); // eslint-disable-line  @typescript-eslint/no-var-requires
      if (attr) {
        module = module[attr];
      }
      if (!(symbolName in module)) {
        throw new Error(`Q-ERROR: missing symbol '${symbolName}' in module '${url}'.`);
      }
      return module[symbolName];
    },
    raf: () => {
      console.error('server can not rerender');
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
    chunkForSymbol(symbolName: string, _chunk, parent) {
      return mapperFn(symbolName, mapper, parent);
    },
  };
  return serverPlatform;
}

/** Applies NodeJS specific platform APIs to the passed in document instance. */
export async function setServerPlatform(
  opts: SerializeDocumentOptions,
  manifest: ResolvedManifest | undefined
) {
  const platform = createPlatform(opts, manifest);
  setPlatform(platform);
}

export const getSymbolHash = (symbolName: string) => {
  const index = symbolName.lastIndexOf('_');
  if (index > -1) {
    return symbolName.slice(index + 1);
  }
  return symbolName;
};
