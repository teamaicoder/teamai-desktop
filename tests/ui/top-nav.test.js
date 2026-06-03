'use strict';

// UI tests for the top-level navigation tabs (Ideas, Design, Plan & Track, Build, Test, Deploy, Operate).
// Run: npm run test:ui

const { test, expect } = require('@playwright/test');
const { launchApp } = require('./helpers/app');

test.describe('top-level navigation', () => {
  let app, win;

  test.beforeEach(async () => {
    ({ app, win } = await launchApp());
  });

  test.afterEach(async () => {
    await app.close();
  });

  test('all nav tabs are visible', async () => {
    const tabs = win.locator('.nav-tab');
    await expect(tabs).toHaveCount(7);
    for (const label of ['Ideas', 'Design', 'Plan & Track', 'Build', 'Test', 'Deploy', 'Operate']) {
      await expect(win.locator(`.nav-tab:has-text("${label}")`)).toBeVisible();
    }
  });

  test('Build is the active tab on startup', async () => {
    const buildTab = win.locator('.nav-tab[data-section="build"]');
    await expect(buildTab).toHaveClass(/active/);
  });

  test('Build section pane is visible on startup', async () => {
    const buildPane = win.locator('#section-build');
    await expect(buildPane).toHaveClass(/active/);
  });

  test('clicking Ideas tab activates it and hides Build', async () => {
    const ideasTab = win.locator('.nav-tab[data-section="ideas"]');
    await ideasTab.click();

    await expect(ideasTab).toHaveClass(/active/);
    await expect(win.locator('.nav-tab[data-section="build"]')).not.toHaveClass(/active/);

    await expect(win.locator('#section-ideas')).toHaveClass(/active/);
    await expect(win.locator('#section-build')).not.toHaveClass(/active/);
  });

  test('switching tabs does not produce JS errors', async () => {
    const errors = [];
    win.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

    const sections = ['ideas', 'design', 'plan', 'build', 'test', 'deploy', 'operate'];
    for (const section of sections) {
      await win.locator(`.nav-tab[data-section="${section}"]`).click();
      await win.waitForTimeout(100);
    }

    const appErrors = errors.filter(m => !m.includes('[app] git:branch'));
    expect(appErrors).toHaveLength(0);
  });

  test('navigating away from Build and back restores Build pane', async () => {
    await win.locator('.nav-tab[data-section="ideas"]').click();
    await expect(win.locator('#section-ideas')).toHaveClass(/active/);

    await win.locator('.nav-tab[data-section="build"]').click();
    await expect(win.locator('#section-build')).toHaveClass(/active/);
    await expect(win.locator('#section-ideas')).not.toHaveClass(/active/);
  });

  test('non-Build sections render a sidebar on first visit', async () => {
    await win.locator('.nav-tab[data-section="ideas"]').click();

    // FileBrowserSection initialises the pane with a sidebar on first visit
    const sidebar = win.locator('#section-ideas .fbs-sidebar');
    await expect(sidebar).toBeVisible({ timeout: 3000 });
  });
});
