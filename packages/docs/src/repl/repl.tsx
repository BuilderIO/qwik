/* eslint-disable no-console */
import {
  component$,
  noSerialize,
  useStyles$,
  useStore,
  useTask$,
  useVisibleTask$,
  $,
} from '@builder.io/qwik';
import { ReplInputPanel } from './repl-input-panel';
import { ReplOutputPanel } from './repl-output-panel';
import styles from './repl.css?inline';
import type { ReplStore, ReplUpdateMessage, ReplMessage, ReplAppInput } from './types';
import { ReplDetailPanel } from './repl-detail-panel';
import { getReplVersion } from './repl-version';
import { updateReplOutput } from './repl-output-update';
import { QWIK_PKG_NAME, getBundled, getNpmCdnUrl } from './bundled';
import { isServer } from '@builder.io/qwik/build';

export const Repl = component$((props: ReplProps) => {
  useStyles$(styles);

  const input = props.input;

  const store = useStore(() => {
    const initStore: ReplStore = {
      clientId: Math.round(Math.random() * Number.MAX_SAFE_INTEGER)
        .toString(36)
        .toLowerCase(),
      html: '',
      transformedModules: [],
      clientBundles: [],
      ssrModules: [],
      diagnostics: [],
      monacoDiagnostics: [],
      enableClientOutput: props.enableClientOutput !== false,
      enableHtmlOutput: props.enableHtmlOutput !== false,
      enableSsrOutput: props.enableSsrOutput !== false,
      selectedInputPath: '',
      selectedOutputPanel: 'app',
      selectedOutputDetail: 'console',
      ssrBuild: true,
      debug: false,
      serverUrl: undefined,
      serverWindow: null,
      versions: [],
      events: [],
      isLoading: true,
    };
    return initStore;
  });

  useTask$(({ track }) => {
    track(() => input.files);

    if (!input.files.some((i) => i.path === props.selectedInputPath) && input.files.length > 0) {
      store.selectedInputPath = input.files[0].path;
    }
  });

  const onInputChange$ = $((path: string, code: string) => {
    const file = input.files.find((i) => i.path === path);
    if (file) {
      file.code = code;
      input.buildId++;
    }
  });

  const onInputDelete$ = $((path: string) => {
    input.files = input.files.filter((i) => i.path !== path);
    if (store.selectedInputPath === path) {
      if (input.files.length > 0) {
        store.selectedInputPath = input.files[0].path;
      } else {
        store.selectedInputPath = '';
      }
    }
  });

  useVisibleTask$(
    async () => {
      if (isServer) {
        return;
      }
      // only run on the client
      // Get the version asap, most likely it will be cached.
      const v = await getReplVersion(input.version, true);
      store.versions = v.versions;
      input.version = v.version;

      window.addEventListener('message', (ev) => receiveMessageFromReplServer(ev, store, input));
      console.log(await import('../routes/repl/repl-sw.js/entry.ts?raw'));
      store.serverUrl = new URL(`/repl/~repl-server-host.html?${store.clientId}`, origin).href;

      // Now get the version from the network
      const vNew = await getReplVersion(input.version, false);
      store.versions = vNew.versions;
      if (vNew.version !== input.version) {
        input.version = v.version;
        sendUserUpdateToReplServer(input, store);
      }
    },
    { strategy: 'document-ready' }
  );

  useTask$(({ track }) => {
    track(() => input.buildId);
    track(() => input.buildMode);
    track(() => input.entryStrategy);
    track(() => input.files);
    track(() => input.version);
    track(() => input.debug);
    track(() => store.serverWindow);

    sendUserUpdateToReplServer(input, store);
  });

  return (
    <>
      <ReplInputPanel
        input={input}
        store={store}
        onInputChange$={onInputChange$}
        onInputDelete$={onInputDelete$}
        enableCopyToPlayground={props.enableCopyToPlayground}
        enableDownload={props.enableDownload}
      />
      <ReplOutputPanel input={input} store={store} />
      <ReplDetailPanel input={input} store={store} />
    </>
  );
});

export const receiveMessageFromReplServer = (
  ev: MessageEvent,
  store: ReplStore,
  input: ReplAppInput
) => {
  if (isServer) {
    return;
  }
  if (ev.origin !== window.origin) {
    return;
  }
  const msg: ReplMessage = ev.data;

  if (!(msg && msg.type && msg.clientId === store.clientId)) {
    return;
  }
  const type = msg.type;
  if (type === 'replready') {
    // keep a reference to the repl server window
    store.serverWindow = noSerialize(ev.source as any);
    sendUserUpdateToReplServer(input, store);
  } else if (type === 'result') {
    // received a message from the server
    updateReplOutput(store, msg);
  } else if (type === 'event') {
    // received an event from the user's app
    store.events = [...store.events, msg.event];
  } else if (type === 'apploaded') {
    store.isLoading = false;
  } else {
    console.log('unknown repl message', msg);
  }
};

const bundled = getBundled();
const getDependencies = (input: ReplAppInput) => {
  const out = { ...bundled };
  if (input.version !== 'bundled') {
    out[QWIK_PKG_NAME] = {
      version: input.version,

      '/core.cjs': getNpmCdnUrl(bundled, QWIK_PKG_NAME, input.version, '/core.cjs'),
      '/core.mjs': getNpmCdnUrl(bundled, QWIK_PKG_NAME, input.version, '/core.mjs'),
      '/core.min.mjs': getNpmCdnUrl(bundled, QWIK_PKG_NAME, input.version, '/core.min.mjs'),
      '/optimizer.cjs': getNpmCdnUrl(bundled, QWIK_PKG_NAME, input.version, '/optimizer.cjs'),
      '/server.cjs': getNpmCdnUrl(bundled, QWIK_PKG_NAME, input.version, '/server.cjs'),
    };
  }
  return out;
};

export const sendUserUpdateToReplServer = (input: ReplAppInput, store: ReplStore) => {
  if (isServer) {
    return;
  }
  if (input.version && store.serverWindow) {
    const msg: ReplUpdateMessage = {
      type: 'update',
      clientId: store.clientId,
      options: {
        buildId: input.buildId,
        debug: input.debug,
        srcInputs: input.files,
        buildMode: input.buildMode as any,
        entryStrategy: {
          type: input.entryStrategy as any,
        },
        version: input.version,
        serverUrl: store.serverUrl,
        deps: getDependencies(input),
      },
    };

    if (msg.options.srcInputs && msg.options.srcInputs.length > 0) {
      // using JSON.stringify() to remove proxies
      store.serverWindow.postMessage(JSON.stringify(msg));
    }
  }
};

export interface ReplProps {
  input: ReplAppInput;
  selectedInputPath?: string;
  enableHtmlOutput?: boolean;
  enableClientOutput?: boolean;
  enableSsrOutput?: boolean;
  enableInputDelete?: boolean;
  enableDownload?: boolean;
  enableCopyToPlayground?: boolean;
}
