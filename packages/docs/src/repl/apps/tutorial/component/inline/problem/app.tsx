import { component$ } from '@builder.io/qwik';

export const App = component$(() => {
  return (
    <div>
      <Greeter />
    </div>
  );
});

export const Greeter = component$(() => {
  return <div>Hello World!</div>;
});
