'use strict';

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const {
  listDir, readFile, writeFile,
  loadPrefs, savePrefs,
  gitBranch,
  ptySpawn, ptyWrite, ptyResize, ptyKill,
} = require('./main/handlers');

console.log('[main] starting, electron', process.versions.electron, 'node', process.versions.node);

if (process.env.NODE_ENV !== 'production') {
  try {
    require('electron-reload')(__dirname, {
      electron: require('electron'),
      hardResetMethod: 'exit',
    });
  } catch { }
}

// Enforce single instance — kill any previous dev instance on reload
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

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

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.webContents.openDevTools({ mode: 'detach' });
}

app.whenReady().then(() => {
  console.log('[main] app ready, creating window');
  createWindow();
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

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

// ── PTY ───────────────────────────────────────────────────────────────────────

const ptys = new Map();
let ptySeq = 0;

ipcMain.handle('pty:spawn', (event, { cwd }) => {
  console.log(`[main] pty:spawn cwd="${cwd}"`);
  const id = ptySpawn(
    nodePty, ptys, ++ptySeq, { cwd },
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
