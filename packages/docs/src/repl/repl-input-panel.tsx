import type { PropFunction } from '@builder.io/qwik';
import { Editor } from './editor';
import { ReplCommands } from './repl-commands';
import { ReplTabButton } from './repl-tab-button';
import { ReplTabButtons } from './repl-tab-buttons';
import type { ReplAppInput, ReplStore } from './types';

export const ReplInputPanel = ({
  input,
  store,
  onInputChange$,
  onInputDelete$,
  enableCopyToPlayground,
  enableDownload,
  enableInputDelete,
}: ReplInputPanelProps) => {
  return (
    <div class="repl-panel repl-input-panel">
      <ReplTabButtons>
        {input.files.map((f) =>
          f.hidden ? null : (
            <ReplTabButton
              text={formatFilePath(f.path)}
              isActive={store.selectedInputPath === f.path}
              onClick$={async () => {
                store.selectedInputPath = f.path;
              }}
              onClose$={async () => {
                const shouldDelete = confirm(`Are you sure you want to delete "${f.path}"?`);
                if (shouldDelete) {
                  onInputDelete$(f.path);
                }
              }}
              enableInputDelete={enableInputDelete}
            />
          )
        )}
        <ReplCommands
          input={input}
          enableCopyToPlayground={enableCopyToPlayground}
          enableDownload={enableDownload}
        />
      </ReplTabButtons>

      <div class="repl-tab">
        <Editor
          input={input}
          onChange$={onInputChange$}
          store={store}
          ariaLabel="File Input"
          lineNumbers="on"
          wordWrap="off"
        />
      </div>
    </div>
  );
};

const formatFilePath = (path: string) => {
  const parts = path.split('/');
  return parts[parts.length - 1];
};

interface ReplInputPanelProps {
  input: ReplAppInput;
  store: ReplStore;
  onInputChange$: PropFunction<(path: string, code: string) => void>;
  onInputDelete$: PropFunction<(path: string) => void>;
  enableDownload?: boolean;
  enableCopyToPlayground?: boolean;
  enableInputDelete?: boolean;
}
