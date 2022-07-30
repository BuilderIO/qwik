import { component$, Host, Slot, useStore, useStyles$, useWatch$ } from '@builder.io/qwik';
import { useLocation } from '@builder.io/qwik-city';
import { Repl } from '../../../repl/repl';
import styles from './tutorial.css?inline';
import { TutorialContentFooter } from './tutorial-content-footer';
import { TutorialContentHeader } from './tutorial-content-header';
import tutorialSections, { TutorialApp } from '@tutorial-data';
import { Header } from '../../../components/header/header';
import type { ReplAppInput, ReplModuleInput } from '../../../repl/types';
import { EditIcon } from '../../../components/svgs/edit-icon';

export default component$(() => {
  useStyles$(styles);
  useStyles$(`html,body { margin: 0; height: 100%; overflow: hidden; }`);

  const { pathname } = useLocation();
  const store = useStore<TutorialStore>(() => {
    const p = pathname.split('/');
    const appId = `${p[2]}/${p[3]}`;
    const t = getTutorial(appId)!;

    const initStore: TutorialStore = {
      appId: t.app.id,
      app: t.app,
      prev: t.prev,
      next: t.next,
      buildId: 0,
      buildMode: 'development',
      entryStrategy: 'hook',
      files: ensureDefaultFiles(t.app.problemInputs),
      version: '',
    };
    return initStore;
  });

  useWatch$((track) => {
    const appId = track(store, 'appId');
    const t = getTutorial(appId)!;

    store.files = ensureDefaultFiles(t.app.problemInputs);
    store.prev = t.prev;
    store.next = t.next;
  });

  return (
    <Host class="tutorial full-width fixed-header">
      <Header />
      <main>
        <div class="tutorial-content-panel">
          <TutorialContentHeader store={store} />

          <div class="content-main">
            <div>
              <Slot />
              {store.next ? (
                <p class="next-link">
                  <a href={`/tutorial/${store.next.id}`} class="next">
                    Next: {store.next.title}
                  </a>
                </p>
              ) : null}
              <p class="edit-tutorial">
                <a
                  href={`https://github.com/BuilderIO/qwik/edit/main/packages/docs/src/pages/tutorial/${store.appId}`}
                  target="_blank"
                >
                  <EditIcon width={18} height={18} />
                  <span>Edit this tutorial</span>
                </a>
              </p>
            </div>
          </div>

          <TutorialContentFooter store={store} />
        </div>
        <div class="tutorial-repl-panel">
          <Repl
            input={store}
            enableHtmlOutput={store.app.enableHtmlOutput}
            enableClientOutput={store.app.enableClientOutput}
            enableSsrOutput={store.app.enableSsrOutput}
            enableCopyToPlayground={true}
            enableDownload={true}
            enableInputDelete={false}
          />
          <div class="tutorial-repl-footer" />
        </div>
      </main>
    </Host>
  );
});

export const getTutorial = (id: string) => {
  const tutorials: TutorialApp[] = [];
  tutorialSections.forEach((s) => tutorials.push(...s.apps));

  for (let i = 0; i < tutorials.length; i++) {
    if (tutorials[i].id === id) {
      return {
        app: JSON.parse(JSON.stringify(tutorials[i])) as TutorialApp,
        prev: tutorials[i - 1],
        next: tutorials[i + 1],
      };
    }
  }

  return null;
};

export const ensureDefaultFiles = (appFiles: ReplModuleInput[]) => {
  const files: ReplModuleInput[] = JSON.parse(JSON.stringify(appFiles));

  if (!files.some((i) => i.code === '/root.tsx')) {
    files.push({ path: '/root.tsx', code: DEFAULT_ROOT, hidden: true });
  }

  if (!files.some((i) => i.code === '/entry.server.tsx')) {
    files.push({ path: '/entry.server.tsx', code: DEFAULT_ENTRY_SERVER, hidden: true });
  }

  return files;
};

export const DEFAULT_ENTRY_SERVER = `
import { renderToString, RenderOptions } from '@builder.io/qwik/server';
import { Root } from './root';

export default function(opts: RenderOptions) {
  return renderToString(<Root />, opts);
}
`;

export const DEFAULT_ROOT = `
import { App } from './app';

export const Root = () => {
  return (
    <html>
      <head>
        <title>Tutorial</title>
      </head>
      <body>
        <App />
      </body>
    </html>
  );
};
`;

export interface TutorialStore extends ReplAppInput {
  appId: string;
  app: TutorialApp;
  prev: TutorialApp | undefined;
  next: TutorialApp | undefined;
}
