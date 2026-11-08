'use strict';

// UI tests for session restore (tabs come back after a relaunch) and for pages
// opened from a terminal landing in the app's preview (teamai-open / $BROWSER).
// Run: npm run test:ui

const fs = require('fs');
const path = require('path');
const http = require('http');
const { test, expect } = require('@playwright/test');
const { launchApp, clickTabAddItem, makeTempDir, navigateSidebarTo } = require('./helpers/app');

function startServer() {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!doctype html><title>Page ${req.url}</title><p>${req.url}</p>`);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => {
    resolve({ server, url: `http://127.0.0.1:${server.address().port}/` });
  }));
}

// URLs of the preview web views currently attached to the window
function shownPreviewUrls(app) {
  return app.evaluate(({ BrowserWindow, session }) => {
    const preview = session.fromPartition('persist:preview');
    const win = BrowserWindow.getAllWindows()[0];
    return win.contentView.children
      .filter(v => v.webContents && v.webContents.session === preview)
      .map(v => v.webContents.getURL());
  });
}

const savedSession = win => win.evaluate(() => window.api.loadPrefs().then(p => p.session));

async function typeInActiveUrl(pane, url) {
  const input = pane.locator('.browser-url-input');
  await input.fill(url);
  await input.press('Enter');
}

// Type a command into the xterm inside a pane
async function typeInTerminal(win, pane, text) {
  await pane.locator('.xterm').first().click();
  await win.keyboard.type(text);
  await win.keyboard.press('Enter');
}

test.describe('Session restore', () => {
  let srv, tmp;
  test.beforeAll(async () => { srv = await startServer(); });
  test.afterAll(async () => { srv.server.close(); });
  test.beforeEach(() => { tmp = makeTempDir(); });
  test.afterEach(() => tmp.cleanup());

  test('tabs in Build and a section, and the active section, come back after a relaunch', async () => {
    const first = await launchApp();
    try {
      const { win } = first;
      await navigateSidebarTo(win, tmp.dir);

      await win.locator('#file-list .file-row').filter({ hasText: 'hello.md' }).click();
      await expect(win.locator('#tab-bar .tab-chip').filter({ hasText: 'hello.md' })).toBeVisible();
      await clickTabAddItem(win, 'New Terminal');
      await expect(win.locator('#tab-bar .tab-chip.terminal-tab')).toHaveCount(1);
      await clickTabAddItem(win, 'New Browser');
      await typeInActiveUrl(win.locator('#tab-content .tab-pane.active'), `${srv.url}browser`);
      await clickTabAddItem(win, 'New Chat + Preview');
      await typeInActiveUrl(win.locator('#tab-content .tab-pane.split-pane.active'), `${srv.url}split`);
      // Make the file tab active in Build
      await win.locator('#tab-bar .tab-chip').filter({ hasText: 'hello.md' }).click();

      await win.locator('.nav-tab[data-section="ideas"]').click();
      const ideasBar = win.locator('#section-ideas .fbs-tab-bar');
      await ideasBar.locator('.tab-add-btn').click();
      await win.locator('.tab-add-menu:visible button:has-text("New Browser")').click();
      await typeInActiveUrl(win.locator('#section-ideas .tab-pane.active'), `${srv.url}ideas`);

      await expect.poll(async () => {
        const s = await savedSession(win);
        return s && s.activeSection === 'ideas' ? s.sections.build.tabs.map(t => t.type).join(',') + '|' + s.sections.ideas.tabs.length : '';
      }, { timeout: 8000 }).toBe('file,terminal,browser,split|1');
    } finally {
      await first.app.close();
    }

    const { app, win } = await launchApp({ userData: first.userData });
    try {
      await expect(win.locator('.nav-tab[data-section="ideas"]')).toHaveClass(/active/);
      const ideasChips = win.locator('#section-ideas .fbs-tab-bar .tab-chip');
      await expect(ideasChips).toHaveCount(1, { timeout: 8000 });
      await expect(ideasChips.first()).toHaveClass(/active/);
      await expect.poll(() => shownPreviewUrls(app), { timeout: 8000 }).toEqual([`${srv.url}ideas`]);

      await win.locator('.nav-tab[data-section="build"]').click();
      const chips = win.locator('#tab-bar .tab-chip');
      await expect(chips).toHaveCount(4);
      await expect(chips.nth(0)).toHaveClass(/file-tab/);
      await expect(chips.nth(0)).toHaveClass(/active/);
      await expect(chips.nth(1)).toHaveClass(/terminal-tab/);
      await expect(chips.nth(2)).toHaveClass(/browser-tab/);
      await expect(chips.nth(3)).toHaveClass(/split-tab/);
      await expect(win.locator('#tab-content .tab-pane.active')).toContainText('This is a test file');

      // The restored terminal is live and started in the saved folder
      await chips.nth(1).click();
      const termPane = win.locator('#tab-content .tab-pane.active');
      await expect(termPane.locator('.xterm')).toBeVisible();
      await typeInTerminal(win, termPane, 'pwd');
      await expect(termPane.locator('.xterm-rows')).toContainText(path.basename(tmp.dir), { timeout: 5000 });

      await chips.nth(3).click();
      await expect.poll(() => shownPreviewUrls(app), { timeout: 8000 }).toEqual([`${srv.url}split`]);
    } finally {
      await app.close();
    }
  });

  test('a saved file that no longer exists is skipped quietly', async () => {
    const first = await launchApp();
    try {
      await navigateSidebarTo(first.win, tmp.dir);
      await first.win.locator('#file-list .file-row').filter({ hasText: 'data.json' }).click();
      await first.win.locator('#file-list .file-row').filter({ hasText: 'hello.md' }).click();
      await expect.poll(async () => ((await savedSession(first.win))?.sections.build.tabs.length) || 0, { timeout: 8000 }).toBe(2);
    } finally {
      await first.app.close();
    }
    fs.rmSync(path.join(tmp.dir, 'hello.md'));

    const { app, win } = await launchApp({ userData: first.userData });
    try {
      const chips = win.locator('#tab-bar .tab-chip');
      await expect(chips).toHaveCount(1);
      await expect(chips.first()).toContainText('data.json');
      await expect(chips.first()).toHaveClass(/active/);
    } finally {
      await app.close();
    }
  });

  test('a terminal running claude at quit runs `claude --continue` after a relaunch', async () => {
    // A stand-in `claude` on PATH that records its arguments and keeps running,
    // under a plain /bin/sh so no shell profile or alias can reach a real one.
    const bin = fs.mkdtempSync(path.join(require('os').tmpdir(), 'tac-bin-'));
    const marker = path.join(bin, 'calls.txt');
    fs.writeFileSync(path.join(bin, 'claude'), `#!/bin/sh\necho "args:$*" >> "${marker}"\nsleep 60\n`, { mode: 0o755 });
    const saved = { PATH: process.env.PATH, SHELL: process.env.SHELL };
    process.env.PATH = `${bin}:${process.env.PATH}`;
    process.env.SHELL = '/bin/sh';
    try {
      const first = await launchApp();
      try {
        await navigateSidebarTo(first.win, tmp.dir);
        await clickTabAddItem(first.win, 'New Terminal');
        const pane = first.win.locator('#tab-content .tab-pane.active');
        await expect(pane.locator('.xterm')).toBeVisible();
        await typeInTerminal(first.win, pane, 'claude');
        await expect.poll(() => fs.existsSync(marker) && fs.readFileSync(marker, 'utf8'), { timeout: 8000 }).toBe('args:\n');
        await expect.poll(async () => ((await savedSession(first.win))?.sections.build.tabs.length) || 0, { timeout: 8000 }).toBe(1);
      } finally {
        await first.app.close();
      }
      const saved2 = JSON.parse(fs.readFileSync(path.join(first.userData, 'teamaicoder-preferences.json'), 'utf8')).session;
      expect(saved2.sections.build.tabs[0]).toMatchObject({ type: 'terminal', claude: true });

      const { app } = await launchApp({ userData: first.userData });
      try {
        await expect.poll(() => fs.readFileSync(marker, 'utf8'), { timeout: 10000 }).toBe('args:\nargs:--continue\n');
      } finally {
        await app.close();
      }
    } finally {
      process.env.PATH = saved.PATH;
      process.env.SHELL = saved.SHELL;
      fs.rmSync(bin, { recursive: true, force: true });
    }
  });
});

test.describe('Opening pages from a terminal', () => {
  let tmp, page;
  test.beforeEach(() => {
    tmp = makeTempDir();
    page = path.join(tmp.dir, 'report.html');
    fs.writeFileSync(page, '<!doctype html><title>Report</title><h1>Report</h1>');
  });
  test.afterEach(() => tmp.cleanup());

  test("Python's webbrowser in a Chat + Preview terminal opens in that tab's preview", async () => {
    const { app, win } = await launchApp();
    try {
      await navigateSidebarTo(win, tmp.dir);
      await clickTabAddItem(win, 'New Chat + Preview');
      const pane = win.locator('#tab-content .tab-pane.split-pane.active');
      await expect(pane.locator('.xterm')).toBeVisible();
      const fileUrl = require('url').pathToFileURL(fs.realpathSync(page)).href;
      await typeInTerminal(win, pane, `python3 -c "import webbrowser; webbrowser.open('${fileUrl}')"`);

      await expect.poll(() => shownPreviewUrls(app), { timeout: 10000 }).toEqual([fileUrl]);
      await expect(pane.locator('.browser-url-input')).toHaveValue(fileUrl);
      await expect(win.locator('#tab-bar .tab-chip')).toHaveCount(1);
    } finally {
      await app.close();
    }
  });

  test('teamai-open in a terminal tab opens a browser tab right after it', async () => {
    const { app, win } = await launchApp();
    try {
      await navigateSidebarTo(win, tmp.dir);
      await clickTabAddItem(win, 'New Terminal');
      await clickTabAddItem(win, 'New Browser');
      await win.locator('#tab-bar .tab-chip.terminal-tab').click();
      const pane = win.locator('#tab-content .tab-pane.active');
      await expect(pane.locator('.xterm')).toBeVisible();
      await typeInTerminal(win, pane, '"$BROWSER" report.html');

      const fileUrl = require('url').pathToFileURL(path.join(fs.realpathSync(tmp.dir), 'report.html')).href;
      const chips = win.locator('#tab-bar .tab-chip');
      await expect(chips).toHaveCount(3, { timeout: 10000 });
      await expect(chips.nth(0)).toHaveClass(/terminal-tab/);
      await expect(chips.nth(1)).toHaveClass(/browser-tab/);
      await expect(chips.nth(1)).toHaveClass(/active/);
      await expect.poll(() => shownPreviewUrls(app), { timeout: 10000 }).toEqual([fileUrl]);
    } finally {
      await app.close();
    }
  });

  test("a section's bottom terminal opens a browser tab in that section", async () => {
    const { app, win } = await launchApp();
    try {
      await win.locator('.nav-tab[data-section="ideas"]').click();
      const term = win.locator('#section-ideas .fbs-terminal-container');
      await expect(term.locator('.xterm')).toBeVisible({ timeout: 5000 });
      await term.locator('.xterm').click();
      await win.keyboard.type(`"$BROWSER" '${page}'`);
      await win.keyboard.press('Enter');

      const chips = win.locator('#section-ideas .fbs-tab-bar .tab-chip');
      await expect(chips).toHaveCount(1, { timeout: 10000 });
      await expect(chips.first()).toHaveClass(/browser-tab/);
    } finally {
      await app.close();
    }
  });
});
