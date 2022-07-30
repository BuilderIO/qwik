/* eslint-disable no-console */
import type { ReplInputOptions, ReplResult } from '../types';
import { appBundleClient } from './app-bundle-client';
import { appBundleSsr } from './app-bundle-ssr';
import { appSsrHtml } from './app-ssr-html';
import { loadDependencies } from './repl-dependencies';
import { sendMessageToReplServer } from './repl-messenger';
import { QWIK_REPL_RESULT_CACHE } from './repl-constants';

export const appUpdate = async (clientId: string, options: ReplInputOptions) => {
  const result: ReplResult = {
    type: 'result',
    clientId,
    buildId: options.buildId,
    html: '',
    transformedModules: [],
    clientBundles: [],
    manifest: undefined,
    ssrModules: [],
    diagnostics: [],
    events: [],
  };

  try {
    await loadDependencies(options);

    const cache = await caches.open(QWIK_REPL_RESULT_CACHE);
    await appBundleClient(options, cache, result);
    await appBundleSsr(options, result);
    await appSsrHtml(options, cache, result);
  } catch (e: any) {
    result.diagnostics.push({
      scope: 'runtime',
      message: String(e.stack || e),
      category: 'error',
      file: '',
      highlights: [],
      suggestions: null,
      code: 'runtime error',
    });
    console.error(e);
  }

  await sendMessageToReplServer(result);
};
