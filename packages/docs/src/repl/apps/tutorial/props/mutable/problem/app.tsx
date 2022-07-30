import { component$, useStore } from '@builder.io/qwik';

interface CountStore {
  count: number;
}
export const App = component$(() => {
  const store = useStore<CountStore>({ count: 0 });

  return (
    <>
      <button onClick$={() => store.count++}>+1</button>
      <Display count={store.count} />
    </>
  );
});

interface DisplayProps {
  count: number;
}
export const Display = component$((props: DisplayProps) => {
  return <div>The count is: {props.count}</div>;
});
