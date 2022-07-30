import { component$ } from '@builder.io/qwik';

export const App = component$(() => {
  return (
    <div>
      <Greeter />
    </div>
  );
});

interface GreeterProps {}
export const Greeter = component$((props: GreeterProps) => {
  return <div>Bind props here</div>;
});
