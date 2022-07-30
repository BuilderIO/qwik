import { component$, Slot, useStore } from '@builder.io/qwik';

export const App = component$(() => {
  console.log('Render: <App>');
  return (
    <Collapsable>
      <span q:slot="closed">(collapsed summary)</span>
      Content that should be displayed when the collapse component is open.
    </Collapsable>
  );
});

export const Collapsable = component$(() => {
  console.log('Render: <Collapsable>');
  const store = useStore({ open: true });
  return (
    <div onClick$={() => (store.open = !store.open)}>
      {store.open ? (
        <div>
          ▼
          <div>
            <Slot />
          </div>
        </div>
      ) : (
        <div>
          ▶︎
          {/* Project content name "closed" here */}
        </div>
      )}
    </div>
  );
});
