import { component$, Slot, useStyles$ } from '@builder.io/qwik';
import { SideBar } from '../../components/sidebar/sidebar';
import { Footer } from '../../components/footer/footer';
import { Header } from '../../components/header/header';
import { OnThisPage } from '../../components/on-this-page/on-this-page';
import { ContentNav } from '../../components/content-nav/content-nav';
import styles from '../docs/docs.css?inline';

// eslint-disable-next-line
export { useMarkdownItems } from '../../components/sidebar/sidebar';

export default component$(() => {
  useStyles$(styles);

  return (
    <div class="docs fixed-header">
      <Header />
      <div class="flex gap-12 xl:gap-20 items-stretch content-container">
        <SideBar />
        <main class="contents">
          <div class="docs-container">
            <article>
              <Slot />
            </article>
            <ContentNav />
            <Footer />
          </div>
          <OnThisPage />
        </main>
      </div>
    </div>
  );
});
