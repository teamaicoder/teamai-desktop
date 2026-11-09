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
4. To add a single repo or folder that isn't in the portfolio, use **Projects → Add Project Folder…**. Its title comes from the `project:` (or `product:`) field in the folder's `RELEASE.md` or `PRODUCT.md` frontmatter when there is one, so the switcher shows the folder name beside the title (for example `My App · my-app`) whenever they differ. A note beside the switcher confirms the project was added, or updated if a project with that name was already there.
5. **Projects → Re-import Projects** picks up changes to the portfolio. If a project's folder is wrong, open the right one and choose **Use current folder as project folder** from the switcher; re-imports keep it.

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

### A status board in Plan & Track

A section can open on a status page of your own: a pinned **Status** tab, always first, that can't be closed. Set it up from the menu bar with **Plan & Track → Set Status Board…**, which asks for:

| Field | What it is |
|---|---|
| **Refresh command** | A shell command that re-renders the all-projects page. It runs in your home folder, in your login shell. Optional: leave it empty for a page that's kept up to date some other way. |
| **Page** | Where that page is: a file path (`~/…` works), a `file://` URL or an `http(s)://` URL. |
| **Project refresh command** | A command that renders a page for one project. `{root}` is replaced with the active project's folder, and the command runs there. It must print the path of the page it wrote, ideally on a line starting with `wrote ` (for example `wrote /home/me/boards/alpha.html`). |
| **Action command** | Optional. Runs when you click an action link on the board (see [Acting on board items](#acting-on-board-items)), with the link's JSON payload on its standard input. |

For example, with a script that renders HTML status pages from your repos:

```
Refresh command:          ~/bin/render-status --all
Page:                     ~/status/index.html
Project refresh command:  cd {root} && ~/bin/render-status --project .
```

When you open the section, the Status tab shows the page straight away, runs the refresh command in the background and reloads when it finishes. It refreshes at most once every two minutes on its own; **Refresh** runs it immediately and the label beside it shows when it last finished. **All projects / This project** switches between the two pages (This project needs an active project). If a command fails, the end of its error output appears above the page and the last good page stays visible. Links between pages (for example from the board to a project's page) open inside the tab.

If you move to another tab in the section, that tab stays active when you come back; the Status tab is shown first again the next time you launch the app. **Plan & Track → Clear Status Board** removes it.

The setting is stored as `sectionHome` in the preferences file, keyed by section (`plan`, `ideas`, `design`, `test`, `deploy`, `operate`), so other sections can have a board too:

```json
"sectionHome": {
  "plan": {
    "refresh": "~/bin/render-status --all",
    "page": "~/status/index.html",
    "projectRefresh": "cd {root} && ~/bin/render-status --project .",
    "actionCommand": "~/bin/board-action"
  }
}
```

### Acting on board items

A board page can put buttons on its items that act inside the app: open Claude Code on a project with a prompt, or send an answer to a script and refresh the board. They are ordinary links (or forms) to `teamaicoder://` URLs, and they only work in a Status tab: the same page opened in a normal browser tab does nothing with them, and they are never passed to the operating system.

A page can tell it's in a Status tab: `file://` pages there are loaded with `?in=teamaicoder` added to the URL, so it can show these buttons only when they'll work:

```js
const inApp = new URLSearchParams(location.search).get('in') === 'teamaicoder';
```

**Open Claude on an item.** `teamaicoder://terminal?project=<slug>&prompt=<text>` (URL-encode the prompt) opens a new Chat + Preview tab in the same section, in the folder of the project with that slug, and runs `claude '<prompt>'` there. The prompt is passed as one quoted argument, so quotes, `$` and backticks in it are safe; line breaks and other control characters become spaces and it is cut at 4000 characters. With no prompt it just runs `claude`. A slug that isn't one of your projects shows an error above the page and runs nothing.

```html
<a href="teamaicoder://terminal?project=my-app&prompt=Fix%20the%20failing%20login%20test">Fix with Claude</a>
```

**Run an action.** `teamaicoder://action?payload=<URL-encoded JSON object>` runs the board's **Action command** in your home folder, in your login shell, with the payload JSON on standard input (at most 64 KB; it must be a JSON object). One action runs at a time per board, for up to 60 seconds. When it exits with status 0, the last line it printed shows briefly beside **Refresh** and the board refreshes straight away. When it fails, the end of its error output appears above the page. A form works too, which suits answering a question inline:

```html
<form method="GET" action="teamaicoder://action">
  <input type="hidden" name="payload" value='{"question":"Q12","answer":"Ship it on Friday"}'>
  <button>Answer</button>
</form>
```

If the payload has `"followup": {"project": "<slug>", "prompt": "…"}` and the action succeeds, the app then opens Claude on that project as the terminal link does, so an answer can hand straight on to an agent.

A minimal action command, reading the payload with `jq`:

```sh
#!/bin/sh
payload=$(cat)
q=$(printf '%s' "$payload" | jq -r .question)
printf '%s\n' "$payload" >> ~/status/answers.jsonl
echo "Recorded the answer to $q"
```

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
