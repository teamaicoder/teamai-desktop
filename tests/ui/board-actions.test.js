'use strict';

// UI tests for board actions: teamaicoder:// links and forms on a status board
// page in a Status tab open a Claude terminal on a project, or run the
// section's action command with a JSON payload on stdin.
// Run: npm run test:ui

const fs = require('fs');
const os = require('os');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { launchApp } = require('./helpers/app');

const tmp = prefix => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));

// A board page with terminal links, action links and an answer form, rendered
// by a refresh script that counts its runs, and an action script that records
// its stdin. With $DIR/action-fail present the action fails on stderr.
function makeBoard() {
  const dir = tmp('tac-actions-');
  const prompt = "Fix the 'login' bug\nin $HOME; then `echo hi`";
  const followup = { project: 'alpha', prompt: 'Follow up on the answer' };
  const link = (id, href) => `<a id="${id}" href="${href}">${id}</a>`;
  const page = `<!doctype html><title>Board</title>
<p id="v">BOARD __N__</p><p id="inapp"></p>
${link('term', `teamaicoder://terminal?project=alpha&prompt=${encodeURIComponent(prompt)}`)}
${link('term-empty', 'teamaicoder://terminal?project=alpha')}
${link('term-unknown', 'teamaicoder://terminal?project=nobody&prompt=hi')}
${link('act', `teamaicoder://action?payload=${encodeURIComponent(JSON.stringify({ id: 'Q1', answer: 'yes' }))}`)}
${link('act-followup', `teamaicoder://action?payload=${encodeURIComponent(JSON.stringify({ id: 'Q2', followup }))}`)}
${link('act-blank', `teamaicoder://action?payload=${encodeURIComponent(JSON.stringify({ id: 'Q3' }))}" target="_blank`)}
<form id="answer" method="GET" action="teamaicoder://action">
  <input type="hidden" name="payload" value="${JSON.stringify({ id: 'Q4', answer: 'from form' }).replace(/"/g, '&quot;')}">
  <button id="submit" type="submit">Answer</button>
</form>
<script>document.getElementById('inapp').textContent = new URLSearchParams(location.search).get('in') || 'none';</script>`;
  fs.writeFileSync(path.join(dir, 'page.tmpl'), page);
  const refresh = path.join(dir, 'refresh.sh');
  fs.writeFileSync(refresh, `#!/bin/sh
D='${dir}'
n=$(cat "$D/count" 2>/dev/null || echo 0); n=$((n + 1)); echo $n > "$D/count"
sed "s/__N__/$n/" "$D/page.tmpl" > "$D/board.html"
`, { mode: 0o755 });
  const action = path.join(dir, 'action.sh');
  fs.writeFileSync(action, `#!/bin/sh
D='${dir}'
if [ -f "$D/action-fail" ]; then cat > /dev/null; echo "could not save the answer" >&2; exit 2; fi
cat > "$D/stdin.json"
echo "working…"
echo "Saved answer"
`, { mode: 0o755 });
  return {
    dir, prompt, followup,
    entry: { refresh: `sh '${refresh}'`, page: path.join(dir, 'board.html'), actionCommand: `sh '${action}'` },
    count: () => Number(fs.readFileSync(path.join(dir, 'count'), 'utf8').trim()),
    stdin: () => { try { return JSON.parse(fs.readFileSync(path.join(dir, 'stdin.json'), 'utf8')); } catch { return null; } },
    cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
  };
}

// One project, "alpha", whose folder is <workspace>/alpha
function makeProject() {
  const root = tmp('tac-proj-');
  const portfolio = path.join(root, 'specs', 'portfolio');
  fs.mkdirSync(portfolio, { recursive: true });
  fs.writeFileSync(path.join(portfolio, 'alpha.md'),
    '---\nslug: alpha\ntitle: Alpha\nrepos:\n  - github.com/example/alpha\n---\n');
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

// A stand-in `claude` on PATH that records its folder and each argument,
// under a plain /bin/sh so no shell profile or alias can reach a real one.
function standInClaude() {
  const bin = tmp('tac-bin-');
  const calls = path.join(bin, 'calls.txt');
  fs.writeFileSync(path.join(bin, 'claude'),
    `#!/bin/sh\n{ echo "cwd:$(pwd -P)"; echo "argc:$#"; for a in "$@"; do echo "arg:$a"; done; echo "--"; } >> "${calls}"\nsleep 60\n`,
    { mode: 0o755 });
  const saved = { PATH: process.env.PATH, SHELL: process.env.SHELL };
  process.env.PATH = `${bin}:${process.env.PATH}`;
  process.env.SHELL = '/bin/sh';
  return {
    calls: () => { try { return fs.readFileSync(calls, 'utf8'); } catch { return ''; } },
    restore: () => {
      process.env.PATH = saved.PATH;
      process.env.SHELL = saved.SHELL;
      fs.rmSync(bin, { recursive: true, force: true });
    },
  };
}

// The preview view currently shown in the window (the active tab's)
async function shownView(app, script) {
  return app.evaluate(async ({ BrowserWindow, session }, js) => {
    const preview = session.fromPartition('persist:preview');
    const view = BrowserWindow.getAllWindows()[0].contentView.children.find(v => v.webContents && v.webContents.session === preview);
    if (!view) return null;
    const result = js ? await view.webContents.executeJavaScript(js).catch(e => `error: ${e.message}`) : null;
    const text = await view.webContents.executeJavaScript("document.getElementById('v')?.textContent || ''").catch(() => '');
    return { url: view.webContents.getURL(), text, result };
  }, script || null);
}

const click = (app, id) => shownView(app, `document.getElementById('${id}').click(); true`);
const setHome = (win, section, entry) => win.evaluate(([s, e]) => window._testSetSectionHome(s, e), [section, entry]);

test.describe('Board actions', () => {
  let board, proj, claude;
  test.beforeEach(() => { board = makeBoard(); proj = makeProject(); claude = standInClaude(); });
  test.afterEach(() => { claude.restore(); proj.cleanup(); board.cleanup(); });

  async function openBoard() {
    const launched = await launchApp();
    const { win, app } = launched;
    await win.evaluate(([p, w]) => window._testImportProjects(p, w), [proj.specs, proj.workspace]);
    await setHome(win, 'plan', board.entry);
    await win.locator('.nav-tab[data-section="plan"]').click();
    await expect.poll(async () => (await shownView(app))?.text, { timeout: 15000 }).toBe('BOARD 1');
    return launched;
  }

  test('the page is marked as inside the app; a terminal link opens Claude on the project', async () => {
    const { app, win } = await openBoard();
    try {
      const view = await shownView(app, "document.getElementById('inapp').textContent");
      expect(view.result).toBe('teamaicoder');
      expect(view.url).toMatch(/board\.html\?in=teamaicoder$/);

      const chips = win.locator('#section-plan .fbs-tab-bar .tab-chip');
      await click(app, 'term');
      await expect(chips).toHaveCount(2, { timeout: 8000 });
      await expect(chips.nth(1)).toHaveClass(/split-tab/);
      await expect(chips.nth(1)).toHaveClass(/active/);
      const cleaned = board.prompt.replace(/\n/g, ' ');
      await expect.poll(claude.calls, { timeout: 10000 }).toBe(`cwd:${proj.projectRoot}\nargc:1\narg:${cleaned}\n--\n`);

      // An empty prompt starts plain `claude`; the page itself never navigated
      await chips.first().click();
      await click(app, 'term-empty');
      await expect(chips).toHaveCount(3, { timeout: 8000 });
      await expect.poll(claude.calls, { timeout: 10000 }).toContain(`cwd:${proj.projectRoot}\nargc:0\n--\n`);
      await chips.first().click();
      expect((await shownView(app)).text).toBe('BOARD 1');
    } finally {
      await app.close();
    }
  });

  test('an unknown project shows an error and runs nothing', async () => {
    const { app, win } = await openBoard();
    try {
      await click(app, 'term-unknown');
      const error = win.locator('#section-plan .tab-pane.home-pane .home-error');
      await expect(error).toBeVisible({ timeout: 5000 });
      await expect(error).toContainText('Unknown project "nobody"');
      await expect(win.locator('#section-plan .fbs-tab-bar .tab-chip')).toHaveCount(1);
      expect(claude.calls()).toBe('');
    } finally {
      await app.close();
    }
  });

  test('an action posts its payload, shows the result and refreshes the board', async () => {
    const { app, win } = await openBoard();
    try {
      const pane = win.locator('#section-plan .tab-pane.home-pane');
      await click(app, 'act');
      await expect.poll(board.stdin, { timeout: 10000 }).toEqual({ id: 'Q1', answer: 'yes' });
      await expect(pane.locator('.home-note')).toHaveText('Saved answer', { timeout: 10000 });
      // Refreshed at once, inside the 2-minute throttle
      await expect.poll(async () => (await shownView(app))?.text, { timeout: 15000 }).toBe('BOARD 2');

      // A GET form posting to teamaicoder://action works the same way
      await click(app, 'submit');
      await expect.poll(board.stdin, { timeout: 10000 }).toEqual({ id: 'Q4', answer: 'from form' });
      await expect.poll(async () => (await shownView(app))?.text, { timeout: 15000 }).toBe('BOARD 3');
      expect((await shownView(app)).url).toMatch(/board\.html\?in=teamaicoder$/);

      // A target=_blank action link runs too, without opening a tab
      await click(app, 'act-blank');
      await expect.poll(board.stdin, { timeout: 10000 }).toEqual({ id: 'Q3' });
      await expect.poll(async () => (await shownView(app))?.text, { timeout: 15000 }).toBe('BOARD 4');
      await expect(win.locator('#section-plan .fbs-tab-bar .tab-chip')).toHaveCount(1);

      // A failing action shows its stderr inline
      fs.writeFileSync(path.join(board.dir, 'action-fail'), '');
      await click(app, 'act');
      await expect(pane.locator('.home-error')).toContainText('could not save the answer', { timeout: 10000 });
      expect(board.count()).toBe(4);
    } finally {
      await app.close();
    }
  });

  test('an action with a followup opens a terminal once it succeeds', async () => {
    const { app, win } = await openBoard();
    try {
      await click(app, 'act-followup');
      await expect.poll(board.stdin, { timeout: 10000 }).toMatchObject({ id: 'Q2' });
      const chips = win.locator('#section-plan .fbs-tab-bar .tab-chip');
      await expect(chips).toHaveCount(2, { timeout: 10000 });
      await expect(chips.nth(1)).toHaveClass(/split-tab/);
      await expect.poll(claude.calls, { timeout: 10000 }).toBe(`cwd:${proj.projectRoot}\nargc:1\narg:${board.followup.prompt}\n--\n`);
    } finally {
      await app.close();
    }
  });

  test('an action needs an action command', async () => {
    const { app, win } = await openBoard();
    try {
      await setHome(win, 'plan', { ...board.entry, actionCommand: null });
      await expect.poll(async () => (await shownView(app))?.text, { timeout: 15000 }).toMatch(/^BOARD /);
      await click(app, 'act');
      await expect(win.locator('#section-plan .tab-pane.home-pane .home-error')).toContainText('No action command', { timeout: 5000 });
      expect(board.stdin()).toBeNull();
    } finally {
      await app.close();
    }
  });

  test('links in an ordinary browser tab do nothing', async () => {
    const { app, win } = await openBoard();
    try {
      await win.locator('#section-plan .fbs-tab-bar .tab-add-btn').click();
      await win.locator('.tab-add-menu:visible button:has-text("New Browser")').click();
      const chips = win.locator('#section-plan .fbs-tab-bar .tab-chip');
      await expect(chips).toHaveCount(2);
      const boardUrl = require('url').pathToFileURL(board.entry.page).href;
      const urlInput = win.locator('#section-plan .tab-pane.active .browser-url-input');
      await urlInput.fill(boardUrl);
      await urlInput.press('Enter');
      await expect.poll(async () => (await shownView(app))?.url, { timeout: 8000 }).toBe(boardUrl);
      expect((await shownView(app, "document.getElementById('inapp').textContent")).result).toBe('none');

      await click(app, 'term');
      await click(app, 'act');
      await click(app, 'submit');
      await click(app, 'act-blank');
      await win.waitForTimeout(1500);
      expect((await shownView(app)).url).toBe(boardUrl);
      await expect(chips).toHaveCount(2);
      expect(claude.calls()).toBe('');
      expect(board.stdin()).toBeNull();
    } finally {
      await app.close();
    }
  });
});
