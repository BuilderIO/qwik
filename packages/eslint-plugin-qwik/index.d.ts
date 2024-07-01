// inspired by https://github.com/typescript-eslint/typescript-eslint/commit/8ef5f4bffcf0904a28ada92a224a378d309407a4

import type { ClassicConfig, FlatConfig } from '@typescript-eslint/utils/ts-eslint';

import type { rules, configs } from './index';

declare const cjsExport: {
  configs: Record<keyof typeof configs, ClassicConfig.Config>;
  meta: FlatConfig.PluginMeta;
  rules: typeof rules;
};
export = cjsExport;
