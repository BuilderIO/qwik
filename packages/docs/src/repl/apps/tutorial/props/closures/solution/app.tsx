import { component$, $, PropFunction } from '@builder.io/qwik';

export const App = component$(() => {
  const goodbye$ = $(() => alert('Good Bye!'));
  return (
    <div>
      <MyComponent goodbye$={goodbye$} hello$={async (name) => alert('Hello ' + name)} />
    </div>
  );
});

interface MyComponentProps {
  goodbye$: PropFunction<() => void>;
  hello$: PropFunction<(name: string) => void>;
}
export const MyComponent = component$((props: MyComponentProps) => {
  return (
    <div>
      <button onClick$={props.goodbye$}>hello</button>
      <button onClick$={async () => await props.hello$('World')}>good bye</button>
    </div>
  );
});
