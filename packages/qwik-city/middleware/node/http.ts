import type { IncomingMessage, ServerResponse } from 'node:http';
import { Http2ServerRequest } from 'node:http2';
import type {
  ServerRequestMode,
  ServerRequestEvent,
} from '@builder.io/qwik-city/middleware/request-handler';
import type { ClientConn } from '../request-handler/types';
import type { QwikCityNodeRequestOptions } from '.';

export function computeOrigin(
  req: IncomingMessage | Http2ServerRequest,
  opts?: QwikCityNodeRequestOptions
) {
  return opts?.getOrigin?.(req) ?? opts?.origin ?? process.env.ORIGIN ?? fallbackOrigin(req);
}

function fallbackOrigin(req: IncomingMessage | Http2ServerRequest) {
  const { PROTOCOL_HEADER, HOST_HEADER } = process.env;
  const headers = req.headers;
  const protocol =
    (PROTOCOL_HEADER && headers[PROTOCOL_HEADER]) ||
    ((req.socket as any).encrypted || (req.connection as any).encrypted ? 'https' : 'http');
  const hostHeader = HOST_HEADER ?? (req instanceof Http2ServerRequest ? ':authority' : 'host');
  const host = headers[hostHeader];

  return `${protocol}://${host}`;
}

export function getUrl(req: IncomingMessage | Http2ServerRequest, origin: string) {
  return normalizeUrl((req as any).originalUrl || req.url || '/', origin);
}

const DOUBLE_SLASH_REG = /\/\/|\\\\/g;

export function normalizeUrl(url: string, base: string) {
  // do not allow the url to have a relative protocol url
  // which could bypass of CSRF protections
  // for example: new URL("//attacker.com", "https://qwik.build.io")
  // would return "https://attacker.com" when it should be "https://qwik.build.io/attacker.com"
  return new URL(url.replace(DOUBLE_SLASH_REG, '/'), base);
}

export async function fromNodeHttp(
  url: URL,
  req: IncomingMessage | Http2ServerRequest,
  res: ServerResponse,
  mode: ServerRequestMode,
  getClientConn?: (req: IncomingMessage | Http2ServerRequest) => ClientConn
) {
  const requestHeaders = new Headers();
  const nodeRequestHeaders = req.headers;
  for (const key in nodeRequestHeaders) {
    const value = nodeRequestHeaders[key];
    if (typeof value === 'string') {
      requestHeaders.set(key, value);
    } else if (Array.isArray(value)) {
      for (const v of value) {
        requestHeaders.append(key, v);
      }
    }
  }

  const getRequestBody = async function* () {
    for await (const chunk of req as any) {
      yield chunk;
    }
  };

  const body = req.method === 'HEAD' || req.method === 'GET' ? undefined : getRequestBody();
  const controller = new AbortController();
  const options = {
    method: req.method,
    headers: requestHeaders,
    body: body as any,
    signal: controller.signal,
    duplex: 'half' as any,
  };
  res.on('close', () => {
    controller.abort();
  });
  const serverRequestEv: ServerRequestEvent<boolean> = {
    mode,
    url,
    request: new Request(url.href, options as any),
    env: {
      get(key) {
        return process.env[key];
      },
    },
    getWritableStream: (status, headers, cookies) => {
      res.statusCode = status;
      let once = true;
      headers.forEach((value, key) => res.setHeader(key, value));

      return new WritableStream<Uint8Array>({
        write(chunk) {
          // set headers once but allow for dev to add cookie values
          if (once) {
            const cookieHeaders = cookies.headers();
            if (cookieHeaders.length > 0) {
              res.setHeader('Set-Cookie', cookieHeaders);
            }
            once = false;
          }
          if (res.closed || res.destroyed) {
            // If the response has already been closed or destroyed (for example the client has disconnected)
            // then writing into it will cause an error. So just stop writing since no one
            // is listening.
            return;
          }
          res.write(chunk, (error) => {
            if (error) {
              console.error(error);
            }
          });
        },
        close() {
          res.end();
        },
      });
    },
    getClientConn: () => {
      return getClientConn
        ? getClientConn(req)
        : {
            ip: req.socket.remoteAddress,
          };
    },
    platform: {
      ssr: true,
      incomingMessage: req,
      node: process.versions.node,

      // Weirdly needed to make typecheck of insights happy
    } as QwikCityPlatform,
    locale: undefined,
  };

  return serverRequestEv;
}
