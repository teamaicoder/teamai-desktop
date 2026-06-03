'use strict';

// UI tests for the Build section sidebar: file list, navigation, starred folders, toolbar.
// Run: npm run test:ui

const { test, expect } = require('@playwright/test');
const { launchApp, makeTempDir, navigateSidebarTo } = require('./helpers/app');

test.describe('sidebar', () => {
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

  // ── File list ────────────────────────────────────────────────────────────────

  test('shows files and folders from the navigated directory', async () => {
    const fileList = win.locator('#file-list');
    await expect(fileList.locator('.file-row')).toHaveCount(4); // hello.md, data.json, script.js, subdir/
  });

  test('folders and files are distinguishable in the list', async () => {
    // Folder rows should navigate on click; files should open tabs
    const rows = win.locator('#file-list .file-row');
    await expect(rows).toHaveCount(4);

    // The subdir entry should be present
    await expect(win.locator('#file-list .file-row[data-path]').filter({ hasText: 'subdir' })).toBeVisible();
  });

  test('clicking a folder navigates into it', async () => {
    const subdirRow = win.locator('#file-list .file-row').filter({ hasText: 'subdir' });
    await subdirRow.click();

    // After navigating into subdir, nested.md should be in the list
    await expect(win.locator('#file-list .file-row').filter({ hasText: 'nested.md' })).toBeVisible({ timeout: 3000 });
  });

  // ── Sidebar header ───────────────────────────────────────────────────────────

  test('sidebar header shows the current folder name', async () => {
    const header = win.locator('#sidebar-header .sidebar-header-name');
    await expect(header).toContainText(require('path').basename(dir));
  });

  test('Go up button appears when inside a subdirectory', async () => {
    const subdirRow = win.locator('#file-list .file-row').filter({ hasText: 'subdir' });
    await subdirRow.click();

    const upBtn = win.locator('#sidebar-header .icon-btn[title="Go up"]');
    await expect(upBtn).toBeVisible({ timeout: 3000 });
  });

  test('Go up button navigates back to parent', async () => {
    const subdirRow = win.locator('#file-list .file-row').filter({ hasText: 'subdir' });
    await subdirRow.click();
    await win.locator('#sidebar-header .icon-btn[title="Go up"]').click();

    // Back to root — should see all 4 entries again
    await expect(win.locator('#file-list .file-row')).toHaveCount(4, { timeout: 3000 });
  });

  // ── Toolbar ──────────────────────────────────────────────────────────────────

  test('toolbar shows New File and New Folder buttons', async () => {
    await expect(win.locator('#sidebar-toolbar .sidebar-toolbar-btn').filter({ hasText: 'New File' })).toBeVisible();
    await expect(win.locator('#sidebar-toolbar .sidebar-toolbar-btn').filter({ hasText: 'New Folder' })).toBeVisible();
  });

  // ── Starring ─────────────────────────────────────────────────────────────────

  test('star button toggles starred state', async () => {
    const starBtn = win.locator('#sidebar-header .icon-btn[title="Star this folder"]');
    await expect(starBtn).toBeVisible();

    // Count starred rows before starring
    const countBefore = await win.locator('#starred-section .starred-row').count();

    await starBtn.click();

    // After starring, button title should change
    const unstarBtn = win.locator('#sidebar-header .icon-btn[title="Remove from starred"]');
    await expect(unstarBtn).toBeVisible({ timeout: 2000 });

    // Starred section should have one more row than before
    await expect(win.locator('#starred-section .starred-row')).toHaveCount(countBefore + 1, { timeout: 2000 });
  });

  test('starred folder appears in starred section and is clickable', async () => {
    // Count before starring
    const countBefore = await win.locator('#starred-section .starred-row').count();

    // Star the current dir
    await win.locator('#sidebar-header .icon-btn[title="Star this folder"]').click();
    await expect(win.locator('#starred-section .starred-row')).toHaveCount(countBefore + 1, { timeout: 2000 });

    // Navigate away into subdir
    const subdirRow = win.locator('#file-list .file-row').filter({ hasText: 'subdir' });
    await subdirRow.click();

    // Click the newly added starred row (the last one, which is our temp dir)
    const rows = win.locator('#starred-section .starred-row');
    await rows.last().click();

    // Should be back showing the root temp dir files
    await expect(win.locator('#file-list .file-row')).toHaveCount(4, { timeout: 3000 });
  });
});
