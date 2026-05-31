'use strict';

console.log('[preload] starting');

const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const os = require('os');

console.log('[preload] core requires OK');

// marked lives in the main process (md:render IPC) — keeps the preload thin
// and avoids native-module resolution issues in the renderer context.

try {
  contextBridge.exposeInMainWorld('api', {
    // Path utilities
    basename: p => path.basename(p),
    extname:  p => path.extname(p).toLowerCase(),
    homedir:  () => os.homedir(),

    // File system
    listDir:   p              => ipcRenderer.invoke('fs:list',  p),
    readFile:  p              => ipcRenderer.invoke('fs:read',  p),
    writeFile: (p, content)   => ipcRenderer.invoke('fs:write', { filePath: p, content }),

    // Preferences
    loadPrefs: ()     => ipcRenderer.invoke('prefs:load'),
    savePrefs: data   => ipcRenderer.invoke('prefs:save', data),

    // Git
    gitBranch: p => ipcRenderer.invoke('git:branch', p),

    // Native folder picker
    openFolder: defaultPath => ipcRenderer.invoke('dialog:openFolder', { defaultPath }),

    // Markdown → HTML (handled by main process)
    renderMarkdown: text => ipcRenderer.invoke('md:render', text),

    // PTY
    ptySpawn:  cwd            => ipcRenderer.invoke('pty:spawn', { cwd }),
    ptyWrite:  (id, data)     => ipcRenderer.send('pty:write',  { id, data }),
    ptyResize: (id, cols, rows) => ipcRenderer.send('pty:resize', { id, cols, rows }),
    ptyKill:   id             => ipcRenderer.send('pty:kill',   { id }),

    // Streaming PTY events
    onPtyData: cb => ipcRenderer.on('pty:data', (_, p) => cb(p)),
    onPtyExit: cb => ipcRenderer.on('pty:exit', (_, p) => cb(p)),
  });

  console.log('[preload] window.api exposed OK');
} catch (err) {
  console.error('[preload] contextBridge.exposeInMainWorld FAILED:', err.message);
  console.error(err.stack);
}
