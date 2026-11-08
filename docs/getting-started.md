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

### Projects

If you keep a portfolio, a folder with one markdown file per project, the app can import it. Each file starts with YAML frontmatter:

```markdown
---
slug: my-app
title: My App
one_liner: What it is, in a sentence
phase: build          # shown as a chip in the switcher
health: green         # green, amber or red
repos:
  - github.com/my-org/my-app        # comments after '#' are ignored
  - github.com/my-org/my-app-infra
---
```

1. **Projects → Import from Portfolio…** in the menu bar. Choose the portfolio folder (or the repo that contains `portfolio/`), then the workspace folder your checkouts live under (the first time only).
2. The app scans the workspace, up to four folders deep, for git checkouts and matches each repo by its `origin` remote. A project's folder is `<workspace>/<slug>` when that holds all its checkouts, otherwise the folder that does.
3. Pick a project from the switcher at the left of the top bar. Build and every section open at the project's folder, and the Build sidebar lists its repos. Repos with no local checkout are greyed out.
4. **Projects → Re-import Projects** picks up changes to the portfolio. If a project's folder is wrong, open the right one and choose **Use current folder as project folder** from the switcher; re-imports keep it.

## 4. Tabs

The **+** at the end of a section's tab strip opens:

- **New File**: creates a file in the current folder and opens it.
- **New Terminal**: a shell in the section's folder. Start your agent here (`claude`, `codex`, `aider`, and so on).
- **New Browser**: an embedded web page. Paste any URL: your GitHub Projects board, CI runs, analytics. The toolbar has back, forward, reload and **Open in system browser**.
- **New Chat + Preview**: a terminal on the left and a browser on the right. Run your agent (`claude`) in the terminal and open the page you're working on, such as a SharePoint or Google Docs link, on the right. Drag the divider to resize. The app remembers the split for next time.

Clicking a file in the tree opens it in a tab. Markdown files open rendered. Switch to source or WYSIWYG mode to edit them. When a file changes on disk, for example because an agent edited it, its open tab reloads.

### Signing in to sites in browser tabs

Browser and Chat + Preview tabs behave like a normal browser profile. Sign in to Microsoft 365, Google or any other site the usual way (including multi-factor prompts) and the sign-in is shared by every browser tab and kept across restarts. Sign-in windows that a site opens as a popup appear as a small window and close back into the page. Links that open a new tab open another browser tab in the same section.

The tabs present themselves as Chrome, because some sign-in pages refuse unfamiliar browsers. This session is separate from the Workbench tab's.

### Opening pages from a terminal

Every terminal in the app has `BROWSER` set to a small helper, `teamai-open`, so a tool that opens a browser shows the page inside the app instead:

- In a **Chat + Preview** tab, the page opens in that tab's own preview, on the right of the terminal.
- In a **terminal tab**, it opens in a new browser tab right after the terminal.
- In a section's bottom **Terminal** panel, it opens in a new browser tab in that section.

This works for anything that honours `$BROWSER`, such as Python's `webbrowser` module, which many CLI tools and agent skills use to open a report or status page. You can also run it yourself:

```bash
"$BROWSER" report.html          # a file, relative to the current folder
"$BROWSER" http://localhost:3000
```

Only `http`, `https` and `file` addresses are accepted. Outside the app the helper hands the page to your normal browser.

### Reopening your last session

When you quit and reopen the app, your tabs come back where they were, in Build and in every section, along with the section you were in:

- **Files** reopen; any that have since been deleted are skipped.
- **Terminals** start a fresh shell in the folder they were last in. Scrollback and running programs don't survive a restart, with one exception: a terminal that was running `claude` when you quit runs `claude --continue`, so the conversation picks up again. If two terminals in the same folder were running it, neither is resumed (they would both resume the same conversation). Set `"restoreClaude": false` in the preferences file to turn this off.
- **Browser** and **Chat + Preview** tabs reload the page they were showing; you stay signed in.

## 5. The Workbench tab

If you run the Workbench dashboard (the server side of TeamAICoder), point the app at it: **Workbench → Set Workbench URL…** in the menu bar. A **Workbench** tab appears at the end of the top bar and shows the dashboard.

- The tab keeps its own session, so you stay signed in across restarts.
- Links to other sites open in your normal browser.
- Leave the URL empty to hide the tab again.

## 6. A suggested first workspace

For a project in `~/code/my-app`:

- **Plan & Track** → `~/code/my-app/docs`, plus a browser tab on the repo's GitHub Projects board
- **Build** → `~/code/my-app`, with one terminal running your coding agent and one for `npm test`
- **Deploy** → `~/code/my-app/deploy`, plus a browser tab on your hosting dashboard

## Where settings are stored

Preferences (section folders, starred folders, the last open folder, imported projects, the open tabs) are saved to:

```
~/Library/Application Support/TeamAICoder/teamaicoder-preferences.json
```

Delete that file to reset the app. Sign-ins made in browser tabs are kept in the app's browser profile in the same folder, as cookies, the same way a browser keeps them. TeamAICoder stores no other credentials. Terminals use your normal shell environment, so CLI agents use whatever login you've already set up for them.
