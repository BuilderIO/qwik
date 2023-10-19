import type { ServerRenderOptions } from '@builder.io/qwik-city/middleware/request-handler';
import type { Http2ServerRequest } from 'node:http2';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createQwikCity as createNodeQwikCity } from '../node/index';

/**
 * @public
 */
export function createQwikCity(opts: QwikCityVercelServerlessOptions) {
  const qwikCity = createNodeQwikCity(opts);

  async function onVercelServerlessRequest(
    req: IncomingMessage | Http2ServerRequest,
    res: ServerResponse,
    next: (err?: any) => void
  ) {
    qwikCity.router(req, res, next);
  }

  return onVercelServerlessRequest;
}

/**
 * @public
 */
export interface QwikCityVercelServerlessOptions extends ServerRenderOptions {}

/**
 * @public
 */
export interface PlatformVercel {}
