import type { ReplResult, ReplStore } from './types';

export const updateReplOutput = async (store: ReplStore, result: ReplResult) => {
  store.diagnostics = result.diagnostics;

  if (store.diagnostics.length === 0) {
    store.html = result.html;
    store.transformedModules = result.transformedModules;
    store.clientBundles = result.clientBundles;
    store.ssrModules = result.ssrModules;
    store.events = result.events;

    if (store.selectedOutputPanel === 'diagnostics' && store.monacoDiagnostics.length === 0) {
      store.selectedOutputPanel = 'app';
    }
  }
};
