import {
  accessSync,
  readFileSync,
  writeFileSync,
  rmSync,
  statSync,
  mkdirSync,
  readdirSync,
  copyFileSync,
  existsSync,
} from 'fs';
import assert from 'assert';
import { join, relative } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { readPackageJson, writePackageJson } from './package-json';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

async function validateCreateQwikCli() {
  console.log(`👾 validating create-qwik...`);

  const cliDir = join(__dirname, '..', 'packages', 'create-qwik', 'dist');
  accessSync(cliDir);

  const cliBin = join(cliDir, 'create-qwik');
  accessSync(cliBin);

  const cliPkgJsonPath = join(cliDir, 'package.json');
  const cliPkgJson = JSON.parse(readFileSync(cliPkgJsonPath, 'utf-8'));
  assert.strictEqual(cliPkgJson.name, 'create-qwik');

  const startersDir = join(cliDir, 'starters');
  accessSync(startersDir);

  const appsDir = join(startersDir, 'apps');
  accessSync(appsDir);

  const serversDir = join(startersDir, 'servers');
  accessSync(serversDir);

  const featuresDir = join(startersDir, 'features');
  accessSync(featuresDir);

  const cliApi = join(cliDir, 'index.js');
  console.log(`💫 import cli api: ${cliApi}`);
  const api: typeof import('create-qwik') = await import(pathToFileURL(cliApi).href);

  const starters = await api.getStarters();
  assert.ok(starters.apps.length > 0);

  const tmpDir = join(__dirname, '..', 'dist-dev');
  await validateStarter(api, tmpDir, 'blank', true);
  await validateStarter(api, tmpDir, 'library', false);
  await validateStarter(api, tmpDir, 'qwik-city', true);

  console.log(`👽 create-qwik validated\n`);
}

async function validateStarter(
  api: typeof import('create-qwik'),
  distDir: string,
  starterId: string,
  app: boolean
) {
  const projectName = starterId;
  const appDir = join(distDir, 'app-' + projectName);

  console.log(`\n------------------------------------\n`);
  console.log(`🌎 ${projectName}: ${appDir}`);
  rmSync(appDir, { force: true, recursive: true });

  const result = await api.createStarter({
    projectName,
    starterId,
    outDir: appDir,
  });

  assert.strictEqual(result.projectName, projectName);
  assert.strictEqual(result.starterId, starterId);
  assert.strictEqual(result.outDir, appDir);

  accessSync(result.outDir);

  const appPkgJsonPath = join(result.outDir, 'package.json');
  const appPkgJson = JSON.parse(readFileSync(appPkgJsonPath, 'utf-8'));
  assert.strictEqual(appPkgJson.name, projectName.toLowerCase());

  appPkgJson.devDependencies['@builder.io/qwik'] = 'latest';
  writeFileSync(appPkgJsonPath, JSON.stringify(appPkgJson, null, 2));

  const tsconfigPath = join(result.outDir, 'tsconfig.json');
  accessSync(tsconfigPath);

  const { execa } = await import('execa');
  console.log(`💥 ${projectName}: npm install`);
  await execa('npm', ['install'], { cwd: appDir, stdout: 'inherit' });

  console.log(`🌟 ${projectName}: copy @builder.io/qwik distribution`);
  const qwikNodeModule = join(appDir, 'node_modules', '@builder.io', 'qwik');
  rmSync(qwikNodeModule, { force: true, recursive: true });
  const distQwik = join(__dirname, '..', 'packages', 'qwik', 'dist');
  cpSync(distQwik, qwikNodeModule);

  console.log(`🌟 ${projectName}: copy eslint-plugin-qwik distribution`);
  const eslintNodeModule = join(appDir, 'node_modules', 'eslint-plugin-qwik');
  rmSync(eslintNodeModule, { force: true, recursive: true });
  const distEslintQwik = join(__dirname, '..', 'packages', 'eslint-plugin-qwik', 'dist');
  cpSync(distEslintQwik, eslintNodeModule);

  console.log(`🌈 ${projectName}: npm run build`);
  await execa('npm', ['run', 'build'], { cwd: appDir, stdout: 'inherit' });

  console.log(`🌈 ${projectName}: npm run lint`);
  await execa('npm', ['run', 'lint'], { cwd: appDir, stdout: 'inherit' });

  accessSync(join(appDir, '.vscode'));
  if (app) {
    accessSync(join(appDir, 'dist', 'favicon.ico'));
    accessSync(join(appDir, 'dist', 'q-manifest.json'));
    accessSync(join(appDir, 'dist', 'build'));
    const serverDir = join(appDir, 'server');
    accessSync(serverDir);

    let hasEntryServer = false;
    const serverOutput = readdirSync(serverDir);
    for (const serverFileName of serverOutput) {
      if (serverFileName.startsWith('entry.')) {
        hasEntryServer = true;
        break;
      }
    }

    if (!hasEntryServer) {
      throw new Error(`"${projectName}", ${appDir} did not generate server output`);
    }
    if (!serverOutput) {
      throw new Error(`"${projectName}", ${appDir} did not generate server output`);
    }
  } else {
    accessSync(join(appDir, 'lib', 'types'));
    accessSync(join(appDir, 'lib', 'index.qwik.mjs'));
    accessSync(join(appDir, 'lib', 'index.qwik.cjs'));
  }
  accessSync(join(appDir, 'README.md'));
  accessSync(join(appDir, 'tsconfig.json'));
  accessSync(join(appDir, 'tsconfig.tsbuildinfo'));

  console.log(`⭐️ ${projectName} validated\n`);
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
