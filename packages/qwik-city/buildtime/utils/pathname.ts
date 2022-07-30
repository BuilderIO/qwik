import { relative, dirname, join, extname } from 'path';
import { DYNAMIC_SEGMENT } from '../routing/parse-pathname';
import type { NormalizedPluginOptions } from '../types';
import { getExtensionLessBasename, is404Name, is500Name, isMarkdownExt, normalizePath } from './fs';

export function getPathnameFromFilePath(opts: NormalizedPluginOptions, filePath: string) {
  // get relative file system path
  const relFilePath = relative(opts.routesDir, filePath);

  // ensure file system path uses / (POSIX) instead of \\ (windows)
  let pathname = normalizePath(relFilePath);

  // remove pathless segments (directories starting with "__")
  pathname = removePathlessSegments(pathname);

  const dirName = normalizePath(dirname(pathname));

  let fileName = getExtensionLessBasename(pathname);
  let layoutName = '';
  let layoutStop = false;

  const namedLayoutParts = fileName.split('@');
  if (namedLayoutParts.length === 2) {
    fileName = namedLayoutParts[0];
    layoutName = namedLayoutParts[1];
  }

  if (fileName.endsWith('!')) {
    layoutStop = true;
    fileName = fileName.substring(0, fileName.length - 1);
  }

  if (fileName === 'index' || is404Name(fileName) || is500Name(fileName)) {
    if (dirName === '.') {
      pathname = `/`;
    } else {
      pathname = `/${dirName}`;
    }
  } else {
    pathname = `/${dirName}/${fileName}`;
  }

  return {
    pathname: normalizePathname(opts, pathname),
    layoutName,
    layoutStop,
  };
}

export function removePathlessSegments(pathname: string) {
  return pathname
    .split('/')
    .filter((segment) => !isPathlessSegment(segment))
    .join('/');
}

export function isPathlessSegment(segment: string) {
  return segment.startsWith('__');
}

export function isDynamicSegment(segment: string) {
  return DYNAMIC_SEGMENT.test(segment);
}

export function getMenuPathname(opts: NormalizedPluginOptions, filePath: string) {
  let pathname = normalizePath(relative(opts.routesDir, filePath));
  pathname = `/` + normalizePath(dirname(pathname));
  return normalizePathname(opts, pathname);
}

export function normalizePathname(opts: NormalizedPluginOptions, pathname: string) {
  pathname = new URL(pathname, 'https://qwik.builder.io/').pathname;

  if (pathname !== '/') {
    if (opts.trailingSlash) {
      if (!pathname.endsWith('/')) {
        pathname += '/';
      }
    } else if (pathname.endsWith('/')) {
      pathname = pathname.slice(0, pathname.length - 1);
    }
  }
  return pathname;
}

export function getMenuLinkHref(opts: NormalizedPluginOptions, menuFilePath: string, href: string) {
  const prefix = href.toLocaleLowerCase();
  if (
    prefix.startsWith('/') ||
    prefix.startsWith('https:') ||
    prefix.startsWith('http:') ||
    prefix.startsWith('file:')
  ) {
    return href;
  }

  const querySplit = href.split('?');
  const hashSplit = href.split('#');
  href = href.split('?')[0].split('#')[0];

  if (!isMarkdownExt(extname(href))) {
    return href;
  }

  const indexDir = dirname(menuFilePath);
  const parts = normalizePath(href)
    .split('/')
    .filter((p) => p.length > 0);
  const filePath = join(indexDir, ...parts);

  let { pathname } = getPathnameFromFilePath(opts, filePath);
  if (querySplit.length > 1) {
    pathname += '?' + querySplit[1];
  } else if (hashSplit.length > 1) {
    pathname += '#' + hashSplit[1];
  }
  return pathname;
}
