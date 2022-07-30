// bundled into an HTML self-executing script
/* eslint-disable no-console */
import type { ReplMessage, ReplResult } from '../types';

const init = (clientId: string) => {
  let swRegistration: ServiceWorkerRegistration | null = null;
  let loadTmr: any = null;

  const updateApp = (result: ReplResult) => {
    const iframe = document.createElement('iframe');
    iframe.classList.add('loading');
    iframe.src = `/repl/` + result.clientId + `/`;
    iframe.dataset.buildId = String(result.buildId);

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

    document.body.appendChild(iframe);
  };

  const receiveMessageFromMainApp = (ev: MessageEvent) => {
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
      window.parent.postMessage(msg, '*');
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
    if (ev.data) {
      const msg: ReplMessage = JSON.parse(ev.data);
      if (msg?.type === 'event') {
        sendMessageToMain(msg);
      }
    }
  };

  const replReady = () => {
    clearTimeout(loadTmr);

    console.debug(`Qwik REPL server "` + clientId + `" ready`);

    navigator.serviceWorker.addEventListener('message', receiveMessageFromSw);
    window.addEventListener('message', receiveMessageFromUserApp);

    sendMessageToMain({ type: 'replready', clientId: clientId! });
  };

  if (window.parent === window) {
    console.error(`Qwik REPL server "` + clientId + `" is not an iframe window`);
  } else {
    loadTmr = setTimeout(() => {
      console.error(`Qwik REPL server "` + clientId + `" has not initialized`);
    }, 15000);

    navigator.serviceWorker
      .register('/repl/repl-sw.js', {
        scope: '/repl/',
      })
      .then(
        (reg) => {
          swRegistration = reg;
          if (swRegistration.active) {
            console.debug(`Qwik REPL server "` + clientId + `" service worker registration active`);
            replReady();

            reg.addEventListener('updatefound', () => {
              const newWorker = reg.installing;
              if (newWorker) {
                let isRefreshing = false;
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state == 'activated') {
                    if (!isRefreshing) {
                      isRefreshing = true;
                      window.parent.location.reload();
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
                console.debug(
                  `Qwik REPL server "` + clientId + `" statechange: ${ev?.target?.state}`
                );
              }
            });
          }
        },
        (err) => {
          console.error(
            `Qwik REPL Server "` + clientId + `" service worker registration failed:`,
            err
          );
        }
      )
      .catch((e) => console.error(e));

    document.title += ': ' + clientId;
    window.addEventListener('message', receiveMessageFromMainApp);
  }
};

const hashClientId = location.hash.slice(1);
if (/^[a-z0-9]+$/.test(hashClientId)) {
  init(hashClientId);
} else {
  console.error('Qwik REPL server missing valid client id');
}

const s = '';
export default s;
