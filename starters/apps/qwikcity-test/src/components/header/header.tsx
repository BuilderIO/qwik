import { component$, useStyles$ } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';
import styles from './header.css?inline';

export default component$(() => {
  useStyles$(styles);

  const pathname = useLocation().pathname;

  return (
    <header>
      <div class="header-inner">
        <section class="logo">
          <Link href="/qwikcity-test" prefetch={true} data-test-link="header-home">
            Qwik City 🏙
          </Link>
        </section>
        <nav data-test-header-links>
          <Link
            href="/qwikcity-test/blog"
            prefetch={true}
            class={{ active: pathname.startsWith('/blog') }}
            data-test-link="blog-home"
          >
            Blog
          </Link>
          <Link
            href="/qwikcity-test/docs"
            prefetch={true}
            class={{ active: pathname.startsWith('/docs') }}
            data-test-link="docs-home"
          >
            Docs
          </Link>
          <Link
            href="/qwikcity-test/api"
            prefetch={true}
            class={{ active: pathname.startsWith('/api') }}
            data-test-link="api-home"
          >
            API
          </Link>
          <Link
            href="/qwikcity-test/products/hat"
            prefetch={true}
            class={{ active: pathname.startsWith('/products') }}
            data-test-link="products-hat"
          >
            Products
          </Link>
          <Link
            href="/qwikcity-test/about-us"
            prefetch={true}
            class={{ active: pathname.startsWith('/about-us') }}
            data-test-link="about-us"
          >
            About Us
          </Link>
          <Link
            href="/qwikcity-test/sign-in"
            prefetch={true}
            class={{ active: pathname.startsWith('/sign-in') }}
            data-test-link="sign-in"
          >
            Sign In
          </Link>
        </nav>
      </div>
    </header>
  );
});
