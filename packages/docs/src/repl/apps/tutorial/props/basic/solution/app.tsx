import { component$ } from '@builder.io/qwik';

export const App = component$(() => {
  return (
    <div>
      <Greeter salutation="Hello" name="World" />
    </div>
  );
});

interface GreeterProps {
  salutation: string;
  name: string;
}
export const Greeter = component$((props: GreeterProps) => {
  return (
    <div>
      {props.salutation} {props.name}!
    </div>
  );
});
