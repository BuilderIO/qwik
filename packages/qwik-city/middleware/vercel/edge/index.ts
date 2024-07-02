import type {
  ServerRenderOptions,
  ServerRequestEvent,
} from '@builder.io/qwik-city/middleware/request-handler';
import {
  mergeHeadersCookies,
  requestHandler,
} from '@builder.io/qwik-city/middleware/request-handler';
import { getNotFound } from '@qwik-city-not-found-paths';
import { isStaticPath } from '@qwik-city-static-paths';
import { _deserializeData, _serializeData, _verifySerializable } from '@builder.io/qwik';
import { setServerPlatform } from '@builder.io/qwik/server';

// @builder.io/qwik-city/middleware/vercel/edge
const COUNTRY_HEADER_NAME = 'x-vercel-ip-country';
const IP_HEADER_NAME = 'x-real-ip';
const VERCEL_COOKIE = '__vdpl';
const VERCEL_SKEW_PROTECTION_ENABLED = 'VERCEL_SKEW_PROTECTION_ENABLED';
const VERCEL_DEPLOYMENT_ID = 'VERCEL_DEPLOYMENT_ID';
const BASE_URL = 'BASE_URL';

/** @public */
export function createQwikCity(opts: QwikCityVercelEdgeOptions) {
  const qwikSerializer = {
    _deserializeData,
    _serializeData,
    _verifySerializable,
  };
  if (opts.manifest) {
    setServerPlatform(opts.manifest);
  }
  async function onVercelEdgeRequest(request: Request) {
    try {
      const url = new URL(request.url);

      if (isStaticPath(request.method, url)) {
        // known static path, let vercel handle it
        return new Response(null, {
          headers: {
            'x-middleware-next': '1',
          },
        });
      }

      const p = (() => globalThis.process)();

      const serverRequestEv: ServerRequestEvent<Response> = {
        mode: 'server',
        locale: undefined,
        url,
        request,
        env: {
          get(key) {
            return p.env[key];
          },
        },
        getWritableStream: (status, headers, cookies, resolve) => {
          const { readable, writable } = new TransformStream();
          if (serverRequestEv.env.get(VERCEL_SKEW_PROTECTION_ENABLED)) {
            const deploymentId = serverRequestEv.env.get(VERCEL_DEPLOYMENT_ID) || '';
            const baseUrl = serverRequestEv.env.get(BASE_URL) || '/';
            // only on document request
            if (request.headers.has('Sec-Fetch-Dest')) {
              // set cookie before creating response
              cookies.set(VERCEL_COOKIE, deploymentId, {
                path: baseUrl,
                secure: true,
                sameSite: true,
                httpOnly: true,
              });
            }
          }
          const response = new Response(readable, {
            status,
            headers: mergeHeadersCookies(headers, cookies),
          });
          resolve(response);
          return writable;
        },
        platform: {},
        getClientConn: () => {
          return {
            ip: request.headers.get(IP_HEADER_NAME) ?? undefined,
            country: request.headers.get(COUNTRY_HEADER_NAME) ?? undefined,
          };
        },
      };

      // send request to qwik city request handler
      const handledResponse = await requestHandler(serverRequestEv, opts, qwikSerializer);
      if (handledResponse) {
        handledResponse.completion.then((v) => {
          if (v) {
            console.error(v);
          }
        });
        const response = await handledResponse.response;
        if (response) {
          return response;
        }
      }

      // qwik city did not have a route for this request
      // response with 404 for this pathname

      // In the development server, we replace the getNotFound function
      // For static paths, we assign a static "Not Found" message.
      // This ensures consistency between development and production environments for specific URLs.
      const notFoundHtml = isStaticPath(request.method || 'GET', url)
        ? 'Not Found'
        : getNotFound(url.pathname);
      return new Response(notFoundHtml, {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Not-Found': url.pathname },
      });
    } catch (e: any) {
      console.error(e);
      return new Response(String(e || 'Error'), {
        status: 500,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Error': 'vercel-edge' },
      });
    }
  }

  return onVercelEdgeRequest;
}

/** @public */
export interface QwikCityVercelEdgeOptions extends ServerRenderOptions {}

/** @public */
export interface PlatformVercelEdge {}

/** For backward compatibility */
/** @public */
export interface PlatformVercel {}
