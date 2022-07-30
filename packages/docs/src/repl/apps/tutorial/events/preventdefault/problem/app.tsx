import { component$ } from '@builder.io/qwik';

export const App = component$(() => {
  return (
    <a href="/" onClick$={() => alert('do something else.')}>
      click me!
    </a>
  );
});
