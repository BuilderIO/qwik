import { component$, Host, Slot, useStore } from '@builder.io/qwik';

export const App = component$(() => {
  const store = useStore({ count: 0 });
  return (
    <MyButton
      host:onClick$={() => store.count++}
      host:style={{ backgroundColor: 'lightpink', padding: '1em' }}
    >
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
