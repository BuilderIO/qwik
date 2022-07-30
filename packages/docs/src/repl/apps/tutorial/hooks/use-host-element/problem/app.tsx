import { component$, Host } from '@builder.io/qwik';

export const App = component$(
  () => {
    return (
      <Host onClick$={() => alert('Hello World!')}>
        Host element tag-name: {'get tag name from: host.tagName'}
      </Host>
    );
  },
  { tagName: 'my-app' }
);
