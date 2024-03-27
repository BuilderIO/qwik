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
export const qwikLoader = (doc: Document, hasInitialized?: number) => {
  const Q_CONTEXT = '__q_context__';
  const win = window as any;
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

  const broadcast = (infix: string, ev: Event, type = ev.type) => {
    querySelectorAll('[on' + infix + '\\:' + type + ']')[forEach]((el) =>
      dispatch(el, infix, ev, type)
    );
  };

  const resolveContainer = (containerEl: Element) => {
    if ((containerEl as QContainerElement)[Q_JSON] === undefined) {
      const parentJSON = containerEl === doc.documentElement ? doc.body : containerEl;
      let script = parentJSON.lastElementChild;
      while (script) {
        if (script.tagName === 'SCRIPT' && script[getAttribute]('type') === 'qwik/json') {
          (containerEl as QContainerElement)[Q_JSON] = JSON.parse(
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

  const dispatch = async (element: Element, onPrefix: string, ev: Event, eventName = ev.type) => {
    const attrName = 'on' + onPrefix + ':' + eventName;
    if (element.hasAttribute('preventdefault:' + eventName)) {
      ev.preventDefault();
    }
    const ctx = (element as any)['_qc_'] as QContext | undefined;
    const relevantListeners = ctx && ctx.li.filter((li) => li[0] === attrName);
    if (relevantListeners && relevantListeners.length > 0) {
      for (const listener of relevantListeners) {
        // listener[1] holds the QRL
        await listener[1].getFn([element, ev], () => element[isConnected])(ev, element);
      }
      return;
    }
    const attrValue = element[getAttribute](attrName);
    if (attrValue) {
      const container = element.closest('[q\\:container]')!;
      const baseURI = new URL(doc.baseURI);
      const base = container?.getAttribute('q:base') ?? '/';
      for (const qrl of attrValue.split('\n')) {
        const pathUrl = (base + qrl).replace(/\/+/g, '/');
        const url = new URL(pathUrl, baseURI.origin);
        const symbolName = url.hash[replace](/^#?([^?[|]*).*$/, '$1') || 'default';
        const reqTime = performance.now();
        let handler: any;
        const isSync = qrl.startsWith('#');
        if (isSync) {
          handler = ((container as QContainerElement).qFuncs || [])[Number.parseInt(symbolName)];
        } else {
          const module = import(/* @vite-ignore */ url.href.split('#')[0]);
          resolveContainer(container);
          handler = (await module)[symbolName];
        }
        const previousCtx = (doc as any)[Q_CONTEXT];
        if (element[isConnected]) {
          try {
            (doc as any)[Q_CONTEXT] = [element, ev, url];
            isSync ||
              emitEvent<QwikSymbolEvent>('qsymbol', {
                symbol: symbolName,
                element: element,
                reqTime,
              });
            await handler(ev, element);
          } finally {
            (doc as any)[Q_CONTEXT] = previousCtx;
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
      await dispatch(element, '', ev, type);
      element = ev.bubbles && ev.cancelBubble !== true ? element.parentElement : null;
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
        addEventListener(win, eventName, processWindowEvent);
        events.add(eventName);
      }
    }
  };

  if (!(Q_CONTEXT in doc)) {
    // Mark qwik-loader presence but falsy
    (doc as any)[Q_CONTEXT] = 0;
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
