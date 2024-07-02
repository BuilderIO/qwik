import {
  accessSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join, relative } from 'node:path';
import { readPackageJson, writePackageJson } from './package-json';

import assert from 'assert';
import { panic } from './util';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

async function validateCreateQwikCli() {
  console.log(`👾 validating create-qwik...`);

  const cliDir = join(__dirname, '..', 'packages', 'create-qwik', 'dist');
  accessSync(cliDir);

  const cliBin = join(cliDir, 'create-qwik.cjs');
  accessSync(cliBin);

  const cliPkgJsonPath = join(cliDir, 'package.json');
  const cliPkgJson = JSON.parse(readFileSync(cliPkgJsonPath, 'utf-8'));
  assert.strictEqual(cliPkgJson.name, 'create-qwik');

  const startersDir = join(cliDir, 'starters');
  accessSync(startersDir);

  const appsDir = join(startersDir, 'apps');
  accessSync(appsDir);

  const cliApi = join(cliDir, 'index.cjs');
  console.log(`💫 import cli api: ${cliApi}`);
  const api: typeof import('create-qwik') = await import(pathToFileURL(cliApi).href);

  const tmpDir = join(__dirname, '..', 'dist-dev');

  await Promise.all([
    validateStarter(api, tmpDir, 'basic', true, `👻`),
    validateStarter(api, tmpDir, 'empty', true, `🫙`),
    validateStarter(api, tmpDir, 'library', false, `📚`),
  ]).catch((e) => {
    console.error(e);
    panic(String(e));
  });

  console.log(`👽 create-qwik validated\n`);
}

async function validateStarter(
  api: typeof import('create-qwik'),
  distDir: string,
  starterId: string,
  app: boolean,
  emoji: string
) {
  const appDir = join(distDir, 'e2e-' + starterId);

  console.log(`${emoji} ${appDir}`);
  rmSync(appDir, { force: true, recursive: true });

  const result = await api.createApp({
    starterId,
    outDir: appDir,
  });

  assert.strictEqual(result.starterId, starterId);
  assert.strictEqual(result.outDir, appDir);

  accessSync(result.outDir);

  const appPkgJsonPath = join(result.outDir, 'package.json');
  const appPkgJson = JSON.parse(readFileSync(appPkgJsonPath, 'utf-8'));

  appPkgJson.devDependencies['@builder.io/qwik'] = 'latest';
  writeFileSync(appPkgJsonPath, JSON.stringify(appPkgJson, null, 2));

  const tsconfigPath = join(result.outDir, 'tsconfig.json');
  accessSync(tsconfigPath);

  const { execa } = await import('execa');
  console.log(`${emoji} ${starterId}: npm install`);
  await execa('npm', ['install', '--legacy-peer-deps'], { cwd: appDir, stdout: 'inherit' });

  // console.log(`${emoji} ${projectName}: copy @builder.io/qwik distribution`);
  // const qwikNodeModule = join(appDir, 'node_modules', '@builder.io', 'qwik');
  // rmSync(qwikNodeModule, { force: true, recursive: true });
  // const distQwik = join(__dirname, '..', 'packages', 'qwik', 'dist');
  // cpSync(distQwik, qwikNodeModule);

  // console.log(`${emoji} ${projectName}: copy eslint-plugin-qwik distribution`);
  // const eslintNodeModule = join(appDir, 'node_modules', 'eslint-plugin-qwik');
  // rmSync(eslintNodeModule, { force: true, recursive: true });
  // const distEslintQwik = join(__dirname, '..', 'packages', 'eslint-plugin-qwik', 'dist');
  // cpSync(distEslintQwik, eslintNodeModule);

  // console.log(`${emoji} ${projectName}: copy @types`);
  // const typesNodeModule = join(appDir, 'node_modules', '@types');
  // const distTypesQwik = join(__dirname, '..', 'node_modules', '@types');
  // cpSync(distTypesQwik, typesNodeModule);

  // console.log(`${emoji} ${projectName}: npm run build`);
  // if (app) {
  //   await execa('node', ['./node_modules/@builder.io/qwik/qwik.cjs', 'build'], {
  //     cwd: appDir,
  //     stdout: 'inherit',
  //   });
  // } else {
  //   await execa('npm', ['run', 'build'], {
  //     cwd: appDir,
  //     stdout: 'inherit',
  //   });
  // }

  // accessSync(join(appDir, '.vscode'));

  // if (app) {
  //   // app
  //   accessSync(join(appDir, 'dist', 'favicon.ico'));
  //   accessSync(join(appDir, 'dist', 'q-manifest.json'));
  //   accessSync(join(appDir, 'dist', 'build'));
  // } else {
  //   // library
  //   accessSync(join(appDir, 'lib', 'types'));
  //   accessSync(join(appDir, 'lib', 'index.qwik.mjs'));
  //   accessSync(join(appDir, 'lib', 'index.qwik.cjs'));
  // }
  // accessSync(join(appDir, 'README.md'));
  // accessSync(join(appDir, 'tsconfig.json'));
  // accessSync(join(appDir, 'tsconfig.tsbuildinfo'));

  console.log(`${emoji} ${starterId} validated\n`);
}

function cpSync(src: string, dest: string) {
  // cpSync() not available until Node v16.7.0
  try {
    const stats = statSync(src);
    if (stats.isDirectory()) {
      mkdirSync(dest, { recursive: true });
      readdirSync(src).forEach((childItem) => {
        const childSrc = join(src, childItem);
        const childDest = join(dest, childItem);
        cpSync(childSrc, childDest);
      });
    } else {
      copyFileSync(src, dest);
    }
  } catch (e) {}
}

async function copyLocalQwikDistToTestApp(appDir: string) {
  const srcQwikDir = join(__dirname, '..', 'packages', 'qwik', 'dist');
  const destQwikDir = join(appDir, 'node_modules', '@builder.io', 'qwik');
  const srcQwikCityDir = join(__dirname, '..', 'packages', 'qwik-city', 'lib');
  const destQwikCityDir = join(appDir, 'node_modules', '@builder.io', 'qwik-city');
  const destQwikBin = relative(appDir, join(destQwikDir, 'qwik.cjs'));

  if (existsSync(appDir) && existsSync(srcQwikDir) && existsSync(srcQwikCityDir)) {
    console.log('\nqwik-app local development updates:');

    rmSync(destQwikDir, { recursive: true, force: true });
    cpSync(srcQwikDir, destQwikDir);
    console.log(
      ` - Copied "${relative(process.cwd(), srcQwikDir)}" to "${relative(
        process.cwd(),
        destQwikDir
      )}"`
    );

    rmSync(destQwikCityDir, { recursive: true, force: true });
    cpSync(srcQwikCityDir, destQwikCityDir);
    console.log(
      ` - Copied "${relative(process.cwd(), srcQwikCityDir)}" to "${relative(
        process.cwd(),
        destQwikCityDir
      )}"`
    );

    const appPackageJson = await readPackageJson(appDir);
    appPackageJson.scripts!.qwik = `node ./${destQwikBin}`;
    await writePackageJson(appDir, appPackageJson);
    console.log(
      ` - Updated ${relative(process.cwd(), appDir)} package.json qwik script to "${
        appPackageJson.scripts!.qwik
      }"`
    );

    console.log('');
  }
}

(async () => {
  try {
    if (process.argv.includes('--copy-local-qwik-dist')) {
      const appDir = join(__dirname, '..', 'qwik-app');
      await copyLocalQwikDistToTestApp(appDir);
    } else {
      await validateCreateQwikCli();
    }
  } catch (e) {
    console.error('❌', e);
    process.exit(1);
  }
})();
