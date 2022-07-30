import { component$, useWatch$, useStore } from '@builder.io/qwik';

export const App = component$(() => {
  const store = useStore({
    value: '',
    debouncedValue: '',
  });
  useWatch$((track) => {
    // rerun this function  when `value` property changes.
    track(store, 'value');
    // Set up timeout for debounced value.
    const id = setTimeout(() => (store.debouncedValue = store.value), 500);
    // return cleanup function in case `value` property changes before time is up.
    return () => clearTimeout(id);
  });
  return (
    <>
      <input
        value={store.value}
        onKeyUp$={(event) => (store.value = (event.target as HTMLInputElement).value)}
      />
      <br />
      Current value: {store.value}
      <br />
      Debaunced value: {store.debouncedValue}
    </>
  );
});
