import { dirname } from 'path';
import { resolveMenu } from '../markdown/menu';
import type {
  BuildFallbackRoute,
  BuildEntry,
  BuildLayout,
  BuildRoute,
  NormalizedPluginOptions,
  ParsedLayoutId,
  RouteSourceFile,
} from '../types';
import { createFileId, isLayoutName, normalizePath, parseLayoutId } from '../utils/fs';
import { getPathnameFromFilePath } from '../utils/pathname';
import { parseRoutePathname } from './parse-pathname';
import { sortRoutes } from './sort-routes';

export async function resolveSourceFiles(
  opts: NormalizedPluginOptions,
  sourceFiles: RouteSourceFile[]
) {
  const layouts = sourceFiles
    .filter((s) => s.type === 'layout')
    .map((s) => resolveLayout(opts, s))
    .sort((a, b) => {
      if (a.id < b.id) return -1;
      if (a.id > b.id) return 1;
      return 0;
    });

  const routes = sourceFiles
    .filter((s) => s.type === 'page' || s.type === 'endpoint')
    .map((s) => resolveRoute(opts, layouts, s))
    .sort(sortRoutes);

  const fallbackRoutes = sourceFiles
    .filter((s) => s.type === '404' || s.type === '500')
    .map((s) => resolveFallbackRoute(opts, layouts, s))
    .sort(sortRoutes);

  const entries = sourceFiles
    .filter((s) => s.type === 'entry')
    .map((s) => resolveEntry(opts, s))
    .sort((a, b) => {
      if (a.chunkFileName < b.chunkFileName) return -1;
      if (a.chunkFileName > b.chunkFileName) return 1;
      return 0;
    });

  const menus = sourceFiles
    .filter((s) => s.type === 'menu')
    .map((p) => resolveMenu(opts, p))
    .sort((a, b) => {
      if (a.pathname < b.pathname) return -1;
      if (a.pathname > b.pathname) return 1;
      return 0;
    });

  return { layouts, routes, fallbackRoutes, entries, menus };
}

export function resolveLayout(opts: NormalizedPluginOptions, layoutSourceFile: RouteSourceFile) {
  const dirName = layoutSourceFile.dirName;
  const filePath = layoutSourceFile.filePath;
  let dirPath = layoutSourceFile.dirPath;

  let layoutId: ParsedLayoutId;

  if (isLayoutName(dirName)) {
    dirPath = normalizePath(dirname(dirPath));
    layoutId = parseLayoutId(dirName);
  } else {
    layoutId = parseLayoutId(layoutSourceFile.fileName);
  }

  const layout: BuildLayout = {
    id: createFileId(opts.routesDir, filePath),
    filePath,
    dirPath,
    ...layoutId,
  };

  return layout;
}

export function resolveRoute(
  opts: NormalizedPluginOptions,
  appLayouts: BuildLayout[],
  sourceFile: RouteSourceFile
) {
  const filePath = sourceFile.filePath;
  const layouts: BuildLayout[] = [];
  const routesDir = opts.routesDir;
  const { pathname, layoutName, layoutStop } = getPathnameFromFilePath(opts, filePath);

  if (!layoutStop) {
    let currentDir = normalizePath(dirname(filePath));
    let hasFoundNamedLayout = false;
    const hasNamedLayout = layoutName !== '';

    for (let i = 0; i < 20; i++) {
      let layout: BuildLayout | undefined = undefined;

      if (hasNamedLayout && !hasFoundNamedLayout) {
        layout = appLayouts.find((l) => l.dirPath === currentDir && l.layoutName === layoutName);
        if (layout) {
          hasFoundNamedLayout = true;
        }
      } else {
        layout = appLayouts.find((l) => l.dirPath === currentDir && l.layoutName === '');
      }

      if (layout) {
        layouts.push(layout);
        if (layout.layoutType === 'top') {
          break;
        }
      }

      if (currentDir === routesDir) {
        break;
      }

      currentDir = normalizePath(dirname(currentDir));
    }
  }

  const buildRoute: BuildRoute = {
    type: sourceFile.type as any,
    id: createFileId(opts.routesDir, filePath),
    filePath,
    pathname,
    layouts: layouts.reverse(),
    ...parseRoutePathname(pathname),
  };

  return buildRoute;
}

export function resolveFallbackRoute(
  opts: NormalizedPluginOptions,
  appLayouts: BuildLayout[],
  sourceFile: RouteSourceFile
) {
  const buildFallbackRoute: BuildFallbackRoute = {
    status: sourceFile.type === '500' ? '500' : '404',
    ...resolveRoute(opts, appLayouts, sourceFile),
  };

  return buildFallbackRoute;
}

function resolveEntry(opts: NormalizedPluginOptions, sourceFile: RouteSourceFile) {
  const { pathname } = getPathnameFromFilePath(opts, sourceFile.filePath);

  const entryTextIndex = pathname.lastIndexOf('/entry');
  const chunkFileName = pathname.slice(1, entryTextIndex) + '.js';

  const buildEntry: BuildEntry = {
    filePath: sourceFile.filePath,
    chunkFileName,
  };

  return buildEntry;
}
