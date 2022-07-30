import * as assert from 'uvu/assert';
import * as utils from './pathname';
import { join } from 'path';
import { suite } from './test-suite';

const test = suite();

test('pathname from _404', ({ opts }) => {
  const filePath = join(opts.routesDir, '_404.tsx');
  const { pathname, layoutName, layoutStop } = utils.getPathnameFromFilePath(opts, filePath);
  assert.is(pathname, '/');
  assert.is(layoutName, '');
  assert.is(layoutStop, false);
});

test('pathname from _500', ({ opts }) => {
  const filePath = join(opts.routesDir, '_500.tsx');
  const { pathname, layoutName, layoutStop } = utils.getPathnameFromFilePath(opts, filePath);
  assert.is(pathname, '/');
  assert.is(layoutName, '');
  assert.is(layoutStop, false);
});

test('layoutStop pathname from index!.tsx', ({ opts }) => {
  const filePath = join(opts.routesDir, 'index!.tsx');
  const { pathname, layoutName, layoutStop } = utils.getPathnameFromFilePath(opts, filePath);
  assert.is(pathname, '/');
  assert.is(layoutName, '');
  assert.is(layoutStop, true);
});

test('pathname from index.tsx', ({ opts }) => {
  const filePath = join(opts.routesDir, 'index.tsx');
  const { pathname, layoutName, layoutStop } = utils.getPathnameFromFilePath(opts, filePath);
  assert.is(pathname, '/');
  assert.is(layoutName, '');
  assert.is(layoutStop, false);
});

test('pathname from index@layout.tsx', ({ opts }) => {
  const filePath = join(opts.routesDir, 'index@layout.tsx');
  const { pathname, layoutName, layoutStop } = utils.getPathnameFromFilePath(opts, filePath);
  assert.is(pathname, '/');
  assert.is(layoutName, 'layout');
  assert.is(layoutStop, false);
});

test('pathname from index.mdx', ({ opts }) => {
  const filePath = join(opts.routesDir, 'index.mdx');
  const { pathname, layoutName, layoutStop } = utils.getPathnameFromFilePath(opts, filePath);
  assert.is(pathname, '/');
  assert.is(layoutName, '');
  assert.is(layoutStop, false);
});

test('pathname from index@layout.mdx', ({ opts }) => {
  const filePath = join(opts.routesDir, 'index@layout.mdx');
  const { pathname, layoutName, layoutStop } = utils.getPathnameFromFilePath(opts, filePath);
  assert.is(pathname, '/');
  assert.is(layoutName, 'layout');
  assert.is(layoutStop, false);
});

test('pathname from index.mdx, trailingSlash', ({ opts }) => {
  opts.trailingSlash = true;
  const filePath = join(opts.routesDir, 'index.mdx');
  const { pathname, layoutName, layoutStop } = utils.getPathnameFromFilePath(opts, filePath);
  assert.is(pathname, '/');
  assert.is(layoutStop, false);
  assert.is(layoutName, '');
});

test('pathname from index@layout.mdx, trailingSlash', ({ opts }) => {
  opts.trailingSlash = true;
  const filePath = join(opts.routesDir, 'index@layout.mdx');
  const { pathname, layoutName, layoutStop } = utils.getPathnameFromFilePath(opts, filePath);
  assert.is(pathname, '/');
  assert.is(layoutName, 'layout');
  assert.is(layoutStop, false);
});

test('pathname from index.tsx, trailingSlash', ({ opts }) => {
  opts.trailingSlash = true;
  const filePath = join(opts.routesDir, 'index.tsx');
  const { pathname, layoutName, layoutStop } = utils.getPathnameFromFilePath(opts, filePath);
  assert.is(pathname, '/');
  assert.is(layoutName, '');
  assert.is(layoutStop, false);
});

test('pathname from index@layout.tsx, trailingSlash', ({ opts }) => {
  opts.trailingSlash = true;
  const filePath = join(opts.routesDir, 'index@layout.tsx');
  const { pathname, layoutName, layoutStop } = utils.getPathnameFromFilePath(opts, filePath);
  assert.is(pathname, '/');
  assert.is(layoutName, 'layout');
  assert.is(layoutStop, false);
});

test('pathname from index.md', ({ opts }) => {
  const filePath = join(opts.routesDir, 'index.md');
  const { pathname, layoutName, layoutStop } = utils.getPathnameFromFilePath(opts, filePath);
  assert.is(pathname, '/');
  assert.is(layoutName, '');
  assert.is(layoutStop, false);
});

test('index in subdirectory, trailingSlash', ({ opts }) => {
  opts.trailingSlash = true;
  const filePath = join(opts.routesDir, 'dir', 'index.md');
  const { pathname, layoutName } = utils.getPathnameFromFilePath(opts, filePath);
  assert.is(pathname, '/dir/');
  assert.is(layoutName, '');
});

test('index in subdirectory, trailingSlash', ({ opts }) => {
  opts.trailingSlash = true;
  const filePath = join(opts.routesDir, 'dir', 'index@layout.md');
  const { pathname, layoutName } = utils.getPathnameFromFilePath(opts, filePath);
  assert.is(pathname, '/dir/');
  assert.is(layoutName, 'layout');
});

test('index in subdirectory', ({ opts }) => {
  const filePath = join(opts.routesDir, 'dir', 'index.md');
  const { pathname, layoutName } = utils.getPathnameFromFilePath(opts, filePath);
  assert.is(pathname, '/dir');
  assert.is(layoutName, '');
});

test('index in subdirectory', ({ opts }) => {
  const filePath = join(opts.routesDir, 'dir', 'index@layout.md');
  const { pathname, layoutName } = utils.getPathnameFromFilePath(opts, filePath);
  assert.is(pathname, '/dir');
  assert.is(layoutName, 'layout');
});

test('pathname from page@layout.mdx', ({ opts }) => {
  const filePath = join(opts.routesDir, 'page@layout.mdx');
  const { pathname, layoutName } = utils.getPathnameFromFilePath(opts, filePath);
  assert.is(pathname, '/page');
  assert.is(layoutName, 'layout');
});

test('pathname from page.mdx', ({ opts }) => {
  const filePath = join(opts.routesDir, 'page.mdx');
  const { pathname, layoutName } = utils.getPathnameFromFilePath(opts, filePath);
  assert.is(pathname, '/page');
  assert.is(layoutName, '');
});

test('pathname from page@layout.mdx', ({ opts }) => {
  const filePath = join(opts.routesDir, 'page@layout.mdx');
  const { pathname, layoutName } = utils.getPathnameFromFilePath(opts, filePath);
  assert.is(pathname, '/page');
  assert.is(layoutName, 'layout');
});

test('pathname from page.mdx, trailingSlash', ({ opts }) => {
  opts.trailingSlash = true;
  const filePath = join(opts.routesDir, 'page.mdx');
  const { pathname, layoutName } = utils.getPathnameFromFilePath(opts, filePath);
  assert.is(pathname, '/page/');
  assert.is(layoutName, '');
});

test('pathname from page@layout.mdx, trailingSlash', ({ opts }) => {
  opts.trailingSlash = true;
  const filePath = join(opts.routesDir, 'page@layout.mdx');
  const { pathname, layoutName } = utils.getPathnameFromFilePath(opts, filePath);
  assert.is(pathname, '/page/');
  assert.is(layoutName, 'layout');
});

test('pathname from dir/page.mdx', ({ opts }) => {
  const filePath = join(opts.routesDir, 'dir', 'page.mdx');
  const { pathname, layoutName } = utils.getPathnameFromFilePath(opts, filePath);
  assert.is(pathname, '/dir/page');
  assert.is(layoutName, '');
});

test('pathname from dir/page@layout.mdx', ({ opts }) => {
  const filePath = join(opts.routesDir, 'dir', 'page@layout.mdx');
  const { pathname, layoutName } = utils.getPathnameFromFilePath(opts, filePath);
  assert.is(pathname, '/dir/page');
  assert.is(layoutName, 'layout');
});

test('pathname from dir/page.mdx, trailingSlash', ({ opts }) => {
  opts.trailingSlash = true;
  const filePath = join(opts.routesDir, 'dir', 'page.mdx');
  const { pathname, layoutName } = utils.getPathnameFromFilePath(opts, filePath);
  assert.is(pathname, '/dir/page/');
  assert.is(layoutName, '');
});

test('pathname from dir/page@layout.mdx, trailingSlash', ({ opts }) => {
  opts.trailingSlash = true;
  const filePath = join(opts.routesDir, 'dir', 'page@layout.mdx');
  const { pathname, layoutName } = utils.getPathnameFromFilePath(opts, filePath);
  assert.is(pathname, '/dir/page/');
  assert.is(layoutName, 'layout');
});

test('pathname with pathless directories', ({ opts }) => {
  const filePath = join(opts.routesDir, '__pathless', 'account', '__route', 'sign-up.mdx');
  const { pathname, layoutName } = utils.getPathnameFromFilePath(opts, filePath);
  assert.is(pathname, '/account/sign-up');
  assert.is(layoutName, '');
});

test('pathname with pathless directories, trailingSlash', ({ opts }) => {
  opts.trailingSlash = true;
  const filePath = join(opts.routesDir, '__pathless', 'account', '__route', 'sign-up.mdx');
  const { pathname, layoutName } = utils.getPathnameFromFilePath(opts, filePath);
  assert.is(pathname, '/account/sign-up/');
  assert.is(layoutName, '');
});

test('menu pathname from guide/menu.md', ({ opts }) => {
  const filePath = join(opts.routesDir, 'guide', 'menu.md');
  const pathname = utils.getMenuPathname(opts, filePath);
  assert.is(pathname, '/guide');
});

test('menu pathname from a/b/c/menu.md', ({ opts }) => {
  const filePath = join(opts.routesDir, 'a', 'b', 'c', 'menu.md');
  const pathname = utils.getMenuPathname(opts, filePath);
  assert.is(pathname, '/a/b/c');
});

test('menu pathname from guide/menu.md, trailingSlash', ({ opts }) => {
  opts.trailingSlash = true;
  const filePath = join(opts.routesDir, 'guide', 'menu.md');
  const pathname = utils.getMenuPathname(opts, filePath);
  assert.is(pathname, '/guide/');
});

test('index href guides/getting-started.mdx', ({ opts }) => {
  const href = './getting-started.mdx';
  const indexFilePath = join(opts.routesDir, 'guide', 'README.md');
  const pathname = utils.getMenuLinkHref(opts, indexFilePath, href);
  assert.is(pathname, '/guide/getting-started');
});

test('index href guides/getting-started.mdx?intro', ({ opts }) => {
  const href = './getting-started.mdx?intro';
  const indexFilePath = join(opts.routesDir, 'guide', 'components', 'README.md');
  const pathname = utils.getMenuLinkHref(opts, indexFilePath, href);
  assert.is(pathname, '/guide/components/getting-started?intro');
});

test('index href guides/getting-started.mdx#intro', ({ opts }) => {
  const href = './getting-started.mdx#intro';
  const indexFilePath = join(opts.routesDir, 'guide', 'components', 'README.md');
  const pathname = utils.getMenuLinkHref(opts, indexFilePath, href);
  assert.is(pathname, '/guide/components/getting-started#intro');
});

test('index href /link', ({ opts }) => {
  const href = '/link';
  const indexFilePath = join(opts.routesDir, 'guide', 'README.md');
  const pathname = utils.getMenuLinkHref(opts, indexFilePath, href);
  assert.is(pathname, '/link');
});

test('index href http://builder.io/', ({ opts }) => {
  const href = 'http://builder.io/';
  const indexFilePath = join(opts.routesDir, 'guide', 'README.md');
  const pathname = utils.getMenuLinkHref(opts, indexFilePath, href);
  assert.is(pathname, 'http://builder.io/');
});

test('index href ./getting-started.txt', ({ opts }) => {
  const href = './getting-started.txt';
  const indexFilePath = join(opts.routesDir, 'guide', 'README.md');
  const pathname = utils.getMenuLinkHref(opts, indexFilePath, href);
  assert.is(pathname, './getting-started.txt');
});

test('normalizePathname /, trailing slash', ({ opts }) => {
  opts.trailingSlash = true;
  const pathname = utils.normalizePathname(opts, '/');
  assert.is(pathname, '/');
});

test('normalizePathname /, no trailing slash', ({ opts }) => {
  opts.trailingSlash = false;
  const pathname = utils.normalizePathname(opts, '/');
  assert.is(pathname, '/');
});

test('normalizePathname /name, trailing slash', ({ opts }) => {
  opts.trailingSlash = true;
  const pathname = utils.normalizePathname(opts, '/name');
  assert.is(pathname, '/name/');
});

test('normalizePathname /name, no trailing slash', ({ opts }) => {
  opts.trailingSlash = false;
  const pathname = utils.normalizePathname(opts, '/name');
  assert.is(pathname, '/name');
});

test('normalizePathname /name/, trailing slash', ({ opts }) => {
  opts.trailingSlash = true;
  const pathname = utils.normalizePathname(opts, '/name/');
  assert.is(pathname, '/name/');
});

test('normalizePathname /name/, no trailing slash', ({ opts }) => {
  opts.trailingSlash = false;
  const pathname = utils.normalizePathname(opts, '/name/');
  assert.is(pathname, '/name');
});

test('normalizePathname encoded', ({ opts }) => {
  const pathname = utils.normalizePathname(opts, '/plz no spaces');
  assert.is(pathname, '/plz%20no%20spaces');
});

test.run();
