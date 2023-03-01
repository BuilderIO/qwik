/* eslint-disable no-console */
import type { AppCommand } from '../utils/app-command';
import { loadIntegrations, sortIntegrationsAndReturnAsClackOptions } from '../utils/integrations';
import prompts from 'prompts';
import { bgCyan, bold, magenta, cyan, bgMagenta } from 'kleur/colors';
import { bye, getPackageManager, panic, printHeader, note } from '../utils/utils';
import { updateApp } from './update-app';
import type { IntegrationData, UpdateAppResult } from '../types';
import { relative } from 'node:path';
import { logSuccessFooter, logNextStep } from '../utils/log';
import { runInPkg, startSpinner } from '../utils/install-deps';
import { intro, isCancel, select, log } from '@clack/prompts';

export async function runAddInteractive(app: AppCommand, id: string | undefined) {
  const pkgManager = getPackageManager();
  const integrations = await loadIntegrations();
  let integration: IntegrationData | undefined;

  console.clear();
  printHeader();

  if (typeof id === 'string') {
    // cli passed a flag with the integration id to add
    integration = integrations.find((i) => i.id === id);
    if (!integration) {
      throw new Error(`Invalid integration: ${id}`);
    }

    intro(`🦋 ${bgCyan(` Add Integration `)} ${bold(magenta(integration.id))}`);
  } else {
    // use interactive cli to choose which integration to add
    intro(`🦋 ${bgCyan(` Add Integration `)}`);

    const integrationChoices = [
      ...integrations.filter((i) => i.type === 'adapter'),
      ...integrations.filter((i) => i.type === 'feature'),
    ];

    const integrationAnswer = await select({
      message: 'What integration would you like to add?',
      options: await sortIntegrationsAndReturnAsClackOptions(integrationChoices),
    });

    if (isCancel(integrationAnswer)) {
      bye();
    }

    integration = integrations.find((i) => i.id === integrationAnswer);

    if (!integration) {
      throw new Error(`Invalid integration: ${id}`);
    }
  }

  const integrationHasDeps =
    Object.keys({
      ...integration.pkgJson.dependencies,
      ...integration.pkgJson.devDependencies,
    }).length > 0;

  let runInstall = false;
  if (integrationHasDeps) {
    runInstall = true;
  }

  const result = await updateApp(pkgManager, {
    rootDir: app.rootDir,
    integration: integration.id,
    installDeps: runInstall,
  });

  const commit = await logUpdateAppResult(pkgManager, result);
  if (commit) {
    await result.commit(true);
    const postInstall = result.integration.pkgJson.__qwik__?.postInstall;
    if (postInstall) {
      const spinner = startSpinner(`Running post install script: ${postInstall}`);
      await runInPkg(pkgManager, postInstall.split(' '), app.rootDir);
      spinner.succeed();
    }
    logUpdateAppCommitResult(result);
  }
}

async function logUpdateAppResult(pkgManager: string, result: UpdateAppResult) {
  const modifyFiles = result.updates.files.filter((f) => f.type === 'modify');
  const overwriteFiles = result.updates.files.filter((f) => f.type === 'overwrite');
  const createFiles = result.updates.files.filter((f) => f.type === 'create');
  const installDepNames = Object.keys(result.updates.installedDeps);
  const installDeps = installDepNames.length > 0;

  if (
    modifyFiles.length === 0 &&
    overwriteFiles.length === 0 &&
    createFiles.length === 0 &&
    !installDeps
  ) {
    panic(`No updates made`);
  }

  log.step(`👻 ${bgCyan(` Ready? `)} Add ${bold(magenta(result.integration.id))} to your app?`);

  if (modifyFiles.length > 0) {
    log.message(
      [
        `🐬 ${cyan('Modify')}`,
        ...modifyFiles.map((f) => `   - ${relative(process.cwd(), f.path)}`),
      ].join('\n')
    );
  }

  if (createFiles.length > 0) {
    console.log(`🌟 ${cyan(`Create`)}`);
    for (const f of createFiles) {
      console.log(`   - ${relative(process.cwd(), f.path)}`);
    }
    console.log(``);
  }

  if (overwriteFiles.length > 0) {
    console.log(`🐳 ${cyan(`Overwrite`)}`);
    for (const f of overwriteFiles) {
      console.log(`   - ${relative(process.cwd(), f.path)}`);
    }
    console.log(``);
  }

  if (installDeps) {
    console.log(
      `💾 ${cyan(`Install ${pkgManager} dependenc${installDepNames.length > 1 ? 'ies' : 'y'}:`)}`
    );
    installDepNames.forEach((depName) => {
      console.log(`   - ${depName} ${result.updates.installedDeps[depName]}`);
    });
    console.log(``);
  }

  const commitAnswer = await prompts(
    {
      type: 'select',
      name: 'commit',
      message: `Ready to apply the ${bold(magenta(result.integration.id))} updates to your app?`,
      choices: [
        { title: 'Yes looks good, finish update!', value: true },
        { title: 'Nope, cancel update', value: false },
      ],
      hint: ' ',
    },
    {
      onCancel: () => {
        console.log(``);
        process.exit(0);
      },
    }
  );
  console.log(``);

  return commitAnswer.commit as boolean;
}

function logUpdateAppCommitResult(result: UpdateAppResult) {
  console.log(
    `🦄 ${bgMagenta(` Success! `)} Added ${bold(cyan(result.integration.id))} to your app`
  );
  console.log(``);
  logSuccessFooter(result.integration.docs);
  const nextSteps = result.integration.pkgJson.__qwik__?.nextSteps;
  logNextStep(nextSteps);
}
