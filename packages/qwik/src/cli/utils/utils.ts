import { blue, gray, green, magenta, red, reset, white } from 'kleur/colors';
import { log, outro } from '@clack/prompts';

import type { ChildProcess } from 'node:child_process';
import type { IntegrationPackageJson } from '../types';
import detectPackageManager from 'which-pm-runs';
import fs from 'node:fs';
import { join } from 'node:path';
import spawn from 'cross-spawn';

export function runCommand(cmd: string, args: string[], cwd: string) {
  let child: ChildProcess;

  const install = new Promise<boolean>((resolve) => {
    try {
      child = spawn(cmd, args, {
        cwd,
        stdio: 'ignore',
      });

      child.on('error', (e) => {
        if (e) {
          if (e.message) {
            log.error(red(String(e.message)) + `\n\n`);
          } else {
            log.error(red(String(e)) + `\n\n`);
          }
        }
        resolve(false);
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    } catch (e) {
      resolve(false);
    }
  });

  const abort = async () => {
    if (child) {
      child.kill('SIGINT');
    }
  };

  return { abort, install };
}

export async function readPackageJson(dir: string) {
  const path = join(dir, 'package.json');
  const pkgJson: IntegrationPackageJson = JSON.parse(await fs.promises.readFile(path, 'utf-8'));
  return pkgJson;
}

export async function writePackageJson(dir: string, pkgJson: IntegrationPackageJson) {
  const path = join(dir, 'package.json');
  await fs.promises.writeFile(path, JSON.stringify(pkgJson, null, 2) + '\n');
}

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function cleanPackageJson(srcPkg: IntegrationPackageJson) {
  srcPkg = { ...srcPkg };

  const cleanedPkg: IntegrationPackageJson = {
    name: srcPkg.name,
    version: srcPkg.version,
    description: srcPkg.description,
    scripts: srcPkg.scripts,
    dependencies: srcPkg.dependencies,
    devDependencies: srcPkg.devDependencies,
    main: srcPkg.main,
    qwik: srcPkg.qwik,
    module: srcPkg.module,
    types: srcPkg.types,
    exports: srcPkg.exports,
    files: srcPkg.files,
    engines: { node: srcPkg.engines?.node || '^18.17.0 || ^20.3.0 || >=21.0.0' },
  };

  Object.keys(cleanedPkg).forEach((prop) => {
    delete (srcPkg as any)[prop];
  });
  delete srcPkg.__qwik__;

  const sortedKeys = Object.keys(srcPkg).sort();
  for (const key of sortedKeys) {
    (cleanedPkg as any)[key] = (srcPkg as any)[key];
  }

  return cleanedPkg;
}

export function dashToTitleCase(str: string) {
  return str
    .toLocaleLowerCase()
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export function toDashCase(str: string) {
  return str.toLocaleLowerCase().replace(/ /g, '-');
}

export function limitLength(hint: string, maxLength: number = 50) {
  if (hint.length > maxLength) {
    return hint.substring(0, maxLength - 3) + '...';
  }
  return hint;
}

export function getPackageManager() {
  return detectPackageManager()?.name || 'npm';
}

export function pmRunCmd() {
  const pm = getPackageManager();
  if (pm !== 'npm') {
    return pm;
  }
  return `${pm} run`;
}

export function panic(msg: string) {
  console.error(`\n❌ ${red(msg)}\n`);
  process.exit(1);
}

export function bye(): never {
  outro('Take care, see you soon! 👋');
  process.exit(0);
}

export function printHeader() {
  /* eslint-disable no-console */
  console.log(
    blue(`
      ${magenta('............')}
    .::: ${magenta(':--------:.')}
   .::::  ${magenta('.:-------:.')}
  .:::::.   ${magenta('.:-------.')}
  ::::::.     ${magenta('.:------.')}
 ::::::.        ${magenta(':-----:')}
 ::::::.       ${magenta('.:-----.')}
  :::::::.     ${magenta('.-----.')}
   ::::::::..   ${magenta('---:.')}
    .:::::::::. ${magenta(':-:.')}
     ..::::::::::::
             ...::::
    `),
    '\n'
  );
}

export async function getFilesDeep(root: string) {
  const files: string[] = [];

  async function getFiles(directory: string) {
    if (!fs.existsSync(directory)) {
      return;
    }

    const filesInDirectory = await fs.promises.readdir(directory);
    for (const file of filesInDirectory) {
      const absolute = join(directory, file);

      if (fs.statSync(absolute).isDirectory()) {
        await getFiles(absolute);
      } else {
        files.push(absolute);
      }
    }
  }

  await getFiles(root);
  return files;
}

// Used from https://github.com/sindresorhus/is-unicode-supported/blob/main/index.js
export default function isUnicodeSupported() {
  if (process.platform !== 'win32') {
    return process.env.TERM !== 'linux'; // Linux console (kernel)
  }

  return (
    Boolean(process.env.CI) ||
    Boolean(process.env.WT_SESSION) || // Windows Terminal
    Boolean(process.env.TERMINUS_SUBLIME) || // Terminus (<0.2.27)
    process.env.ConEmuTask === '{cmd::Cmder}' || // ConEmu and cmder
    process.env.TERM_PROGRAM === 'Terminus-Sublime' ||
    process.env.TERM_PROGRAM === 'vscode' ||
    process.env.TERM === 'xterm-256color' ||
    process.env.TERM === 'alacritty' ||
    process.env.TERMINAL_EMULATOR === 'JetBrains-JediTerm'
  );
}

// Used from https://github.com/natemoo-re/clack/blob/main/packages/prompts/src/index.ts
const unicode = isUnicodeSupported();
const s = (c: string, fallback: string) => (unicode ? c : fallback);
const S_BAR = s('│', '|');
const S_BAR_H = s('─', '-');
const S_CORNER_TOP_RIGHT = s('╮', '+');
const S_CONNECT_LEFT = s('├', '+');
const S_CORNER_BOTTOM_RIGHT = s('╯', '+');
const S_STEP_SUBMIT = s('◇', 'o');

function ansiRegex() {
  const pattern = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))',
  ].join('|');

  return new RegExp(pattern, 'g');
}

const strip = (str: string) => str.replace(ansiRegex(), '');
export const note = (message = '', title = '') => {
  const lines = `\n${message}\n`.split('\n');
  const titleLen = strip(title).length;
  const len =
    Math.max(
      lines.reduce((sum, ln) => {
        ln = strip(ln);
        return ln.length > sum ? ln.length : sum;
      }, 0),
      titleLen
    ) + 2;
  const msg = lines
    .map((ln) => `${gray(S_BAR)}  ${white(ln)}${' '.repeat(len - strip(ln).length)}${gray(S_BAR)}`)
    .join('\n');
  process.stdout.write(
    `${gray(S_BAR)}\n${green(S_STEP_SUBMIT)}  ${reset(title)} ${gray(
      S_BAR_H.repeat(Math.max(len - titleLen - 1, 1)) + S_CORNER_TOP_RIGHT
    )}\n${msg}\n${gray(S_CONNECT_LEFT + S_BAR_H.repeat(len + 2) + S_CORNER_BOTTOM_RIGHT)}\n`
  );
};
// End of used code from clack
