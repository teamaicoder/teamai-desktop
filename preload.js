'use strict';

console.log('[preload] starting');

const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const os = require('os');
const { marked } = require('marked');

console.log('[preload] core requires OK');

try {
  contextBridge.exposeInMainWorld('api', {
    // Path utilities
    basename: p => path.basename(p),
    extname:  p => path.extname(p).toLowerCase(),
    dirname:  p => path.dirname(p),
    join:     (...parts) => path.join(...parts),
    homedir:  () => os.homedir(),

    // File system
    listDir:      p              => ipcRenderer.invoke('fs:list',   p),
    readFile:     p              => ipcRenderer.invoke('fs:read',   p),
    writeFile:    (p, content)   => ipcRenderer.invoke('fs:write',  { filePath: p, content }),
    renameEntry:  (oldPath, newPath) => ipcRenderer.invoke('fs:rename', { oldPath, newPath }),
    deleteEntry:  (entryPath, isDir) => ipcRenderer.invoke('fs:delete', { entryPath, isDir }),
    mkdir:        dirPath        => ipcRenderer.invoke('fs:mkdir',  { dirPath }),
    touch:        filePath       => ipcRenderer.invoke('fs:touch',  { filePath }),

    // Context menu
    showContextMenu: (p, isDir, section) => ipcRenderer.send('ctx:show', { path: p, isDir, section }),
    onCtxAction:     cb => ipcRenderer.on('ctx:action', (_, p) => cb(p)),

    // Preferences
    loadPrefs: ()     => ipcRenderer.invoke('prefs:load'),
    savePrefs: data   => ipcRenderer.invoke('prefs:save', data),

    // Git
    gitBranch: p => ipcRenderer.invoke('git:branch', p),

    // Native folder / file pickers
    openFolder: defaultPath => ipcRenderer.invoke('dialog:openFolder', { defaultPath }),
    openFile:   defaultPath => ipcRenderer.invoke('dialog:openFile',   { defaultPath }),

    // Browser (WebContentsView — bypasses X-Frame-Options, full Chromium)
    browserCreate:   ()           => ipcRenderer.invoke('browser:create'),
    browserNavigate: (id, url)    => ipcRenderer.invoke('browser:navigate', { id, url }),
    browserShow:     (id, bounds) => ipcRenderer.send('browser:show', { id, bounds }),
    browserHide:     (id)         => ipcRenderer.send('browser:hide', { id }),
    browserDestroy:  (id)         => ipcRenderer.invoke('browser:destroy', { id }),
    browserBack:     (id)         => ipcRenderer.invoke('browser:back', { id }),
    browserForward:  (id)         => ipcRenderer.invoke('browser:forward', { id }),
    browserReload:   (id)         => ipcRenderer.invoke('browser:reload', { id }),
    browserOpenExternal: (id)     => ipcRenderer.invoke('browser:open-external', { id }),
    onBrowserEvent:  cb           => ipcRenderer.on('browser:event', (_, p) => cb(p)),

    // Workbench (dashboard web tab)
    workbenchLoad:        url    => ipcRenderer.invoke('workbench:load', url),
    workbenchReload:      ()     => ipcRenderer.invoke('workbench:reload'),
    workbenchShow:        bounds => ipcRenderer.send('workbench:show', { bounds }),
    workbenchHide:        ()     => ipcRenderer.send('workbench:hide'),
    onWorkbenchEvent:     cb     => ipcRenderer.on('workbench:event', (_, p) => cb(p)),
    onWorkbenchConfigure: cb     => ipcRenderer.on('workbench:configure', () => cb()),
    projectsImport:       opts   => ipcRenderer.invoke('projects:import', opts),
    onProjectsCommand:    cb     => ipcRenderer.on('projects:command', (_, p) => cb(p)),

    // Files opened from Finder; appReady() returns any that arrived before init finished
    appReady:   ()  => ipcRenderer.invoke('app:ready'),
    onOpenFile: cb  => ipcRenderer.on('app:open-file', (_, p) => cb(p)),

    // Markdown → HTML (sync, runs in preload via marked)
    renderMarkdown: text => marked.parse(text, { breaks: true }),

    // PTY
    ptySpawn:  cwd            => ipcRenderer.invoke('pty:spawn', { cwd }),
    ptyWrite:  (id, data)     => ipcRenderer.send('pty:write',  { id, data }),
    ptyResize: (id, cols, rows) => ipcRenderer.send('pty:resize', { id, cols, rows }),
    ptyKill:   id             => ipcRenderer.send('pty:kill',   { id }),

    // Streaming PTY events
    onPtyData: cb => ipcRenderer.on('pty:data', (_, p) => cb(p)),
    onPtyExit: cb => ipcRenderer.on('pty:exit', (_, p) => cb(p)),

    // File watching (auto-reload)
    watchFile:     p  => ipcRenderer.invoke('fs:watch', p),
    unwatchFile:   p  => ipcRenderer.invoke('fs:unwatch', p),
    onFileChanged: cb => ipcRenderer.on('fs:changed', (_, p) => cb(p)),
  });

  console.log('[preload] window.api exposed OK');
} catch (err) {
  console.error('[preload] contextBridge.exposeInMainWorld FAILED:', err.message);
  console.error(err.stack);
}
