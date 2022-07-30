import { component$ } from '@builder.io/qwik';

export const App = component$(() => {
  console.log('render <App>');
  return (
    <div id="container">
      <button
        onClick$={() => {
          // The click handler is completely stateless, and does not use any QWIK api.
          // Meaning, the qwik runtime is NEVER downloaded, nor executed
          console.log('click');
          const div = document.querySelector('#container')! as HTMLElement;
          div.style.background = 'yellow';
        }}
      >
        Action
      </button>
    </div>
  );
});
