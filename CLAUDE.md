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
- Exposes `window.api` to the renderer via `contextBridge`. This is the only bridge between the sandboxed renderer and Node. All calls go through IPC channels prefixed by domain: `fs:*`, `prefs:*`, `git:*`, `pty:*`, `md:*`, `dialog:*`, `browser:*`, `workbench:*`, `projects:*`, `preview:*` (`preview:open`, pages sent from terminals), `home:*` (status boards).
- Markdown rendering (`marked`) runs in the main process and is called via `md:render` IPC — it never runs in the renderer.

**Renderer** (`renderer/`)
- Single-page app: `index.html` + `app.js` + `styles.css`. No framework, no bundler.
- `session.js` — pure functions for the saved session (`prefs.session`): serialise tabs, normalise a saved session, decide which terminals resume `claude --continue`. Loaded as a plain `<script>` (`window.TacSession`) and `require()`d by `main/handlers.js`, `main.js` and the unit tests — keep it free of DOM and Node APIs.
- `app.js` has three layers: **state** (plain object at top), **sidebar** (file tree, starred folders, git badges), and **tab system** (IndexedStack-style — all panes stay in the DOM, only the active one is visible via `.active` class).
- Tabs are keyed by file path for file tabs, and `terminal_${dir}_${timestamp}` for terminal tabs.
- PTY data flows: main process → `pty:data` IPC event → `terminals Map<ptyId, {term, fitAddon}>` → xterm.js write.

**Session restore**
- The renderer saves `prefs.session` (debounced on tab changes, and every 30 s) with each section's tabs and active tab. Terminal entries carry the live `ptyId`; the renderer asks `pty:info` for each terminal's cwd and foreground process (ps/lsof) and records `claude: true` when Claude Code is in the foreground. On `before-quit`, main refreshes the saved entries from the live shells synchronously, so a `claude` still running at quit is resumed.
- Build's tabs are restored in `init()`; each section's tabs on its first visit (sections initialise lazily). Until then a section's saved tabs are carried over unchanged.
- Tab ids get a `uid()` suffix because restore creates several tabs in the same millisecond.

**Opening pages from terminals: the socket/env contract**
- Main listens on a Unix socket (`tac.sock` in userData, mode 0600; a temp path if that would exceed the socket path limit). A client sends one JSON line `{"url": "...", "ptyId": "..."}` and gets back `{"ok": true}` or `{"ok": false}`. Only `http:`, `https:` and `file:` URLs are accepted (`parseOpenRequest` in `main/handlers.js`).
- Every PTY gets: `BROWSER` (path to `scripts/teamai-open`), `TEAMAICODER_SOCKET`, `TEAMAICODER_PTY_ID` (the PTY's id) and `TEAMAICODER_NODE` (`process.execPath`). `scripts/teamai-open` runs `scripts/teamai-open.js` under `ELECTRON_RUN_AS_NODE=1`; if the socket can't be reached it falls back to the system opener. Both scripts are `asarUnpack`ed in packaged builds and `main.js` resolves the unpacked path.
- The renderer (`openFromTerminal`) routes by `ptyId`: a split tab's own preview, else a new browser tab after the owning terminal tab, else a new tab in the section owning the bottom terminal, else Build.
- This socket is the intended base for a future MCP `preview_open` tool: an MCP server started from an app terminal inherits these variables and can send the same message.

**Section home (status board)**
- `prefs.sectionHome[<section>] = { refresh, page, projectRefresh }`, normalised by `normalizeSectionHome` (`~` and paths become `file://` URLs). The renderer adds a pinned, non-closable `type: 'home'` tab first in that `FileBrowserSection` (`ensureHome`, on init and every visit); it isn't saved in the session, so restore never duplicates it.
- `home:refresh` (main) runs the command read from prefs on disk, never from the renderer, in `$SHELL -lc` (cwd: home, or the project root for `projectRefresh` with `{root}` shell-quoted). 90 s timeout, one run per section/mode/project at a time. A project run's page path comes from `parseRenderedPage(stdout)`. The renderer throttles automatic runs to one per 2 minutes per view.
- `setActiveTab(id, { auto })`: only user choices (`auto: false`) mark `movedFromHome`, which stops the Status tab grabbing focus on later visits in the same session.

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
  - `launchApp({ userData })` — launches the app with its own temp `userData` dir (so tests never touch real preferences) and waits for `init() complete`. Pass the returned `userData` back in to relaunch against the same preferences and sessions.
  - `clickTabAddItem(win, itemText)` — hovers the `+` button and clicks a dropdown item (`'New File'`, `'New Browser'`, `'New Terminal'` or `'New Chat + Preview'`).
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
  - `workbench.test.js` — Workbench tab: set/clear the URL from the menu, persistent session across restarts, external links open in the system browser, unreachable-URL error
  - `open-file.test.js` — files opened from Finder (macOS `open-file`): open rendered in Build, switch section, reuse the tab
  - `preview.test.js` — browser tabs and the Chat + Preview split: sign-in cookie persists across restarts, Chrome user agent, sign-in popups on the same session, new-tab links, back/forward, divider drag and saved ratio, section switching
  - `session.test.js` — session restore (tabs in Build and a section, active section and tab, terminal cwd, missing files skipped, `claude --continue` resume via a stand-in `claude`) and pages opened from terminals (Python `webbrowser` in a split lands in its preview, `$BROWSER` in a terminal tab opens a tab after it, a section's bottom terminal)
  - `section-home.test.js` — status board: pinned Status tab first in Plan & Track, background refresh and 2-minute throttle, Refresh, file links inside the page, All/This project toggle, inline errors, the set-up dialog, kept first and not duplicated after a relaunch, cleared from the menu
  - `projects.test.js` — projects: import a fixture portfolio, the switcher with phase/health chips, choosing a project (Build repo list, missing repos greyed, sections at the project folder), Re-import from the menu, active project kept across restarts
