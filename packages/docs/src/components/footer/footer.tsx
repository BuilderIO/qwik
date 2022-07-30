import { component$, Host, useStyles$ } from '@builder.io/qwik';
import styles from './footer.css?inline';

export const Footer = component$(
  () => {
    useStyles$(styles);

    return (
      <Host class="pt-8 pb-12 px-2 flex flex-wrap justify-center sm:justify-between text-sm">
        <nav class="flex py-2 px-2 md:px-0">
          <a class="px-4 py-1" href="https://github.com/BuilderIO/qwik" target="_blank">
            Github
          </a>
          <a class="px-4 py-1" href="https://twitter.com/QwikDev" target="_blank">
            @QwikDev
          </a>
          <a class="px-4 py-1" href="https://qwik.builder.io/chat" target="_blank">
            Discord
          </a>
        </nav>
        <div class="py-3 px-2 md:px-0">
          <span>Made with ♡ by the </span>
          <a href="https://www.builder.io/">Builder.io</a>
          <span> team</span>
        </div>
      </Host>
    );
  },
  { tagName: 'footer' }
);
