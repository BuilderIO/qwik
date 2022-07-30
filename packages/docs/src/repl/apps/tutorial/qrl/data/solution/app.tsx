import { component$, $ } from '@builder.io/qwik';

export const App = component$(() => {
  return (
    <>
      <button onClick$={async () => alert(await $('Hello World!').resolve())}>click me</button>
    </>
  );
});
