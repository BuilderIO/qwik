import type { RouteNavigate } from './types';

export const clientNavigate = (
  win: ClientHistoryWindow,
  doc: Document,
  routeNavigate: RouteNavigate
) => {
  const newPath = routeNavigate.path;
  const currentPath = normalizePath(win.location);

  if (currentPath !== newPath) {
    // current browser url and route path are different
    // see if we should scroll to the hash after the url update
    handleScroll(win, doc, currentPath, newPath);

    // push the new route path to the history
    win.history.pushState('', '', newPath);
  }

  if (!win[CLIENT_HISTORY_INITIALIZED]) {
    // only add event listener once
    win[CLIENT_HISTORY_INITIALIZED] = 1;

    win.addEventListener('popstate', () => {
      // history pop event has happened
      const currentPath = normalizePath(win.location);
      const previousPath = routeNavigate.path;

      if (currentPath !== previousPath) {
        handleScroll(win, doc, previousPath, currentPath);

        // current browser url and route path are different
        // update the route path
        routeNavigate.path = currentPath;
      }
    });
  }
};

export const normalizePath = (url: URL | Location) => url.pathname + url.search + url.hash;

const clientPathToUrl = (path: string, loc: Location) => new URL(path, loc.href);

export const getClientNavigatePath = (href: string | undefined | null, loc: Location) => {
  if (typeof href === 'string') {
    try {
      const url = clientPathToUrl(href, loc);
      if (url.origin === loc.origin) {
        return normalizePath(url);
      }
    } catch (e) {
      console.error(e);
    }
  }
  return null;
};

const handleScroll = async (win: Window, doc: Document, previousPath: string, newPath: string) => {
  const loc = win.location;
  const previousUrl = clientPathToUrl(previousPath, loc);
  const newUrl = clientPathToUrl(newPath, loc);
  const newHash = newUrl.hash;
  const isSameRoute = previousUrl.pathname + previousUrl.search === newUrl.pathname + newUrl.search;

  if (isSameRoute) {
    // same route after path change

    if (previousUrl.hash !== newHash) {
      // hash has changed on the same route

      // wait for a moment while window gets settled
      await new Promise((resolve) => setTimeout(resolve, 9));

      if (newHash) {
        // hash has changed on the same route and there's a hash
        // scroll to the element if it exists
        scrollToHashId(doc, newHash);
      } else {
        // hash has changed on the same route, but now there's no hash
        win.scrollTo(0, 0);
      }
    }
  } else {
    // different route after change

    if (newHash) {
      // different route and there's a hash
      // content may not have finished updating yet
      // poll the dom for the element for a short time
      for (let i = 0; i < 20; i++) {
        await new Promise(requestAnimationFrame);
        if (scrollToHashId(doc, newHash)) {
          break;
        }
      }
    }
  }
};

const scrollToHashId = (doc: Document, hash: string) => {
  const elmId = hash.slice(1);
  const elm = doc.getElementById(elmId);
  if (elm) {
    // found element to scroll to
    elm.scrollIntoView();
  }
  return elm;
};

const CLIENT_HISTORY_INITIALIZED = /* @__PURE__ */ Symbol();

interface ClientHistoryWindow extends Window {
  [CLIENT_HISTORY_INITIALIZED]?: 1;
}
