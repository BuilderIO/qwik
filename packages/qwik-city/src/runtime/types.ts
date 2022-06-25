import type { FunctionComponent } from '@builder.io/qwik';
import type { ROUTE_TYPE_ENDPOINT } from './constants';

export interface PageModule {
  readonly default: any;
  readonly breadcrumbs?: ContentBreadcrumb[];
  readonly head?: ContentModuleHead;
  readonly headings?: ContentHeading[];
  readonly menu?: { path: string };
}

export interface LayoutModule {
  readonly default: any;
  readonly head?: ContentModuleHead;
}

/**
 * @public
 */
export interface RouteLocation {
  hash: string;
  host: string;
  hostname: string;
  href: string;
  origin: string;
  routeParams: RouteParams;
  pathname: string;
  port: string;
  protocol: string;
  search: string;
  searchParams: Record<string, string>;
}

/**
 * @public
 */
export interface EndpointModule {
  all?: EndpointHandler;
  del?: EndpointHandler;
  get?: EndpointHandler;
  head?: EndpointHandler;
  options?: EndpointHandler;
  patch?: EndpointHandler;
  post?: EndpointHandler;
  put?: EndpointHandler;
}

/**
 * @public
 */
export interface DocumentHead {
  title: string;
  meta: DocumentMeta[];
  links: DocumentLink[];
  styles: DocumentStyle[];
}

/**
 * @public
 */
export interface DocumentMeta {
  content?: string;
  httpEquiv?: string;
  name?: string;
  property?: string;
  key?: string;
}

/**
 * @public
 */
export interface DocumentLink {
  as?: string;
  crossorigin?: string;
  disabled?: boolean;
  href?: string;
  hreflang?: string;
  id?: string;
  imagesizes?: string;
  imagesrcset?: string;
  integrity?: string;
  media?: string;
  prefetch?: string;
  referrerpolicy?: string;
  rel?: string;
  sizes?: string;
  title?: string;
  type?: string;
  key?: string;
}

/**
 * @public
 */
export interface DocumentStyle {
  style: string;
  props?: { [propName: string]: string };
  key?: string;
}

/**
 * @public
 */
export interface HeadComponentProps {
  resolved: DocumentHead;
  location: RouteLocation;
}

/**
 * @public
 */
export type HeadComponent = FunctionComponent<HeadComponentProps>;

/**
 * @public
 */
export interface ContentBreadcrumb {
  text: string;
  href?: string;
}

/**
 * @public
 */
export interface ContentMenu {
  text: string;
  href?: string;
  items?: ContentMenu[];
}

/**
 * @public
 */
export interface ContentHeading {
  text: string;
  id: string;
  level: number;
}

/**
 * @public
 */
export type RouteData =
  | [pattern: RegExp, pageLoader: (() => Promise<ContentModule>)[]]
  | [pattern: RegExp, pageLoader: (() => Promise<ContentModule>)[], paramNames: string[]]
  | [
      pattern: RegExp,
      endpointLoader: (() => Promise<EndpointModule>)[],
      paramNames: string[],
      routeType: typeof ROUTE_TYPE_ENDPOINT
    ];

/**
 * @public
 */
export type RouteParams = Record<string, string>;

export interface MatchedRoute {
  route: RouteData;
  params: RouteParams;
  pathname: string;
}

export interface LoadedRoute extends MatchedRoute {
  modules: ContentModule[];
}

export interface LoadedContent extends LoadedRoute {
  pageModule: PageModule;
}

export type ContentModule = PageModule | LayoutModule;

export type ContentModuleHead = HeadComponent | DocumentHead;

/**
 * @public
 */
export interface RequestEvent {
  request: Request;
  params: RouteParams;
  url: URL;
}

/**
 * @public
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

/**
 * @public
 */
export type EndpointHandler = (ev: RequestEvent) => Response | Promise<Response>;

export interface QwikCityState {
  breadcrumbs: ContentBreadcrumb[] | undefined;
  head: DocumentHead;
  headings: ContentHeading[] | undefined;
  menu: { path: string } | undefined;
  modules: ContentModule[];
  location: RouteLocation;
}
