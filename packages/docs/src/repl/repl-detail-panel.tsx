import { ReplConsole } from './repl-console';
import { ReplOptions } from './repl-options';
import { ReplTabButton } from './repl-tab-button';
import { ReplTabButtons } from './repl-tab-buttons';
import type { ReplAppInput, ReplStore } from './types';

export const ReplDetailPanel = ({ input, store }: ReplDetailPanelProps) => {
  return (
    <div class="repl-panel repl-detail-panel">
      <ReplTabButtons>
        <ReplTabButton
          text="Console"
          isActive={store.selectedOutputDetail === 'console'}
          onClick$={async () => {
            store.selectedOutputDetail = 'console';
          }}
        />
        <ReplTabButton
          text="Options"
          isActive={store.selectedOutputDetail === 'options'}
          onClick$={async () => {
            store.selectedOutputDetail = 'options';
          }}
        />
      </ReplTabButtons>

      <div class="repl-tab">
        {store.selectedOutputDetail === 'console' ? <ReplConsole store={store} /> : null}
        {store.selectedOutputDetail === 'options' ? (
          <ReplOptions input={input} versions={store.versions} />
        ) : null}
      </div>
    </div>
  );
};

interface ReplDetailPanelProps {
  input: ReplAppInput;
  store: ReplStore;
}
