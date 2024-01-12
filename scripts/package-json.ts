import { type BuildConfig, ensureDir, type PackageJSON } from './util';
import { readFile, writeFile } from './util';
import { join } from 'node:path';

/**
 * The published build does not use the package.json found in the root directory. This function
 * generates the package.json file for package to be published. Note that some of the properties can
 * be pulled from the root package.json.
 */
export async function generatePackageJson(config: BuildConfig) {
  const rootPkg = await readPackageJson(join(config.packagesDir, 'qwik'));

  const distPkg: PackageJSON = {
    name: rootPkg.name,
    version: config.distVersion,
    description: rootPkg.description,
    license: rootPkg.license,
    main: './core.mjs',
    types: './core.d.ts',
    bin: {
      qwik: './qwik-cli.cjs',
    },
    type: 'module',
    dependencies: rootPkg.dependencies,
    exports: {
      '.': {
        types: './core.d.ts',
        import: {
          min: './core.min.mjs',
          development: './core.mjs',
          production: './core.prod.mjs',
          default: './core.prod.mjs',
        },
        require: {
          development: './core.cjs',
          production: './core.prod.cjs',
          default: './core.prod.cjs',
        },
      },
      './cli': {
        require: './cli.cjs',
      },
      './jsx-runtime': {
        types: './jsx-runtime.d.ts',
        import: {
          min: './core.min.mjs',
          development: './core.mjs',
          production: './core.prod.mjs',
          default: './core.prod.mjs',
        },
        require: {
          development: './core.cjs',
          production: './core.prod.cjs',
          default: './core.prod.cjs',
        },
      },
      './jsx-dev-runtime': {
        types: './jsx-runtime.d.ts',
        import: {
          min: './core.min.mjs',
          development: './core.mjs',
          production: './core.prod.mjs',
          default: './core.mjs',
        },
        require: {
          development: './core.cjs',
          production: './core.prod.cjs',
          default: './core.cjs',
        },
      },
      './build': {
        import: {
          development: './build/index.dev.mjs',
          production: './build/index.prod.mjs',
          default: './build/index.mjs',
        },
        require: {
          development: './build/index.dev.cjs',
          production: './build/index.prod.cjs',
          default: './build/index.cjs',
        },
      },
      './loader': {
        types: './loader/index.d.ts',
        import: './loader/index.mjs',
        require: './loader/index.cjs',
      },
      './optimizer.cjs': './optimizer.cjs',
      './optimizer.mjs': './optimizer.mjs',
      './optimizer': {
        types: './optimizer.d.ts',
        import: './optimizer.mjs',
        require: './optimizer.cjs',
      },
      './server.cjs': './server.cjs',
      './server.mjs': './server.mjs',
      './server': {
        types: './server.d.ts',
        import: './server.mjs',
        require: './server.cjs',
      },
      './testing': {
        types: './testing/index.d.ts',
        import: './testing/index.mjs',
        require: './testing/index.cjs',
      },
      './qwikloader.js': './qwikloader.js',
      './qwikloader.debug.js': './qwikloader.debug.js',
      './qwik-prefetch.js': './qwik-prefetch.js',
      './qwik-prefetch.debug.js': './qwik-prefetch.debug.js',
      './package.json': './package.json',
    },
    files: Array.from(new Set(rootPkg.files)).sort((a, b) => {
      if (a.toLocaleLowerCase() < b.toLocaleLowerCase()) return -1;
      if (a.toLocaleLowerCase() > b.toLocaleLowerCase()) return 1;
      return 0;
    }),
    contributors: rootPkg.contributors,
    homepage: rootPkg.homepage,
    repository: rootPkg.repository,
    bugs: rootPkg.bugs,
    keywords: rootPkg.keywords,
    engines: rootPkg.engines,
  };

  await writePackageJson(config.distQwikPkgDir, distPkg);
  console.log(config.distQwikPkgDir);

  await generateLegacyCjsSubmodule(config, 'core');
  await generateLegacyCjsSubmodule(config, 'jsx-runtime');
  await generateLegacyCjsSubmodule(config, 'jsx-dev-runtime', 'jsx-runtime');
  await generateLegacyCjsSubmodule(config, 'optimizer');
  await generateLegacyCjsSubmodule(config, 'server');

  console.log(`🐷 generated package.json`);
}

export async function generateLegacyCjsSubmodule(
  config: BuildConfig,
  pkgName: string,
  index = pkgName
) {
  // Modern Node.js will resolve the submodule packages using "exports": https://nodejs.org/api/packages.html#subpath-exports
  // however, legacy Node.js still needs a directory and its own package.json
  // this can be removed once node12 is in the distant past
  const pkg: PackageJSON = {
    name: `@builder.io/qwik/${pkgName}`,
    version: config.distVersion,
    main: `../${index}.mjs`,
    module: `../${index}.mjs`,
    types: `../${index}.d.ts`,
    type: 'module',
    private: true,
    exports: {
      '.': {
        types: `../${index}.d.ts`,
        require: `../${index}.cjs`,
        import: `../${index}.mjs`,
      },
    },
  };
  const submoduleDistDir = join(config.distQwikPkgDir, pkgName);
  ensureDir(submoduleDistDir);
  await writePackageJson(submoduleDistDir, pkg);
}

export async function readPackageJson(pkgJsonDir: string) {
  const pkgJsonPath = join(pkgJsonDir, 'package.json');
  const pkgJson: PackageJSON = JSON.parse(await readFile(pkgJsonPath, 'utf-8'));
  return pkgJson;
}

export async function writePackageJson(pkgJsonDir: string, pkgJson: PackageJSON) {
  ensureDir(pkgJsonDir);
  const pkgJsonPath = join(pkgJsonDir, 'package.json');
  const pkgJsonStr = JSON.stringify(pkgJson, null, 2) + '\n';
  await writeFile(pkgJsonPath, pkgJsonStr);
}
