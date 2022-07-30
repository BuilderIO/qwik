import { component$, Host, Slot, useStore } from '@builder.io/qwik';

export const App = component$(() => {
  const store = useStore({ count: 0 });
  return (
    <MyButton host:onClick$={() => null} host:style={{}}>
      {store.count}
    </MyButton>
  );
});

export const MyButton = component$(
  () => {
    return (
      <Host>
        <Slot />
      </Host>
    );
  },
  { tagName: 'button' }
);
