'use strict';

// UI tests for file tab behaviour: opening, switching, deduplication, dirty state, and closing.
// Run: npm run test:ui

const { test, expect } = require('@playwright/test');
const { launchApp, makeTempDir, navigateSidebarTo } = require('./helpers/app');

test.describe('file tabs', () => {
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

  // ── Opening ──────────────────────────────────────────────────────────────────

  test('clicking a file opens it in a new tab', async () => {
    const fileRow = win.locator('#file-list .file-row').filter({ hasText: 'hello.md' });
    await fileRow.click();

    const chip = win.locator('#tab-bar .tab-chip').filter({ hasText: 'hello.md' });
    await expect(chip).toBeVisible({ timeout: 3000 });
  });

  test('opened file tab becomes active', async () => {
    await win.locator('#file-list .file-row').filter({ hasText: 'hello.md' }).click();

    const chip = win.locator('#tab-bar .tab-chip').filter({ hasText: 'hello.md' });
    await expect(chip).toHaveClass(/active/, { timeout: 3000 });
  });

  test('file content is displayed in the pane', async () => {
    await win.locator('#file-list .file-row').filter({ hasText: 'hello.md' }).click();

    // Markdown file should render — check the rendered preview contains the heading
    const tabContent = win.locator('#tab-content');
    await expect(tabContent).toContainText('Hello', { timeout: 5000 });
  });

  // ── Deduplication ────────────────────────────────────────────────────────────

  test('clicking the same file twice does not open a second tab', async () => {
    const fileRow = win.locator('#file-list .file-row').filter({ hasText: 'hello.md' });
    await fileRow.click();
    await fileRow.click();

    const chips = win.locator('#tab-bar .tab-chip').filter({ hasText: 'hello.md' });
    await expect(chips).toHaveCount(1);
  });

  // ── Multiple tabs ────────────────────────────────────────────────────────────

  test('opening multiple files creates multiple tabs', async () => {
    await win.locator('#file-list .file-row').filter({ hasText: 'hello.md' }).click();
    await win.locator('#file-list .file-row').filter({ hasText: 'data.json' }).click();

    await expect(win.locator('#tab-bar .tab-chip').filter({ hasText: 'hello.md' })).toBeVisible();
    await expect(win.locator('#tab-bar .tab-chip').filter({ hasText: 'data.json' })).toBeVisible();
  });

  test('clicking an existing tab chip switches focus to that tab', async () => {
    await win.locator('#file-list .file-row').filter({ hasText: 'hello.md' }).click();
    await win.locator('#file-list .file-row').filter({ hasText: 'data.json' }).click();

    // data.json should be active now
    await expect(win.locator('#tab-bar .tab-chip').filter({ hasText: 'data.json' })).toHaveClass(/active/);

    // Click back to hello.md
    await win.locator('#tab-bar .tab-chip').filter({ hasText: 'hello.md' }).click();
    await expect(win.locator('#tab-bar .tab-chip').filter({ hasText: 'hello.md' })).toHaveClass(/active/);
  });

  // ── Closing ──────────────────────────────────────────────────────────────────

  test('close button removes the tab', async () => {
    await win.locator('#file-list .file-row').filter({ hasText: 'hello.md' }).click();
    const chip = win.locator('#tab-bar .tab-chip').filter({ hasText: 'hello.md' });
    await expect(chip).toBeVisible();

    await chip.locator('.tab-close').click();
    await expect(chip).not.toBeVisible({ timeout: 3000 });
  });

  test('closing all tabs shows the empty state', async () => {
    await win.locator('#file-list .file-row').filter({ hasText: 'hello.md' }).click();
    const chip = win.locator('#tab-bar .tab-chip').filter({ hasText: 'hello.md' });
    await chip.locator('.tab-close').click();

    await expect(win.locator('#empty-state')).toBeVisible({ timeout: 3000 });
  });

  // ── JSON tab ─────────────────────────────────────────────────────────────────

  test('JSON file opens with the JSON tree viewer', async () => {
    await win.locator('#file-list .file-row').filter({ hasText: 'data.json' }).click();

    // JSON files use a custom tree viewer (not CodeMirror) — look for json-view or json keys
    const jsonView = win.locator('#tab-content .json-view');
    await expect(jsonView).toBeVisible({ timeout: 5000 });
  });
});
