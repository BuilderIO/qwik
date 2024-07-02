import { createQwikCity as createQwikCityNode } from '@builder.io/qwik-city/middleware/node';
import type { ServerRenderOptions } from '@builder.io/qwik-city/middleware/request-handler';

import type { Http2ServerRequest } from 'node:http2';
import type { IncomingMessage, ServerResponse } from 'node:http';
import * as process from 'node:process';

// @builder.io/qwik-city/middleware/vercel/serverless
const VERCEL_COOKIE = '__vdpl';
const VERCEL_SKEW_PROTECTION_ENABLED = 'VERCEL_SKEW_PROTECTION_ENABLED';
const VERCEL_DEPLOYMENT_ID = 'VERCEL_DEPLOYMENT_ID';
const BASE_URL = 'BASE_URL';

/** @public */
export function createQwikCity(opts: QwikCityVercelServerlessOptions) {
  const { router } = createQwikCityNode(opts);

  return function onVercelServerlessRequest(
    req: IncomingMessage | Http2ServerRequest,
    res: ServerResponse,
    next: (err?: any) => void
  ) {
    try {
      if (process.env[VERCEL_SKEW_PROTECTION_ENABLED]) {
        const deploymentId = process.env[VERCEL_DEPLOYMENT_ID] || '';
        const baseUrl = process.env[BASE_URL] || '/';

        // Only on document request
        if (req.headers['sec-fetch-dest']) {
          // set cookie before creating response
          const cookieName = VERCEL_COOKIE;
          const cookieValue = deploymentId;
          const cookieOptions = [`Path=${baseUrl}`, 'Secure', 'SameSite=Strict', 'HttpOnly'];
          const cookieString = `${cookieName}=${cookieValue}; ${cookieOptions.join('; ')}`;

          // Set the cookie header
          res.setHeader('Set-Cookie', cookieString);
        }
      }

      router(req, res, next);
    } catch (err: any) {
      throw new Error(err.message);
    }
  };
}

/** @public */
export interface QwikCityVercelServerlessOptions extends ServerRenderOptions {}

/** @public */
export interface PlatformVercelServerless {}
