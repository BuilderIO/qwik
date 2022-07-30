import { noSerialize, useContext, useUserContext } from '@builder.io/qwik';
import {
  ContentContext,
  DocumentHeadContext,
  RouteLocationContext,
  RouteNavigateContext,
} from './contexts';
import type {
  RouteLocation,
  ResolvedDocumentHead,
  RouteNavigate,
  QwikCityUserContext,
} from './types';

/**
 * @public
 */
export const useContent = () => useContext(ContentContext);

/**
 * @public
 */
export const useDocumentHead = (): Required<ResolvedDocumentHead> =>
  useContext(DocumentHeadContext);

/**
 * @public
 */
export const useLocation = (): RouteLocation => useContext(RouteLocationContext);

/**
 * @public
 */
export const useNavigate = (): RouteNavigate => useContext(RouteNavigateContext);

export const useQwikCityContext = () => {
  return noSerialize(useUserContext<QwikCityUserContext>('qwikcity'));
};
