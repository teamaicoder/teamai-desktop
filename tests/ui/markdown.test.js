'use strict';

// UI tests for markdown file rendering and the edit/preview toggle.
// Run: npm run test:ui

const { test, expect } = require('@playwright/test');
const { launchApp, makeTempDir, navigateSidebarTo } = require('./helpers/app');

test.describe('markdown rendering', () => {
  let app, win, dir, cleanup;

  test.beforeEach(async () => {
    ({ app, win } = await launchApp());
    ({ dir, cleanup } = makeTempDir());
    await navigateSidebarTo(win, dir);
  });

  test.afterEach(async () => {
    await app.close();
    cleanup();
  });

  test('markdown file opens in preview (view) mode by default', async () => {
    await win.locator('#file-list .file-row').filter({ hasText: 'hello.md' }).click();

    // The rendered preview should contain an <h1> from the "# Hello" heading
    const tabContent = win.locator('#tab-content');
    await expect(tabContent.locator('h1')).toBeVisible({ timeout: 5000 });
    await expect(tabContent.locator('h1')).toContainText('Hello');
  });

  test('markdown preview renders body text', async () => {
    await win.locator('#file-list .file-row').filter({ hasText: 'hello.md' }).click();

    const tabContent = win.locator('#tab-content');
    await expect(tabContent).toContainText('This is a test file.', { timeout: 5000 });
  });

  test('Edit button switches to editor mode', async () => {
    await win.locator('#file-list .file-row').filter({ hasText: 'hello.md' }).click();

    // The edit button has no title — locate it by text content inside the toolbar
    const editBtn = win.locator('#tab-content .toolbar-btn').filter({ hasText: 'Edit' });
    await expect(editBtn).toBeVisible({ timeout: 3000 });
    await editBtn.click();

    // In edit mode, Toast UI Editor (v2) should be present
    const editor = win.locator('#tab-content .tui-editor-defaultUI');
    await expect(editor).toBeVisible({ timeout: 5000 });
  });

  test('switching back to preview re-renders the html', async () => {
    await win.locator('#file-list .file-row').filter({ hasText: 'hello.md' }).click();

    // Enter edit mode
    const editBtn = win.locator('#tab-content .toolbar-btn').filter({ hasText: 'Edit' });
    await expect(editBtn).toBeVisible({ timeout: 3000 });
    await editBtn.click();

    // Switch back to preview using the View button
    const viewBtn = win.locator('#tab-content .toolbar-btn').filter({ hasText: 'View' });
    await expect(viewBtn).toBeVisible({ timeout: 3000 });
    await viewBtn.click();

    // Rendered HTML heading should be back
    await expect(win.locator('#tab-content h1')).toBeVisible({ timeout: 3000 });
  });

  test('no JS errors when opening a markdown file', async () => {
    const errors = [];
    win.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

    await win.locator('#file-list .file-row').filter({ hasText: 'hello.md' }).click();
    await win.waitForTimeout(500);

    const appErrors = errors.filter(m => m.includes('[app]') && m.includes('failed'));
    expect(appErrors).toHaveLength(0);
  });
});
