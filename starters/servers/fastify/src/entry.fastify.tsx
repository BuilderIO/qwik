/* eslint-disable no-console */
import Fastify from 'fastify';
import staticPlugin from '@fastify/static';
import { join } from 'path';
import { render } from './entry.ssr';

/**
 * Create a fastify server
 * https://fastify.io/
 */
const app = Fastify();

/**
 * Serve static client build files,
 * hashed filenames, immutable cache-control
 */
app.register(staticPlugin, {
  prefix: '/build/',
  root: join(__dirname, '..', 'dist', 'build'),
  immutable: true,
  maxAge: '1y',
});

/**
 * Serve static public files at the root
 */
app.register(staticPlugin, {
  root: join(__dirname, '..', 'dist'),
  index: false,
  decorateReply: false,
  wildcard: false,
});

/**
 * Server-Side Render Qwik application
 */
app.get('/*', async (request, reply) => {
  try {
    // Render the Root component to a string
    const result = await render({
      url: request.url,
    });

    // respond with SSR'd HTML
    reply.type('text/html').send(result.html);
  } catch (e) {
    // Error while server-side rendering
    app.log.error(e);
    throw e;
  }
});

/**
 * Start the fastify server
 */
app.listen({ port: 8080 }, (e) => {
  if (e) {
    console.error(e.message);
    process.exit(1);
  }

  console.log(`http://localhost:8080/`);
});
