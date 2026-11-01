'use strict';

// UI tests for files opened from Finder (macOS 'open-file': Open With, or a
// double-click when TeamAICoder is the default Markdown app).
// Run: npm run test:ui

const { test, expect } = require('@playwright/test');
const path = require('path');
const { launchApp, makeTempDir } = require('./helpers/app');

// Emit the event macOS sends, in the main process
function sendOpenFile(app, filePath) {
  return app.evaluate(({ app: electronApp }, p) => {
    electronApp.emit('open-file', { preventDefault() {} }, p);
  }, filePath);
}

test.describe('opening files from Finder', () => {
  let app, win, tmp;

  test.beforeEach(async () => {
    tmp = makeTempDir();
    ({ app, win } = await launchApp());
  });

  test.afterEach(async () => {
    await app.close();
    tmp.cleanup();
  });

  test('a markdown file opens rendered in a Build tab', async () => {
    await sendOpenFile(app, path.join(tmp.dir, 'hello.md'));
    await expect(win.locator('#tab-bar .tab-chip:has-text("hello.md")')).toBeVisible();
    await expect(win.locator('#tab-content h1:has-text("Hello")')).toBeVisible();
  });

  test('switches to Build from another section', async () => {
    await win.locator('.nav-tab[data-section="ideas"]').click();
    await sendOpenFile(app, path.join(tmp.dir, 'subdir', 'nested.md'));
    await expect(win.locator('.nav-tab[data-section="build"]')).toHaveClass(/active/);
    await expect(win.locator('#tab-bar .tab-chip:has-text("nested.md")')).toBeVisible();
  });

  test('opening the same file twice reuses its tab', async () => {
    const file = path.join(tmp.dir, 'hello.md');
    await sendOpenFile(app, file);
    await sendOpenFile(app, file);
    await expect(win.locator('#tab-bar .tab-chip:has-text("hello.md")')).toHaveCount(1);
  });
});
