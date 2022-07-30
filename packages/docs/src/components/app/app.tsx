import { component$, Host, useStore, useContextProvider, useStyles$ } from '@builder.io/qwik';
import styles from './global.css';
import { Page } from '../page/page';
import { GlobalStore, SiteStore } from '../../utils/context';
import { useQwikCity } from '@builder.io/qwik-city';

export const App = component$(() => {
  useStyles$(styles);

  const store = useStore<SiteStore>({
    headerMenuOpen: false,
    sideMenuOpen: false,
  });

  useContextProvider(GlobalStore, store);
  useQwikCity();

  return (
    <Host
      class={{
        'header-open': store.headerMenuOpen,
        'menu-open': store.sideMenuOpen,
      }}
    >
      <Page />
    </Host>
  );
});
