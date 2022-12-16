import { component$, Slot } from '@builder.io/qwik';
import { RequestHandler, loader$ } from '@builder.io/qwik-city';
import { isUserAuthenticated } from '../auth/auth';

export const rootLoader = loader$(() => {
  return {
    serverTime: new Date().toISOString(),
    nodeVersion: process.version,
  };
});

export const userLoader = loader$(async ({ cookie }) => {
  return {
    isAuthenticated: await isUserAuthenticated(cookie),
  };
});

export default component$(() => {
  return <Slot />;
});

export const onGet: RequestHandler = ({ headers }) => {
  // cache for a super long time of 10 seconds for pages using this layout
  headers.set('Cache-Control', 'max-age=10');
};
