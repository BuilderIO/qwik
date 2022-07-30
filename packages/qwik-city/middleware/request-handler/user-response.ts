import { Headers as HeadersPolyfill } from 'headers-polyfill';
import type {
  EndpointHandler,
  EndpointModule,
  RequestContext,
  RequestEvent,
  ResponseContext,
  RouteParams,
} from '../../runtime/src/library/types';
import type { UserResponseContext } from './types';

export async function loadUserResponse(
  request: RequestContext,
  url: URL,
  params: RouteParams,
  endpointModules: EndpointModule[],
  trailingSlash: boolean | undefined,
  isEndpointOnly: boolean
) {
  const userResponse: UserResponseContext = {
    url,
    params,
    status: 200,
    headers: new (typeof Headers === 'function' ? Headers : HeadersPolyfill)(),
    body: undefined,
    type: 'endpoint',
  };

  if (!isEndpointOnly) {
    isEndpointOnly = request.headers.get('Accept') === 'application/json';
  }
  const { pathname } = url;

  if (!isEndpointOnly) {
    isEndpointOnly = request.headers.get('Accept') === 'application/json';
  }

  if (!isEndpointOnly && pathname !== '/') {
    // only check for slash redirect on pages
    if (trailingSlash) {
      // must have a trailing slash
      if (!pathname.endsWith('/')) {
        // add slash to existing pathname
        return pageRedirect(userResponse, pathname + '/');
      }
    } else {
      // should not have a trailing slash
      if (pathname.endsWith('/')) {
        // remove slash from existing pathname
        return pageRedirect(userResponse, pathname.slice(0, pathname.length - 1));
      }
    }
  }

  let middlewareIndex = -1;
  let hasRequestHandler = false;

  const abort = () => {
    middlewareIndex = ABORT_INDEX;
  };

  const redirect = (url: string, status?: number) => {
    userResponse.status = typeof status === 'number' ? status : 307;
    userResponse.headers.set('Location', url);
    abort();
  };

  const response: ResponseContext = {
    get status() {
      return userResponse.status;
    },
    set status(code) {
      userResponse.status = code;
    },
    headers: userResponse.headers,
    redirect,
  };

  const next = async () => {
    middlewareIndex++;

    while (middlewareIndex < endpointModules.length) {
      const endpointModule = endpointModules[middlewareIndex];

      let reqHandler: EndpointHandler | undefined = undefined;

      switch (request.method) {
        case 'GET': {
          reqHandler = endpointModule.onGet;
          break;
        }
        case 'POST': {
          reqHandler = endpointModule.onPost;
          break;
        }
        case 'PUT': {
          reqHandler = endpointModule.onPut;
          break;
        }
        case 'PATCH': {
          reqHandler = endpointModule.onPatch;
          break;
        }
        case 'OPTIONS': {
          reqHandler = endpointModule.onOptions;
          break;
        }
        case 'HEAD': {
          reqHandler = endpointModule.onHead;
          break;
        }
        case 'DELETE': {
          reqHandler = endpointModule.onDelete;
          break;
        }
      }

      reqHandler = reqHandler || endpointModule.onRequest;

      if (typeof reqHandler === 'function') {
        hasRequestHandler = true;

        // create user request event, which is a narrowed down request context
        const requstEv: RequestEvent = {
          request,
          url,
          params,
          response,
          next,
          abort,
        };

        // get the user's endpoint return data
        userResponse.body = await reqHandler(requstEv);
      }

      middlewareIndex++;
    }
  };

  await next();

  if (userResponse.status >= 300 && userResponse.status <= 399) {
    // already know it's a redirect, no need to continue
    return userResponse;
  }

  if (isEndpointOnly) {
    // this can only be an endpoint response and not a content page render/response

    if (!hasRequestHandler) {
      // can only be an endpoint but there wasn't a handler for this method
      userResponse.status = 405;
      userResponse.headers.set('Content-Type', 'text/plain; charset=utf-8');
      userResponse.body = `Method Not Allowed: ${request.method}`;
    } else {
      if (!userResponse.headers.has('Content-Type')) {
        // default to use a application/json content type response
        userResponse.headers.set('Content-Type', 'application/json; charset=utf-8');
      }

      // the data from each layout/page endpoint is already completed in "body"
      if (userResponse.headers.get('Content-Type')!.startsWith('application/json')) {
        // JSON response, stringify the body
        userResponse.body = JSON.stringify(userResponse.body);
      } else if (userResponse.body != null) {
        // serialize for a string response
        const type = typeof userResponse.body;
        if (type === 'string' || type === 'number' || type === 'boolean') {
          userResponse.body = String(userResponse.body);
        } else {
          // don't know how to serialize this object for the response
          throw new Error(`Unsupport response body type`);
        }
      }
    }
  } else {
    // not an endpoint or a redirect only response
    // but the route matched, so a content page response
    userResponse.type = 'page';

    // default to text/html content if it wasn't provided
    if (!userResponse.headers.has('Content-Type')) {
      userResponse.headers.set('Content-Type', 'text/html; charset=utf-8');
    }
  }

  return userResponse;
}

function pageRedirect(userResponseContext: UserResponseContext, updatedPathname: string) {
  userResponseContext.status = 308;
  userResponseContext.headers.set('Location', updatedPathname + userResponseContext.url.search);
  return userResponseContext;
}

const ABORT_INDEX = 999999999;
