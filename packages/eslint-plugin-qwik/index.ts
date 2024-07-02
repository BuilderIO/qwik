import { jsxAtag } from './src/jsxAtag';
import { jsxImg } from './src/jsxImg';
import { jsxKey } from './src/jsxKey';
import { jsxNoScriptUrl } from './src/jsxNoScriptUrl';
import { loaderLocation } from './src/loaderLocation';
import { noReactProps } from './src/noReactProps';
import { noUseVisibleTask } from './src/noUseVisibleTask';
import { preferClasslist } from './src/preferClasslist';
import { unusedServer } from './src/unusedServer';
import { useMethodUsage } from './src/useMethodUsage';
import { validLexicalScope } from './src/validLexicalScope';

export const rules = {
  'use-method-usage': useMethodUsage,
  'valid-lexical-scope': validLexicalScope,
  'loader-location': loaderLocation,
  'no-react-props': noReactProps,
  'prefer-classlist': preferClasslist,
  'jsx-no-script-url': jsxNoScriptUrl,
  'jsx-key': jsxKey,
  'unused-server': unusedServer,
  'jsx-img': jsxImg,
  'jsx-a': jsxAtag,
  'no-use-visible-task': noUseVisibleTask,
  'invalid-sync-closure':noSyncClosure,
};

export const configs = {
  recommended: {
    plugins: ['qwik'],
    rules: {
      'qwik/use-method-usage': 'error',
      'qwik/valid-lexical-scope': 'error',
      'qwik/no-react-props': 'error',
      'qwik/prefer-classlist': 'warn',
      'qwik/jsx-no-script-url': 'warn',
      'qwik/loader-location': 'warn',
      'qwik/jsx-key': 'warn',
      'qwik/unused-server': 'error',
      'qwik/jsx-img': 'warn',
      'qwik/jsx-a': 'warn',
      'qwik/no-use-visible-task': 'warn',
      'qwik/invalid-sync-closure': 'warn',
    },
  },
  strict: {
    plugins: ['qwik'],
    rules: {
      'qwik/valid-lexical-scope': 'error',
      'qwik/use-method-usage': 'error',
      'qwik/loader-location': 'error',
      'qwik/no-react-props': 'error',
      'qwik/prefer-classlist': 'error',
      'qwik/jsx-no-script-url': 'error',
      'qwik/jsx-key': 'error',
      'qwik/unused-server': 'error',
      'qwik/jsx-img': 'error',
      'qwik/jsx-a': 'error',
      'qwik/no-use-visible-task': 'warn',
      'qwik/invalid-sync-closure': 'warn',
    },
  },
};
