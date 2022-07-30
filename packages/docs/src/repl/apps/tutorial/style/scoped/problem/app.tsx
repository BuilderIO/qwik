import { component$, Host, useScopedStyles$ } from '@builder.io/qwik';

export const App = component$(() => {
  return (
    <>
      <ComponentA />
      <ComponentB />
    </>
  );
});

export const ComponentA = component$(() => {
  useScopedStyles$(`
    .component .⭐️� {
      background-color: red;
    }`);
  return (
    <Host class="component">
      <div>A</div>
    </Host>
  );
});

export const ComponentB = component$(() => {
  useScopedStyles$(`
    .component .⭐️� {
      background-color: green;
    }`);

  return (
    <Host class="component">
      <div>B</div>
    </Host>
  );
});
