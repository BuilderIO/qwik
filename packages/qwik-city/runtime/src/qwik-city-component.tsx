import {
  $,
  component$,
  getLocale,
  noSerialize,
  Slot,
  useContextProvider,
  useServerData,
  useSignal,
  useStore,
  useTask$,
  _getContextElement,
  _weakSerialize,
  useStyles$,
  _waitUntilRendered,
} from '@builder.io/qwik';
import { isBrowser, isDev, isServer } from '@builder.io/qwik/build';
import * as qwikCity from '@qwik-city-plan';
import { CLIENT_DATA_CACHE } from './constants';
import {
  ContentContext,
  ContentInternalContext,
  DocumentHeadContext,
  RouteActionContext,
  RouteInternalContext,
  RouteLocationContext,
  RouteNavigateContext,
  RouteStateContext,
} from './contexts';
import { createDocumentHead, resolveHead } from './head';
import { loadRoute } from './routing';
import type {
  ClientPageData,
  ContentModule,
  ContentState,
  ContentStateInternal,
  Editable,
  EndpointResponse,
  LoadedRoute,
  MutableRouteLocation,
  PageModule,
  ResolvedDocumentHead,
  RouteActionValue,
  RouteNavigate,
  RouteStateInternal,
  ScrollState,
} from './types';
import { loadClientData } from './use-endpoint';
import { useQwikCityEnv } from './use-functions';
import { isSameOrigin, isSamePath, toUrl } from './utils';
import { clientNavigate } from './client-navigate';
import {
  currentScrollState,
  getScrollHistory,
  saveScrollHistory,
  restoreScroll,
} from './scroll-restoration';
import spaInit from './spa-init';

/** @public */
export const QWIK_CITY_SCROLLER = '_qCityScroller';

/** @public */
export interface QwikCityProps {
  // /**
  //  * The QwikCity component must have only two direct children: `<head>` and `<body>`, like the following example:
  //  *
  //  * ```tsx
  //  * <QwikCityProvider>
  //  *   <head>
  //  *     <meta charset="utf-8" />
  //  *   </head>
  //  *   <body lang="en"></body>
  //  * </QwikCityProvider>
  //  * ```
  //  */
  // children?: [JSXNode, JSXNode];

  /**
   * Enable the ViewTransition API
   *
   * Default: `true`
   *
   * @see https://github.com/WICG/view-transitions/blob/main/explainer.md
   * @see https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
   * @see https://caniuse.com/mdn-api_viewtransition
   */
  viewTransition?: boolean;
}

/** @public */
export const QwikCityProvider = component$<QwikCityProps>((props) => {
  useStyles$(`:root{view-transition-name:none}`);
  const env = useQwikCityEnv();
  if (!env?.params) {
    throw new Error(
      `Missing Qwik City Env Data for help visit https://github.com/QwikDev/qwik/issues/6237`
    );
  }

  const urlEnv = useServerData<string>('url');
  if (!urlEnv) {
    throw new Error(`Missing Qwik URL Env Data`);
  }

  const url = new URL(urlEnv);
  const routeLocation = useStore<MutableRouteLocation>(
    {
      url,
      params: env.params,
      isNavigating: false,
      prevUrl: undefined,
    },
    { deep: false }
  );
  const navResolver: { r?: () => void } = {};
  const loaderState = _weakSerialize(useStore(env.response.loaders, { deep: false }));
  const routeInternal = useSignal<RouteStateInternal>({
    type: 'initial',
    dest: url,
    forceReload: false,
    replaceState: false,
    scroll: true,
  });
  const documentHead = useStore<Editable<ResolvedDocumentHead>>(createDocumentHead);
  const content = useStore<Editable<ContentState>>({
    headings: undefined,
    menu: undefined,
  });

  const contentInternal = useSignal<ContentStateInternal>();

  const currentActionId = env.response.action;
  const currentAction = currentActionId ? env.response.loaders[currentActionId] : undefined;
  const actionState = useSignal<RouteActionValue>(
    currentAction
      ? {
          id: currentActionId!,
          data: env.response.formData,
          output: {
            result: currentAction,
            status: env.response.status,
          },
        }
      : undefined
  );

  const goto: RouteNavigate = $(async (path, opt) => {
    const {
      type = 'link',
      forceReload = path === undefined, // Hack for nav() because this API is already set.
      replaceState = false,
      scroll = true,
    } = typeof opt === 'object' ? opt : { forceReload: opt };
    if (typeof path === 'number') {
      if (isBrowser) {
        history.go(path);
      }
      return;
    }
    const lastDest = routeInternal.value.dest;
    const dest = path === undefined ? lastDest : toUrl(path, routeLocation.url);

    if (!isSameOrigin(dest, lastDest)) {
      // Cross-origin nav() should always abort early.
      if (isBrowser) {
        location.href = dest.href;
      }
      return;
    }

    if (!forceReload && isSamePath(dest, lastDest)) {
      if (isBrowser) {
        // Use `location.href` because the lastDest signal is only updated on page navigates.
        if (type === 'link' && dest.href !== location.href) {
          history.pushState(null, '', dest);
        }

        // Always scroll on same-page popstates, #hash clicks, or links.
        const scroller = document.getElementById(QWIK_CITY_SCROLLER) ?? document.documentElement;
        restoreScroll(type, dest, new URL(location.href), scroller, getScrollHistory());

        if (type === 'popstate') {
          (window as ClientSPAWindow)._qCityScrollEnabled = true;
        }
      }

      // TODO Future feature?: update routeLocation.url signal on hash changes for `<Link>` & `<a>` during SPA?
      // - Hashes in Link are already broken in Qwik (<=v1.1.5), and <a> tags are untracked. (not a new bug)
      // - Would need an early pop handler pushed on first # w/o full Nav SPA bootup. (post-SPA refactor)

      return;
    }

    routeInternal.value = { type, dest, forceReload, replaceState, scroll };

    if (isBrowser) {
      loadClientData(dest, _getContextElement());
      loadRoute(qwikCity.routes, qwikCity.menus, qwikCity.cacheModules, dest.pathname);
    }

    actionState.value = undefined;
    routeLocation.isNavigating = true;

    return new Promise<void>((resolve) => {
      navResolver.r = resolve;
    });
  });

  useContextProvider(ContentContext, content);
  useContextProvider(ContentInternalContext, contentInternal);
  useContextProvider(DocumentHeadContext, documentHead);
  useContextProvider(RouteLocationContext, routeLocation);
  useContextProvider(RouteNavigateContext, goto);
  useContextProvider(RouteStateContext, loaderState);
  useContextProvider(RouteActionContext, actionState);
  useContextProvider(RouteInternalContext, routeInternal);

  useTask$(({ track }) => {
    async function run() {
      const [navigation, action] = track(() => [routeInternal.value, actionState.value]);

      const locale = getLocale('');
      const prevUrl = routeLocation.url;
      const navType = action ? 'form' : navigation.type;
      const replaceState = navigation.replaceState;
      let trackUrl: URL;
      let clientPageData: EndpointResponse | ClientPageData | undefined;
      let loadedRoute: LoadedRoute | null = null;
      let elm: unknown;
      if (isServer) {
        // server
        trackUrl = new URL(navigation.dest, routeLocation.url);
        loadedRoute = env!.loadedRoute;
        clientPageData = env!.response;
      } else {
        // client
        trackUrl = new URL(navigation.dest, location as any as URL);

        // ensure correct trailing slash
        if (trackUrl.pathname.endsWith('/')) {
          if (!qwikCity.trailingSlash) {
            trackUrl.pathname = trackUrl.pathname.slice(0, -1);
          }
        } else if (qwikCity.trailingSlash) {
          trackUrl.pathname += '/';
        }
        let loadRoutePromise = loadRoute(
          qwikCity.routes,
          qwikCity.menus,
          qwikCity.cacheModules,
          trackUrl.pathname
        );
        elm = _getContextElement();
        const pageData = (clientPageData = await loadClientData(trackUrl, elm, {
          action,
          clearCache: true,
        }));
        if (!pageData) {
          // Reset the path to the current path
          (routeInternal as any).untrackedValue = { type: navType, dest: trackUrl };
          return;
        }
        const newHref = pageData.href;
        const newURL = new URL(newHref, trackUrl);
        if (!isSamePath(newURL, trackUrl)) {
          trackUrl = newURL;
          loadRoutePromise = loadRoute(
            qwikCity.routes,
            qwikCity.menus,
            qwikCity.cacheModules,
            trackUrl.pathname
          );
        }

        try {
          loadedRoute = await loadRoutePromise;
        } catch (e) {
          window.location.href = newHref;
          return;
        }
      }

      if (loadedRoute) {
        const [routeName, params, mods, menu] = loadedRoute;
        const contentModules = mods as ContentModule[];
        const pageModule = contentModules[contentModules.length - 1] as PageModule;

        // Update route location
        routeLocation.prevUrl = prevUrl;
        routeLocation.url = trackUrl;
        routeLocation.params = { ...params };

        (routeInternal as any).untrackedValue = { type: navType, dest: trackUrl };

        // Needs to be done after routeLocation is updated
        const resolvedHead = resolveHead(clientPageData!, routeLocation, contentModules, locale);

        // Update content
        content.headings = pageModule.headings;
        content.menu = menu;
        contentInternal.value = noSerialize(contentModules);

        // Update document head
        documentHead.links = resolvedHead.links;
        documentHead.meta = resolvedHead.meta;
        documentHead.styles = resolvedHead.styles;
        documentHead.scripts = resolvedHead.scripts;
        documentHead.title = resolvedHead.title;
        documentHead.frontmatter = resolvedHead.frontmatter;

        if (isBrowser) {
          if (props.viewTransition !== false) {
            // mark next DOM render to use startViewTransition API
            (document as any).__q_view_transition__ = true;
          }

          let scrollState: ScrollState | undefined;
          if (navType === 'popstate') {
            scrollState = getScrollHistory();
          }
          const scroller = document.getElementById(QWIK_CITY_SCROLLER) ?? document.documentElement;

          if (
            (navigation.scroll &&
              (!navigation.forceReload || !isSamePath(trackUrl, prevUrl)) &&
              (navType === 'link' || navType === 'popstate')) ||
            // Action might have responded with a redirect.
            (navType === 'form' && !isSamePath(trackUrl, prevUrl))
          ) {
            // Mark next DOM render to scroll.
            (document as any).__q_scroll_restore__ = () =>
              restoreScroll(navType, trackUrl, prevUrl, scroller, scrollState);
          }

          const loaders = clientPageData?.loaders;
          const win = window as ClientSPAWindow;
          if (loaders) {
            Object.assign(loaderState, loaders);
          }
          CLIENT_DATA_CACHE.clear();

          if (!win._qCitySPA) {
            // only add event listener once
            win._qCitySPA = true;
            history.scrollRestoration = 'manual';

            win.addEventListener('popstate', () => {
              // Disable scroll handler eagerly to prevent overwriting history.state.
              win._qCityScrollEnabled = false;
              clearTimeout(win._qCityScrollDebounce);

              goto(location.href, {
                type: 'popstate',
              });
            });

            win.removeEventListener('popstate', win._qCityInitPopstate!);
            win._qCityInitPopstate = undefined;

            // Browsers natively will remember scroll on ALL history entries, incl. custom pushState.
            // Devs could push their own states that we can't control.
            // If a user doesn't initiate scroll after, it will not have any scrollState.
            // We patch these to always include scrollState.
            // TODO Block this after Navigation API PR, browsers that support it have a Navigation API solution.
            if (!win._qCityHistoryPatch) {
              win._qCityHistoryPatch = true;
              const pushState = history.pushState;
              const replaceState = history.replaceState;

              const prepareState = (state: any) => {
                if (state === null || typeof state === 'undefined') {
                  state = {};
                } else if (state?.constructor !== Object) {
                  state = { _data: state };

                  if (isDev) {
                    console.warn(
                      'In a Qwik SPA context, `history.state` is used to store scroll state. ' +
                        'Direct calls to `pushState()` and `replaceState()` must supply an actual Object type. ' +
                        'We need to be able to automatically attach the scroll state to your state object. ' +
                        'A new state object has been created, your data has been moved to: `history.state._data`'
                    );
                  }
                }

                state._qCityScroll = state._qCityScroll || currentScrollState(scroller);
                return state;
              };

              history.pushState = (state, title, url) => {
                state = prepareState(state);
                return pushState.call(history, state, title, url);
              };

              history.replaceState = (state, title, url) => {
                state = prepareState(state);
                return replaceState.call(history, state, title, url);
              };
            }

            // Chromium and WebKit fire popstate+hashchange for all #anchor clicks,
            // ... even if the URL is already on the #hash.
            // Firefox only does it once and no more, but will still scroll. It also sets state to null.
            // Any <a> tags w/ #hash href will break SPA state in Firefox.
            // We patch these events and direct them to Link pipeline during SPA.
            document.body.addEventListener('click', (event) => {
              if (event.defaultPrevented) {
                return;
              }

              const target = (event.target as HTMLElement).closest('a[href]');

              if (target && !target.hasAttribute('preventdefault:click')) {
                const href = target.getAttribute('href')!;
                const prev = new URL(location.href);
                const dest = new URL(href, prev);
                // Patch only same-page anchors.
                if (isSameOrigin(dest, prev) && isSamePath(dest, prev)) {
                  event.preventDefault();

                  // Simulate same-page (no hash) anchor reload.
                  // history.scrollRestoration = 'manual' makes these not scroll.
                  if (!dest.hash && !dest.href.endsWith('#')) {
                    if (dest.href !== prev.href) {
                      history.pushState(null, '', dest);
                    }

                    win._qCityScrollEnabled = false;
                    clearTimeout(win._qCityScrollDebounce);
                    saveScrollHistory({
                      ...currentScrollState(scroller),
                      x: 0,
                      y: 0,
                    });
                    location.reload();
                    return;
                  }

                  goto(target.getAttribute('href')!);
                }
              }
            });

            document.body.removeEventListener('click', win._qCityInitAnchors!);
            win._qCityInitAnchors = undefined;

            // TODO Remove block after Navigation API PR.
            // Calling `history.replaceState` during `visibilitychange` in Chromium will nuke BFCache.
            // Only Chromium 96 - 101 have BFCache without Navigation API. (<1% of users)
            if (!(window as any).navigation) {
              // Commit scrollState on refresh, cross-origin navigation, mobile view changes, etc.
              document.addEventListener(
                'visibilitychange',
                () => {
                  if (win._qCityScrollEnabled && document.visibilityState === 'hidden') {
                    // Last & most reliable point to commit state.
                    // Do not clear timeout here in case debounce gets to run later.
                    const scrollState = currentScrollState(scroller);
                    saveScrollHistory(scrollState);
                  }
                },
                { passive: true }
              );

              document.removeEventListener('visibilitychange', win._qCityInitVisibility!);
              win._qCityInitVisibility = undefined;
            }

            win.addEventListener(
              'scroll',
              () => {
                if (!win._qCityScrollEnabled) {
                  return;
                }

                clearTimeout(win._qCityScrollDebounce);
                win._qCityScrollDebounce = setTimeout(() => {
                  const scrollState = currentScrollState(scroller);
                  saveScrollHistory(scrollState);
                  // Needed for e2e debounceDetector.
                  win._qCityScrollDebounce = undefined;
                }, 200);
              },
              { passive: true }
            );

            removeEventListener('scroll', win._qCityInitScroll!);
            win._qCityInitScroll = undefined;

            win._qCityBootstrap?.remove();
            win._qCityBootstrap = undefined;

            // Cache SPA recovery script.
            spaInit.resolve();
          }

          if (navType !== 'popstate') {
            win._qCityScrollEnabled = false;
            clearTimeout(win._qCityScrollDebounce);

            // Save the final scroll state before pushing new state.
            // Upgrades/replaces state with scroll pos on nav as needed.
            const scrollState = currentScrollState(scroller);
            saveScrollHistory(scrollState);
          }

          clientNavigate(window, navType, prevUrl, trackUrl, replaceState);
          _waitUntilRendered(elm as Element).then(() => {
            const container = getContainer(elm as Element);
            container.setAttribute('q:route', routeName);
            const scrollState = currentScrollState(scroller);
            saveScrollHistory(scrollState);
            win._qCityScrollEnabled = true;

            routeLocation.isNavigating = false;
            navResolver.r?.();
          });
        }
      }
    }
    const promise = run();
    if (isServer) {
      return promise;
    } else {
      return;
    }
  });

  return <Slot />;
});

function getContainer(elm: Node): HTMLElement {
  while (elm && elm.nodeType !== Node.ELEMENT_NODE) {
    elm = elm.parentElement as Element;
  }
  return (elm as Element).closest('[q\\:container]') as HTMLElement;
}

/** @public */
export interface QwikCityMockProps {
  url?: string;
  params?: Record<string, string>;
  goto?: RouteNavigate;
}

/** @public */
export const QwikCityMockProvider = component$<QwikCityMockProps>((props) => {
  const urlEnv = props.url ?? 'http://localhost/';
  const url = new URL(urlEnv);
  const routeLocation = useStore<MutableRouteLocation>(
    {
      url,
      params: props.params ?? {},
      isNavigating: false,
      prevUrl: undefined,
    },
    { deep: false }
  );

  const loaderState = useSignal({});
  const routeInternal = useSignal<RouteStateInternal>({ type: 'initial', dest: url });

  const goto: RouteNavigate =
    props.goto ??
    $(async () => {
      console.warn('QwikCityMockProvider: goto not provided');
    });

  const documentHead = useStore(createDocumentHead, { deep: false });

  const content = useStore<ContentState>(
    {
      headings: undefined,
      menu: undefined,
    },
    { deep: false }
  );

  const contentInternal = useSignal<ContentStateInternal>();

  const actionState = useSignal<RouteActionValue>();

  useContextProvider(ContentContext, content);
  useContextProvider(ContentInternalContext, contentInternal);
  useContextProvider(DocumentHeadContext, documentHead);
  useContextProvider(RouteLocationContext, routeLocation);
  useContextProvider(RouteNavigateContext, goto);
  useContextProvider(RouteStateContext, loaderState);
  useContextProvider(RouteActionContext, actionState);
  useContextProvider(RouteInternalContext, routeInternal);

  return <Slot />;
});

export interface ClientSPAWindow extends Window {
  _qCitySPA?: boolean;
  _qCityHistoryPatch?: boolean;
  _qCityScrollEnabled?: boolean;
  _qCityScrollDebounce?: ReturnType<typeof setTimeout>;
  _qCityInitPopstate?: () => void;
  _qCityInitAnchors?: (event: MouseEvent) => void;
  _qCityInitVisibility?: () => void;
  _qCityInitScroll?: () => void;
  _qCityBootstrap?: HTMLAnchorElement;
  _qcs?: boolean;
}
