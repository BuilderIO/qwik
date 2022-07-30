import { component$, useStore } from '@builder.io/qwik';

export const App = component$(() => {
  const store = useStore({ show: true });
  return (
    <div>
      <button onClick$={() => (store.show = !store.show)}>Toggle</button>
      {store.show ? <Greeter /> : null}
    </div>
  );
});

export const Greeter = component$(() => {
  // Use useCleanup$ here to alert the user when the component is removed.
  return <span>Hello World</span>;
});
