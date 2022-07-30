import { component$, Host } from '@builder.io/qwik';

export const App = component$(
  () => {
    return <Host>Host element tag-name: {'print current document.location here'}</Host>;
  },
  { tagName: 'my-app' }
);
