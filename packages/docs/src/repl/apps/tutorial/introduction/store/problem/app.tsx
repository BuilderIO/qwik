import { component$ } from '@builder.io/qwik';

export const App = component$(() => {
  // `github` is just a constant object.
  // Convert it to a Store that can be serialized to JSON on application pause.
  const github = {
    org: 'BuilderIO',
    repos: ['qwik', 'partytown'] as string[] | null,
  };

  return (
    <div>
      <span>
        GitHub username:
        <input value={github.org} />
      </span>
      <div>
        {github.repos ? (
          <ul>
            {github.repos.map((repo) => (
              <li>
                <a href={`https://github.com/${github.org}/${repo}`}>
                  {github.org}/{repo}
                </a>
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
