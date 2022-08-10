import { tmpdir } from 'os';
import { join } from 'path';
import { test } from 'uvu';
import { equal } from 'uvu/assert';
import {
  createFileId,
  getExtension,
  isMarkdownExt,
  isMenuFileName,
  isModuleExt,
  isPageExt,
  isPageModuleExt,
  normalizePath,
  removeExtension,
} from './fs';

const routesDir = normalizePath(join(tmpdir(), 'src', 'routes'));

test('isPageExt', () => {
  const t = [
    { ext: '.tsx', expect: true },
    { ext: '.ts', expect: false },
    { ext: '.jsx', expect: true },
    { ext: '.js', expect: false },
    { ext: '.md', expect: true },
    { ext: '.mdx', expect: true },
    { ext: '.css', expect: false },
  ];
  t.forEach((c) => {
    equal(isPageExt(c.ext), c.expect, c.ext);
  });
});

test('isModuleExt', () => {
  const t = [
    { ext: '.tsx', expect: false },
    { ext: '.ts', expect: true },
    { ext: '.jsx', expect: false },
    { ext: '.js', expect: true },
    { ext: '.md', expect: false },
    { ext: '.mdx', expect: false },
    { ext: '.css', expect: false },
  ];
  t.forEach((c) => {
    equal(isModuleExt(c.ext), c.expect, c.ext);
  });
});

test('isPageModuleExt', () => {
  const t = [
    { ext: '.tsx', expect: true },
    { ext: '.ts', expect: false },
    { ext: '.jsx', expect: true },
    { ext: '.js', expect: false },
    { ext: '.md', expect: false },
    { ext: '.mdx', expect: false },
    { ext: '.css', expect: false },
  ];
  t.forEach((c) => {
    equal(isPageModuleExt(c.ext), c.expect, c.ext);
  });
});

test('isMarkdownExt', () => {
  const t = [
    { ext: '.tsx', expect: false },
    { ext: '.ts', expect: false },
    { ext: '.jsx', expect: false },
    { ext: '.js', expect: false },
    { ext: '.md', expect: true },
    { ext: '.mdx', expect: true },
    { ext: '.css', expect: false },
  ];
  t.forEach((c) => {
    equal(isMarkdownExt(c.ext), c.expect, c.ext);
  });
});

test('isMenuFileName', () => {
  const t = [
    { name: 'menu.md', expect: true },
    { name: 'menu.msx', expect: false },
    { name: 'menu.tsx', expect: false },
    { name: 'menu.ts', expect: false },
  ];
  t.forEach((c) => {
    equal(isMenuFileName(c.name), c.expect, c.name);
  });
});

test('getExtension', () => {
  const t = [
    { name: 'file.dot.dot.PnG ', expect: '.png' },
    { name: 'file.JSX', expect: '.jsx' },
    { name: 'file.d.ts', expect: '.d.ts' },
    { name: 'file.ts', expect: '.ts' },
    { name: 'C:\\path\\to\\file.tsx', expect: '.tsx' },
    { name: 'http://qwik.builder.io/index.mdx', expect: '.mdx' },
    { name: 'file', expect: '' },
    { name: '', expect: '' },
    { name: null, expect: '' },
    { name: undefined, expect: '' },
  ];
  t.forEach((c) => {
    equal(getExtension(c.name!), c.expect, c.name!);
  });
});

test('removeExtension', () => {
  const t = [
    { name: 'file.dot.dot.PnG ', expect: 'file.dot.dot' },
    { name: 'file.JSX', expect: 'file' },
    { name: 'file.d.ts', expect: 'file' },
    { name: 'file.ts', expect: 'file' },
    { name: 'C:\\path\\to\\file.tsx', expect: 'C:\\path\\to\\file' },
    { name: 'http://qwik.builder.io/index.mdx', expect: 'http://qwik.builder.io/index' },
    { name: 'file', expect: 'file' },
    { name: '', expect: '' },
    { name: null, expect: '' },
    { name: undefined, expect: '' },
  ];
  t.forEach((c) => {
    equal(removeExtension(c.name!), c.expect, c.name!);
  });
});

test('createFileId, Page dir/index.tsx', () => {
  const path = normalizePath(join(routesDir, 'docs', 'index.tsx'));
  const p = createFileId(routesDir, path);
  equal(p, 'Docs');
});

test('createFileId, Page about-us.tsx', () => {
  const path = normalizePath(join(routesDir, 'about-us', 'index.tsx'));
  const p = createFileId(routesDir, path);
  equal(p, 'Aboutus');
});

test('createFileId, Endpoint, api/[user]/index.ts', () => {
  const path = normalizePath(join(routesDir, 'api', '[user]', 'index.ts'));
  const p = createFileId(routesDir, path);
  equal(p, 'ApiUser');
});

test('createFileId, Endpoint, data.json.ts', () => {
  const path = normalizePath(join(routesDir, 'api', 'data.json', 'index.ts'));
  const p = createFileId(routesDir, path);
  equal(p, 'ApiData');
});

test('createFileId, Layout', () => {
  const path = normalizePath(join(routesDir, 'dashboard', 'settings', 'layout.tsx'));
  const p = createFileId(routesDir, path);
  equal(p, 'DashboardSettingsLayout');
});

test.run();
