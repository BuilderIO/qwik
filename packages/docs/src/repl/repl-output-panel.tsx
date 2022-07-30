import { mutable } from '@builder.io/qwik';
import { CodeBlock } from '../components/code-block/code-block';
import { ReplOutputModules } from './repl-output-modules';
import { ReplOutputSymbols } from './repl-output-symbols';
import { ReplTabButton } from './repl-tab-button';
import { ReplTabButtons } from './repl-tab-buttons';
import type { ReplAppInput, ReplStore } from './types';

export const ReplOutputPanel = ({ input, store }: ReplOutputPanelProps) => {
  const diagnosticsLen = store.diagnostics.length + store.monacoDiagnostics.length;

  return (
    <div class="repl-panel repl-output-panel">
      <ReplTabButtons>
        <ReplTabButton
          text="App"
          isActive={store.selectedOutputPanel === 'app'}
          onClick$={async () => {
            store.selectedOutputPanel = 'app';
          }}
        />

        {store.enableHtmlOutput ? (
          <ReplTabButton
            text="HTML"
            isActive={store.selectedOutputPanel === 'html'}
            onClick$={async () => {
              store.selectedOutputPanel = 'html';
            }}
          />
        ) : null}

        {store.enableClientOutput ? (
          <ReplTabButton
            text="Symbols"
            isActive={store.selectedOutputPanel === 'symbols'}
            onClick$={async () => {
              store.selectedOutputPanel = 'symbols';
            }}
          />
        ) : null}

        {store.enableClientOutput ? (
          <ReplTabButton
            text="Client Bundles"
            isActive={store.selectedOutputPanel === 'clientBundles'}
            onClick$={async () => {
              store.selectedOutputPanel = 'clientBundles';
            }}
          />
        ) : null}

        {store.enableSsrOutput ? (
          <ReplTabButton
            text="SSR Module"
            isActive={store.selectedOutputPanel === 'serverModules'}
            onClick$={async () => {
              store.selectedOutputPanel = 'serverModules';
            }}
          />
        ) : null}

        <ReplTabButton
          text={`Diagnostics${diagnosticsLen > 0 ? ` (${diagnosticsLen})` : ``}`}
          cssClass={{ 'repl-tab-diagnostics': true }}
          isActive={store.selectedOutputPanel === 'diagnostics'}
          onClick$={async () => {
            store.selectedOutputPanel = 'diagnostics';
          }}
        />
      </ReplTabButtons>

      <div
        class={{
          'repl-tab': true,
          'repl-mode-production': input.buildMode === 'production',
          'repl-mode-development': input.buildMode !== 'production',
        }}
      >
        <div
          class={{
            'output-result': true,
            'output-app': true,
            'output-app-active': store.selectedOutputPanel === 'app',
          }}
        >
          {store.isLoading ? (
            <svg class="repl-spinner" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="24"
                stroke-width="4"
                stroke-dasharray="37.69911184307752 37.69911184307752"
                fill="none"
                stroke-linecap="round"
              />
            </svg>
          ) : null}
          <iframe class="repl-server" src={store.serverUrl} />
        </div>

        {store.selectedOutputPanel === 'html' ? (
          <div class="output-result output-html">
            <CodeBlock language="markup" code={mutable(store.html)} theme="light" />
          </div>
        ) : null}

        {store.selectedOutputPanel === 'symbols' ? (
          <ReplOutputSymbols outputs={store.transformedModules} />
        ) : null}

        {store.selectedOutputPanel === 'clientBundles' ? (
          <ReplOutputModules headerText="/build/" outputs={store.clientBundles} />
        ) : null}

        {store.selectedOutputPanel === 'serverModules' ? (
          <ReplOutputModules headerText="/server/" outputs={store.ssrModules} />
        ) : null}

        {store.selectedOutputPanel === 'diagnostics' ? (
          <div class="output-result output-diagnostics">
            {diagnosticsLen === 0 ? (
              <p class="no-diagnostics">- No Reported Diagnostics -</p>
            ) : (
              [...store.diagnostics, ...store.monacoDiagnostics].map((d) => <p>{d.message}</p>)
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

interface ReplOutputPanelProps {
  input: ReplAppInput;
  store: ReplStore;
}
