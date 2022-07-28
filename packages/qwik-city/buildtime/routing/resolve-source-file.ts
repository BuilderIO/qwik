import { dirname } from 'path';
import type {
  BuildFallbackRoute,
  BuildLayout,
  BuildRoute,
  NormalizedPluginOptions,
  ParsedLayoutId,
  RouteSourceFile,
} from '../types';
import { createFileId, isLayoutName, normalizePath, parseLayoutId } from '../utils/fs';
import { getPathnameFromFilePath } from '../utils/pathname';
import { parseRoutePathname } from './parse-pathname';

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
