import replServerHtml from '@repl-server-html';
import type { EndpointHandler } from '@builder.io/qwik-city';

export const onGet: EndpointHandler = ({ response }) => {
  response.headers.set('Content-Type', 'text/html; charset=utf-8');
  response.headers.set('Cache-Control', 'immutable');
  return replServerHtml;
};
