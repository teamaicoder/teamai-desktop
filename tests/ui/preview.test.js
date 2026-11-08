'use strict';

// UI tests for preview browser tabs and the Chat + Preview split:
// persistent shared sign-in session, plain Chrome user agent, sign-in popups,
// new-tab links, the toolbar and the resizable split.
// Run: npm run test:ui

const http = require('http');
const { test, expect } = require('@playwright/test');
const { launchApp, clickTabAddItem } = require('./helpers/app');

// A stand-in site: sets a session cookie on first visit and records each
// request's path, cookies and user agent.
function startServer() {
  const requests = [];
  const server = http.createServer((req, res) => {
    requests.push({ path: req.url, cookie: req.headers.cookie || '', ua: req.headers['user-agent'] || '' });
    const headers = { 'Content-Type': 'text/html' };
    if (!(req.headers.cookie || '').includes('pv_session=')) {
      headers['Set-Cookie'] = 'pv_session=signed-in; Max-Age=86400; Path=/';
    }
    res.writeHead(200, headers);
    if (req.url.startsWith('/popup')) {
      res.end('<!doctype html><title>Sign in</title><p id="popup">Sign-in window</p>');
    } else if (req.url.startsWith('/second')) {
      res.end('<!doctype html><title>Second</title><p>Second page</p>');
    } else {
      res.end(`<!doctype html><title>Preview test</title>
        <h1>Preview home</h1>
        <a id="newtab" href="/second" target="_blank">open in new tab</a>`);
    }
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => {
    resolve({ server, url: `http://127.0.0.1:${server.address().port}/`, requests });
  }));
}

// The preview web views (persist:preview session), read in the main process
function previewViews(app) {
  return app.evaluate(({ BrowserWindow, session }) => {
    const preview = session.fromPartition('persist:preview');
    const win = BrowserWindow.getAllWindows().find(w => w.contentView.children.length > 0) || BrowserWindow.getAllWindows()[0];
    return win.contentView.children
      .filter(v => v.webContents && v.webContents.session === preview)
      .map(v => ({ url: v.webContents.getURL(), bounds: v.getBounds() }));
  });
}

async function navigateActiveUrl(win, url) {
  const input = win.locator('#tab-content .tab-pane.active .browser-url-input');
  await input.fill(url);
  await input.press('Enter');
}

async function waitForPreviewUrl(app, predicate) {
  await expect.poll(async () => (await previewViews(app)).some(v => predicate(v.url)), { timeout: 8000 }).toBe(true);
}

// Run script in the shown preview page as if the user had clicked
function runInPreview(app, script) {
  return app.evaluate(({ BrowserWindow, session }, js) => {
    const preview = session.fromPartition('persist:preview');
    const win = BrowserWindow.getAllWindows().find(w => w.contentView.children.length > 0);
    const view = win.contentView.children.find(v => v.webContents && v.webContents.session === preview);
    return view.webContents.executeJavaScript(js, true);
  }, script);
}

test.describe('Preview browser tabs', () => {
  let srv;

  test.beforeAll(async () => { srv = await startServer(); });
  test.afterAll(async () => { srv.server.close(); });
  test.beforeEach(() => { srv.requests.length = 0; });

  test('a sign-in cookie persists across a restart', async () => {
    const first = await launchApp();
    await clickTabAddItem(first.win, 'New Browser');
    await navigateActiveUrl(first.win, srv.url);
    await waitForPreviewUrl(first.app, u => u.startsWith(srv.url));
    await first.app.close();

    srv.requests.length = 0;
    const { app, win } = await launchApp({ userData: first.userData });
    try {
      await clickTabAddItem(win, 'New Browser');
      await navigateActiveUrl(win, srv.url);
      await expect.poll(() => srv.requests.some(r => r.cookie.includes('pv_session=signed-in')), { timeout: 8000 }).toBe(true);
    } finally {
      await app.close();
    }
  });

  test('presents a plain Chrome user agent', async () => {
    const { app, win } = await launchApp();
    try {
      await clickTabAddItem(win, 'New Browser');
      await navigateActiveUrl(win, srv.url);
      await expect.poll(() => srv.requests.length, { timeout: 8000 }).toBeGreaterThan(0);
      const ua = srv.requests[0].ua;
      expect(ua).toContain('Chrome/');
      expect(ua).not.toMatch(/Electron\//);
      expect(ua).not.toMatch(/teamaicoder\//i);
    } finally {
      await app.close();
    }
  });

  test('hides passkeys so sign-in pages fall back to passwords', async () => {
    const { app, win } = await launchApp();
    try {
      await clickTabAddItem(win, 'New Browser');
      await navigateActiveUrl(win, srv.url);
      await waitForPreviewUrl(app, u => u.startsWith(srv.url));
      await expect.poll(() => runInPreview(app, 'document.readyState'), { timeout: 8000 }).toBe('complete');
      const result = await runInPreview(app, `(async () => {
        const hidden = typeof window.PublicKeyCredential === 'undefined';
        let error = null;
        try {
          await navigator.credentials.get({ publicKey: { challenge: new Uint8Array(16) } });
        } catch (e) { error = e.name; }
        return { hidden, error };
      })()`);
      expect(result).toEqual({ hidden: true, error: 'NotAllowedError' });
    } finally {
      await app.close();
    }
  });

  test('a sign-in popup opens as a child window on the same session', async () => {
    const { app, win } = await launchApp();
    try {
      await clickTabAddItem(win, 'New Browser');
      await navigateActiveUrl(win, srv.url);
      await waitForPreviewUrl(app, u => u.startsWith(srv.url));
      await expect.poll(() => srv.requests.some(r => r.path === '/'), { timeout: 8000 }).toBe(true);

      await runInPreview(app, `window.open('/popup', 'signin', 'width=420,height=560'); true`);

      await expect.poll(() => srv.requests.some(r => r.path === '/popup' && r.cookie.includes('pv_session=signed-in')),
        { timeout: 8000 }).toBe(true);
      const popup = await app.evaluate(async ({ BrowserWindow, session }) => {
        const preview = session.fromPartition('persist:preview');
        const w = BrowserWindow.getAllWindows().find(b => b.webContents.session === preview);
        if (!w) return null;
        return {
          hasParent: !!w.getParentWindow(),
          hasOpener: await w.webContents.executeJavaScript('!!window.opener'),
        };
      });
      expect(popup).toEqual({ hasParent: true, hasOpener: true });
    } finally {
      await app.close();
    }
  });

  test('a link that opens a new tab opens another preview tab', async () => {
    const { app, win } = await launchApp();
    try {
      await clickTabAddItem(win, 'New Browser');
      await navigateActiveUrl(win, srv.url);
      await waitForPreviewUrl(app, u => u.startsWith(srv.url));
      await expect.poll(() => srv.requests.some(r => r.path === '/'), { timeout: 8000 }).toBe(true);

      await runInPreview(app, `document.getElementById('newtab').click(); true`);

      await expect(win.locator('#tab-bar .tab-chip.browser-tab')).toHaveCount(2, { timeout: 8000 });
      await expect.poll(() => srv.requests.some(r => r.path === '/second'), { timeout: 8000 }).toBe(true);
    } finally {
      await app.close();
    }
  });

  test('toolbar back and forward move through history', async () => {
    const { app, win } = await launchApp();
    try {
      await clickTabAddItem(win, 'New Browser');
      const pane = win.locator('#tab-content .tab-pane.active');
      await expect(pane.locator('.browser-back')).toBeDisabled();

      await navigateActiveUrl(win, srv.url);
      await waitForPreviewUrl(app, u => u === srv.url);
      await navigateActiveUrl(win, `${srv.url}second`);
      await waitForPreviewUrl(app, u => u.endsWith('/second'));

      await expect(pane.locator('.browser-back')).toBeEnabled();
      await pane.locator('.browser-back').click();
      await waitForPreviewUrl(app, u => u === srv.url);
      await expect(pane.locator('.browser-url-input')).toHaveValue(srv.url);

      await expect(pane.locator('.browser-forward')).toBeEnabled();
      await pane.locator('.browser-forward').click();
      await waitForPreviewUrl(app, u => u.endsWith('/second'));
      await expect(pane.locator('.browser-reload')).toBeVisible();
      await expect(pane.locator('.browser-external')).toBeVisible();
    } finally {
      await app.close();
    }
  });
});

test.describe('Chat + Preview split', () => {
  let srv;

  test.beforeAll(async () => { srv = await startServer(); });
  test.afterAll(async () => { srv.server.close(); });

  test('opens a terminal beside a preview browser', async () => {
    const { app, win } = await launchApp();
    try {
      await clickTabAddItem(win, 'New Chat + Preview');
      const pane = win.locator('#tab-content .tab-pane.split-pane.active');
      await expect(pane).toBeVisible();
      await expect(pane.locator('.split-chat .xterm')).toBeVisible({ timeout: 5000 });
      await expect(pane.locator('.split-preview .browser-url-input')).toBeVisible();
      await expect(win.locator('#tab-bar .tab-chip.split-tab')).toHaveText(/Chat \+ Preview/);

      const chatBox = await pane.locator('.split-chat').boundingBox();
      const previewBox = await pane.locator('.split-preview').boundingBox();
      expect(chatBox.x + chatBox.width).toBeLessThanOrEqual(previewBox.x);
    } finally {
      await app.close();
    }
  });

  test('dragging the divider moves the preview view and the ratio is kept', async () => {
    const first = await launchApp();
    let ratio;
    try {
      const { app, win } = first;
      await clickTabAddItem(win, 'New Chat + Preview');
      await navigateActiveUrl(win, srv.url);
      await waitForPreviewUrl(app, u => u.startsWith(srv.url));

      await expect.poll(async () => (await previewViews(app))[0]?.bounds.width ?? 0, { timeout: 5000 }).toBeGreaterThan(1);
      const before = (await previewViews(app))[0].bounds;

      const divider = win.locator('.tab-pane.split-pane.active .split-divider');
      const box = await divider.boundingBox();
      await win.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await win.mouse.down();
      await win.mouse.move(box.x - 150, box.y + box.height / 2, { steps: 5 });
      await win.mouse.up();

      await expect.poll(async () => (await previewViews(app))[0]?.bounds.x ?? before.x, { timeout: 5000 })
        .toBeLessThan(before.x - 100);
      const after = (await previewViews(app))[0].bounds;
      expect(after.width).toBeGreaterThan(before.width + 100);

      ratio = await win.evaluate(() => window.api.loadPrefs().then(p => p.splitRatio));
      expect(ratio).toBeLessThan(0.4);
    } finally {
      await first.app.close();
    }

    const { app, win } = await launchApp({ userData: first.userData });
    try {
      await clickTabAddItem(win, 'New Chat + Preview');
      const basis = await win.locator('.tab-pane.split-pane.active .split-chat').evaluate(el => el.style.flexBasis);
      expect(parseFloat(basis)).toBeCloseTo(ratio * 100, 1);
    } finally {
      await app.close();
    }
  });

  test('closing the split tab removes its preview view', async () => {
    const { app, win } = await launchApp();
    try {
      await clickTabAddItem(win, 'New Chat + Preview');
      await navigateActiveUrl(win, srv.url);
      await waitForPreviewUrl(app, u => u.startsWith(srv.url));
      await win.locator('#tab-bar .tab-chip.split-tab .tab-close').click();
      await expect(win.locator('#tab-bar .tab-chip.split-tab')).toHaveCount(0);
      await expect.poll(async () => (await previewViews(app)).length, { timeout: 5000 }).toBe(0);
    } finally {
      await app.close();
    }
  });

  test('is available in other sections and hides when switching section', async () => {
    const { app, win } = await launchApp();
    try {
      await win.locator('.nav-tab[data-section="ideas"]').click();
      const bar = win.locator('#section-ideas .fbs-tab-bar');
      await bar.locator('.tab-add-btn').click();
      await win.locator('.tab-add-menu:visible button:has-text("New Chat + Preview")').click();
      const pane = win.locator('#section-ideas .tab-pane.split-pane.active');
      await expect(pane.locator('.split-chat .xterm')).toBeVisible({ timeout: 5000 });

      const input = pane.locator('.browser-url-input');
      await input.fill(srv.url);
      await input.press('Enter');
      await waitForPreviewUrl(app, u => u.startsWith(srv.url));

      await win.locator('.nav-tab[data-section="build"]').click();
      await expect.poll(async () => (await previewViews(app)).length, { timeout: 5000 }).toBe(0);
      await win.locator('.nav-tab[data-section="ideas"]').click();
      await expect.poll(async () => (await previewViews(app)).length, { timeout: 5000 }).toBe(1);
    } finally {
      await app.close();
    }
  });
});
