import { component$, Host, useContext, useStyles$ } from '@builder.io/qwik';
import { usePage, usePageIndex } from '@builder.io/qwik-city';
import { GlobalStore } from '../../utils/context';
import { CloseIcon } from '../svgs/close-icon';
import styles from './sidebar.css?inline';

export const SideBar = component$(
  () => {
    useStyles$(styles);
    const page = usePage();
    const navIndex = usePageIndex();
    const globalStore = useContext(GlobalStore);

    if (!page) {
      return null;
    }

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
          <ol>
            {page.breadcrumbs.map((b) => (
              <li>{b.text}</li>
            ))}
          </ol>
        </nav>
        <nav class="menu">
          <button
            class="menu-close lg:hidden"
            onClick$={() => (globalStore.sideMenuOpen = !globalStore.sideMenuOpen)}
            type="button"
          >
            <CloseIcon width={24} height={24} />
          </button>
          {navIndex
            ? navIndex.items?.map((item) => (
                <>
                  <h5>{item.text}</h5>
                  <ul>
                    {item.items?.map((item) => (
                      <li>
                        <a
                          href={item.href}
                          class={{
                            'is-active':
                              new URL(page.url, 'https://qwik.builder.io/').pathname === item.href,
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
