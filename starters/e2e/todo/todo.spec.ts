import { test, expect, Page } from '@playwright/test';

test.describe('Todo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todo/');
  });

  test('todo title', async ({ page }) => {
    const title = page.locator('title');
    await expect(title).toHaveText('Qwik Demo: ToDo');
  });

  test('should start with 3 items', async ({ page }) => {
    await expect(page.locator('.todo-count > strong')).toContainText('3');
  });

  test('should add new item', async ({ page }) => {
    await addTodoItem(page, 'New Item');
    await assertItemCount(page, 4);
    await expect(page.locator('.todo-list>li:last-child label')).toContainText('New Item');
  });

  test('should remove item', async ({ page }) => {
    await assertItemCount(page, 3);
    await page.locator('.todo-list>li:last-child').hover();
    await page.locator('.todo-list>li:last-child button').click();
    await assertItemCount(page, 2);
  });

  test('should complete an item', async ({ page }) => {
    await assertItemCount(page, 3);
    await page.locator('.todo-list>li:last-child input').click();
    await assertItemCount(page, 2, 3);
  });

  test('should edit an item', async ({ page }) => {
    await page.locator('.todo-list>li:first-child label').dblclick();
    await page.locator('.todo-list>li:first-child input.edit').fill('');
    await page.locator('.todo-list>li:first-child input.edit').press('X');
    await page.locator('.todo-list>li:first-child input.edit').press('Enter');
    await expect(page.locator('.todo-list>li:first-child')).toContainText('X');
  });

  test('should blur input.edit element', async ({ page }) => {
    await page.locator('.todo-list>li:first-child label').dblclick();
    await page.locator('.todo-list>li:first-child input.edit').dispatchEvent('blur');
  });

  test('should clear completed', async ({ page }) => {
    await assertItemCount(page, 3);
    await page.locator('.todo-list>li:first-child input[type=checkbox]').click();
    await page.locator('button.clear-completed').click();
    await assertItemCount(page, 2);
  });

  // Flaky on E2E Tests (ubuntu-latest, chromium)
  // test('should add item, remove item, set filter.', async ({ page }) => {
  //   await addTodoItem(page, 'New Item');
  //   await assertItemCount(page, 4);
  //   await page.locator('.todo-list>li:nth-child(2)').hover();
  //   await page.locator('.todo-list>li:nth-child(2) button').click();
  //   await assertItemCount(page, 3);
  //   await page.locator('.todo-list>li:last-child').hover();
  //   await page.locator('.todo-list>li:last-child input').click();
  //   await assertItemCount(page, 2, 3);
  //   await page.locator('footer li:first-child').click();
  //   await page.locator('.clear-completed').click();
  //   await assertItemCount(page, 2);
  // });
});
async function assertItemCount(page: Page, count: number, total?: number) {
  await expect(page.locator('.todo-count > strong')).toContainText(String(count));
  await expect(page.locator('.todo-list>li')).toHaveCount(total == undefined ? count : total);
}

async function addTodoItem(page: Page, text: string) {
  await page.fill('input.new-todo', text);
  await page.press('input.new-todo', 'Enter');
  await page.waitForTimeout(50);
}
