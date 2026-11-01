'use strict';

// UI tests for the Workbench tab (the dashboard in a web view, URL set from the menu).
// Run: npm run test:ui

const http = require('http');
const { test, expect } = require('@playwright/test');
const { launchApp } = require('./helpers/app');

// A stand-in dashboard: sets a session cookie on first visit and records the
// cookies each request arrives with.
function startServer() {
  const seenCookies = [];
  const server = http.createServer((req, res) => {
    seenCookies.push(req.headers.cookie || '');
    const headers = { 'Content-Type': 'text/html' };
    if (!(req.headers.cookie || '').includes('wb_session=')) {
      headers['Set-Cookie'] = 'wb_session=abc123; Max-Age=86400; Path=/';
    }
    res.writeHead(200, headers);
    res.end(`<!doctype html><title>Workbench test</title>
      <h1 id="home">Workbench home</h1>
      <a id="popup" href="https://example.com/popup" target="_blank">popup</a>
      <a id="away" href="https://example.com/away">away</a>
      <a id="same" href="/runs">runs</a>`);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => {
    resolve({ server, url: `http://127.0.0.1:${server.address().port}/`, seenCookies });
  }));
}

async function openSetUrlDialog(app, win) {
  await app.evaluate(({ Menu }) => Menu.getApplicationMenu().getMenuItemById('workbench-set-url').click());
  await win.locator('#workbench-url-input').waitFor({ state: 'visible', timeout: 3000 });
}

async function setWorkbenchUrl(app, win, url) {
  await openSetUrlDialog(app, win);
  await win.locator('#workbench-url-input').fill(url);
  await win.locator('#workbench-dialog-save').click();
}

// URL the Workbench web view is showing, read in the main process
function workbenchViewUrl(app) {
  return app.evaluate(({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows()[0];
    const view = win.contentView.children.find(v => v.webContents && v.webContents.session !== win.webContents.session);
    return view ? view.webContents.getURL() : null;
  });
}

async function waitForViewUrl(app, predicate) {
  await expect.poll(async () => {
    const u = await workbenchViewUrl(app);
    return !!u && predicate(u);
  }, { timeout: 8000 }).toBe(true);
}

test.describe('Workbench tab', () => {
  let srv;

  test.beforeAll(async () => { srv = await startServer(); });
  test.afterAll(async () => { srv.server.close(); });

  test('is hidden until a URL is set', async () => {
    const { app, win } = await launchApp();
    try {
      await expect(win.locator('#nav-workbench')).toBeHidden();
      await expect(win.locator('.nav-tab:visible')).toHaveCount(7);
    } finally {
      await app.close();
    }
  });

  test('setting a URL from the menu shows the tab and loads the dashboard', async () => {
    const { app, win } = await launchApp();
    try {
      await setWorkbenchUrl(app, win, srv.url);
      await expect(win.locator('#nav-workbench')).toBeVisible();
      await expect(win.locator('#nav-workbench')).toHaveClass(/active/);
      await expect(win.locator('#workbench-url')).toHaveText(srv.url);
      await waitForViewUrl(app, u => u.startsWith(srv.url));
    } finally {
      await app.close();
    }
  });

  test('rejects a URL that is not http or https', async () => {
    const { app, win } = await launchApp();
    try {
      await openSetUrlDialog(app, win);
      await win.locator('#workbench-url-input').fill('file:///etc/passwd');
      await win.locator('#workbench-dialog-save').click();
      await expect(win.locator('#workbench-url-invalid')).toBeVisible();
      await expect(win.locator('#nav-workbench')).toBeHidden();
    } finally {
      await app.close();
    }
  });

  test('restores the tab and keeps the session across a restart', async () => {
    const first = await launchApp();
    await setWorkbenchUrl(first.app, first.win, srv.url);
    await waitForViewUrl(first.app, u => u.startsWith(srv.url));
    await first.app.close();

    srv.seenCookies.length = 0;
    const { app, win } = await launchApp({ userData: first.userData });
    try {
      await expect(win.locator('#nav-workbench')).toBeVisible();
      await expect(win.locator('#workbench-url')).toHaveText(srv.url);
      await expect.poll(() => srv.seenCookies.some(c => c.includes('wb_session=abc123')), { timeout: 8000 }).toBe(true);
    } finally {
      await app.close();
    }
  });

  test('links that leave the dashboard open in the system browser', async () => {
    const { app, win } = await launchApp();
    try {
      await app.evaluate(({ shell }) => {
        global.__opened = [];
        shell.openExternal = async url => { global.__opened.push(url); };
      });
      await setWorkbenchUrl(app, win, srv.url);
      await waitForViewUrl(app, u => u.startsWith(srv.url));

      const clickInView = id => app.evaluate(({ BrowserWindow }, linkId) => {
        const w = BrowserWindow.getAllWindows()[0];
        const view = w.contentView.children.find(v => v.webContents && v.webContents.session !== w.webContents.session);
        return view.webContents.executeJavaScript(`document.getElementById('${linkId}').click()`);
      }, id);

      await clickInView('popup');
      await clickInView('away');
      await expect.poll(() => app.evaluate(() => global.__opened), { timeout: 5000 })
        .toEqual(['https://example.com/popup', 'https://example.com/away']);
      expect(await workbenchViewUrl(app)).toMatch(new RegExp(`^${srv.url}`));

      // Same-origin links still navigate inside the tab
      await clickInView('same');
      await waitForViewUrl(app, u => u === `${srv.url}runs`);
    } finally {
      await app.close();
    }
  });

  test('shows an error with Retry when the dashboard is unreachable', async () => {
    const closed = http.createServer();
    const port = await new Promise(r => closed.listen(0, '127.0.0.1', () => r(closed.address().port)));
    await new Promise(r => closed.close(r));

    const { app, win } = await launchApp();
    try {
      await setWorkbenchUrl(app, win, `http://127.0.0.1:${port}/`);
      await expect(win.locator('#workbench-error')).toBeVisible({ timeout: 8000 });
      await expect(win.locator('#workbench-retry')).toBeVisible();
    } finally {
      await app.close();
    }
  });

  test('clearing the URL hides the tab again', async () => {
    const { app, win } = await launchApp();
    try {
      await setWorkbenchUrl(app, win, srv.url);
      await expect(win.locator('#nav-workbench')).toBeVisible();
      await setWorkbenchUrl(app, win, '');
      await expect(win.locator('#nav-workbench')).toBeHidden();
      await expect(win.locator('.nav-tab[data-section="build"]')).toHaveClass(/active/);
    } finally {
      await app.close();
    }
  });
});
