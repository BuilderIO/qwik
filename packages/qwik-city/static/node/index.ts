import type { StaticGenerateOptions } from '../types';
import { createSystem } from './node-system';
import { isMainThread, workerData } from 'node:worker_threads';
import { mainThread } from '../main-thread';
import { workerThread } from '../worker-thread';

export async function generate(opts: StaticGenerateOptions) {
  if (isMainThread) {
    const sys = await createSystem(opts);
    const result = await mainThread(sys);
    return result;
  }

  throw new Error(`generate() cannot be called from a worker thread`);
}

if (!isMainThread && workerData) {
  (async () => {
    // self initializing worker thread with workerData
    const sys = await createSystem(workerData);
    await workerThread(sys);
  })();
}
