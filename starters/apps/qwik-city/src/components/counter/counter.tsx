import { component$, useStyles$, useStore } from '@builder.io/qwik';

export const Counter = component$(() => {
  const store = useStore({ count: 0 });
  useStyles$(`
  .counter {
    border: 3px solid #1474ff;
    padding: 10px;
    border-radius: 10px;
    color: #1474ff;
  }
`);

  return (
    <button class="counter" type="button" onClick$={() => store.count++}>
      Increment {store.count}
    </button>
  );
});
