import { component$, useHostElement, Host } from '@builder.io/qwik';

export const App = component$(
  () => {
    const host = useHostElement();
    return (
      <Host onClick$={() => alert('Hello World!')}>Host element tag-name: {host.tagName}</Host>
    );
  },
  { tagName: 'my-app' }
);
