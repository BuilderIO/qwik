/* eslint-disable no-console */
import { component$, useStore } from '@builder.io/qwik';

interface AppStore {
  counter: { count: number };
  largeData: any;
}
export const App = component$(() => {
  const store = useStore<AppStore>(
    {
      counter: { count: 1 },
      largeData: { data: 'PRETEND THIS IS LARGE DATASET' },
    },
    { recursive: true }
  );
  console.log('Render: <App/>');
  const counter = store.counter;
  return (
    <>
      <tt>&lt;App&gt;</tt>
      <tt>largeData</tt>: {JSON.stringify(store.largeData)}
      <br />
      Click <button onClick$={() => store.counter.count++}>+1</button>
      <Child counter={counter} />
    </>
  );
});

export const Child = component$((props: { counter: AppStore['counter'] }) => {
  console.log('Render: <Child/>');
  return (
    <>
      <tt>&lt;Child&gt;</tt> {props.counter.count}
    </>
  );
});
