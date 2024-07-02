import chalk from 'chalk';
import waitOn from 'wait-on';
import path from 'path';
import { spawn, spawnSync } from 'child_process';

let vitePreview = null;

export default {
  async before() {
    console.info(chalk.dim(' ℹ Starting Vite preview server...'));

    spawnSync(path.resolve('node_modules/.bin/qwik'), ['build', 'preview'], { cwd: process.cwd() });

    vitePreview = spawn(path.resolve('node_modules/.bin/vite'), ['preview', '--host'], {
      cwd: process.cwd()
    });

    return waitOn({
      resources: [this.settings.baseUrl],
      timeout: 5000,
    }).then(() => {
      console.info(chalk.dim(' ℹ Vite preview server running.'));
    });
  },

  async after() {
    if (vitePreview) {
      console.info(chalk.dim('\n ℹ Stopping Vite preview server...'));
      vitePreview.kill('SIGTERM');
      console.info(chalk.dim(' ℹ Vite preview server stopped.'));
    }
  },
}
