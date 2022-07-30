import { component$, useStore } from '@builder.io/qwik';

export const App = component$(() => {
  return (
    <>
      <h1>Hello World!</h1>
      I am a static component, there is no reason to ever download me to the client.
      <br />
      <button onClick$={() => alert('Hello')}>greet!</button>
      <Counter />
    </>
  );
});

export const Counter = component$(() => {
  const store = useStore({ count: 0 });
  return (
    <>
      I am a dynamic component. Qwik will download me only when it is time to re-render me after the
      user clicks on the <tt>+1</tt> button.
      <br />
      Current count: {store.count}
      <button onClick$={() => store.count++}>+1</button>
    </>
  );
});
