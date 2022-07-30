import { component$, Host, useStyles$ } from '@builder.io/qwik';

export const App = component$(() => {
  return (
    <>
      <ComponentA />
      <ComponentB />
    </>
  );
});

export const ComponentA = component$(() => {
  useStyles$(`
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
  useStyles$(`
    .component .⭐️� {
      background-color: green;
    }`);

  return (
    <Host class="component">
      <div>B</div>
    </Host>
  );
});
