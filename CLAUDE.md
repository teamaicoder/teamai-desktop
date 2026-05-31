# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start app with hot reload (renderer reloads on file save, main restarts on main.js change)
npm start         # Start app without hot reload
npm test          # Run all tests
npm test -- --testPathPattern=ipc-handlers   # Run a single test file
npm run setup     # Copy xterm.js vendor assets into renderer/vendor/
```

There is no build step — the renderer is plain HTML/CSS/JS served directly from disk.

`node-pty` is a native module. After `npm install`, run `npm run setup` if vendor assets are missing, and `npm run postinstall` (or `electron-rebuild -f`) if node-pty fails to load.

## Architecture

The app follows Electron's standard two-process model with strict context isolation:

**Main process** (`main.js`, `main/handlers.js`)
- `main.js` — creates the `BrowserWindow`, registers all `ipcMain` handlers, manages the PTY map (`ptys: Map<id, pty>`), and pipes renderer console output to the terminal.
- `main/handlers.js` — pure Node functions for fs, prefs, git (`exec git rev-parse`), and PTY lifecycle. Designed to be injectable for tests (no Electron imports; `nodePty` and `ptys` are passed in explicitly).

**Preload** (`preload.js`)
- Exposes `window.api` to the renderer via `contextBridge`. This is the only bridge between the sandboxed renderer and Node. All calls go through IPC channels prefixed by domain: `fs:*`, `prefs:*`, `git:*`, `pty:*`, `md:*`, `dialog:*`.
- Markdown rendering (`marked`) runs in the main process and is called via `md:render` IPC — it never runs in the renderer.

**Renderer** (`renderer/`)
- Single-page app: `index.html` + `app.js` + `styles.css`. No framework, no bundler.
- `app.js` has three layers: **state** (plain object at top), **sidebar** (file tree, starred folders, git badges), and **tab system** (IndexedStack-style — all panes stay in the DOM, only the active one is visible via `.active` class).
- Tabs are keyed by file path for file tabs, and `terminal_${dir}_${timestamp}` for terminal tabs.
- PTY data flows: main process → `pty:data` IPC event → `terminals Map<ptyId, {term, fitAddon}>` → xterm.js write.

**Tests** (`tests/ipc-handlers.test.js`)
- Tests run in Node (Jest, no Electron). They import `main/handlers.js` directly and inject mock `nodePty`/`ptys` objects. No mocking of the file system — tests use `os.tmpdir()` for real I/O.
