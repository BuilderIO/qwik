import { backgroundInstallDeps, installDeps } from '../../qwik/src/cli/utils/install-deps';
import { bgBlue, gray, magenta, red } from 'kleur/colors';
import { cancel, confirm, intro, isCancel, log, select, spinner, text } from '@clack/prompts';
import { getPackageManager, note, runCommand, wait } from '../../qwik/src/cli/utils/utils';
import { join, relative } from 'node:path';

import type { CreateAppResult } from '../../qwik/src/cli/types';
import { clearDir } from './helpers/clearDir';
import { createApp } from './create-app';
/* eslint-disable no-console */
import fs from 'node:fs';
import { getRandomJoke } from './helpers/jokes';
import { installDepsCli } from './helpers/installDepsCli';
import { logAppCreated } from './helpers/logAppCreated';
import { makeTemplateManager } from './helpers/templateManager';
import { resolveRelativeDir } from './helpers/resolveRelativeDir';

export async function runCreateInteractiveCli(): Promise<CreateAppResult> {
  const pkgManager = getPackageManager();
  const templateManager = await makeTemplateManager('app');
  const defaultProjectName = './qwik-app';

  intro(`Let's create a ${bgBlue(' Qwik App ')} ✨ (v${(globalThis as any).QWIK_VERSION})`);

  await wait(500);

  const projectNameAnswer =
    (await text({
      message: `Where would you like to create your new project? ${gray(
        `(Use '.' or './' for current directory)`
      )}`,
      placeholder: defaultProjectName,
    })) || defaultProjectName;

  if (isCancel(projectNameAnswer)) {
    cancel('Operation cancelled.');
    process.exit(0);
  }

  const baseApp = templateManager.getBaseApp();

  if (!baseApp) {
    throw new Error('Base app not found');
  }

  // sorted alphabetically
  const starterApps = templateManager.templates
    .filter((a) => a.id !== baseApp.id)
    .sort((a, b) => a.name.localeCompare(b.name));

  const outDir: string = resolveRelativeDir(projectNameAnswer.trim());
  baseApp.target = outDir;

  const backgroundInstall = backgroundInstallDeps(pkgManager, baseApp);

  log.info(`Creating new project in ${bgBlue(' ' + outDir + ' ')} ... 🐇`);

  let removeExistingOutDirPromise: Promise<void | void[]> | null = null;

  if (fs.existsSync(outDir) && fs.readdirSync(outDir).length > 0) {
    const existingOutDirAnswer = await select({
      message: `Directory "./${relative(
        process.cwd(),
        outDir
      )}" already exists and is not empty. What would you like to do?`,
      options: [
        { value: 'exit', label: 'Do not overwrite this directory and exit' },
        { value: 'replace', label: 'Remove contents of this directory' },
      ],
    });

    if (isCancel(existingOutDirAnswer) || existingOutDirAnswer === 'exit') {
      cancel('Operation cancelled.');
      process.exit(0);
    }

    if (existingOutDirAnswer === 'replace') {
      removeExistingOutDirPromise = clearDir(outDir);
    }
  }
  const starterIdAnswer = await select({
    message: 'Select a starter',
    options: starterApps.map((s) => {
      return { label: s.name, value: s.id, hint: s.pkgJson?.description };
    }),
  });

  if (isCancel(starterIdAnswer)) {
    cancel('Operation cancelled.');
    process.exit(0);
  }

  const starterId = starterIdAnswer as string;

  const runDepInstallAnswer = await confirm({
    message: `Would you like to install ${pkgManager} dependencies?`,
    initialValue: true,
  });

  if (isCancel(runDepInstallAnswer)) {
    cancel('Operation cancelled.');
    process.exit(0);
  }

  const gitInitAnswer = await confirm({
    message: `Initialize a new git repository?`,
    initialValue: true,
  });

  if (removeExistingOutDirPromise) {
    await removeExistingOutDirPromise;
  }

  const runDepInstall: boolean = runDepInstallAnswer;

  if (!runDepInstall) {
    backgroundInstall.abort();
  } else if (typeof backgroundInstall.success === 'undefined') {
    try {
      const joke = await confirm({
        message: `Finishing the install. Wanna hear a joke?`,
        initialValue: true,
      });
      if (!isCancel(joke) && joke) {
        const [setup, punchline] = getRandomJoke();
        note(magenta(`${setup!.trim()}\n${punchline!.trim()}`), '🙈');
      }
    } catch (e) {
      // Never crash on jokes
    }
  }

  const s = spinner();

  s.start('Creating App...');

  const result = await createApp({ appId: starterId, outDir, pkgManager, templateManager });

  s.stop('App Created 🐰');

  if (gitInitAnswer) {
    if (fs.existsSync(join(outDir, '.git'))) {
      log.info(`Git has already been initialized before. Skipping...`);
    } else {
      s.start('Git initializing...');

      try {
        const res = [];
        res.push(await runCommand('git', ['init'], outDir).install);
        res.push(await runCommand('git', ['add', '-A'], outDir).install);
        res.push(await runCommand('git', ['commit', '-m', 'Initial commit ⚡️'], outDir).install);

        if (res.some((r) => r === false)) {
          throw '';
        }

        s.stop('Git initialized 🎲');
      } catch (e) {
        s.stop('Git failed to initialize');
        log.error(red(`Git failed to initialize. You can do this manually by running: git init`));
      }
    }
  }

  let successfulDepsInstall = false;

  if (runDepInstall) {
    successfulDepsInstall = await installDepsCli(
      async () => {
        const success = await backgroundInstall.complete(result.outDir);

        if (success) {
          return await installDeps(pkgManager, result.outDir).install;
        }

        return success;
      },
      { pkgManager, spinner: s }
    );
  }

  logAppCreated(pkgManager, result, successfulDepsInstall);

  return result;
}
