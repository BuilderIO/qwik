import type {
  HttpMethod,
  EndpointResponse,
  QwikCityUserContext,
  RouteLocation,
  RouteParams,
} from '../../runtime/src/library/types';

export function isAcceptJsonOnly(request: Request) {
  return request.headers.get('accept') === 'application/json';
}

export function getQwikCityUserContext(
  url: URL,
  params: RouteParams,
  method: HttpMethod,
  endpointResponse: EndpointResponse
): QwikCityUserContext {
  const qcRoute: RouteLocation = {
    hash: url.hash,
    hostname: url.hostname,
    href: url.href,
    params: { ...params },
    pathname: url.pathname,
    query: {},
    search: url.search,
  };
  url.searchParams.forEach((value, key) => (qcRoute.query[key] = value));

  return {
    qcRoute,
    qcRequest: {
      method,
    },
    qcResponse: endpointResponse,
  };
}
