import { component$, useStore } from '@builder.io/qwik';

export const App = component$(() => {
  const store = useStore({ counter: { count: 0 } });

  return (
    <>
      <Display counter={store.counter} />
      <button onClick$={() => store.counter.count++}>+1</button>
    </>
  );
});

interface DisplayProps {
  counter: { count: number };
}
export const Display = component$((props: DisplayProps) => {
  return <>Count: {props.counter.count}</>;
});
