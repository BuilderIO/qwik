import fs from 'node:fs';
import type { FsUpdates, UpdateAppOptions } from '../types';
import { extname, join } from 'node:path';
import { getPackageManager } from '../utils/utils';
import mergeWith from 'lodash/mergeWith';

export async function mergeIntegrationDir(
  fileUpdates: FsUpdates,
  opts: UpdateAppOptions,
  srcDir: string,
  destDir: string
) {
  const items = await fs.promises.readdir(srcDir);
  await Promise.all(
    items.map(async (itemName) => {
      const destName = itemName === 'gitignore' ? '.gitignore' : itemName;
      const ext = extname(destName);
      const srcChildPath = join(srcDir, itemName);
      const destChildPath = join(destDir, destName);
      const s = await fs.promises.stat(srcChildPath);

      if (s.isDirectory()) {
        await mergeIntegrationDir(fileUpdates, opts, srcChildPath, destChildPath);
      } else if (s.isFile()) {
        if (destName === 'package.json') {
          await mergePackageJsons(fileUpdates, srcChildPath, destChildPath);
        } else if (destName === 'settings.json' || destName === 'tsconfig.json') {
          await mergeJsons(fileUpdates, srcChildPath, destChildPath);
        } else if (destName === 'README.md') {
          await mergeReadmes(fileUpdates, srcChildPath, destChildPath);
        } else if (
          destName === '.gitignore' ||
          destName === '.prettierignore' ||
          destName === '.eslintignore'
        ) {
          await mergeIgnoresFile(fileUpdates, srcChildPath, destChildPath);
        } else if (ext === '.css') {
          await mergeCss(fileUpdates, srcChildPath, destChildPath, opts);
        } else if (fs.existsSync(destChildPath)) {
          fileUpdates.files.push({
            path: destChildPath,
            content: await fs.promises.readFile(srcChildPath),
            type: 'overwrite',
          });
        } else {
          fileUpdates.files.push({
            path: destChildPath,
            content: await fs.promises.readFile(srcChildPath),
            type: 'create',
          });
        }
      }
    })
  );
}

async function mergePackageJsons(fileUpdates: FsUpdates, srcPath: string, destPath: string) {
  const srcContent = await fs.promises.readFile(srcPath, 'utf-8');
  try {
    const srcPkgJson = JSON.parse(srcContent);
    const props = ['scripts', 'dependencies', 'devDependencies'];
    const destPkgJson = JSON.parse(await fs.promises.readFile(destPath, 'utf-8'));
    props.forEach((prop) => {
      mergePackageJsonSort(srcPkgJson, destPkgJson, prop);
    });
    if (destPkgJson.scripts?.qwik) {
      const qwikVal = destPkgJson.scripts.qwik;
      delete destPkgJson.scripts.qwik;
      destPkgJson.scripts.qwik = qwikVal;
    }
    fileUpdates.files.push({
      path: destPath,
      content: JSON.stringify(destPkgJson, null, 2) + '\n',
      type: 'modify',
    });
  } catch (e) {
    fileUpdates.files.push({
      path: destPath,
      content: srcContent,
      type: 'create',
    });
  }
}

async function mergeJsons(fileUpdates: FsUpdates, srcPath: string, destPath: string) {
  const srcContent = await fs.promises.readFile(srcPath, 'utf-8');
  try {
    const srcPkgJson = JSON.parse(srcContent);
    const destPkgJson = JSON.parse(await fs.promises.readFile(destPath, 'utf-8'));
    const mergedJson = mergeWith(srcPkgJson, destPkgJson, (value, srcValue) => {
      if (Array.isArray(value)) {
        return value.concat(srcValue);
      }
    });

    fileUpdates.files.push({
      path: destPath,
      content: JSON.stringify(mergedJson, null, 2) + '\n',
      type: 'modify',
    });
  } catch (e) {
    fileUpdates.files.push({
      path: destPath,
      content: srcContent,
      type: 'create',
    });
  }
}

function mergePackageJsonSort(src: any, dest: any, prop: string) {
  if (src[prop]) {
    if (dest[prop]) {
      Object.assign(dest[prop], { ...src[prop] });
    } else {
      dest[prop] = { ...src[prop] };
    }

    const sorted: any = {};
    const keys = Object.keys(dest[prop]).sort();
    for (const key of keys) {
      sorted[key] = dest[prop][key];
    }
    dest[prop] = sorted;
  }
}

async function mergeReadmes(fileUpdates: FsUpdates, srcPath: string, destPath: string) {
  const srcContent = await fs.promises.readFile(srcPath, 'utf-8');

  let type: 'create' | 'modify';
  let destContent = '';
  try {
    destContent = await fs.promises.readFile(destPath, 'utf-8');
    destContent = destContent.trim() + '\n\n' + srcContent;
    type = 'modify';
  } catch (e) {
    destContent = srcContent;
    type = 'create';
  }

  const pkgManager = getPackageManager();
  if (pkgManager !== 'npm') {
    destContent = destContent.replace(/\b(npm run|pnpm run|yarn( run)?)\b/g, pkgManager);
  }

  fileUpdates.files.push({
    path: destPath,
    content: destContent.trim() + '\n',
    type,
  });
}

async function mergeIgnoresFile(fileUpdates: FsUpdates, srcPath: string, destPath: string) {
  const srcContent = await fs.promises.readFile(srcPath, 'utf-8');

  try {
    const destContent = await fs.promises.readFile(destPath, 'utf-8');
    const srcLines = srcContent.trim().split(/\r?\n/);
    const destLines = destContent.trim().split(/\r?\n/);
    for (const srcLine of srcLines) {
      if (!destLines.includes(srcLine)) {
        if (srcLine.startsWith('#')) {
          destLines.push('');
        }
        destLines.push(srcLine);
      }
    }
    fileUpdates.files.push({
      path: destPath,
      content: destLines.join('\n').trim() + '\n',
      type: 'modify',
    });
  } catch (e) {
    fileUpdates.files.push({
      path: destPath,
      content: srcContent,
      type: 'create',
    });
  }
}

async function mergeCss(
  fileUpdates: FsUpdates,
  srcPath: string,
  destPath: string,
  opts: UpdateAppOptions
) {
  const srcContent = await fs.promises.readFile(srcPath, 'utf-8');

  try {
    // css file already exists, prepend the src to the dest file
    const destContent = await fs.promises.readFile(destPath, 'utf-8');
    const mergedContent = srcContent.trim() + '\n\n' + destContent.trim() + '\n';

    const isAddingLibrary = opts.installDeps === true;
    // When it's integrating a css library, use merge strategy
    // Otherwise, it's initializing a new Qwik project, use overwrite strategy
    fileUpdates.files.push({
      path: destPath,
      content: isAddingLibrary ? mergedContent : srcContent,
      type: isAddingLibrary ? 'modify' : 'overwrite',
    });
  } catch (e) {
    // css file doesn't already exist, just copy it over
    fileUpdates.files.push({
      path: destPath,
      content: srcContent,
      type: 'create',
    });
  }
}
