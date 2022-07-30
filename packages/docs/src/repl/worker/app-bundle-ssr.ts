/* eslint-disable no-console */
import type { InputOptions } from 'rollup';
import type { Diagnostic, QwikRollupPluginOptions } from '@builder.io/qwik/optimizer';
import type { ReplInputOptions, ReplResult } from '../types';
import { replCss, replResolver } from './repl-plugins';
import { getInputs, getOutput } from './app-bundle-client';
import type { QwikWorkerGlobal } from './repl-service-worker';

export const appBundleSsr = async (options: ReplInputOptions, result: ReplResult) => {
  const start = performance.now();

  const qwikRollupSsrOpts: QwikRollupPluginOptions = {
    target: 'ssr',
    buildMode: options.buildMode,
    debug: options.debug,
    srcInputs: getInputs(options),
    entryStrategy: { type: 'inline' },
    manifestInput: result.manifest,
  };

  console.debug('ssr opts', qwikRollupSsrOpts);

  const entry = options.srcInputs.find((i) => i.path.endsWith('entry.server.tsx'));
  if (!entry) {
    throw new Error(`Missing SSR entry "entry.server.tsx"`);
  }

  const rollupInputOpts: InputOptions = {
    input: entry.path,
    cache: self.rollupCache,
    plugins: [
      replCss(options),
      self.qwikOptimizer?.qwikRollup(qwikRollupSsrOpts),
      replResolver(options, 'ssr'),
    ],
    onwarn(warning) {
      const diagnostic: Diagnostic = {
        scope: 'rollup-ssr',
        code: warning.code ?? null,
        message: warning.message,
        category: 'warning',
        highlights: [],
        file: warning.id || '',
        suggestions: null,
      };
      const loc = warning.loc;
      if (loc && loc.file) {
        diagnostic.file = loc.file;
        diagnostic.highlights.push({
          startCol: loc.column,
          endCol: loc.column + 1,
          startLine: loc.line,
          endLine: loc.line + 1,
          lo: 0,
          hi: 0,
        });
      }
      result.diagnostics.push(diagnostic);
    },
  };

  const bundle = await self.rollup?.rollup(rollupInputOpts);
  if (bundle) {
    self.rollupCache = bundle.cache;

    const generated = await bundle.generate({
      format: 'cjs',
      inlineDynamicImports: true,
      sourcemap: false,
    });

    result.ssrModules = generated.output.map(getOutput);

    result.ssrModules.push({
      path: 'q-manifest.json',
      code: JSON.stringify(result.manifest, null, 2),
    });
  }

  result.events.push({
    kind: 'console-log',
    scope: 'build',
    start,
    end: performance.now(),
    message: ['Build SSR'],
  });
};

declare const self: QwikWorkerGlobal;
