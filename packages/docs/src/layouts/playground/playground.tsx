import {
  $,
  component$,
  Host,
  useStyles$,
  useStore,
  useClientEffect$,
  useStyles$,
} from '@builder.io/qwik';
import { Repl } from '../../components/repl/repl';
import { Header } from '../../components/header/header';
import { getLocation, useHeadMeta } from '@builder.io/qwik-city';
import styles from './playground.css?inline';
import playgroundApp from '@playground-data';
import type { ReplAppInput } from '../../components/repl/types';
import {
  createPlaygroundShareUrl,
  parsePlaygroundShareUrl,
} from '../../components/repl/repl-share-url';

const Playground = component$(() => {
  useStyles$(`html,body { margin: 0; height: 100%; overflow: hidden; }`);
  useStyles$(styles);
  useHeadMeta({ title: `Qwik Playground` });

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
    const loc = getLocation(document);
    const shareData = parsePlaygroundShareUrl(loc.hash.slice(1));
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
        onPointerDownQrl={pointerDown}
        onPointerMoveQrl={pointerMove}
        onPointerUpQrl={pointerUp}
        onPointerOutQrl={pointerUp}
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

export default Playground;
