/* eslint-disable no-console */
import { component$, useServerMount$, useStore, useWatch$ } from '@builder.io/qwik';

// import { isServer } from '@builder.io/qwik/build';
export const isServer = (() => {
  // This is a workaround for a bug in REPL which fails to package up of @builder.io/qwik/build.
  // TODO remove this when the bug is fixed.
  try {
    return typeof window == 'undefined';
  } catch (e) {
    return false;
  }
})();

export const App = component$(() => {
  const github = useStore({
    org: 'BuilderIO',
    repos: null as string[] | null,
  });

  useServerMount$(async () => {
    github.repos = await getRepositories(github.org);
  });

  useWatch$((track) => {
    track(github, 'org');

    if (isServer) return;

    github.repos = null;
    const controller = new AbortController();
    getRepositories(github.org, controller).then((repos) => (github.repos = repos));

    return () => controller.abort();
  });

  console.log('create JSX');
  return (
    <div>
      <span>
        GitHub username:
        <input
          value={github.org}
          onKeyUp$={(ev) => (github.org = (ev.target as HTMLInputElement).value)}
        />
      </span>
      <div>
        {github.repos ? (
          <ul>
            {github.repos.map((repo) => (
              <li>
                <a href={`https://github.com/${github.org}/${repo}`}>{repo}</a>
              </li>
            ))}
          </ul>
        ) : (
          'loading...'
        )}
      </div>
    </div>
  );
});

export async function getRepositories(username: string, controller?: AbortController) {
  console.log('FETCH', `https://api.github.com/users/${username}/repos`);
  const resp = await fetch(`https://api.github.com/users/${username}/repos`, {
    signal: controller?.signal,
  });
  console.log('FETCH resolved');
  const json = await resp.json();
  return Array.isArray(json) ? json.map((repo: { name: string }) => repo.name) : null;
}
