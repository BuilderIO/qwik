import { component$, useStore, $ } from '@builder.io/qwik';

export const App = component$(() => {
  const store = useStore({ name: '' });
  const onKeyUp$ = $(async (event: KeyboardEvent) => {
    const input = event.target as HTMLInputElement;
    if (event.key === 'Enter') {
      alert(store.name);
    } else {
      store.name = input.value;
    }
  });
  return (
    <>
      Enter your name followed by the enter key: <input onKeyUp$={onKeyUp$} value={store.name} />
    </>
  );
});
