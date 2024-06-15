import type { QwikSymbolEvent, QwikVisibleEvent } from './core/render/jsx/types/jsx-qwik-events';
import type { QContainerElement } from './core/container/container';
import type { QContext } from './core/state/context';

/**
 * Set up event listening for browser.
 *
 * Determine all the browser events and set up global listeners for them. If browser triggers event
 * search for the lazy load URL and `import()` it.
 *
 * @param doc - Document to use for setting up global listeners, and to determine all the browser
 *   supported events.
 */
export const qwikLoader = (
  doc: Document & { __q_context__?: [Element, Event, URL] | 0 },
  hasInitialized?: number
) => {
  const Q_CONTEXT = '__q_context__';
  type qWindow = Window & {
    qwikevents: {
      push: (...e: string[]) => void;
    };
  };
  const win = window as unknown as qWindow;
  const events = new Set();

  // Some shortenings for minification
  const replace = 'replace';
  const forEach = 'forEach';
  const target = 'target';
  const getAttribute = 'getAttribute';
  const isConnected = 'isConnected';
  const qvisible = 'qvisible';
  const Q_JSON = '_qwikjson_';
  const querySelectorAll = (query: string) => {
    return doc.querySelectorAll(query);
  };

  const isPromise = (promise: Promise<any>) => promise && typeof promise.then === 'function';

  const broadcast = (infix: string, ev: Event, type = ev.type) => {
    querySelectorAll('[on' + infix + '\\:' + type + ']')[forEach]((el) =>
      dispatch(el, infix, ev, type)
    );
  };

  const resolveContainer = (containerEl: QContainerElement) => {
    if (containerEl[Q_JSON] === undefined) {
      const parentJSON = containerEl === doc.documentElement ? doc.body : containerEl;
      let script = parentJSON.lastElementChild;
      while (script) {
        if (script.tagName === 'SCRIPT' && script[getAttribute]('type') === 'qwik/json') {
          containerEl[Q_JSON] = JSON.parse(
            script.textContent![replace](/\\x3C(\/?script)/gi, '<$1')
          );
          break;
        }
        script = script.previousElementSibling;
      }
    }
  };

  const createEvent = <T extends CustomEvent = any>(eventName: string, detail?: T['detail']) =>
    new CustomEvent(eventName, {
      detail,
    }) as T;

  const dispatch = async (
    element: Element & { _qc_?: QContext | undefined },
    onPrefix: string,
    ev: Event,
    eventName = ev.type
  ) => {
    const attrName = 'on' + onPrefix + ':' + eventName;
    if (element.hasAttribute('preventdefault:' + eventName)) {
      ev.preventDefault();
    }
    const ctx = element['_qc_'];
    const relevantListeners = ctx && ctx.li.filter((li) => li[0] === attrName);
    if (relevantListeners && relevantListeners.length > 0) {
      for (const listener of relevantListeners) {
        // listener[1] holds the QRL
        const results = listener[1].getFn([element, ev], () => element[isConnected])(ev, element);
        const cancelBubble = ev.cancelBubble;
        if (isPromise(results)) {
          await results;
        }
        // forcing async with await resets ev.cancelBubble to false
        if (cancelBubble) {
          ev.stopPropagation();
        }
      }
      return;
    }
    const attrValue = element[getAttribute](attrName);
    if (attrValue) {
      const container = element.closest('[q\\:container]')! as QContainerElement;
      const qBase = container[getAttribute]('q:base')!;
      const qVersion = container[getAttribute]('q:version') || 'unknown';
      const qManifest = container[getAttribute]('q:manifest-hash') || 'dev';
      const base = new URL(qBase, doc.baseURI);
      for (const qrl of attrValue.split('\n')) {
        const url = new URL(qrl, base);
        const href = url.href;
        const match = /^#?(([^#]+)#)?([^?[|]*).*$/.exec(url.hash);
        const attr = match![2];
        const symbol = match![3];
        const reqTime = performance.now();
        let handler: undefined | any;
        let importError: undefined | 'sync' | 'async' | 'no-symbol';
        let error: undefined | Error;
        const isSync = qrl.startsWith('#');
        const eventData = { qBase, qManifest, qVersion, href, symbol, element, reqTime };
        if (isSync) {
          handler = (container.qFuncs || [])[Number.parseInt(symbol)];
          if (!handler) {
            importError = 'sync';
            error = new Error('sync handler error for symbol: ' + symbol);
          }
        } else {
          const uri = url.href.split('#')[0];
          try {
            const module = import(/* @vite-ignore */ uri);
            resolveContainer(container);
            handler = await module;
            if (attr) {
              handler = handler[attr];
            }
            handler = handler[symbol];
            if (!handler) {
              importError = 'no-symbol';
              error = new Error(`${symbol} not in ${uri}`);
            }
          } catch (err) {
            importError ||= 'async';
            error = err as Error;
          }
        }
        if (!handler) {
          emitEvent('qerror', { importError, error, ...eventData });
          console.error(error);
          // break out of the loop if handler is not found
          break;
        }
        const previousCtx = doc[Q_CONTEXT];
        if (element[isConnected]) {
          try {
            doc[Q_CONTEXT] = [element, ev, url];
            isSync || emitEvent<QwikSymbolEvent>('qsymbol', { ...eventData });
            const results = handler(ev, element);
            // only await if there is a promise returned
            if (isPromise(results)) {
              await results;
            }
          } catch (error) {
            emitEvent('qerror', { error, ...eventData });
          } finally {
            doc[Q_CONTEXT] = previousCtx;
          }
        }
      }
    }
  };

  const emitEvent = <T extends CustomEvent = any>(eventName: string, detail?: T['detail']) => {
    doc.dispatchEvent(createEvent<T>(eventName, detail));
  };

  const camelToKebab = (str: string) => str[replace](/([A-Z])/g, (a) => '-' + a.toLowerCase());

  /**
   * Event handler responsible for processing browser events.
   *
   * If browser emits an event, the `eventProcessor` walks the DOM tree looking for corresponding
   * `(${event.type})`. If found the event's URL is parsed and `import()`ed.
   *
   * @param ev - Browser event.
   */
  const processDocumentEvent = async (ev: Event) => {
    // eslint-disable-next-line prefer-const
    let type = camelToKebab(ev.type);
    let element = ev[target] as Element | null;
    broadcast('-document', ev, type);

    while (element && element[getAttribute]) {
      const results = dispatch(element, '', ev, type);
      let cancelBubble = ev.cancelBubble;
      if (isPromise(results)) {
        await results;
      }
      // if another async handler stopPropagation
      cancelBubble =
        cancelBubble || ev.cancelBubble || element.hasAttribute('stoppropagation:' + ev.type);
      element = ev.bubbles && cancelBubble !== true ? element.parentElement : null;
    }
  };

  const processWindowEvent = (ev: Event) => {
    broadcast('-window', ev, camelToKebab(ev.type));
  };

  const processReadyStateChange = () => {
    const readyState = doc.readyState;
    if (!hasInitialized && (readyState == 'interactive' || readyState == 'complete')) {
      // document is ready
      hasInitialized = 1;

      emitEvent('qinit');
      const riC = win.requestIdleCallback ?? win.setTimeout;
      riC.bind(win)(() => emitEvent('qidle'));

      if (events.has(qvisible)) {
        const results = querySelectorAll('[on\\:' + qvisible + ']');
        const observer = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              observer.unobserve(entry[target]);
              dispatch(entry[target], '', createEvent<QwikVisibleEvent>(qvisible, entry));
            }
          }
        });
        results[forEach]((el) => observer.observe(el));
      }
    }
  };

  const addEventListener = (
    el: Document | Window,
    eventName: string,
    handler: (ev: Event) => void,
    capture = false
  ) => {
    return el.addEventListener(eventName, handler, { capture, passive: false });
  };

  const push = (eventNames: string[]) => {
    for (const eventName of eventNames) {
      if (!events.has(eventName)) {
        addEventListener(doc, eventName, processDocumentEvent, true);
        addEventListener(win, eventName, processWindowEvent, true);
        events.add(eventName);
      }
    }
  };

  if (!(Q_CONTEXT in doc)) {
    // Mark qwik-loader presence but falsy
    doc[Q_CONTEXT] = 0;
    const qwikevents = win.qwikevents;
    // If `qwikEvents` is an array, process it.
    if (Array.isArray(qwikevents)) {
      push(qwikevents);
    }
    // Now rig up `qwikEvents` so we get notified of new registrations by other containers.
    win.qwikevents = {
      push: (...e: string[]) => push(e),
    };
    addEventListener(doc, 'readystatechange', processReadyStateChange);
    processReadyStateChange();
  }
};

export interface QwikLoaderMessage extends MessageEvent {
  data: string[];
}
