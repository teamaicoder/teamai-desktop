# TeamAICoder

An Electron-based developer workspace: file browser, code editor, WYSIWYG markdown editor, and integrated terminal.

## Getting Started

```bash
npm install
npm run setup    # copy vendor assets (xterm, CodeMirror, Toast UI Editor)
npm run dev      # launch with hot reload
```

> **Note:** `node-pty` is a native module. If it fails to load after `npm install`, run:
> ```bash
> npm run postinstall   # or: electron-rebuild -f
> ```

> **Hot reload scope:** `npm run dev` watches renderer files (HTML/CSS/JS in `renderer/`) and restarts the main process when `main.js` changes. Changes to `app.js` that rewire event listeners at startup (e.g. the tab bar `+` button) require a **full restart** (`Ctrl-C` then `npm run dev`) — hot reload reloads the file but does not re-run startup wiring.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with hot reload (renderer reloads on save, main restarts on `main.js` change) |
| `npm start` | Start without hot reload |
| `npm run setup` | Copy vendor assets from `node_modules` into `renderer/vendor/` |
| `npm test` | Run Jest unit tests |
| `npm run test:ui` | Run Playwright UI tests against the real Electron app |
| `npm test -- --testPathPattern=ipc-handlers` | Run a single test file |
| `npm run dist` | Package for macOS |

## Architecture

Follows Electron's standard two-process model with strict context isolation.

### Main process (`main.js`, `main/handlers.js`)
- `main.js` — creates the `BrowserWindow`, registers all `ipcMain` handlers, manages the PTY map.
- `main/handlers.js` — pure Node functions for fs, prefs, git, and PTY lifecycle. No Electron imports; dependencies are injected for testability.

### Preload (`preload.js`)
- Exposes `window.api` to the renderer via `contextBridge`.
- IPC channels are namespaced by domain: `fs:*`, `prefs:*`, `git:*`, `pty:*`, `md:*`, `dialog:*`.
- Markdown rendering (`marked`) runs in the main process via `md:render` IPC.

### Renderer (`renderer/`)
- Single-page app: `index.html` + `app.js` + `styles.css`. No framework, no bundler.
- Tab system is IndexedStack-style — all panes stay in the DOM, active one shown via `.active` class.
- File tabs keyed by path; terminal tabs keyed by `terminal_${dir}_${timestamp}`.

### Tests (`tests/`)
- Jest, Node environment (no Electron). Handlers are tested by importing `main/handlers.js` directly with injected mocks. File system tests use `os.tmpdir()` — no mocking.
