import { component$ } from '@builder.io/qwik';

export const App = component$(() => {
  return (
    <div>
      <span>
        GitHub organization:
        <input value="BuilderIO" />
      </span>
      <div>
        <ul>
          <li>
            <a href="https://github.com/BuilderIO/qwik">Qwik</a>
          </li>
          <li>
            <a href="https://github.com/BuilderIO/partytown">Partytown</a>
          </li>
        </ul>
      </div>
    </div>
  );
});
