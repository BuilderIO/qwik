import type { BuildContext, BuildRoute, RouteSourceFile } from './types';
import { addError } from './utils/format';
import { validateSourceFiles } from './routing/source-file';
import { walkRoutes, walkRoutesWithPathname } from './routing/walk-routes-dir';
import { getRouteParams } from '../runtime/src/library/routing';
import type { RouteParams } from '../runtime/src/library/types';
import { resolveSourceFiles } from './routing/resolve-source-file';

export async function build(ctx: BuildContext) {
  try {
    const opts = ctx.opts;
    const routesDir = opts.routesDir;

    const sourceFiles = await walkRoutes(routesDir);

    const resolved = await resolveSourceFiles(opts, sourceFiles);
    ctx.layouts = resolved.layouts;
    ctx.routes = resolved.routes;
    ctx.fallbackRoutes = resolved.fallbackRoutes;
    ctx.entries = resolved.entries;
    ctx.menus = resolved.menus;

    validateBuild(ctx, sourceFiles);
  } catch (e) {
    addError(ctx, e);
  }
}
export async function buildFromUrlPathname(
  ctx: BuildContext,
  pathname: string
): Promise<{ route: BuildRoute; params: RouteParams } | null> {
  const sourceFiles = await walkRoutesWithPathname(ctx.opts.routesDir, pathname);

  if (sourceFiles.length > 0) {
    const resolved = await resolveSourceFiles(ctx.opts, sourceFiles);

    for (const route of resolved.routes) {
      const match = route.pattern.exec(pathname);
      if (match) {
        ctx.layouts = resolved.layouts;
        ctx.routes = resolved.routes;
        ctx.fallbackRoutes = resolved.fallbackRoutes;
        ctx.entries = resolved.entries;
        ctx.menus = resolved.menus;
        return {
          route,
          params: getRouteParams(route.paramNames, match),
        };
      }
    }
  }

  return null;
}

function validateBuild(ctx: BuildContext, sourceFiles: RouteSourceFile[]) {
  const pathnames = Array.from(new Set(ctx.routes.map((r) => r.pathname))).sort();

  for (const pathname of pathnames) {
    const foundRoutes = ctx.routes.filter((r) => r.pathname === pathname);
    if (foundRoutes.length > 1) {
      addError(
        ctx,
        `More than one route has been found for pathname "${pathname}". Please narrow it down to only one of these:\n${foundRoutes
          .map((r) => `  - ${r.filePath}`)
          .join('\n')}`
      );
    }
  }

  validateSourceFiles(ctx, sourceFiles);
}
