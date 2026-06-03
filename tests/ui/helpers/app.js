'use strict';

const { _electron: electron } = require('playwright');
const path = require('path');
const os = require('os');
const fs = require('fs');

const ROOT = path.join(__dirname, '..', '..', '..');

// ── Launch ────────────────────────────────────────────────────────────────────

async function launchApp() {
  const app = await electron.launch({
    args: [ROOT],
    env: { ...process.env, NODE_ENV: 'test' },
    timeout: 15000,
  });

  const win = await app.firstWindow();

  // Wait for init() to finish — listen for the console log it emits
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('App init timed out')), 12000);
    win.on('console', msg => {
      if (msg.text().includes('init() complete')) { clearTimeout(timer); resolve(); }
    });
  });

  return { app, win };
}

// ── Tab-bar + button ──────────────────────────────────────────────────────────

// Click the + button in the Build tab bar to open the dropdown, then click an item.
// itemText: 'New File' | 'New Browser' | 'New Terminal'
async function clickTabAddItem(win, itemText) {
  const addBtn = win.locator('#tab-bar .tab-add-btn');
  await addBtn.click();
  const item = win.locator(`.tab-add-menu:visible button:has-text("${itemText}")`);
  await item.waitFor({ state: 'visible', timeout: 3000 });
  await item.click();
}

// ── Temp directory ────────────────────────────────────────────────────────────

// Creates a temporary directory with a small file tree for file-system tests.
// Returns { dir, cleanup }.
function makeTempDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tac-test-'));
  fs.writeFileSync(path.join(dir, 'hello.md'), '# Hello\nThis is a test file.\n');
  fs.writeFileSync(path.join(dir, 'data.json'), '{"key":"value","count":42}\n');
  fs.writeFileSync(path.join(dir, 'script.js'), 'console.log("hello");\n');
  fs.mkdirSync(path.join(dir, 'subdir'));
  fs.writeFileSync(path.join(dir, 'subdir', 'nested.md'), '# Nested\n');
  return {
    dir,
    cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
  };
}

// Navigate the sidebar to a specific folder using the "Change root folder" button.
// Since we can't interact with the native dialog, we use the IPC directly via
// win.evaluate to set the root and navigate.
async function navigateSidebarTo(win, dir) {
  await win.evaluate(d => window._testNavigateTo(d), dir);
}

module.exports = { launchApp, clickTabAddItem, makeTempDir, navigateSidebarTo };
