'use strict';

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// ── File system ───────────────────────────────────────────────────────────────

function listDir(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    return entries
      .map(e => ({ name: e.name, path: path.join(dirPath, e.name), isDir: e.isDirectory() }))
      .sort((a, b) => {
        if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      });
  } catch {
    return [];
  }
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

function renameEntry(oldPath, newPath) {
  fs.renameSync(oldPath, newPath);
}

function deleteEntry(entryPath) {
  fs.rmSync(entryPath, { recursive: true, force: true });
}

function mkdirEntry(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function touchEntry(filePath) {
  fs.writeFileSync(filePath, '', { flag: 'wx' }); // fail if already exists
}

// ── Preferences ───────────────────────────────────────────────────────────────

const PREFS_DEFAULT = () => ({
  starredFolders: [],
  lastOpenFolder: null,
  sectionFolders: {},
});

function loadPrefs(prefsPath) {
  try {
    if (!fs.existsSync(prefsPath)) return PREFS_DEFAULT();
    const data = JSON.parse(fs.readFileSync(prefsPath, 'utf8'));
    // Migrate legacy ideas-specific prefs into sectionFolders
    const sectionFolders = (typeof data.sectionFolders === 'object' && data.sectionFolders !== null)
      ? data.sectionFolders : {};
    if (!sectionFolders.ideas) {
      sectionFolders.ideas = {};
      if (typeof data.ideasFolder === 'string') sectionFolders.ideas.folder = data.ideasFolder;
      if (typeof data.lastIdeasFolder === 'string') sectionFolders.ideas.lastFolder = data.lastIdeasFolder;
    }
    return {
      starredFolders: Array.isArray(data.starredFolders) ? data.starredFolders : [],
      lastOpenFolder: typeof data.lastOpenFolder === 'string' ? data.lastOpenFolder : null,
      sectionFolders,
    };
  } catch {
    return PREFS_DEFAULT();
  }
}

function savePrefs(prefsPath, data) {
  fs.mkdirSync(path.dirname(prefsPath), { recursive: true });
  fs.writeFileSync(prefsPath, JSON.stringify(data, null, 2));
}

// ── Git ───────────────────────────────────────────────────────────────────────

function gitBranch(dirPath) {
  return new Promise(resolve => {
    exec(`git -C "${dirPath}" rev-parse --abbrev-ref HEAD`, (err, stdout) => {
      resolve(err ? null : (stdout.trim() || null));
    });
  });
}

// ── PTY ───────────────────────────────────────────────────────────────────────
//
// ptySpawn / ptyWrite / ptyResize / ptyKill accept the ptys Map and nodePty
// explicitly so tests can inject mocks and inspect state without electron.

function ptySpawn(nodePty, ptys, seq, { cwd, cols = 80, rows = 24 }, onData, onExit) {
  if (!nodePty) throw new Error('node-pty is not installed. Run: npm run setup');

  const id = String(seq);
  const shell = process.env.SHELL || (process.platform === 'win32' ? 'cmd.exe' : '/bin/bash');

  const pty = nodePty.spawn(shell, [], {
    name: 'xterm-256color',
    cols,
    rows,
    cwd,
    env: { ...process.env },
  });

  pty.onData(data => onData(id, data));
  pty.onExit(() => { onExit(id); ptys.delete(id); });

  ptys.set(id, pty);
  return id;
}

function ptyWrite(ptys, id, data) {
  ptys.get(id)?.write(data);
}

function ptyResize(ptys, id, cols, rows) {
  try { ptys.get(id)?.resize(cols, rows); } catch { }
}

function ptyKill(ptys, id) {
  try { ptys.get(id)?.kill(); } catch { }
  ptys.delete(id);
}

module.exports = {
  listDir, readFile, writeFile,
  renameEntry, deleteEntry, mkdirEntry, touchEntry,
  loadPrefs, savePrefs,
  gitBranch,
  ptySpawn, ptyWrite, ptyResize, ptyKill,
};
