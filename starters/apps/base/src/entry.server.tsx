import { qwikCity } from '@builder.io/qwik-city/middleware/express';
import polka from 'polka';
import sirv from 'sirv';
import { fileURLToPath } from 'url';
import { join } from 'path';
import render from './entry.ssr';

// Directories where the static assets are located
const distDir = join(fileURLToPath(import.meta.url), '..', '..', 'dist');
const buildDir = join(distDir, 'build');

// Create the Qwik City server middleware
const { router, notFound } = qwikCity(render);

// Create the http server with polka
// https://github.com/lukeed/polka
const app = polka();

// Static asset middleware with sirv
// https://github.com/lukeed/sirv
app.use(`/build`, sirv(buildDir, { immutable: true }));
app.use(sirv(distDir));

// Use Qwik City's page and endpoint request handler
app.use(router);

// Use Qwik City's 404 handler
app.use(notFound);

// Start the server
app.listen(3000, () => {
  /* eslint-disable */
  console.log(`http://localhost:3000/`);
});
