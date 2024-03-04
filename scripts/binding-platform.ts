import { type BuildConfig, ensureDir } from './util';
import spawn from 'cross-spawn';
import { join } from 'node:path';
import semver from 'semver';
import { existsSync } from 'node:fs';
import { copyFile, readdir, writeFile } from 'fs/promises';

export async function buildPlatformBinding(config: BuildConfig) {
  await new Promise((resolve, reject) => {
    try {
      ensureDir(config.distQwikPkgDir);
      ensureDir(config.distBindingsDir);

      const cmd = `napi`;
      const args = [
        `build`,
        `--cargo-name`,
        'qwik_napi',
        `--platform`,
        `--config=packages/qwik/src/napi/napi.config.json`,
        config.distBindingsDir,
      ];

      if (config.platformTarget) {
        args.push(`--target`, config.platformTarget);
      }
      if (!config.dev) {
        args.push(`--release`);
        args.push(`--strip`);
      }

      const napiCwd = join(config.rootDir);

      const child = spawn(cmd, args, { stdio: 'inherit', cwd: napiCwd });
      child.on('error', reject);

      child.on('close', (code) => {
        if (code === 0) {
          resolve(child.stdout);
        } else {
          reject(`napi exited with code ${code}`);
        }
      });
    } catch (e) {
      reject(e);
    }
  });

  console.log('🐯 native binding');
}

export async function copyPlatformBindingWasm(config: BuildConfig) {
  ensureDir(config.distQwikPkgDir);
  ensureDir(config.distBindingsDir);
  const cacheDir = join(config.tmpDir, `cached-bindings`);

  let buildVersion = '0.0.0';
  try {
    const releaseDataUrl = `https://data.jsdelivr.com/v1/package/npm/@builder.io/qwik`;
    const releaseRsp = await fetch(releaseDataUrl);
    const releases = (await releaseRsp.json()) as any;
    buildVersion = releases.tags.latest;
    Object.values(releases.tags).forEach((version: any) => {
      if (semver.gt(version, buildVersion)) {
        buildVersion = version;
      }
    });
  } catch (e) {
    const cachedDirs = await readdir(cacheDir);
    for (const cachedVersion of cachedDirs) {
      if (semver.gt(cachedVersion, buildVersion)) {
        buildVersion = cachedVersion;
      }
    }
  }

  try {
    const cacheVersionDir = join(cacheDir, buildVersion);
    ensureDir(cacheVersionDir);

    const bindingFilenames = [
      'qwik.darwin-arm64.node',
      'qwik.darwin-x64.node',
      'qwik.wasm.cjs',
      'qwik.wasm.mjs',
      'qwik.win32-x64-msvc.node',
      'qwik_wasm_bg.wasm',
    ];

    await Promise.all(
      bindingFilenames.map(async (bindingFilename) => {
        const cachedPath = join(cacheVersionDir, bindingFilename);
        const distPath = join(config.distBindingsDir, bindingFilename);

        if (!existsSync(cachedPath)) {
          const cdnUrl = `https://cdn.jsdelivr.net/npm/@builder.io/qwik@${buildVersion}/bindings/${bindingFilename}`;
          const rsp = (await fetch(cdnUrl)) as any;
          await writeFile(cachedPath, rsp.body);
        }

        await copyFile(cachedPath, distPath);
      })
    );

    console.log(`🦉 native binding / wasm (copied from npm v${buildVersion})`);
  } catch (e) {
    console.warn(`😱 ${e}`);
  }
}
