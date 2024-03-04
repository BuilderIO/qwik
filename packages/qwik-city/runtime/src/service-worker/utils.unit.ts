import type { AppBundle } from './types';
import { getCacheToDelete, isAppBundleRequest, useCache } from './utils';
import { assert, test } from 'vitest';

test('getCacheToDelete, delete bundles no longer possible', () => {
  const appBundles: AppBundle[] = [
    ['q-abc.js', [], []],
    ['q-def.js', [], []],
  ];
  const cachedUrls = [
    'https://qwik.builder.io/build/q-abc.js',
    'https://qwik.builder.io/build/q-xyz.js',
  ];
  const c = getCacheToDelete(appBundles, cachedUrls);
  assert.deepEqual(c, ['https://qwik.builder.io/build/q-xyz.js']);
});

test('getCacheToDelete, none to delete', () => {
  const appBundles: AppBundle[] = [
    ['q-abc.js', [], []],
    ['q-def.js', [], []],
  ];
  const cachedUrls = ['https://qwik.builder.io/build/q-abc.js'];
  const c = getCacheToDelete(appBundles, cachedUrls);
  assert.deepEqual(c, []);
});

test('isAppBundleRequest, in buildBundles', () => {
  const appBundles: AppBundle[] = [
    ['q-abc.js', [], []],
    ['q-def.js', [], []],
  ];
  const pathname = '/build/q-abc.js';
  const c = isAppBundleRequest(appBundles, pathname);
  assert.deepEqual(c, true);
});

test('isAppBundleRequest, not in buildBundles', () => {
  const appBundles: AppBundle[] = [
    ['q-abc.js', [], []],
    ['q-def.js', [], []],
  ];
  const pathname = '/build/q-xyz.js';
  const c = isAppBundleRequest(appBundles, pathname);
  assert.deepEqual(c, false);
});

test('do not useCache, no response', () => {
  const request = mockRequest();
  const response = undefined;
  const c = useCache(request, response);
  assert.deepEqual(c, false);
});

test('do not useCache, response has max-age=0', () => {
  const request = mockRequest();
  const response = mockResponse();
  response.headers.set('cache-control', 'max-age=0');
  const c = useCache(request, response);
  assert.deepEqual(c, false);
});

test('do not useCache, response has no-cache', () => {
  const request = mockRequest();
  const response = mockResponse();
  response.headers.set('cache-control', 'no-cache');
  const c = useCache(request, response);
  assert.deepEqual(c, false);
});

test('useCache', () => {
  const request = mockRequest();
  const response = mockResponse();
  const c = useCache(request, response);
  assert.deepEqual(c, true);
});

export function mockRequest(url?: string): Request {
  url = url || 'https://qwik.builder.io/';
  return new Request(url);
}

export function mockResponse(body?: any): Response {
  return new Response(body);
}
