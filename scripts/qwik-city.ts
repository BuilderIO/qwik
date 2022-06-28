import { BuildConfig, panic, run, watcher } from './util';
import { build } from 'esbuild';
import { join } from 'path';
import { readPackageJson, writePackageJson } from './package-json';
import { checkExistingNpmVersion, releaseVersionPrompt } from './release';
import semver from 'semver';
import mri from 'mri';

const PACKAGE = 'qwik-city';

export async function buildQwikCity(config: BuildConfig) {
  const input = join(config.packagesDir, PACKAGE);
  const output = join(input, 'dist');

  await Promise.all([
    buildVite(config, input, output),
    buildCloudflarePages(config, input, output),
    buildExpress(config, input, output),
  ]);

  console.log(`🏙  ${PACKAGE}`);
}

async function buildVite(config: BuildConfig, input: string, output: string) {
  const entryPoints = [join(input, 'buildtime', 'vite', 'index.ts')];

  const external = ['source-map', 'vfile', '@mdx-js/mdx'];

  await build({
    entryPoints,
    outfile: join(output, 'vite', 'index.mjs'),
    bundle: true,
    platform: 'node',
    format: 'esm',
    external,
    watch: watcher(config),
  });

  await build({
    entryPoints,
    outfile: join(output, 'vite', 'index.cjs'),
    bundle: true,
    platform: 'node',
    format: 'cjs',
    external,
    watch: watcher(config),
  });
}

async function buildCloudflarePages(config: BuildConfig, input: string, output: string) {
  const entryPoints = [join(input, 'adaptors', 'cloudflare-pages', 'index.ts')];

  await build({
    entryPoints,
    outfile: join(output, 'adaptors', 'cloudflare-pages', 'index.mjs'),
    bundle: true,
    platform: 'node',
    format: 'esm',
    watch: watcher(config),
  });
}

async function buildExpress(config: BuildConfig, input: string, output: string) {
  const entryPoints = [join(input, 'adaptors', 'express', 'index.ts')];

  const external = ['express', 'path'];

  await build({
    entryPoints,
    outfile: join(output, 'adaptors', 'express', 'index.mjs'),
    bundle: true,
    platform: 'node',
    format: 'esm',
    external,
    watch: watcher(config),
  });

  await build({
    entryPoints,
    outfile: join(output, 'adaptors', 'express', 'index.cjs'),
    bundle: true,
    platform: 'node',
    format: 'cjs',
    external,
    watch: watcher(config),
  });
}

export async function prepareReleaseQwikCity() {
  const pkgRootDir = join(__dirname, '..');
  const pkg = await readPackageJson(pkgRootDir);

  console.log(`⛴ preparing ${pkg.name} ${pkg.version} release`);

  const answers = await releaseVersionPrompt(pkg.name, pkg.version);
  if (!semver.valid(answers.version)) {
    panic(`Invalid version`);
  }

  pkg.version = answers.version;

  await checkExistingNpmVersion(pkg.name, pkg.version);

  await writePackageJson(pkgRootDir, pkg);

  // git add the changed package.json
  const gitAddArgs = ['add', join(pkgRootDir, 'package.json')];
  await run('git', gitAddArgs);

  // git commit the changed package.json
  const commitMessage = `qwik-city ${pkg.version}`;
  const gitCommitArgs = ['commit', '--message', commitMessage];
  await run('git', gitCommitArgs);

  console.log(``);
  console.log(`Next:`);
  console.log(` - Submit a PR to main with the package.json update`);
  console.log(` - Once merged, run the "Release Qwik City" workflow`);
  console.log(` - https://github.com/BuilderIO/qwik/actions/workflows/release-qwik-city.yml`);
  console.log(``);
}

export async function releaseQwikCity() {
  const args = mri(process.argv.slice(2));

  const distTag = args['set-dist-tag'];

  const pkgRootDir = join(__dirname, '..');
  const pkg = await readPackageJson(pkgRootDir);

  console.log(`🚢 publishing ${pkg.name} ${pkg.version}`);

  const npmPublishArgs = ['publish', '--tag', distTag, '--access', 'public'];
  await run('npm', npmPublishArgs, false, false, { cwd: pkgRootDir });
}
