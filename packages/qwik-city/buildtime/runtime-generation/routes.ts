import { ROUTE_TYPE_ENDPOINT } from '../../runtime/src/library//constants';
import type { BuildContext, BuildFallbackRoute, BuildRoute } from '../types';
import { getImportPath } from './utils';

export function createRoutes(ctx: BuildContext, c: string[], esmImports: string[]) {
  const isSsr = ctx.target === 'ssr';
  const includeEndpoints = isSsr;
  const dynamicImports = ctx.target === 'client';

  if (ctx.layouts.length > 0) {
    c.push(`\n/** Qwik City Layouts (${ctx.layouts.length}) */`);
    for (const layout of ctx.layouts) {
      const importPath = JSON.stringify(getImportPath(layout.filePath));
      if (dynamicImports) {
        c.push(`const ${layout.id} = ()=>import(${importPath});`);
      } else {
        esmImports.push(`import * as ${layout.id}_ from ${importPath};`);
        c.push(`const ${layout.id} = ()=>${layout.id}_;`);
      }
    }
  }

  const routes = ctx.routes.filter(
    (r) => r.type === 'page' || (includeEndpoints && r.type === 'endpoint')
  );

  c.push(`\n/** Qwik City Routes (${routes.length}) */`);
  c.push(`const routes = [`);

  for (const route of routes) {
    const loaders = [];

    if (route.type === 'page') {
      for (const layout of route.layouts) {
        loaders.push(layout.id);
      }

      const importPath = getImportPath(route.filePath);
      if (dynamicImports) {
        loaders.push(`()=>import(${JSON.stringify(importPath)})`);
      } else {
        esmImports.push(`import * as ${route.id} from ${JSON.stringify(importPath)};`);
        loaders.push(`()=>${route.id}`);
      }
    } else if (route.type === 'endpoint' && includeEndpoints) {
      const importPath = getImportPath(route.filePath);
      esmImports.push(`import * as ${route.id} from ${JSON.stringify(importPath)};`);
      loaders.push(`()=>${route.id}`);
    }

    c.push(`  ${createRoute(route, loaders)},`);
  }

  c.push(`];`);

  if (isSsr) {
    c.push(`\n/** Qwik City Fallback Routes (${ctx.fallbackRoutes.length}) */`);
    c.push(`const fallbackRoutes = [`);

    for (const fallbackRoute of ctx.fallbackRoutes) {
      const loaders = [];
      for (const layout of fallbackRoute.layouts) {
        loaders.push(layout.id);
      }
      const importPath = getImportPath(fallbackRoute.filePath);
      esmImports.push(`import * as ${fallbackRoute.id} from ${JSON.stringify(importPath)};`);
      loaders.push(`()=>${fallbackRoute.id}`);

      c.push(`  ${createFallbackRoute(fallbackRoute, loaders)},`);
    }

    c.push(`];`);
  }
}

function createRoute(r: BuildRoute, loaders: string[]) {
  const pattern = r.pattern.toString();
  const moduleLoaders = `[ ${loaders.join(', ')} ]`;

  if (r.type === 'endpoint') {
    const paramNames = JSON.stringify(r.paramNames);
    return `[ ${pattern}, ${moduleLoaders}, ${paramNames}, ${ROUTE_TYPE_ENDPOINT} ]`;
  }

  if (r.paramNames.length > 0) {
    const paramNames = JSON.stringify(r.paramNames);
    return `[ ${pattern}, ${moduleLoaders}, ${paramNames} ]`;
  }

  return `[ ${pattern}, ${moduleLoaders} ]`;
}

function createFallbackRoute(r: BuildFallbackRoute, loaders: string[]) {
  const pattern = r.pattern.toString();
  const moduleLoaders = `[ ${loaders.join(', ')} ]`;
  const paramNames = JSON.stringify(r.paramNames);
  const routeType = r.type === 'endpoint' ? ROUTE_TYPE_ENDPOINT : 0;
  const status = JSON.stringify(r.status);

  return `[ ${pattern}, ${moduleLoaders}, ${paramNames}, ${routeType}, ${status} ]`;
}
