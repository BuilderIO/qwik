import { component$, useRef, useClientEffect$, useStore } from '@builder.io/qwik';

export const App = component$(() => {
  const store = useStore({
    width: 0,
    height: 0,
  });
  const outputRef = useRef();
  useClientEffect$(() => {
    if (outputRef.current) {
      const rect = outputRef.current.getBoundingClientRect();
      store.width = Math.round(rect.width);
      store.height = Math.round(rect.height);
    }
  });

  return (
    <div>
      <div style={{ border: '1px solid red', width: '100px' }} ref={outputRef}>
        Change text value here to stretch the box.
      </div>
      <div>
        The above red box is {store.height} pixels high and {store.width} pixels wide.
      </div>
    </div>
  );
});
