import { component$, useOnDocument, $, useStore, useOn, useOnWindow } from '@builder.io/qwik';

export const App = component$(() => {
  const store = useStore(
    {
      element: { x: 0, y: 0 },
      window: { x: 0, y: 0 },
      document: { x: 0, y: 0 },
    },
    { recursive: true }
  );
  useOn(
    'mousemove',
    $((event) => {
      store.element.x = (event as MouseEvent).x;
      store.element.y = (event as MouseEvent).y;
    })
  );
  useOnDocument(
    'mousemove',
    $((event) => {
      store.document.x = (event as MouseEvent).x;
      store.document.y = (event as MouseEvent).y;
    })
  );
  useOnWindow(
    'mousemove',
    $((event) => {
      store.window.x = (event as MouseEvent).x;
      store.window.y = (event as MouseEvent).y;
    })
  );

  return (
    <ul>
      <li>
        Element: ({store.element.x}, {store.element.y})
      </li>
      <li>
        Document: ({store.document.x}, {store.document.y})
      </li>
      <li>
        Window: ({store.window.x}, {store.window.y})
      </li>
    </ul>
  );
});
