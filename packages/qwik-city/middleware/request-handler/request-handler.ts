import { loadRoute } from '../../runtime/src/library/routing';
import { loadUserResponse, ErrorResponse, RedirectResponse } from './user-response';
import type { QwikCityRequestContext, QwikCityRequestOptions } from './types';
import type { Render } from '@builder.io/qwik/server';
import { errorHandler, errorResponse } from './error-handler';
import cityPlan from '@qwik-city-plan';
import { endpointHandler } from './endpoint-handler';
import { pageHandler } from './page-handler';
import { redirectResponse } from './redirect-handler';

/**
 * @public
 */
export async function requestHandler<T = any>(
  requestCtx: QwikCityRequestContext,
  render: Render,
  opts?: QwikCityRequestOptions
): Promise<T | null> {
  try {
    const pathname = requestCtx.url.pathname;
    const { routes, menus, cacheModules, trailingSlash } = { ...cityPlan, ...opts };
    const loadedRoute = await loadRoute(routes, menus, cacheModules, pathname);
    if (loadedRoute) {
      // found and loaded the route for this pathname
      const { mods, params } = loadedRoute;

      // build endpoint response from each module in the hierarchy
      const userResponse = await loadUserResponse(requestCtx, params, mods, trailingSlash);

      // status and headers should be immutable in at this point
      // body may not have resolved yet
      if (userResponse.type === 'endpoint') {
        return endpointHandler(requestCtx, userResponse);
      }

      return pageHandler(requestCtx, userResponse, render, opts);
    }
  } catch (e: any) {
    if (e instanceof RedirectResponse) {
      return redirectResponse(requestCtx, e);
    }
    if (e instanceof ErrorResponse) {
      return errorResponse(requestCtx, e);
    }
    return errorHandler(requestCtx, e);
  }

  // route not found, return null so other server middlewares
  // have the chance to handle this request
  return null;
}
