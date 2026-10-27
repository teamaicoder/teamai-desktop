# TeamAICoder

**An open-source desktop workbench for running many software projects at once, with AI coding agents doing the building.**

TeamAICoder gives every project one window, organised by stage of the lifecycle: Ideas, Design, Plan & Track, Build, Test, Deploy and Operate. Each section is a set of tabs, which can be files, terminals or embedded web pages, rooted in the folders you assign to it. Run Claude Code, Codex or any CLI agent in a terminal tab, keep the spec open beside it, and have the project's GitHub board in the next tab.

> **Status: early.** macOS is the supported platform. The app works day to day for local folders, terminals and web tabs. Remote agents on Kubernetes, a shared API and an MCP server are on the [roadmap](docs/roadmap.md).

## Features

- **Lifecycle sections.** Seven top-level sections, each with its own folder, file tree and tab strip, so ideas, plans and deploy notes don't end up in one pile.
- **Integrated terminals.** Real PTYs (node-pty + xterm.js), opened in any folder. Run `claude`, `codex`, `npm test` or anything else.
- **Embedded browser tabs.** GitHub Projects, CI, analytics and docs sit next to the code, not in another app.
- **Markdown-first editing.** WYSIWYG and source modes, live reload when an agent edits the file, and links between markdown files that work.
- **Code editor.** CodeMirror with syntax highlighting for common languages.
- **Starred folders**, so you can jump between projects quickly.

## Quick start

Requirements: macOS, [Node.js](https://nodejs.org/) 20 or later, and the Xcode Command Line Tools (`xcode-select --install`). node-pty compiles a native module.

```bash
git clone https://github.com/teamaicoder/teamai-desktop.git
cd teamai-desktop
npm install      # also rebuilds node-pty for Electron
npm run setup    # copies xterm, CodeMirror and Toast UI Editor into renderer/vendor/
npm start
```

To build the app and install it into `/Applications`, see [Building and installing](docs/building-and-installing.md).

## Documentation

| Guide | For |
|---|---|
| [Getting started](docs/getting-started.md) | First launch, sections, folders, tabs, where settings are stored |
| [Building and installing](docs/building-and-installing.md) | Packaging the `.app`, installing it, optional code signing |
| [Troubleshooting](docs/troubleshooting.md) | node-pty, missing vendor assets, Gatekeeper |
| [Roadmap](docs/roadmap.md) | Where the project is heading |
| [Contributing](CONTRIBUTING.md) | Development setup, tests, pull requests |

> **Hot reload scope:** `npm run dev` watches renderer files (HTML/CSS/JS in `renderer/`) and restarts the main process when `main.js` changes. Changes to `app.js` that rewire event listeners at startup (e.g. the tab bar `+` button) require a **full restart** (`Ctrl-C` then `npm run dev`). Hot reload reloads the file but doesn't re-run startup wiring.

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

## Licence

[MIT](LICENSE)
