/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import matter from 'gray-matter';
import { loadEnv } from 'vite';

const rootDir = path.join(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
export const PRIVATE_GITHUB_ACCESS_TOKEN =
  process.env.GITHUB_TOKEN || loadEnv('', '.', 'PRIVATE').PRIVATE_GITHUB_ACCESS_TOKEN;

async function updateContributors() {
  const routesDir = path.join(rootDir, 'packages', 'docs', 'src', 'routes');
  await updateDocsDir(routesDir);
}

async function updateDocsDir(dir: string) {
  const items = fs.readdirSync(dir);
  for (const itemName of items) {
    if (itemName === 'index.mdx') {
      await updateGithubCommits(path.join(dir, itemName));
    } else {
      const itemPath = path.join(dir, itemName);
      const itemStat = fs.statSync(itemPath);
      if (itemStat.isDirectory()) {
        await updateDocsDir(itemPath);
      }
    }
  }
}

async function updateGithubCommits(filePath: string) {
  console.log('update:', filePath);

  const gm = matter.read(filePath);

  const repoPath = path.relative(rootDir, filePath).replace(/\\/g, '/');
  const url = new URL(`https://api.github.com/repos/QwikDev/qwik/commits`);
  url.searchParams.set('since', new Date('2022-01-01').toISOString());
  url.searchParams.set('path', repoPath);

  const response = await fetch(url.href, {
    headers: {
      'User-Agent': 'Qwik Workshop',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(PRIVATE_GITHUB_ACCESS_TOKEN
        ? {
            Authorization: 'Bearer ' + PRIVATE_GITHUB_ACCESS_TOKEN,
          }
        : {}),
    },
  });
  if (response.status !== 200) {
    console.log('error', response.status, response.statusText, await response.text());
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return;
  }

  const commits: any = await response.json();
  if (!Array.isArray(commits)) {
    console.log('error', JSON.stringify(commits));
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return;
  }

  const contributors: { author: string; count: number }[] = [];

  for (const commit of commits) {
    const author = commit?.author?.login;
    if (author) {
      const contributor = contributors.find((c) => c.author === author);
      if (contributor) {
        contributor.count++;
      } else {
        contributors.push({ author, count: 1 });
      }
    }

    if (commits.indexOf(commit) === 0) {
      gm.data.updated_at = commit?.commit?.author?.date;
    }

    if (commits.indexOf(commit) === commits.length - 1) {
      gm.data.created_at = commit?.commit?.author?.date;
    }
  }

  contributors.sort((a, b) => {
    if (a.count > b.count) {
      return -1;
    }
    if (a.count < b.count) {
      return 1;
    }
    return 0;
  });

  gm.data.contributors = gm.data.contributors || [];
  for (const contributor of contributors) {
    if (!gm.data.contributors.includes(contributor.author)) {
      gm.data.contributors.push(contributor.author);
    }
  }

  const md = matter.stringify(gm.content, gm.data);

  fs.writeFileSync(filePath, md);

  console.log(repoPath, contributors.length);

  if (response.headers.get('x-ratelimit-remaining') === '0') {
    const resetHeader = response.headers.get('x-ratelimit-reset');
    const resetTime = resetHeader ? parseInt(resetHeader) * 1000 : Date.now() + 1000;
    const waitTime = resetTime - Date.now();
    console.log(
      `next request is rate limited, waiting ${Math.round(waitTime / 1000 / 60)} minutes`
    );
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }
}

updateContributors();
