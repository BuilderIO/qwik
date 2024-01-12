import {
  type BuildConfig,
  copyFile,
  emptyDir,
  mkdir,
  nodeTarget,
  stat,
  getBanner,
  readdir,
  run,
} from './util';
import { build } from 'esbuild';
import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { readPackageJson, writePackageJson } from './package-json';

const PACKAGE = 'create-qwik';

export async function buildCreateQwikCli(config: BuildConfig) {
  const srcCliDir = join(config.packagesDir, PACKAGE);
  const distCliDir = join(srcCliDir, 'dist');

  await bundleCreateQwikCli(config, srcCliDir, distCliDir);
  await copyStartersDir(config, distCliDir, ['apps']);

  await copyFile(join(srcCliDir, 'package.json'), join(distCliDir, 'package.json'));
  await copyFile(join(srcCliDir, 'README.md'), join(distCliDir, 'README.md'));
  await copyFile(join(srcCliDir, 'create-qwik.cjs'), join(distCliDir, 'create-qwik.cjs'));

  console.log('🐠 create-qwik cli');
}

async function bundleCreateQwikCli(config: BuildConfig, srcCliDir: string, distCliDir: string) {
  emptyDir(distCliDir);

  await build({
    entryPoints: [join(srcCliDir, 'index.ts')],
    outfile: join(distCliDir, 'index.cjs'),
    target: nodeTarget,
    platform: 'node',
    format: 'cjs',
    bundle: true,
    sourcemap: false,
    minify: !config.dev,
    plugins: [
      {
        name: 'colorAlias',
        setup(build) {
          build.onResolve({ filter: /^chalk$/ }, async (args) => {
            const result = await build.resolve('kleur', {
              resolveDir: args.resolveDir,
              kind: 'import-statement',
            });
            if (result.errors.length > 0) {
              return { errors: result.errors };
            }
            return { path: result.path };
          });
        },
      },
    ],
    external: ['prettier', 'typescript'],
    define: {
      'globalThis.CODE_MOD': 'false',
      'globalThis.QWIK_VERSION': JSON.stringify(config.distVersion),
    },
    banner: {
      js: getBanner(PACKAGE, config.distVersion),
    },
  });
}

export async function publishCreateQwikCli(
  config: BuildConfig,
  distTag: string,
  version: string,
  isDryRun: boolean
) {
  const distCliDir = join(config.packagesDir, PACKAGE, 'dist');
  const cliPkg = await readPackageJson(distCliDir);

  // update the cli version
  console.log(`   update version = "${version}"`);
  cliPkg.version = version;
  await writePackageJson(distCliDir, cliPkg);

  // update the base app's package.json
  const distCliBaseAppDir = join(distCliDir, 'starters', 'apps', 'base');
  const baseAppPkg = await readPackageJson(distCliBaseAppDir);
  baseAppPkg.devDependencies = baseAppPkg.devDependencies || {};

  const semverQwik = config.devRelease ? `${version}` : `^${version}`;
  console.log(`   update devDependencies["@builder.io/qwik"] = "${semverQwik}"`);
  baseAppPkg.devDependencies['@builder.io/qwik'] = semverQwik;

  console.log(`   update devDependencies["@builder.io/qwik-city"] = "${semverQwik}"`);
  baseAppPkg.devDependencies['@builder.io/qwik-city'] = semverQwik;

  console.log(`   update devDependencies["eslint-plugin-qwik"] = "${semverQwik}"`);
  baseAppPkg.devDependencies['eslint-plugin-qwik'] = semverQwik;

  const rootPkg = await readPackageJson(config.rootDir);
  const typescriptDepVersion = rootPkg.devDependencies!.typescript;
  const viteDepVersion = rootPkg.devDependencies!.vite;

  console.log(`   update devDependencies["typescript"] = "${typescriptDepVersion}"`);
  baseAppPkg.devDependencies['typescript'] = typescriptDepVersion;

  console.log(`   update devDependencies["vite"] = "${viteDepVersion}"`);
  baseAppPkg.devDependencies['vite'] = viteDepVersion;

  console.log(distCliBaseAppDir, JSON.stringify(baseAppPkg, null, 2));
  await writePackageJson(distCliBaseAppDir, baseAppPkg);

  console.log(`⛴ publishing ${cliPkg.name} ${version}`, isDryRun ? '(dry-run)' : '');

  const npmPublishArgs = ['publish', '--tag', distTag];

  await run('npm', npmPublishArgs, isDryRun, isDryRun, { cwd: distCliDir });

  console.log(
    `🐳 published version "${version}" of ${cliPkg.name} with dist-tag "${distTag}" to npm`,
    isDryRun ? '(dry-run)' : ''
  );
}

export async function copyStartersDir(
  config: BuildConfig,
  distCliDir: string,
  typeDirs: ('apps' | 'features' | 'adapters')[]
) {
  const distStartersDir = join(distCliDir, 'starters');
  try {
    await mkdir(distStartersDir);
  } catch (e) {
    //
  }

  await Promise.all(
    typeDirs.map(async (typeDir) => {
      const srcDir = join(config.startersDir, typeDir);
      const distDir = join(distStartersDir, typeDir);

      await rm(distDir, { force: true, recursive: true });

      await copyDir(config, srcDir, distDir);

      const distStartersDirs = await readdir(distDir);
      await Promise.all(
        distStartersDirs
          .filter((a) => a !== '.DS_Store')
          .map(async (distStartersDir) => {
            const pkgJsonPath = join(distDir, distStartersDir, 'package.json');
            if (!existsSync(pkgJsonPath)) {
              throw new Error(`CLI starter missing package.json: ${pkgJsonPath}`);
            }
          })
      );
    })
  );
}

async function copyDir(config: BuildConfig, srcDir: string, destDir: string) {
  await mkdir(destDir);
  const items = await readdir(srcDir);
  await Promise.all(
    items.map(async (itemName) => {
      if (isValidFsItem(itemName)) {
        const srcPath = join(srcDir, itemName);
        const destPath = join(destDir, itemName);
        const itemStat = await stat(srcPath);
        if (itemStat.isDirectory()) {
          await copyDir(config, srcPath, destPath);
        } else if (itemStat.isFile()) {
          await copyFile(srcPath, destPath);
          if (basename(destPath) === 'package.json') {
            await updatePackageJson(config, destDir);
          }
        }
      }
    })
  );
}

async function updatePackageJson(config: BuildConfig, destDir: string) {
  const rootPkg = await readPackageJson(config.rootDir);
  const pkgJson = await readPackageJson(destDir);

  const setVersionFromRoot = (pkgName: string) => {
    if (pkgJson.devDependencies && pkgJson.devDependencies[pkgName]) {
      if (rootPkg.devDependencies && rootPkg.devDependencies[pkgName]) {
        if (
          rootPkg.devDependencies[pkgName] !== 'next' &&
          rootPkg.devDependencies[pkgName] !== 'dev'
        ) {
          pkgJson.devDependencies[pkgName] = rootPkg.devDependencies[pkgName];
        }
      }
    }
  };

  if (pkgJson.devDependencies && pkgJson.devDependencies['@builder.io/qwik']) {
    if (
      pkgJson.devDependencies['@builder.io/qwik'] !== 'next' &&
      pkgJson.devDependencies['@builder.io/qwik'] !== 'dev'
    ) {
      pkgJson.devDependencies['@builder.io/qwik'] = rootPkg.version;
    }
  }

  setVersionFromRoot('@types/eslint');
  setVersionFromRoot('@types/node');
  setVersionFromRoot('@typescript-eslint/eslint-plugin');
  setVersionFromRoot('@typescript-eslint/parser');
  setVersionFromRoot('eslint');
  setVersionFromRoot('prettier');
  setVersionFromRoot('typescript');
  setVersionFromRoot('node-fetch');
  setVersionFromRoot('vite');

  await writePackageJson(destDir, pkgJson);
}

function isValidFsItem(fsItemName: string) {
  return !IGNORE[fsItemName] && !fsItemName.includes('.prod') && !fsItemName.endsWith('-test');
}

const IGNORE: { [path: string]: boolean } = {
  '.rollup.cache': true,
  build: true,
  server: true,
  e2e: true,
  node_modules: true,
  'package-lock.json': true,
  'starter.tsconfig.json': true,
  'tsconfig.tsbuildinfo': true,
  'yarn.lock': true,
  'pnpm-lock.yaml': true,
};
