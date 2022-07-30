import { component$, Host, useDocument } from '@builder.io/qwik';

export const App = component$(
  () => {
    const doc = useDocument();
    return <Host>Host element tag-name: {doc.location.toString()}</Host>;
  },
  { tagName: 'my-app' }
);
