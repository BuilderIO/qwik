import { component$, Host, useContext, useStyles$ } from '@builder.io/qwik';
import { ContentMenu, useContent, useLocation } from '@builder.io/qwik-city';
import { GlobalStore } from '../../context';
import { CloseIcon } from '../svgs/close-icon';
import styles from './sidebar.css?inline';

export const SideBar = component$(
  () => {
    useStyles$(styles);

    const globalStore = useContext(GlobalStore);
    const { menu } = useContent();
    const { pathname } = useLocation();
    const breadcrumbs = createBreadcrumbs(menu, pathname);

    return (
      <Host class="sidebar">
        <nav class="breadcrumbs">
          <button
            onClick$={() => (globalStore.sideMenuOpen = !globalStore.sideMenuOpen)}
            type="button"
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
              {breadcrumbs.map((b) => (
                <li>{b.text}</li>
              ))}
            </ol>
          ) : null}
        </nav>
        <nav class="menu">
          <button
            class="menu-close lg:hidden"
            onClick$={() => (globalStore.sideMenuOpen = !globalStore.sideMenuOpen)}
            type="button"
          >
            <CloseIcon width={24} height={24} />
          </button>
          {menu?.items
            ? menu.items.map((item) => (
                <>
                  <h5>{item.text}</h5>
                  <ul>
                    {item.items?.map((item) => (
                      <li>
                        <a
                          href={item.href}
                          class={{
                            'is-active': pathname === item.href,
                          }}
                        >
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              ))
            : null}
        </nav>
      </Host>
    );
  },
  { tagName: 'aside' }
);

export function createBreadcrumbs(menu: ContentMenu | undefined, pathname: string) {
  if (menu?.items) {
    for (const breadcrumbA of menu.items) {
      if (breadcrumbA.href === pathname) {
        return [breadcrumbA];
      }

      if (breadcrumbA.items) {
        for (const breadcrumbB of breadcrumbA.items) {
          if (breadcrumbB.href === pathname) {
            return [breadcrumbA, breadcrumbB];
          }

          if (breadcrumbB.items) {
            for (const breadcrumbC of breadcrumbB.items) {
              if (breadcrumbC.href === pathname) {
                return [breadcrumbA, breadcrumbB, breadcrumbC];
              }
            }
          }
        }
      }
    }
  }

  return [];
}
