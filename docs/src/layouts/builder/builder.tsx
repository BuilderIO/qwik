import { $, component$, Host, useStyles$ } from '@builder.io/qwik';
import { isServer } from '@builder.io/qwik/build';
import { useLocation } from '../../utils/useLocation';
import { Header } from '../../components/header/header';
import styles from './builder.css';
import { fetch } from '../../utils/fetch';

export const Builder = component$(async () => {
  useStyles$(styles);
  return $(async () => {
    const loc = useLocation();
    const html = await fetchQwikBuilderContent(loc.pathname);
    return (
      <Host>
        <Header />
        {html && <main class="builder" innerHTML={html} />}
      </Host>
    );
  });
});

export const fetchQwikBuilderContent = async (url: string) => {
  const qwikUrl = new URL('https://builder.io/api/v1/qwik/content-page');
  qwikUrl.searchParams.set('apiKey', 'fe30f73e01ef40558cd69a9493eba2a2');
  qwikUrl.searchParams.set('userAttributes.urlPath', url);

  const response = (await fetch(String(qwikUrl))) as Response;
  if (response.status === 200) {
    const { html } = await response.json();
    return html;
  }
  return undefined;
};
