import { component$, useStore, mutable } from '@builder.io/qwik';

interface CountStore {
  count: number;
}
export const App = component$(() => {
  const store = useStore<CountStore>({ count: 0 });

  return (
    <>
      <button onClick$={() => store.count++}>+1</button>
      <Display count={mutable(store.count)} />
    </>
  );
});

interface GreeterProps {
  count: number;
}
export const Display = component$((props: GreeterProps) => {
  return <div>The count is: {props.count}</div>;
});
