import { component$, useStore } from "@builder.io/qwik";

export const Child = component$<{ class: string; name: string }>(
  ({ name, class: className }) => {
    return (
      <div class={className}>
        Child: <span class="binding">{name}</span>
      </div>
    );
  },
);

export default component$(() => {
  const state = useStore([{ name: "INITIAL" }]);
  return (
    <>
      <button onClick$={() => (state[0] = { name: "UPDATE" })}>update!</button>
      <Child class="standalone" name={state[0].name} />
      {state.map((block, idx) => {
        return <Child class="loop" name={block.name} key={idx} />;
      })}
    </>
  );
});
