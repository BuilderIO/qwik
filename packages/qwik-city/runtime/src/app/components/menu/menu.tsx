import { component$, Host, useScopedStyles$ } from '@builder.io/qwik';
import { useContent, Link, useLocation } from '~qwik-city-runtime';
import styles from './menu.css?inline';

export const Menu = component$(
  () => {
    useScopedStyles$(styles);

    const { menu } = useContent();
    const { pathname } = useLocation();

    return (
      <Host class="menu">
        {menu
          ? menu.items?.map((item, i) => (
              <>
                <h5 data-test-menu-header={i}>{item.text}</h5>
                <ul>
                  {item.items?.map((item) => (
                    <li>
                      <Link
                        data-test-menu-link={item.href}
                        href={item.href}
                        class={{
                          'is-active': pathname === item.href,
                        }}
                      >
                        {item.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ))
          : null}
      </Host>
    );
  },
  { tagName: 'aside' }
);
