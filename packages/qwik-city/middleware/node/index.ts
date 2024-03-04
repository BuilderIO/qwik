import type {
  ServerRenderOptions,
  ClientConn,
} from '@builder.io/qwik-city/middleware/request-handler';
import { requestHandler } from '@builder.io/qwik-city/middleware/request-handler';
import { setServerPlatform } from '@builder.io/qwik/server';
import { getNotFound } from '@qwik-city-not-found-paths';
import { isStaticPath } from '@qwik-city-static-paths';
import { createReadStream } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeOrigin, fromNodeHttp, getUrl } from './http';
import { MIME_TYPES } from '../request-handler/mime-types';
import { _deserializeData, _serializeData, _verifySerializable } from '@builder.io/qwik';
import type { Http2ServerRequest } from 'node:http2';

// @builder.io/qwik-city/middleware/node

/** @public */
export function createQwikCity(opts: QwikCityNodeRequestOptions) {
  const qwikSerializer = {
    _deserializeData,
    _serializeData,
    _verifySerializable,
  };
  if (opts.manifest) {
    setServerPlatform(opts.manifest);
  }
  const staticFolder =
    opts.static?.root ?? join(fileURLToPath(import.meta.url), '..', '..', 'dist');

  const router = async (
    req: IncomingMessage | Http2ServerRequest,
    res: ServerResponse,
    next: NodeRequestNextFunction
  ) => {
    try {
      const origin = computeOrigin(req, opts);
      const serverRequestEv = await fromNodeHttp(
        getUrl(req, origin),
        req,
        res,
        'server',
        opts.getClientConn
      );
      const handled = await requestHandler(serverRequestEv, opts, qwikSerializer);
      if (handled) {
        const err = await handled.completion;
        if (err) {
          throw err;
        }
        if (handled.requestEv.headersSent) {
          return;
        }
      }
      next();
    } catch (e) {
      console.error(e);
      next(e);
    }
  };

  const notFound = async (
    req: IncomingMessage | Http2ServerRequest,
    res: ServerResponse,
    next: (e: any) => void
  ) => {
    try {
      if (!res.headersSent) {
        const origin = computeOrigin(req, opts);
        const url = getUrl(req, origin);
        const notFoundHtml = getNotFound(url.pathname);
        res.writeHead(404, {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Not-Found': url.pathname,
        });
        res.end(notFoundHtml);
      }
    } catch (e) {
      console.error(e);
      next(e);
    }
  };

  const staticFile = async (
    req: IncomingMessage | Http2ServerRequest,
    res: ServerResponse,
    next: (e?: any) => void
  ) => {
    try {
      const origin = computeOrigin(req, opts);
      const url = getUrl(req, origin);
      if (isStaticPath(req.method || 'GET', url)) {
        const pathname = url.pathname;
        let filePath: string;
        if (basename(pathname).includes('.')) {
          filePath = join(staticFolder, pathname);
        } else if (opts.qwikCityPlan.trailingSlash) {
          filePath = join(staticFolder, pathname + 'index.html');
        } else {
          filePath = join(staticFolder, pathname, 'index.html');
        }
        const stream = createReadStream(filePath);
        const ext = extname(filePath).replace(/^\./, '');

        const contentType = MIME_TYPES[ext];

        if (contentType) {
          res.setHeader('Content-Type', contentType);
        }

        if (opts.static?.cacheControl) {
          res.setHeader('Cache-Control', opts.static.cacheControl);
        }

        stream.on('error', next);
        stream.pipe(res);

        return;
      }

      return next();
    } catch (e) {
      console.error(e);
      next(e);
    }
  };

  return {
    router,
    notFound,
    staticFile,
  };
}

/** @public */
export interface PlatformNode {
  ssr?: true;
  incomingMessage?: IncomingMessage | Http2ServerRequest;
  node?: string;
}

/** @public */
export interface QwikCityNodeRequestOptions extends ServerRenderOptions {
  /** Options for serving static files */
  static?: {
    /** The root folder for statics files. Defaults to /dist */
    root?: string;
    /** Set the Cache-Control header for all static files */
    cacheControl?: string;
  };

  /**
   * Provide a function that computes the origin of the server, used to resolve relative URLs and
   * validate the request origin against CSRF attacks.
   *
   * When not specified, it defaults to the `ORIGIN` environment variable (if set).
   *
   * If `ORIGIN` is not set, it's derived from the incoming request, which is not recommended for
   * production use. You can specify the `PROTOCOL_HEADER`, `HOST_HEADER` to `X-Forwarded-Proto` and
   * `X-Forwarded-Host` respectively to override the default behavior.
   */
  getOrigin?: (req: IncomingMessage | Http2ServerRequest) => string | null;

  /** Provide a function that returns a `ClientConn` for the given request. */
  getClientConn?: (req: IncomingMessage | Http2ServerRequest) => ClientConn;

  /** @deprecated Use `getOrigin` instead. */
  origin?: string;
}

/** @public */
export interface NodeRequestNextFunction {
  (err?: any): void;
}
