# Getting started

This guide takes you from a fresh clone to a working TeamAICoder window with your own project in it.

## 1. Install and run

You need macOS, Node.js 20 or later, and the Xcode Command Line Tools (`xcode-select --install`).

```bash
git clone https://github.com/teamaicoder/teamai-desktop.git
cd teamai-desktop
npm install
npm run setup
npm start
```

`npm install` compiles node-pty against Electron's Node version (the `postinstall` step). `npm run setup` copies the editor and terminal libraries into `renderer/vendor/`. Run it again after upgrading dependencies.

To run the app from `/Applications` instead of a terminal, see [Building and installing](building-and-installing.md).

## 2. The sections

The bar across the top holds the stages of a project's life:

| Section | Typical folder | Use it for |
|---|---|---|
| Ideas | `ideas/`, `research/` | Raw ideas, research notes, competitor links |
| Design | `mockups/`, `diagrams/` | HTML mockups, diagrams, design notes |
| Plan & Track | `specs/`, `plan/` | Feature specs, the GitHub Projects board in a browser tab |
| Build | the code repo | Terminals running your coding agents, the files they touch |
| Test | the code repo or `tests/` | Test runs, CI pages |
| Deploy | `deploy/`, infra repo | Deploy scripts, hosting dashboards |
| Operate | `runbooks/` | Runbooks, monitoring dashboards, incident notes |

Each section has its own folder, file tree and tabs. None of the folders above is required. A section shows whatever folder you point it at.

## 3. Point each section at a folder

1. Open a section.
2. In the file tree header, click **Change folder** and choose a folder on disk.
3. Click the star to add the folder to your starred list for quick switching.

The app remembers each section's folder between launches.

## 4. Tabs

The **+** at the end of a section's tab strip opens:

- **New File**: creates a file in the current folder and opens it.
- **New Terminal**: a shell in the section's folder. Start your agent here (`claude`, `codex`, `aider`, and so on).
- **New Browser**: an embedded web page. Paste any URL: your GitHub Projects board, CI runs, analytics.

Clicking a file in the tree opens it in a tab. Markdown files open rendered. Switch to source or WYSIWYG mode to edit them. When a file changes on disk, for example because an agent edited it, its open tab reloads.

## 5. A suggested first workspace

For a project in `~/code/my-app`:

- **Plan & Track** → `~/code/my-app/docs`, plus a browser tab on the repo's GitHub Projects board
- **Build** → `~/code/my-app`, with one terminal running your coding agent and one for `npm test`
- **Deploy** → `~/code/my-app/deploy`, plus a browser tab on your hosting dashboard

## Where settings are stored

Preferences (section folders, starred folders, the last open folder) are saved to:

```
~/Library/Application Support/TeamAICoder/teamaicoder-preferences.json
```

Delete that file to reset the app. TeamAICoder stores no credentials. Terminals use your normal shell environment, so CLI agents use whatever login you've already set up for them.
