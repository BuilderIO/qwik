import { component$ } from '@builder.io/qwik';

export const App = component$(() => {
  return (
    <a href="/" onClick$={() => window.open('http://qwik.builder.io')}>
      click me!
    </a>
  );
});
