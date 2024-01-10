import { component$, Slot, useContext, useStyles$, useTask$ } from '@builder.io/qwik';
import { useContent, useLocation, routeLoader$ } from '@builder.io/qwik-city';
import { ContentNav } from '../../components/content-nav/content-nav';
import { Footer } from '../../components/footer/footer';
import { Header } from '../../components/header/header';
import { OnThisPage } from '../../components/on-this-page/on-this-page';
import { createBreadcrumbs, SideBar } from '../../components/sidebar/sidebar';
import { GlobalStore } from '../../context';
import styles from './docs.css?inline';
import Contributors from '../../components/contributors';
import type { PackageManagers } from 'src/components/package-manager-tabs';
import { setCookie } from '../(shop)/utils';

// eslint-disable-next-line
export { useMarkdownItems } from '../../components/sidebar/sidebar';

export const usePkgManager = routeLoader$(async (req) => {
  const pkgManager = req.cookie.get('packageManager');
  if (!pkgManager) {
    setCookie(req.cookie, 'packageManager', 'npm');
    return {
      manager: 'npm',
    };
  }
  return {
    manager: pkgManager.value,
  };
});

export default component$(() => {
  const loc = useLocation();
  const noRightMenu = ['/docs/'].includes(loc.url.pathname);
  useStyles$(styles);
  const { menu } = useContent();
  const globalStore = useContext(GlobalStore);
  const { url } = useLocation();
  const breadcrumbs = createBreadcrumbs(menu, url.pathname);
  const pkgManager = usePkgManager();

  useTask$(() => {
    globalStore.pkgManager = pkgManager.value.manager as PackageManagers;
  });

  return (
    <div class="docs fixed-header">
      <Header />
      <nav class="breadcrumbs">
        <button
          onClick$={() => (globalStore.sideMenuOpen = !globalStore.sideMenuOpen)}
          type="button"
          title="Toggle left menu"
          aria-label="Toggle left menu"
        >
          <span class="sr-only">Navigation</span>
          <svg width="24" height="24">
            <path
              d="M5 6h14M5 12h14M5 18h14"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
        {breadcrumbs.length > 0 ? (
          <ol>
            {breadcrumbs.map((b, key) => (
              <li key={key}>{b.text}</li>
            ))}
          </ol>
        ) : null}
      </nav>
      <SideBar />
      <main
        class={{
          'no-right-menu': noRightMenu,
        }}
      >
        <div class="docs-container">
          <article>
            <Slot />
            <Contributors />
          </article>
          <ContentNav />
          <Footer />
        </div>
        <OnThisPage />
      </main>
    </div>
  );
});
