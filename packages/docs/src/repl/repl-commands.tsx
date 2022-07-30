import { createPlaygroundShareUrl } from './repl-share-url';
import type { ReplAppInput } from './types';

export const ReplCommands = ({
  input,
  enableCopyToPlayground,
  enableDownload,
}: ReplCommandProps) => {
  return (
    <div class="repl-commands">
      {enableCopyToPlayground ? (
        <button
          onClick$={() => {
            location.href = createPlaygroundShareUrl(input);
          }}
          type="button"
          title="Copy To Playground"
          aria-label="Copy To Playground"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <rect
              x="128"
              y="128"
              width="336"
              height="336"
              rx="57"
              ry="57"
              fill="none"
              stroke="currentColor"
              stroke-linejoin="round"
              stroke-width="32"
            />
            <path
              d="M383.5 128l.5-24a56.16 56.16 0 00-56-56H112a64.19 64.19 0 00-64 64v216a56.16 56.16 0 0056 56h24"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="32"
            />
          </svg>
        </button>
      ) : null}

      {/* {enableDownload ? (
        <button type="button" title="Download" aria-label="Download">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="32"
              d="M160 368L32 256l128-112M352 368l128-112-128-112M192 288.1l64 63.9 64-63.9M256 160v176.03"
            />
          </svg>
        </button>
      ) : null} */}
    </div>
  );
};

interface ReplCommandProps {
  input: ReplAppInput;
  enableCopyToPlayground?: boolean;
  enableDownload?: boolean;
}
