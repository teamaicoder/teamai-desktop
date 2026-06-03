# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Read the README first.** `README.md` contains setup steps, commands, architecture overview, and important notes about hot reload behaviour. Refer to it before making changes.

## Repository policy

This is a **public GitHub repository** (`github.com/teamaicoder/teamai-desktop`). Before pushing any commit:

- All code must be production-quality — no debug hacks, commented-out dead code, or TODO shortcuts.
- **Never commit secrets, API keys, tokens, passwords, or environment-specific data.** If a file contains any of these, abort and ask the user to handle it manually.
- Never commit `.env` files or any file with credentials, even if they look like examples.
- Review diffs for accidental inclusion of local paths, personal data, or internal hostnames before pushing.

## Commands

```bash
npm run dev       # Start app with hot reload (renderer reloads on file save, main restarts on main.js change)
npm start         # Start app without hot reload
npm test          # Run all tests
npm test -- --testPathPattern=ipc-handlers   # Run a single test file
npm run setup     # Copy all vendor assets into renderer/vendor/ (xterm, CodeMirror, Toast UI Editor)
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

**Vendor assets** (`renderer/vendor/`)
- Copied by `npm run setup` from `node_modules`. Never edit these files directly.
- `codemirror.js` + `codemirror.css` — base CodeMirror 5 library.
- `cm-simple.js` — CodeMirror `addon/mode/simple` addon, required by the Rust syntax mode (`cm-modes/rust.js`). Must be loaded before `cm-modes/rust.js` in `index.html`.
- `cm-modes/*.js` — language syntax modes (javascript, python, yaml, shell, css, xml, htmlmixed, clike, go, ruby, rust, toml).
- `xterm.js`, `xterm-addon-fit.js`, `xterm.css` — xterm.js terminal emulator.
- `toastui-editor.js`, `toastui-editor.css`, `easymde.min.js`, `easymde.min.css` — rich text / WYSIWYG markdown editors.

**Tests**

*Unit tests* (`tests/ipc-handlers.test.js`)
- Run with `npm test`. Jest, no Electron. Imports `main/handlers.js` directly; injects mock `nodePty`/`ptys`. No file system mocking — uses `os.tmpdir()` for real I/O.

*UI tests* (`tests/ui/`)
- Run with `npm run test:ui`. Uses Playwright's `@playwright/test` + `_electron` launcher to drive the real Electron app.
- The app runs with `NODE_ENV=test`, which disables the visible window (`show: false`), electron-reload, DevTools, and the single-instance lock. Playwright connects via CDP so no window ever appears on screen — tests can run without stealing focus.
- `tests/ui/helpers/app.js` provides shared helpers:
  - `launchApp()` — launches the app and waits for `init() complete` in the console before resolving.
  - `clickTabAddItem(win, itemText)` — hovers the `+` button and clicks a dropdown item (`'New File'` or `'New Browser'`).
  - `makeTempDir()` — creates a temp directory with `hello.md`, `data.json`, `script.js`, and `subdir/nested.md`. Returns `{ dir, cleanup }`.
  - `navigateSidebarTo(win, dir)` — calls `window._testNavigateTo(dir)` in the renderer to navigate the sidebar without a native dialog.
- `window._testNavigateTo(dir)` is defined at the bottom of `renderer/app.js` and sets `state.rootDir` then calls `navigateTo(dir)`.
- Test files by feature area:
  - `tab-add-menu.test.js` — `+` button, hover dropdown, New File, New Browser tab, navigation, close
  - `top-nav.test.js` — top nav tabs, section switching, active state, FBS init on first visit
  - `sidebar.test.js` — file list, folder navigation, go-up, toolbar buttons, starring
  - `file-tabs.test.js` — opening files, deduplication, tab switching, close, empty state
  - `terminal.test.js` — terminal tab open via folder hover action, xterm canvas, close
  - `markdown.test.js` — preview rendering, edit/preview toggle
