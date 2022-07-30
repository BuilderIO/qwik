import { component$ } from '@builder.io/qwik';

export const App = component$(() => {
  const counter = { count: 0 };

  return (
    <>
      <div>Count: {counter.count}</div>
      <button onClick$={() => counter.count++}>+1</button>
    </>
  );
});
