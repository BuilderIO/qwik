/**
 * - Source for url: "/repl/~repl-server-host.js"
 * - Created from the route: "src/routes/repl/~repl-server.js/entry.ts"
 * - Script executed from url: "/repl/~repl-server-host.html"
 * - Public static html source file: "public/repl/~repl-server-host.html"
 */

/* eslint-disable no-console */
import type { ReplMessage, ReplResult } from '../types';

export const initReplServer = (win: Window, doc: Document, nav: Navigator) => {
  const clientId = win.location.search.slice(1);

  if (!/^[a-z0-9]+$/.test(clientId)) {
    console.error('Qwik REPL server missing valid client id');
    return;
  }

  let swRegistration: ServiceWorkerRegistration | null = null;
  let loadTmr: any = null;

  const updateApp = (result: ReplResult) => {
    const iframe = doc.createElement('iframe');
    iframe.classList.add('loading');
    iframe.src = `/repl/` + result.clientId + `/`;
    iframe.dataset.buildId = String(result.buildId);
    iframe.setAttribute('sandbox', 'allow-popups allow-modals allow-scripts allow-same-origin');

    iframe.addEventListener('load', () => {
      if (!iframe.nextElementSibling) {
        // last iframe is the active one, others before it should get removed
        iframe.classList.remove('loading');
        const iframes = iframe.parentElement?.querySelectorAll('iframe');
        if (iframes) {
          for (let i = iframes.length - 1; i >= 0; i--) {
            const otherIframe = iframes[i];
            if (otherIframe !== iframe) {
              otherIframe.remove();
            }
          }
        }
        sendMessageToMain({ type: 'apploaded', clientId: clientId! });
      }
    });

    doc.body.appendChild(iframe);
  };

  const receiveMessageFromMainApp = (ev: MessageEvent) => {
    if (ev.origin !== win.location.origin) {
      return;
    }
    if (swRegistration && swRegistration.active) {
      try {
        if (ev.data) {
          swRegistration.active.postMessage(ev.data);
        }
      } catch (e) {
        console.error('receiveMessageFromMainApp', e, ev.data);
      }
    }
  };

  const sendMessageToMain = (msg: ReplMessage) => {
    if (msg.clientId === clientId) {
      win.parent.postMessage(msg, '*');
    }
  };

  const receiveMessageFromSw = (ev: MessageEvent) => {
    const msg: ReplMessage = ev.data;
    if (msg) {
      sendMessageToMain(msg);
      if (msg.type === 'result') {
        updateApp(msg);
      }
    }
  };

  const receiveMessageFromUserApp = (ev: MessageEvent) => {
    if (ev.origin !== win.location.origin) {
      return;
    }
    if (ev.data) {
      const msg: ReplMessage = JSON.parse(ev.data);
      if (msg?.type === 'event') {
        sendMessageToMain(msg);
      }
    }
  };

  const replReady = () => {
    clearTimeout(loadTmr);

    console.debug('Qwik REPL server "%s" ready', clientId);

    nav.serviceWorker.addEventListener('message', receiveMessageFromSw);
    win.addEventListener('message', receiveMessageFromUserApp);

    sendMessageToMain({ type: 'replready', clientId: clientId! });
  };

  if (win.parent === win) {
    console.error('Qwik REPL server "%s" is not an iframe window', clientId);
  } else {
    loadTmr = setTimeout(() => {
      console.error('Qwik REPL server "%s" has not initialized', clientId);
    }, 60000);

    nav.serviceWorker
      .register('/repl/repl-sw.js', {
        scope: '/repl/',
      })
      .then(
        (reg) => {
          console.trace('Qwik REPL server "%s" service worker registered', clientId, reg);
          swRegistration = reg;
          if (swRegistration.active) {
            console.debug('Qwik REPL server "%s" service worker registration active', clientId);
            replReady();

            reg.addEventListener('updatefound', () => {
              const newWorker = reg.installing;
              if (newWorker) {
                let isRefreshing = false;
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state == 'activated') {
                    if (!isRefreshing) {
                      isRefreshing = true;
                      win.parent.location.reload();
                    }
                  }
                });
              }
            });
          } else if (swRegistration.installing) {
            swRegistration.installing.addEventListener('statechange', (ev: any) => {
              if (ev?.target?.state == 'activated') {
                replReady();
              } else {
                console.debug('Qwik REPL server "%s" statechange: %s', clientId, ev?.target?.state);
              }
            });
          }
        },
        (err) => {
          console.error('Qwik REPL Server "%s" service worker registration failed:', clientId, err);
        }
      )
      .catch((e) => console.error('REPL service worker error', e));

    doc.title += ': ' + clientId;
    win.addEventListener('message', receiveMessageFromMainApp);
  }
};
