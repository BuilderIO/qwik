import type { Optimizer } from '../types';
import type { BuildOptions } from 'esbuild';
import { clientEsbuildPlugin, serverEsbuildPlugin } from './plugins';

export async function createClientEsbuildOptions(optimizer: Optimizer) {
  await optimizer.getTsconfig();

  const clientBuildOpts: BuildOptions = {
    entryPoints: optimizer.getEntryInputs({ platform: 'client' }),
    outdir: optimizer.getRootDir(),
    plugins: [clientEsbuildPlugin(optimizer)],
    format: 'esm',
    bundle: true,
    splitting: true,
    incremental: true,
    write: false,
  };

  if (!optimizer.isDev()) {
    clientBuildOpts.minify = true;
    clientBuildOpts.define = {
      qDev: false as any,
    };
  }

  return clientBuildOpts;
}

export async function createServerEsbuildOptions(optimizer: Optimizer) {
  await optimizer.getTsconfig();

  const serverBuildOpts: BuildOptions = {
    entryPoints: optimizer.getEntryInputs({ platform: 'server' }),
    outdir: optimizer.getRootDir(),
    plugins: [serverEsbuildPlugin(optimizer)],
    format: 'cjs',
    platform: 'node',
    incremental: true,
    write: false,
  };

  return serverBuildOpts;
}
