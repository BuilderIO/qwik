import { createContext } from '@builder.io/qwik';

export interface SiteStore {
  headerMenuOpen: boolean;
  sideMenuOpen: boolean;
}

export const GlobalStore = createContext<SiteStore>('site-store');
