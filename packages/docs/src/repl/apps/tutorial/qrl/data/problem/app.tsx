import { component$ } from '@builder.io/qwik';

export const App = component$(() => {
  return (
    <>
      <button onClick$={async () => alert('Hello World!')}>click me</button>
    </>
  );
});
