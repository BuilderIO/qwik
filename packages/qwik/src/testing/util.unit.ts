import { normalizeUrl } from './util';
import { suite } from 'uvu';
import { equal } from 'uvu/assert';

const normalizeUrlSuite = suite('normalizeUrl');
normalizeUrlSuite('no url', () => {
  equal(normalizeUrl(null).href, 'http://document.qwik.dev/');
  equal(normalizeUrl(undefined).href, 'http://document.qwik.dev/');
  equal(normalizeUrl('').href, 'http://document.qwik.dev/');
  equal(normalizeUrl({} as any).href, 'http://document.qwik.dev/');
});

normalizeUrlSuite('string, full url', () => {
  const url = normalizeUrl('https://my.qwik.dev/some-path?query=string#hash');
  equal(url.pathname, '/some-path');
  equal(url.hash, '#hash');
  equal(url.searchParams.get('query'), 'string');
  equal(url.origin, 'https://my.qwik.dev');
  equal(url.href, 'https://my.qwik.dev/some-path?query=string#hash');
});

normalizeUrlSuite('string, pathname', () => {
  const url = normalizeUrl('/some-path?query=string#hash');
  equal(url.pathname, '/some-path');
  equal(url.hash, '#hash');
  equal(url.searchParams.get('query'), 'string');
  equal(url.origin, 'http://document.qwik.dev');
  equal(url.href, 'http://document.qwik.dev/some-path?query=string#hash');
});

normalizeUrlSuite.run();
