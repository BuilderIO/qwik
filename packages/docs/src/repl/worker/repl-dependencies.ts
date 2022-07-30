/* eslint-disable no-console */
import type { ReplInputOptions } from '../types';
import {
  PRETTIER_VERSION,
  QWIK_PKG_NAME,
  QWIK_REPL_DEPS_CACHE,
  ROLLUP_VERSION,
  TERSER_VERSION,
} from './repl-constants';
import type { QwikWorkerGlobal } from './repl-service-worker';

export const depResponse = async (
  cache: Cache,
  pkgName: string,
  pkgVersion: string,
  pkgPath: string
) => {
  const req = getNpmCdnRequest(pkgName, pkgVersion, pkgPath);
  const cachedRes = await cache.match(req);
  if (cachedRes) {
    return cachedRes;
  }
  const fetchRes = await fetch(req);
  if (fetchRes.ok) {
    if (!req.url.includes('localhost')) {
      await cache.put(req, fetchRes.clone());
    }
    return fetchRes;
  }
};

const exec = async (cache: Cache, pkgName: string, pkgVersion: string, pkgPath: string) => {
  const res = await depResponse(cache, pkgName, pkgVersion, pkgPath);
  if (res) {
    console.debug(`Run: ${res.url}`);
    const run = new Function(await res.clone().text());
    run();
  } else {
    throw new Error(`Unable to run: ${getNpmCdnUrl(pkgName, pkgVersion, pkgPath)}`);
  }
};

export const loadDependencies = async (options: ReplInputOptions) => {
  const version = options.version;

  const cache = await caches.open(QWIK_REPL_DEPS_CACHE);

  await Promise.all([
    depResponse(cache, QWIK_PKG_NAME, version, '/core.cjs'),
    depResponse(cache, QWIK_PKG_NAME, version, '/core.mjs'),
    depResponse(cache, QWIK_PKG_NAME, version, '/core.min.mjs'),
    depResponse(cache, QWIK_PKG_NAME, version, '/optimizer.cjs'),
    depResponse(cache, QWIK_PKG_NAME, version, '/server.cjs'),
    depResponse(cache, 'rollup', ROLLUP_VERSION, '/dist/rollup.browser.js'),
    depResponse(cache, 'prettier', PRETTIER_VERSION, '/standalone.js'),
    depResponse(cache, 'prettier', PRETTIER_VERSION, '/parser-html.js'),
  ]);

  if (!isSameQwikVersion(self.qwikCore?.version, version)) {
    await exec(cache, QWIK_PKG_NAME, version, '/core.cjs');
    if (self.qwikCore) {
      console.debug(`Loaded @builder.io/qwik: ${self.qwikCore.version}`);
    } else {
      throw new Error(`Unable to load @builder.io/qwik ${version}`);
    }
  }

  if (!isSameQwikVersion(self.qwikOptimizer?.versions.qwik, version)) {
    await exec(cache, QWIK_PKG_NAME, version, '/optimizer.cjs');
    if (self.qwikOptimizer) {
      console.debug(`Loaded @builder.io/qwik/optimizer: ${self.qwikOptimizer.versions.qwik}`);
    } else {
      throw new Error(`Unable to load @builder.io/qwik/optimizer ${version}`);
    }
  }

  if (!isSameQwikVersion(self.qwikServer?.versions.qwik, version)) {
    await exec(cache, QWIK_PKG_NAME, version, '/server.cjs');
    if (self.qwikServer) {
      console.debug(`Loaded @builder.io/qwik/server: ${self.qwikServer.versions.qwik}`);
    } else {
      throw new Error(`Unable to load @builder.io/qwik/server ${version}`);
    }
  }

  if (self.rollup?.VERSION !== ROLLUP_VERSION) {
    await exec(cache, 'rollup', ROLLUP_VERSION, '/dist/rollup.browser.js');
    if (self.rollup) {
      console.debug(`Loaded rollup: ${self.rollup!.VERSION}`);
    } else {
      throw new Error(`Unable to load rollup ${ROLLUP_VERSION}`);
    }
  }

  if (self.prettier?.version !== PRETTIER_VERSION) {
    await exec(cache, 'prettier', PRETTIER_VERSION, '/standalone.js');
    await exec(cache, 'prettier', PRETTIER_VERSION, '/parser-html.js');
    if (self.prettier) {
      console.debug(`Loaded prettier: ${self.prettier!.version}`);
    } else {
      throw new Error(`Unable to load prettier ${PRETTIER_VERSION}`);
    }
  }

  if (options.buildMode === 'production' && !self.Terser) {
    await depResponse(cache, 'terser', TERSER_VERSION, '/dist/bundle.min.js');
    await exec(cache, 'terser', TERSER_VERSION, '/dist/bundle.min.js');
    if (self.Terser) {
      console.debug(`Loaded terser: ${TERSER_VERSION}`);
    } else {
      throw new Error(`Unable to load terser ${TERSER_VERSION}`);
    }
  }

  // clear out old cache
  // no need to wait
  cache.keys().then((keys) => {
    if (keys.length > 30) {
      for (let i = 0; i < 5; i++) {
        cache.delete(keys[i]);
      }
    }
  });
};

const getNpmCdnRequest = (pkgName: string, pkgVersion: string, pkgPath: string) => {
  return new Request(getNpmCdnUrl(pkgName, pkgVersion, pkgPath));
};

const getNpmCdnUrl = (pkgName: string, pkgVersion: string, pkgPath: string) => {
  return `https://cdn.jsdelivr.net/npm/${pkgName}${pkgVersion ? '@' + pkgVersion : ''}${pkgPath}`;
};

const isSameQwikVersion = (a: string | undefined, b: string) => {
  if (!a || (a !== b && !a.includes('-dev') && !b.includes('-dev'))) {
    return false;
  }
  return true;
};

declare const self: QwikWorkerGlobal;
