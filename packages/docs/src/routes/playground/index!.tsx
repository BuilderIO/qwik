import { $, component$, Host, useStyles$, useStore, useClientEffect$ } from '@builder.io/qwik';
import { Repl } from '../../repl/repl';
import { Header } from '../../components/header/header';
import styles from './playground.css?inline';
import playgroundApp from '@playground-data';
import type { ReplAppInput } from '../../repl/types';
import { createPlaygroundShareUrl, parsePlaygroundShareUrl } from '../../repl/repl-share-url';

export default component$(() => {
  useStyles$(styles);

  const store = useStore<PlaygroundStore>(() => {
    const initStore: PlaygroundStore = {
      buildId: 0,
      files: playgroundApp.inputs,
      version: '',
      buildMode: 'development',
      entryStrategy: 'hook',
      colResizeActive: false,
      colLeft: 50,
      shareUrlTmr: null,
    };
    return initStore;
  });

  useClientEffect$(() => {
    // run once on the client
    const shareData = parsePlaygroundShareUrl(location.hash.slice(1));
    if (shareData) {
      store.version = shareData.version;
      store.buildMode = shareData.buildMode;
      store.entryStrategy = shareData.entryStrategy;
      store.files = shareData.files;
    }
  });

  useClientEffect$((track) => {
    track(store, 'buildId');
    track(store, 'buildMode');
    track(store, 'entryStrategy');
    track(store, 'files');
    track(store, 'version');

    if (store.version) {
      clearTimeout(store.shareUrlTmr);

      store.shareUrlTmr = setTimeout(() => {
        const shareUrl = createPlaygroundShareUrl(store);
        history.replaceState({}, '', shareUrl);
      }, 1000);
    }
  });

  const pointerDown = $(() => {
    store.colResizeActive = true;
  });

  const pointerMove = $((ev: PointerEvent) => {
    if (store.colResizeActive) {
      store.colLeft = (ev.clientX, ev.clientX / window.innerWidth) * 100;
      store.colLeft = Math.max(25, store.colLeft);
      store.colLeft = Math.min(75, store.colLeft);
    }
  });

  const pointerUp = $(() => {
    store.colResizeActive = false;
  });

  return (
    <Host
      class={{
        playground: true,
        'full-width': true,
        'fixed-header': true,
        'repl-resize-active': store.colResizeActive,
      }}
    >
      <Header />

      <Repl
        input={store}
        style={{
          gridTemplateColumns: `${store.colLeft}% ${100 - store.colLeft}%`,
        }}
        enableCopyToPlayground={false}
        enableDownload={true}
        enableInputDelete={true}
      />

      <div
        class="repl-col-resize-bar"
        onPointerDown$={pointerDown}
        onPointerMove$={pointerMove}
        onPointerUp$={pointerUp}
        onPointerOut$={pointerUp}
        style={{
          left: `calc(${store.colLeft}% - 6px)`,
        }}
      />
    </Host>
  );
});

export interface PlaygroundStore extends ReplAppInput {
  colResizeActive: boolean;
  colLeft: number;
  shareUrlTmr: any;
}
