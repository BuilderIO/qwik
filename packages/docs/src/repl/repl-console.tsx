import { component$, Host, jsx } from '@builder.io/qwik';
import type { ReplEvent, ReplStore } from './types';

export interface ReplConsoleProps {
  store: ReplStore;
}
export const ReplConsole = component$(({ store }: ReplConsoleProps) => {
  return (
    <Host class="detail-logs">
      {store.events.map((ev) => (
        <ReplLog log={ev} />
      ))}
    </Host>
  );
});

export function ReplLog({ log }: { log: ReplEvent }) {
  let elapsed = '';
  if (log.end) {
    elapsed = renderElapsed(log.end - log.start);
  }
  if (log.scope === 'build') {
    return null;
  }
  switch (log.kind) {
    case 'pause':
      return (
        <div class="line paused">
          <div class="content">🔴 Paused in server</div>
        </div>
      );
    case 'resume':
      return (
        <div class="line resumed">
          <div class="content">🟢 Resumed in client</div>
          {elapsed ? <div class="elapsed">{elapsed}</div> : null}
        </div>
      );
    case 'console-log':
    case 'console-debug':
    case 'console-error':
    case 'console-warn':
      return (
        <div class={`log ${log.kind}`}>
          <div class={`platform ${log.scope}`}>{log.scope}</div>
          <div class="content">{renderConsoleMessage(log.message)}</div>
          {elapsed ? <div class="elapsed">{elapsed}</div> : null}
        </div>
      );
    case 'prefetch':
      return (
        <div class={`log ${log.kind}`}>
          <div class={`platform ${log.scope}`}>{log.scope}</div>
          <div class="content">{log.message}</div>
        </div>
      );
    case 'client-module':
      return (
        <div class={`log ${log.kind}`}>
          <div class={`platform ${log.scope}`}>{log.scope}</div>
          <div class="content">{basename(log.message.join(' '))}</div>
        </div>
      );
  }
  return null;
}

const styleprefix = '%c';
function renderConsoleMessage(texts: string[]) {
  const nodes = [];
  for (let i = 0; i < texts.length; i++) {
    const msg = texts[i];
    if (msg.startsWith(styleprefix)) {
      nodes.push(jsx('span', { style: texts[i + 1], children: msg.slice(styleprefix.length) }));
      i++;
    } else {
      nodes.push(' ' + msg);
    }
  }
  return nodes;
}

function basename(str: string) {
  const index = str.lastIndexOf('/');
  if (index > 0) {
    return str.slice(index + 1);
  }
  return str;
}

function renderElapsed(millis: number) {
  if (millis < 1000) {
    return `${millis.toFixed(1)}ms`;
  }
  return `${(millis / 1000).toFixed(2)}s`;
}
