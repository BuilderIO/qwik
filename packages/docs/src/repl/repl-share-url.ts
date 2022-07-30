import { BUILD_MODE_OPTIONS, ENTRY_STRATEGY_OPTIONS } from './repl-options';
// import { compressSync, decompressSync, gzipSync, strFromU8, strToU8 } from 'fflate';

export const parsePlaygroundShareUrl = (shareable: string) => {
  if (typeof shareable === 'string' && shareable.length > 0) {
    try {
      const params = new URLSearchParams(shareable);
      const data: PlaygroundShareUrl = {
        version: '',
        buildMode: 'development',
        entryStrategy: 'hook',
        files: [],
      };

      const version = params.get('version')!;
      if (typeof version === 'string' && version.split('.').length > 2) {
        data.version = version;
      }

      const buildMode = params.get('buildMode')!;
      if (BUILD_MODE_OPTIONS.includes(buildMode)) {
        data.buildMode = buildMode;
      }

      const entryStrategy = params.get('entryStrategy')!;
      if (ENTRY_STRATEGY_OPTIONS.includes(entryStrategy)) {
        data.entryStrategy = entryStrategy;
      }

      const filesBase64 = params.get('files')!;
      if (typeof filesBase64 === 'string') {
        const encoded = atob(filesBase64);
        const filesStr = decodeURIComponent(encoded);
        // const compressedUint8Array = strToU8(compressedString);
        // const filesBuf = decompressSync(compressedUint8Array);
        // const filesStr = strFromU8(filesBuf);
        const files = JSON.parse(filesStr);

        if (Array.isArray(files)) {
          data.files = files.filter(
            (f) => typeof f.code === 'string' && typeof f.path === 'string'
          );
          if (files.length > 0) {
            return data;
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  }
};

export const createPlaygroundShareUrl = (data: PlaygroundShareUrl) => {
  const params = new URLSearchParams();
  params.set('version', data.version);
  params.set('buildMode', data.buildMode);
  params.set('entryStrategy', data.entryStrategy);

  const filesStr = JSON.stringify(data.files);
  // const filesBuf = strToU8(filesStr);
  // const compressedUint8Array = compressSync(filesBuf);
  // const compressedString = strFromU8(compressedUint8Array);
  const encodedURI = encodeURIComponent(filesStr);
  const filesBase64 = btoa(encodedURI);
  params.set('files', filesBase64);

  return `/playground#${params.toString()}`;
};

interface PlaygroundShareUrl {
  version: any;
  buildMode: any;
  entryStrategy: any;
  files: any[];
}
