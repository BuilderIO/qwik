import { ChangelogFunctions } from '@changesets/types';
// @ts-ignore
import { getInfo, getInfoFromPullRequest } from '@changesets/get-github-info';
import { config } from 'dotenv';

config();

const changelogFunctions: ChangelogFunctions = {
  getDependencyReleaseLine: async (changesets, dependenciesUpdated, options) => {
    if (!options.repo) {
      throw new Error(
        'Please provide a repo to this changelog generator like this:\n"changelog": ["@changesets/changelog-github", { "repo": "org/repo" }]',
      );
    }
    if (dependenciesUpdated.length === 0) return '';

    const changesetLink = `- Updated dependencies [${(
      await Promise.all(
        changesets.map(async (cs) => {
          if (cs.commit) {
            let { links } = await getInfo({
              repo: options.repo,
              commit: cs.commit,
            });
            return links.commit;
          }
        }),
      )
    )
      .filter((_) => _)
      .join(', ')}]:`;

    const updatedDepenenciesList = dependenciesUpdated.map(
      (dependency) => `  - ${dependency.name}@${dependency.newVersion}`,
    );

    return [changesetLink, ...updatedDepenenciesList].join('\n');
  },
  getReleaseLine: async (changeset, type, options) => {
    if (!options || !options.repo) {
      throw new Error(
        'Please provide a repo to this changelog generator like this:\n"changelog": ["@changesets/changelog-github", { "repo": "org/repo" }]',
      );
    }

    let prFromSummary: number | undefined;
    let commitFromSummary: string | undefined;
    let usersFromSummary: string[] = [];

    const replacedChangelog = changeset.summary
      .replace(/^\s*(?:pr|pull|pull\s+request):\s*#?(\d+)/im, (_, pr) => {
        let num = Number(pr);
        if (!isNaN(num)) prFromSummary = num;
        return '';
      })
      .replace(/^\s*commit:\s*([^\s]+)/im, (_, commit) => {
        commitFromSummary = commit;
        return '';
      })
      .replace(/^\s*(?:author|user):\s*@?([^\s]+)/gim, (_, user) => {
        usersFromSummary.push(user);
        return '';
      })
      .trim();

    const linkifyIssueHints = (line: string) =>
      line.replace(/(?<=\( ?(?:fix|fixes|see) )(#\d+)(?= ?\))/g, (issueHash) => {
        return `[${issueHash}](https://github.com/${
          options.repo
        }/issues/${issueHash.substring(1)})`;
      });

    const [firstLine, ...futureLines] = replacedChangelog
      .split('\n')
      .map((l) => linkifyIssueHints(l.trimEnd()));

    const links = await (async () => {
      if (prFromSummary !== undefined) {
        let { links } = await getInfoFromPullRequest({
          repo: options.repo,
          pull: prFromSummary,
        });
        if (commitFromSummary) {
          const shortCommitId = commitFromSummary.slice(0, 7);
          links = {
            ...links,
            commit: `[\`${shortCommitId}\`](https://github.com/${options.repo}/commit/${commitFromSummary})`,
          };
        }
        return links;
      }
      const commitToFetchFrom = commitFromSummary || changeset.commit;
      if (commitToFetchFrom) {
        let { links } = await getInfo({
          repo: options.repo,
          commit: commitToFetchFrom,
        });
        return links;
      }
      return {
        commit: null,
        pull: null,
        user: null,
      };
    })();

    const users = usersFromSummary.length
      ? usersFromSummary
          .map(
            (userFromSummary) =>
              `[@${userFromSummary}](https://github.com/${userFromSummary})`,
          )
          .join(', ')
      : links.user;

    let suffix = '';
    if (links.pull || links.commit || users) {
      suffix = `(${users ? `by ${users} ` : ''}in ${links.pull || links.commit})`;
    }

    const emojiFirstline = firstLine
      .replace('FEAT:', '✨ ')
      .replace('feat:', '✨ ')
      .replace('fix:', '🐞🩹')
      .replace('FIX:', '🐞🩹')
      .replace('DOCS:', '📃')
      .replace('docs:', '📃');

    return `\n\n- ${emojiFirstline} ${suffix}\n${futureLines
      .map((l) => `  ${l}`)
      .join('\n')}`;
  },
};

export default changelogFunctions;
