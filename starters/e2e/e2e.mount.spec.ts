import { test, expect } from '@playwright/test';

test.describe('mount', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e/mount');
    page.on('pageerror', (err) => expect(err).toEqual(undefined));
  });

  test('should render logs correctly', async ({ page }) => {
    const btn = page.locator('button');
    const logs = page.locator('#logs');
    const renders = page.locator('#renders');
    await expect(renders).toHaveText('Renders: 2');
    await expect(logs).toHaveText(`BEFORE useServerMount1()
AFTER useServerMount1()
BEFORE useMount2()
AFTER useMount2()
BEFORE useTrack3()
AFTER useTrack3()
BEFORE useServerMount4()
AFTER useServerMount4()`);

    await btn.click();
    await expect(renders).toHaveText('Renders: 3');
    await expect(logs).toHaveText(`BEFORE useServerMount1()
AFTER useServerMount1()
BEFORE useMount2()
AFTER useMount2()
BEFORE useTrack3()
AFTER useTrack3()
BEFORE useServerMount4()
AFTER useServerMount4()
Click`);
  });
});
