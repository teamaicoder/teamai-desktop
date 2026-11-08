'use strict';

const { app, BrowserWindow, ipcMain, dialog, Menu, MenuItem, clipboard, shell, session, WebContentsView } = require('electron');
const path = require('path');
const fs = require('fs');
const {
  listDir, readFile, writeFile,
  renameEntry, deleteEntry, mkdirEntry, touchEntry,
  loadPrefs, savePrefs, normalizeWorkbenchUrl,
  chromeUserAgent, windowOpenTarget,
  gitBranch,
  ptySpawn, ptyWrite, ptyResize, ptyKill,
} = require('./main/handlers');

console.log('[main] starting, electron', process.versions.electron, 'node', process.versions.node);

const IS_TEST = process.env.NODE_ENV === 'test';

// Tests point userData at a temp dir so they never touch real preferences or sessions
if (IS_TEST && process.env.TAC_USER_DATA) app.setPath('userData', process.env.TAC_USER_DATA);

if (!IS_TEST && !app.isPackaged && process.env.NODE_ENV !== 'production') {
  try {
    require('electron-reload')(__dirname, {
      electron: require('electron'),
      hardResetMethod: 'exit',
    });
  } catch { }
}

// Enforce single instance in dev/prod, but not in test (Playwright launches its own instance)
if (!IS_TEST && !app.requestSingleInstanceLock()) {
  app.quit();
}

// ── Opening files from Finder ("Open With", double-click when default) ────────
// macOS sends 'open-file', possibly before the window exists, so paths queue
// until the renderer has finished init() and asks for them.
const pendingOpenFiles = [];
let rendererReady = false;

function openFileInApp(filePath) {
  console.log(`[main] open-file ${filePath}`);
  const win = BrowserWindow.getAllWindows()[0];
  if (!win || !rendererReady) { pendingOpenFiles.push(filePath); return; }
  win.webContents.send('app:open-file', { filePath });
  if (win.isMinimized()) win.restore();
  if (!IS_TEST) win.show();
  win.focus();
}

app.on('open-file', (event, filePath) => {
  event.preventDefault();
  openFileInApp(filePath);
});

ipcMain.handle('app:ready', () => {
  rendererReady = true;
  return pendingOpenFiles.splice(0);
});

let nodePty;
try {
  nodePty = require('node-pty');
  console.log('[main] node-pty loaded OK');
} catch (e) {
  console.warn('[main] node-pty unavailable — terminals disabled:', e.message);
}

let marked;
try {
  ({ marked } = require('marked'));
  console.log('[main] marked loaded OK');
} catch (e) {
  console.error('[main] marked failed to load:', e.message);
}

// ── Window ────────────────────────────────────────────────────────────────────

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 640,
    minHeight: 480,
    title: 'TeamAICoder',
    show: !IS_TEST,   // hidden in test mode — Playwright uses CDP, no visible window needed
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,  // renderer JS cannot access Node — the real security boundary
      nodeIntegration: false,
      sandbox: false,           // preload needs require('path'), require('os'), require('marked')
    },
  });

  // Pipe renderer console → terminal so errors are visible without opening DevTools manually
  win.webContents.on('console-message', (_, level, message, line, sourceId) => {
    const src = sourceId ? `${path.basename(sourceId)}:${line}` : '';
    const labels = ['[renderer]', '[renderer:info]', '[renderer:warn]', '[renderer:error]'];
    console.log(`${labels[level] ?? '[renderer]'} ${src ? `(${src}) ` : ''}${message}`);
  });

  win.webContents.on('render-process-gone', (_, details) => {
    console.error('[main] render-process-gone:', JSON.stringify(details));
  });
  win.webContents.on('did-fail-load', (_, code, desc, url) => {
    console.error(`[main] did-fail-load code=${code} desc="${desc}" url=${url}`);
  });
  win.webContents.on('preload-error', (_, preloadPath, error) => {
    console.error(`[main] preload-error in ${preloadPath}:`, error);
  });
  win.webContents.on('did-finish-load', () => console.log('[main] renderer finished loading'));

  // Block any attempt to navigate away from index.html (e.g. clicking an unhandled link)
  win.webContents.on('will-navigate', (e, url) => {
    const indexUrl = `file://${path.join(__dirname, 'renderer', 'index.html')}`;
    if (!url.startsWith(indexUrl)) {
      console.log(`[main] blocked navigation to ${url}`);
      e.preventDefault();
    }
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  if (!IS_TEST && !app.isPackaged) win.webContents.openDevTools({ mode: 'detach' });
}

app.whenReady().then(() => {
  console.log('[main] app ready, creating window');
  // The packaged app takes its icon from the bundle; when run from source, set the Dock icon here
  if (process.platform === 'darwin' && !app.isPackaged) app.dock.setIcon(path.join(__dirname, 'build', 'icon.png'));
  addWorkbenchMenu();
  createWindow();
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) { rendererReady = false; createWindow(); }
});

// ── Markdown (in main so marked never touches the renderer/preload context) ──

ipcMain.handle('md:render', (_, text) => {
  if (!marked) return `<pre>${text}</pre>`;
  return marked.parse(text, { breaks: true });
});

// ── File system ───────────────────────────────────────────────────────────────

ipcMain.handle('fs:list', (_, dirPath) => {
  console.log(`[main] fs:list "${dirPath}"`);
  const result = listDir(dirPath);
  console.log(`[main] fs:list → ${result.length} entries`);
  return result;
});

ipcMain.handle('fs:read', (_, filePath) => {
  console.log(`[main] fs:read "${filePath}"`);
  return readFile(filePath);
});

ipcMain.handle('fs:write', (_, { filePath, content }) => {
  console.log(`[main] fs:write "${filePath}" (${content.length} chars)`);
  writeFile(filePath, content);
});

// ── Preferences ───────────────────────────────────────────────────────────────

const prefsPath = path.join(app.getPath('userData'), 'teamaicoder-preferences.json');
console.log('[main] prefs path:', prefsPath);

ipcMain.handle('prefs:load', () => {
  const result = loadPrefs(prefsPath);
  console.log('[main] prefs:load →', JSON.stringify(result));
  return result;
});

ipcMain.handle('prefs:save', (_, data) => {
  console.log('[main] prefs:save', JSON.stringify(data));
  try { savePrefs(prefsPath, data); }
  catch (e) { console.error('[main] prefs:save failed:', e.message); }
});

// ── Git ───────────────────────────────────────────────────────────────────────

ipcMain.handle('git:branch', async (_, dirPath) => {
  const branch = await gitBranch(dirPath);
  if (branch) console.log(`[main] git:branch "${dirPath}" → ${branch}`);
  return branch;
});

// ── Dialog ────────────────────────────────────────────────────────────────────

ipcMain.handle('dialog:openFolder', async (_, { defaultPath }) => {
  console.log(`[main] dialog:openFolder defaultPath="${defaultPath}"`);
  const result = await dialog.showOpenDialog({ defaultPath, properties: ['openDirectory'] });
  const picked = result.canceled ? null : result.filePaths[0];
  console.log(`[main] dialog:openFolder → ${picked ?? 'cancelled'}`);
  return picked;
});

ipcMain.handle('dialog:openFile', async (_, { defaultPath }) => {
  console.log(`[main] dialog:openFile defaultPath="${defaultPath}"`);
  const result = await dialog.showOpenDialog({ defaultPath, properties: ['openFile'] });
  const picked = result.canceled ? null : result.filePaths[0];
  console.log(`[main] dialog:openFile → ${picked ?? 'cancelled'}`);
  return picked;
});

// ── File management ───────────────────────────────────────────────────────────

ipcMain.handle('fs:rename', (_, { oldPath, newPath }) => {
  console.log(`[main] fs:rename "${oldPath}" → "${newPath}"`);
  renameEntry(oldPath, newPath);
});

ipcMain.handle('fs:delete', async (event, { entryPath, isDir }) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const name = path.basename(entryPath);
  const { response } = await dialog.showMessageBox(win, {
    type: 'warning',
    buttons: ['Delete', 'Cancel'],
    defaultId: 1,
    cancelId: 1,
    message: `Delete "${name}"?`,
    detail: isDir
      ? 'This folder and all its contents will be permanently deleted.'
      : 'This file will be permanently deleted.',
  });
  if (response !== 0) return { deleted: false };
  try {
    deleteEntry(entryPath);
    console.log(`[main] fs:delete "${entryPath}"`);
    return { deleted: true };
  } catch (e) {
    console.error('[main] fs:delete failed:', e.message);
    await dialog.showErrorBox('Delete failed', e.message);
    return { deleted: false };
  }
});

ipcMain.handle('fs:mkdir', (_, { dirPath }) => {
  console.log(`[main] fs:mkdir "${dirPath}"`);
  mkdirEntry(dirPath);
});

ipcMain.handle('fs:touch', (_, { filePath }) => {
  console.log(`[main] fs:touch "${filePath}"`);
  try { touchEntry(filePath); } catch (e) {
    // File already exists — still OK, just don't overwrite
    if (e.code !== 'EEXIST') throw e;
  }
});

// ── Context menu ──────────────────────────────────────────────────────────────

ipcMain.on('ctx:show', async (event, { path: entryPath, isDir, section }) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const name = path.basename(entryPath);
  const send = (action) => { try { event.sender.send('ctx:action', { ...action, section }); } catch { } };

  const template = [];

  if (isDir) {
    template.push(
      { label: 'New File', click: () => send({ type: 'new-file', parentDir: entryPath }) },
      { label: 'New Folder', click: () => send({ type: 'new-folder', parentDir: entryPath }) },
      { type: 'separator' },
    );
  }

  template.push(
    { label: 'Rename', click: () => send({ type: 'rename', path: entryPath, isDir }) },
    { label: 'Copy Path', click: () => clipboard.writeText(entryPath) },
    {
      label: 'Move To…', click: async () => {
        const res = await dialog.showOpenDialog(win, { properties: ['openDirectory'], title: 'Move to folder' });
        if (res.canceled) return;
        const dest = path.join(res.filePaths[0], name);
        try { fs.renameSync(entryPath, dest); send({ type: 'refresh' }); }
        catch (e) { dialog.showErrorBox('Move failed', e.message); }
      },
    },
    { type: 'separator' },
    {
      label: 'Delete', click: async () => {
        const { response } = await dialog.showMessageBox(win, {
          type: 'warning', buttons: ['Delete', 'Cancel'], defaultId: 1, cancelId: 1,
          message: `Delete "${name}"?`,
          detail: isDir ? 'This folder and all its contents will be permanently deleted.' : 'This file will be permanently deleted.',
        });
        if (response !== 0) return;
        try { deleteEntry(entryPath); send({ type: 'refresh' }); }
        catch (e) { dialog.showErrorBox('Delete failed', e.message); }
      },
    },
  );

  Menu.buildFromTemplate(template).popup({ window: win });
});

// ── File watching (for auto-reload in Ideas) ──────────────────────────────────

const fileWatchers = new Map(); // filePath → { watcher, sender }

ipcMain.handle('fs:watch', (event, filePath) => {
  if (fileWatchers.has(filePath)) return;
  let debounce;
  let watcher;
  try {
    watcher = fs.watch(filePath, () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        try { event.sender.send('fs:changed', { filePath }); } catch { }
      }, 300);
    });
  } catch (e) {
    console.warn(`[main] fs:watch failed for "${filePath}":`, e.message);
    return;
  }
  fileWatchers.set(filePath, { watcher, debounce });
  console.log(`[main] fs:watch watching "${filePath}"`);
});

ipcMain.handle('fs:unwatch', (_, filePath) => {
  const entry = fileWatchers.get(filePath);
  if (!entry) return;
  clearTimeout(entry.debounce);
  try { entry.watcher.close(); } catch { }
  fileWatchers.delete(filePath);
  console.log(`[main] fs:unwatch stopped watching "${filePath}"`);
});

// ── PTY ───────────────────────────────────────────────────────────────────────

const ptys = new Map();
let ptySeq = 0;

ipcMain.handle('pty:spawn', (event, { cwd }) => {
  // Fall back to homedir if the requested cwd no longer exists (e.g. cleaned-up temp dirs)
  const actualCwd = (cwd && fs.existsSync(cwd)) ? cwd : require('os').homedir();
  if (actualCwd !== cwd) console.warn(`[main] pty:spawn cwd="${cwd}" not found, using homedir`);
  console.log(`[main] pty:spawn cwd="${actualCwd}"`);
  const id = ptySpawn(
    nodePty, ptys, ++ptySeq, { cwd: actualCwd },
    (id, data) => { try { event.sender.send('pty:data', { id, data }); } catch { } },
    (id)       => {
      console.log(`[main] pty:exit id=${id}`);
      try { event.sender.send('pty:exit', { id }); } catch { }
    },
  );
  console.log(`[main] pty:spawn → id=${id}`);
  return id;
});

ipcMain.on('pty:write',  (_, { id, data })        => ptyWrite(ptys, id, data));
ipcMain.on('pty:resize', (_, { id, cols, rows })   => {
  console.log(`[main] pty:resize id=${id} ${cols}x${rows}`);
  ptyResize(ptys, id, cols, rows);
});
ipcMain.on('pty:kill',   (_, { id })               => {
  console.log(`[main] pty:kill id=${id}`);
  ptyKill(ptys, id);
});

// ── Browser (WebContentsView) ─────────────────────────────────────────────────

// Every preview tab shares one persistent session, so a sign-in (SharePoint,
// Google Docs, …) is made once, works in every tab and survives restarts. It is
// separate from the Workbench session.
const PREVIEW_PARTITION = 'persist:preview';

const browserViewMap = new Map(); // id → WebContentsView
let browserSeq = 0;
let previewSessionReady = false;

function previewSession() {
  const ses = session.fromPartition(PREVIEW_PARTITION);
  if (!previewSessionReady) {
    previewSessionReady = true;
    ses.setUserAgent(chromeUserAgent(ses.getUserAgent()));
    // Hide WebAuthn so sign-in pages skip passkeys Electron can't complete
    ses.registerPreloadScript({
      type: 'frame',
      id: 'preview-no-passkeys',
      filePath: path.join(__dirname, 'main', 'preview-preload.js'),
    });
  }
  return ses;
}

function previewWebPreferences() {
  return { nodeIntegration: false, contextIsolation: true, sandbox: true, session: previewSession() };
}

// Popups and new-tab links from preview pages. Sign-in popups become child
// windows on the same session (window.opener intact, so they close back into
// the page); links asking for a new tab open as another preview tab.
function handlePreviewWindowOpen(contents, parentWin, onNewTab) {
  contents.setWindowOpenHandler(details => {
    if (windowOpenTarget(details) === 'tab') {
      onNewTab(details.url);
      return { action: 'deny' };
    }
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        parent: parentWin || undefined,
        width: 520, height: 680,
        show: !IS_TEST,
        autoHideMenuBar: true,
        webPreferences: previewWebPreferences(),
      },
    };
  });
  contents.on('did-create-window', child => {
    handlePreviewWindowOpen(child.webContents, child, onNewTab);
  });
}

ipcMain.handle('browser:create', event => {
  const id = String(++browserSeq);
  const view = new WebContentsView({ webPreferences: previewWebPreferences() });
  browserViewMap.set(id, view);
  const wc = view.webContents;

  const fwd = (type, payload) => {
    try { event.sender.send('browser:event', { id, type, ...payload }); } catch {}
  };
  const navState = () => ({ canGoBack: wc.navigationHistory.canGoBack(), canGoForward: wc.navigationHistory.canGoForward() });
  wc.on('did-navigate',         (_, url)              => fwd('navigate', { url, ...navState() }));
  wc.on('did-navigate-in-page', (_, url, isMainFrame) => { if (isMainFrame) fwd('navigate', { url, ...navState() }); });
  wc.on('page-title-updated',   (_, title)            => fwd('title', { title }));
  wc.on('did-fail-load',        (_, code, desc, url)  => {
    if (code !== -3) console.warn(`[main] browser:fail id=${id} code=${code} ${desc} ${url}`);
  });
  handlePreviewWindowOpen(wc, BrowserWindow.fromWebContents(event.sender), url => fwd('open-tab', { url }));

  console.log(`[main] browser:create → id=${id}`);
  return id;
});

ipcMain.handle('browser:navigate', async (_, { id, url }) => {
  const view = browserViewMap.get(id);
  if (!view) return;
  console.log(`[main] browser:navigate id=${id} url=${url}`);
  await view.webContents.loadURL(url);
});

ipcMain.handle('browser:back', (_, { id }) => {
  const nav = browserViewMap.get(id)?.webContents.navigationHistory;
  if (nav?.canGoBack()) nav.goBack();
});

ipcMain.handle('browser:forward', (_, { id }) => {
  const nav = browserViewMap.get(id)?.webContents.navigationHistory;
  if (nav?.canGoForward()) nav.goForward();
});

ipcMain.handle('browser:reload', (_, { id }) => {
  browserViewMap.get(id)?.webContents.reload();
});

// Open the page the tab is showing in the system browser
ipcMain.handle('browser:open-external', (_, { id }) => {
  const url = browserViewMap.get(id)?.webContents.getURL();
  if (url) openExternalIfWeb(url);
});

ipcMain.on('browser:show', (event, { id, bounds }) => {
  const view = browserViewMap.get(id);
  if (!view) return;
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;
  if (!win.contentView.children.includes(view)) win.contentView.addChildView(view);
  view.setBounds({
    x: Math.round(bounds.x), y: Math.round(bounds.y),
    width: Math.max(1, Math.round(bounds.width)), height: Math.max(1, Math.round(bounds.height)),
  });
});

ipcMain.on('browser:hide', (event, { id }) => {
  const view = browserViewMap.get(id);
  if (!view) return;
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) try { win.contentView.removeChildView(view); } catch (e) {
    console.warn(`[main] browser:hide removeChildView failed id=${id}:`, e.message);
  }
});

ipcMain.handle('browser:destroy', (event, { id }) => {
  const view = browserViewMap.get(id);
  if (!view) return;
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) try { win.contentView.removeChildView(view); } catch (e) {
    console.warn(`[main] browser:destroy removeChildView failed id=${id}:`, e.message);
  }
  browserViewMap.delete(id);
  try { view.webContents.close(); } catch (e) {
    console.warn(`[main] browser:destroy webContents.close failed id=${id}:`, e.message);
  }
  console.log(`[main] browser:destroy id=${id}`);
});

// ── Workbench (the dashboard as a web tab) ────────────────────────────────────

// One view for the whole app. Its persistent partition keeps the dashboard's
// session (cookies, storage) across restarts, separate from other browser tabs.
let workbenchView = null;
let workbenchOrigin = null;

function sendToWindows(channel, payload) {
  for (const w of BrowserWindow.getAllWindows()) {
    try { w.webContents.send(channel, payload); } catch {}
  }
}

function openExternalIfWeb(url) {
  try {
    const { protocol } = new URL(url);
    if (protocol === 'http:' || protocol === 'https:') shell.openExternal(url);
  } catch {}
}

function getWorkbenchView() {
  if (workbenchView) return workbenchView;
  workbenchView = new WebContentsView({
    webPreferences: { nodeIntegration: false, contextIsolation: true, partition: 'persist:workbench' },
  });
  const wc = workbenchView.webContents;

  // Links that leave the dashboard open in the system browser, not inside the app
  wc.setWindowOpenHandler(({ url }) => { openExternalIfWeb(url); return { action: 'deny' }; });
  wc.on('will-navigate', (e, url) => {
    let origin = null;
    try { origin = new URL(url).origin; } catch {}
    if (origin !== workbenchOrigin) {
      e.preventDefault();
      openExternalIfWeb(url);
    }
  });

  wc.on('did-finish-load', () => sendToWindows('workbench:event', { type: 'loaded', url: wc.getURL() }));
  wc.on('did-fail-load', (_, code, desc, url, isMainFrame) => {
    if (code === -3 || !isMainFrame) return;   // -3 = aborted by a newer navigation
    console.warn(`[main] workbench:fail code=${code} ${desc} ${url}`);
    sendToWindows('workbench:event', { type: 'fail', code, desc, url });
  });
  return workbenchView;
}

ipcMain.handle('workbench:load', async (_, url) => {
  const target = normalizeWorkbenchUrl(url);
  if (!target) return false;
  workbenchOrigin = new URL(target).origin;
  console.log(`[main] workbench:load ${target}`);
  getWorkbenchView().webContents.loadURL(target).catch(() => {});   // failures arrive as 'fail' events
  return true;
});

ipcMain.handle('workbench:reload', () => {
  if (workbenchView) workbenchView.webContents.reload();
});

ipcMain.on('workbench:show', (event, { bounds }) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;
  const view = getWorkbenchView();
  if (!win.contentView.children.includes(view)) win.contentView.addChildView(view);
  view.setBounds({
    x: Math.round(bounds.x), y: Math.round(bounds.y),
    width: Math.max(1, Math.round(bounds.width)), height: Math.max(1, Math.round(bounds.height)),
  });
});

ipcMain.on('workbench:hide', event => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && workbenchView) try { win.contentView.removeChildView(workbenchView); } catch {}
});

// Menu bar: Workbench → Set Workbench URL… / Reload Workbench
function addWorkbenchMenu() {
  const menu = Menu.getApplicationMenu() || new Menu();
  menu.append(new MenuItem({
    label: 'Workbench',
    submenu: [
      { id: 'workbench-set-url', label: 'Set Workbench URL…', click: () => sendToWindows('workbench:configure', {}) },
      { id: 'workbench-reload', label: 'Reload Workbench', click: () => workbenchView?.webContents.reload() },
    ],
  }));
  Menu.setApplicationMenu(menu);
}
