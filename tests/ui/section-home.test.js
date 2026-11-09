'use strict';

// UI tests for a section's status board (prefs.sectionHome): the pinned Status
// tab in Plan & Track, background refresh, the All / This project toggle,
// inline errors and the set-up dialog.
// Run: npm run test:ui

const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { test, expect } = require('@playwright/test');
const { launchApp } = require('./helpers/app');

// A stand-in board renderer. `board.sh all` rewrites all.html with a run
// count; `board.sh project <root>` writes proj-<name>.html and prints
// "wrote <path> (…)". If $OUT/fail exists it fails with an error on stderr.
function makeBoard() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'tac-board-')));
  const script = path.join(dir, 'board.sh');
  fs.writeFileSync(script, `#!/bin/sh
OUT='${dir}'
if [ -f "$OUT/fail" ]; then echo "render failed: missing data" >&2; exit 3; fi
n=$(cat "$OUT/count" 2>/dev/null || echo 0); n=$((n + 1)); echo $n > "$OUT/count"
if [ "$1" = all ]; then
  printf '<!doctype html><title>All</title><p id="v">ALL %s</p><a id="sub" href="sub.html">sub</a>' "$n" > "$OUT/all.html"
  printf '<!doctype html><title>Sub</title><p id="v">SUB</p>' > "$OUT/sub.html"
else
  name=$(basename "$2")
  printf '<!doctype html><title>Project</title><p id="v">PROJECT %s %s</p>' "$name" "$n" > "$OUT/proj-$name.html"
  echo "wrote $OUT/proj-$name.html ($name, 0 TODO file(s))"
fi
`, { mode: 0o755 });
  return {
    dir,
    entry: {
      refresh: `sh '${script}' all`,
      page: path.join(dir, 'all.html'),
      projectRefresh: `sh '${script}' project {root}`,
    },
    cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
  };
}

// One project, "alpha", with a checkout in a temp workspace
function makeProject() {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'tac-proj-')));
  const portfolio = path.join(root, 'specs', 'portfolio');
  fs.mkdirSync(portfolio, { recursive: true });
  fs.writeFileSync(path.join(portfolio, 'alpha.md'),
    '---\nslug: alpha\ntitle: Alpha\nphase: build\nhealth: green\nrepos:\n  - github.com/example/alpha\n---\n');
  const checkout = path.join(root, 'workspace', 'alpha', 'alpha');
  fs.mkdirSync(path.join(checkout, '.git'), { recursive: true });
  fs.writeFileSync(path.join(checkout, '.git', 'config'), '[remote "origin"]\n\turl = git@github.com:example/alpha.git\n');
  return {
    specs: path.join(root, 'specs'),
    workspace: path.join(root, 'workspace'),
    projectRoot: path.join(root, 'workspace', 'alpha'),
    cleanup: () => fs.rmSync(root, { recursive: true, force: true }),
  };
}

// The Plan & Track Status tab's web view: its URL and the #v text
function homeView(app) {
  return app.evaluate(async ({ BrowserWindow, session }) => {
    const preview = session.fromPartition('persist:preview');
    const win = BrowserWindow.getAllWindows()[0];
    const view = win.contentView.children.find(v => v.webContents && v.webContents.session === preview);
    if (!view) return null;
    const text = await view.webContents.executeJavaScript("document.getElementById('v')?.textContent || ''").catch(() => '');
    return { url: view.webContents.getURL(), text };
  });
}

const setHome = (win, section, entry) => win.evaluate(([s, e]) => window._testSetSectionHome(s, e), [section, entry]);

test.describe('Section status board', () => {
  let board;
  test.beforeEach(() => { board = makeBoard(); });
  test.afterEach(() => board.cleanup());

  test('Plan & Track opens on a pinned Status tab that refreshes in the background', async () => {
    const { app, win } = await launchApp();
    try {
      await setHome(win, 'plan', board.entry);
      await win.locator('.nav-tab[data-section="plan"]').click();

      const chips = win.locator('#section-plan .fbs-tab-bar .tab-chip');
      await expect(chips.first()).toHaveClass(/home-tab/, { timeout: 5000 });
      await expect(chips.first()).toHaveClass(/active/);
      await expect(chips.first()).toContainText('Status');
      await expect(chips.first().locator('.tab-close')).toHaveCount(0);

      const allUrl = pathToFileURL(path.join(board.dir, 'all.html')).href;
      await expect.poll(async () => (await homeView(app))?.text, { timeout: 15000 }).toBe('ALL 1');
      expect((await homeView(app)).url).toBe(`${allUrl}?in=teamaicoder`);
      const pane = win.locator('#section-plan .tab-pane.home-pane');
      await expect(pane.locator('.home-status')).toHaveText(/^updated \d\d:\d\d$/);

      // Returning within 2 minutes shows the page without running the command again
      await win.locator('.nav-tab[data-section="build"]').click();
      await win.locator('.nav-tab[data-section="plan"]').click();
      await expect.poll(async () => (await homeView(app))?.text, { timeout: 5000 }).toBe('ALL 1');
      expect(fs.readFileSync(path.join(board.dir, 'count'), 'utf8').trim()).toBe('1');

      // Refresh always runs it
      await pane.locator('.home-refresh').click();
      await expect.poll(async () => (await homeView(app))?.text, { timeout: 15000 }).toBe('ALL 2');

      // file:// links inside the page navigate within the tab
      await app.evaluate(({ BrowserWindow, session }) => {
        const preview = session.fromPartition('persist:preview');
        const view = BrowserWindow.getAllWindows()[0].contentView.children.find(v => v.webContents && v.webContents.session === preview);
        return view.webContents.executeJavaScript("document.getElementById('sub').click()");
      });
      await expect.poll(async () => (await homeView(app))?.text, { timeout: 5000 }).toBe('SUB');
      expect((await homeView(app)).url).toBe(`${pathToFileURL(path.join(board.dir, 'sub.html')).href}?in=teamaicoder`);
      await expect(chips).toHaveCount(1);
    } finally {
      await app.close();
    }
  });

  test('This project renders the active project\'s page; it is disabled with no project', async () => {
    const proj = makeProject();
    const { app, win } = await launchApp();
    try {
      await setHome(win, 'plan', board.entry);
      await win.locator('.nav-tab[data-section="plan"]').click();
      const pane = win.locator('#section-plan .tab-pane.home-pane');
      const projectBtn = pane.locator('.home-mode-btn[data-mode="project"]');
      await expect(projectBtn).toBeDisabled();
      await expect.poll(async () => (await homeView(app))?.text, { timeout: 15000 }).toBe('ALL 1');

      await win.evaluate(([p, w]) => window._testImportProjects(p, w), [proj.specs, proj.workspace]);
      await win.locator('#project-switcher').click();
      await win.locator('#project-menu .project-menu-item[data-slug="alpha"]').click();
      await expect(projectBtn).toBeEnabled();

      await projectBtn.click();
      await expect(projectBtn).toHaveClass(/active/);
      await expect.poll(async () => (await homeView(app))?.text, { timeout: 15000 }).toBe('PROJECT alpha 2');
      expect((await homeView(app)).url).toBe(`${pathToFileURL(path.join(board.dir, 'proj-alpha.html')).href}?in=teamaicoder`);

      await pane.locator('.home-mode-btn[data-mode="all"]').click();
      await expect.poll(async () => (await homeView(app))?.text, { timeout: 15000 }).toMatch(/^ALL /);
    } finally {
      await app.close();
      proj.cleanup();
    }
  });

  test('a failing refresh shows its error inline and keeps the last page', async () => {
    const { app, win } = await launchApp();
    try {
      await setHome(win, 'plan', board.entry);
      await win.locator('.nav-tab[data-section="plan"]').click();
      await expect.poll(async () => (await homeView(app))?.text, { timeout: 15000 }).toBe('ALL 1');

      fs.writeFileSync(path.join(board.dir, 'fail'), '');
      const pane = win.locator('#section-plan .tab-pane.home-pane');
      await pane.locator('.home-refresh').click();
      const error = pane.locator('.home-error');
      await expect(error).toBeVisible({ timeout: 15000 });
      await expect(error).toContainText('render failed: missing data');
      expect((await homeView(app)).text).toBe('ALL 1');

      fs.rmSync(path.join(board.dir, 'fail'));
      await pane.locator('.home-refresh').click();
      await expect(error).toBeHidden({ timeout: 15000 });
      await expect.poll(async () => (await homeView(app))?.text, { timeout: 15000 }).toBe('ALL 2');
    } finally {
      await app.close();
    }
  });

  test('set up from the dialog, kept first after a relaunch, and removed when cleared', async () => {
    const first = await launchApp();
    try {
      const { win } = first;
      await first.app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.send('home:configure', { section: 'plan' }));
      const dialog = win.locator('#home-dialog');
      await expect(dialog).toBeVisible();
      await dialog.locator('#home-refresh-input').fill(board.entry.refresh);
      await dialog.locator('#home-page-input').fill(board.entry.page);
      await dialog.locator('#home-project-input').fill(board.entry.projectRefresh);
      await dialog.locator('#home-action-input').fill('  ./board-action.sh ');
      await dialog.locator('#home-dialog-save').click();
      await expect(dialog).toHaveCount(0);
      expect((await win.evaluate(() => window.api.loadPrefs())).sectionHome.plan.actionCommand).toBe('./board-action.sh');

      await expect(win.locator('.nav-tab[data-section="plan"]')).toHaveClass(/active/);
      const chips = win.locator('#section-plan .fbs-tab-bar .tab-chip');
      await expect(chips.first()).toHaveClass(/home-tab/, { timeout: 5000 });
      await expect.poll(async () => (await homeView(first.app))?.text, { timeout: 15000 }).toBe('ALL 1');

      // A second tab in the section, made active by the user
      await win.locator('#section-plan .fbs-tab-bar .tab-add-btn').click();
      await win.locator('.tab-add-menu:visible button:has-text("New Browser")').click();
      await expect(chips).toHaveCount(2);
      await expect(chips.nth(1)).toHaveClass(/active/);
      // …stays active when the section is revisited this session
      await win.locator('.nav-tab[data-section="build"]').click();
      await win.locator('.nav-tab[data-section="plan"]').click();
      await expect(chips.nth(1)).toHaveClass(/active/);
      await expect.poll(async () => {
        const s = await win.evaluate(() => window.api.loadPrefs().then(p => p.session));
        return s.sections.plan.tabs.map(t => t.type).join(',');
      }, { timeout: 8000 }).toBe('browser');
    } finally {
      await first.app.close();
    }

    const { app, win } = await launchApp({ userData: first.userData });
    try {
      await expect(win.locator('.nav-tab[data-section="plan"]')).toHaveClass(/active/);
      const chips = win.locator('#section-plan .fbs-tab-bar .tab-chip');
      await expect(chips).toHaveCount(2, { timeout: 8000 });
      await expect(chips.nth(0)).toHaveClass(/home-tab/);
      await expect(chips.nth(0)).toHaveClass(/active/);
      await expect(chips.nth(1)).toHaveClass(/browser-tab/);

      await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.send('home:clear', { section: 'plan' }));
      await expect(chips).toHaveCount(1);
      await expect(chips.first()).toHaveClass(/browser-tab/);
      const prefs = await win.evaluate(() => window.api.loadPrefs());
      expect(prefs.sectionHome).toEqual({});
    } finally {
      await app.close();
    }
  });
});
