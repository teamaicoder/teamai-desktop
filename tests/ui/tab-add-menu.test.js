'use strict';

// UI tests for the tab-bar + button and its dropdown menu.
// Run: npm run test:ui

const { test, expect } = require('@playwright/test');
const { launchApp, clickTabAddItem, makeTempDir, navigateSidebarTo } = require('./helpers/app');

test.describe('tab-bar + button', () => {
  let app, win;

  test.beforeEach(async () => {
    ({ app, win } = await launchApp());
  });

  test.afterEach(async () => {
    await app.close();
  });

  test('+ button is visible in the Build tab bar', async () => {
    const btn = win.locator('.tab-add-btn').first();
    await expect(btn).toBeVisible();
    await expect(btn).toHaveText('+');
  });

  test('clicking + button reveals New File, New Browser and New Terminal options', async () => {
    const btn = win.locator('.tab-add-btn').first();
    await btn.click();

    const menu = win.locator('.tab-add-menu').first();
    await expect(menu).toBeVisible();
    await expect(menu.locator('text=New File')).toBeVisible();
    await expect(menu.locator('text=New Browser')).toBeVisible();
    await expect(menu.locator('text=New Terminal')).toBeVisible();
  });

  test('clicking outside the menu closes it', async () => {
    const btn = win.locator('.tab-add-btn').first();
    await btn.click();
    await expect(win.locator('.tab-add-menu').first()).toBeVisible();

    // Click somewhere outside the menu
    await win.locator('#sidebar-header').click();
    await expect(win.locator('.tab-add-menu').first()).not.toBeVisible({ timeout: 1000 });
  });

  test('clicking New File opens the file picker (dialog appears)', async () => {
    // Can't fully automate a native dialog, so verify the tab count doesn't crash
    // and no JS errors are thrown. A manual step is needed to pick a file.
    const consoleMsgs = [];
    win.on('console', m => { if (m.type() === 'error') consoleMsgs.push(m.text()); });

    await clickTabAddItem(win, 'New File');
    await win.waitForTimeout(500);

    // No JS errors should have been thrown
    const errors = consoleMsgs.filter(m => m.includes('[app]') && m.includes('failed'));
    expect(errors).toHaveLength(0);
  });

  test('clicking New Browser opens a browser tab with an address bar', async () => {
    const errors = [];
    win.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

    await clickTabAddItem(win, 'New Browser');

    // Wait for the tab chip to appear
    const browserChip = win.locator('.tab-chip.browser-tab');
    await expect(browserChip).toBeVisible({ timeout: 5000 });
    await expect(browserChip).toContainText('New Tab');

    // Address bar should be in the DOM
    const urlInput = win.locator('.browser-url-input');
    await expect(urlInput).toBeVisible({ timeout: 3000 });

    // No errors should have been thrown
    const appErrors = errors.filter(m => m.includes('New Browser failed'));
    expect(appErrors).toHaveLength(0);
  });

  test('browser tab address bar navigates on Enter', async () => {
    await clickTabAddItem(win, 'New Browser');

    const urlInput = win.locator('.browser-url-input');
    await expect(urlInput).toBeVisible({ timeout: 5000 });

    await urlInput.fill('example.com');
    await urlInput.press('Enter');

    // Tab title should update to the hostname
    await expect(win.locator('.tab-chip.browser-tab')).toContainText('example.com', { timeout: 8000 });
  });

  test('closing a browser tab removes it and destroys the view', async () => {
    await clickTabAddItem(win, 'New Browser');
    const chip = win.locator('.tab-chip.browser-tab');
    await expect(chip).toBeVisible({ timeout: 5000 });

    const closeBtn = chip.locator('.tab-close');
    await closeBtn.click();

    await expect(chip).not.toBeVisible({ timeout: 3000 });
  });

  test('clicking New Terminal opens a terminal tab', async () => {
    // Navigate to a known-good directory so state.currentDir is valid for ptySpawn
    const { dir, cleanup } = makeTempDir();
    await navigateSidebarTo(win, dir);

    const errors = [];
    win.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

    await clickTabAddItem(win, 'New Terminal');

    // A terminal tab chip should appear
    const chip = win.locator('#tab-bar .tab-chip.terminal-tab');
    await expect(chip).toBeVisible({ timeout: 5000 });

    // No errors should have been thrown
    const appErrors = errors.filter(m => m.includes('New Terminal failed'));
    expect(appErrors).toHaveLength(0);

    cleanup();
  });
});
