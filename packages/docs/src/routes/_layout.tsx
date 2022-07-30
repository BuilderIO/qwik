import { component$, Host, Slot } from '@builder.io/qwik';
import { Header } from '../components/header/header';
import { Footer } from '../components/footer/footer';

export default component$(() => {
  return (
    <Host>
      <Header />
      <main>
        <Slot />
      </main>
      <Footer />
    </Host>
  );
});
