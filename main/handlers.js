'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { pathToFileURL } = require('url');
const { normalizeSession } = require('../renderer/session');
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

// Chat + Preview split: the chat (left) pane's share of the width
const SPLIT_RATIO_DEFAULT = 0.4;
const SPLIT_RATIO_MIN = 0.15;
const SPLIT_RATIO_MAX = 0.85;

function normalizeSplitRatio(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return SPLIT_RATIO_DEFAULT;
  return Math.min(SPLIT_RATIO_MAX, Math.max(SPLIT_RATIO_MIN, value));
}

const PREFS_DEFAULT = () => ({
  starredFolders: [],
  lastOpenFolder: null,
  sectionFolders: {},
  workbenchUrl: null,
  splitRatio: SPLIT_RATIO_DEFAULT,
  projects: [],
  activeProject: null,
  portfolioDir: null,
  workspaceRoot: null,
  session: normalizeSession(null),
  restoreClaude: true,
  sectionHome: {},
});

// The Workbench tab's URL: an http(s) URL, or null when unset or invalid
function normalizeWorkbenchUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return null;
  try {
    const u = new URL(url.trim());
    return (u.protocol === 'http:' || u.protocol === 'https:') ? u.href : null;
  } catch {
    return null;
  }
}

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
      workbenchUrl: normalizeWorkbenchUrl(data.workbenchUrl),
      splitRatio: normalizeSplitRatio(data.splitRatio),
      projects: Array.isArray(data.projects) ? data.projects.filter(p => p && typeof p.slug === 'string') : [],
      activeProject: typeof data.activeProject === 'string' ? data.activeProject : null,
      portfolioDir: typeof data.portfolioDir === 'string' ? data.portfolioDir : null,
      workspaceRoot: typeof data.workspaceRoot === 'string' ? data.workspaceRoot : null,
      session: normalizeSession(data.session),
      restoreClaude: data.restoreClaude !== false,
      sectionHome: normalizeSectionHome(data.sectionHome),
    };
  } catch {
    return PREFS_DEFAULT();
  }
}

function savePrefs(prefsPath, data) {
  fs.mkdirSync(path.dirname(prefsPath), { recursive: true });
  fs.writeFileSync(prefsPath, JSON.stringify(data, null, 2));
}

// ── Preview browser ───────────────────────────────────────────────────────────

// Preview tabs present as plain Chrome. Some sign-in pages (Google in
// particular) refuse browsers whose user agent names Electron or an unknown app.
function chromeUserAgent(ua) {
  return String(ua)
    .split(' ')
    .filter(token => token && !/^Electron\//.test(token) && !/^teamaicoder\//i.test(token))
    .join(' ');
}

// Google's sign-in refuses embedded Chromium even with a Chrome user agent:
// the Sec-CH-UA client hints and navigator.userAgentData still name the
// embedder. Firefox sends neither, so on Google's sign-in pages the preview
// presents as Firefox. The preview preload uses the same string.
const SIGN_IN_FIREFOX_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:145.0) Gecko/20100101 Firefox/145.0';
const FIREFOX_SIGN_IN_URLS = ['https://accounts.google.com/*'];

// Request headers for a Google sign-in request: Firefox user agent, no client hints
function signInRequestHeaders(headers = {}) {
  const out = {};
  for (const [name, value] of Object.entries(headers)) {
    if (/^sec-ch-ua/i.test(name) || /^user-agent$/i.test(name)) continue;
    out[name] = value;
  }
  out['User-Agent'] = SIGN_IN_FIREFOX_UA;
  return out;
}

// How a window.open / target=_blank request from a preview page is handled.
// Script popups with window features (the OAuth sign-in windows Microsoft and
// Google open pass a size) become child windows that keep window.opener.
// Plain links that ask for a new tab become another preview tab in the app.
function windowOpenTarget({ disposition, features } = {}) {
  if (disposition === 'new-window' || (typeof features === 'string' && features.trim())) return 'popup';
  if (disposition === 'foreground-tab' || disposition === 'background-tab') return 'tab';
  return 'popup';
}

// ── Projects ──────────────────────────────────────────────────────────────────
//
// A project is a named set of repos. Projects are imported from a portfolio:
// a folder of `<slug>.md` files whose YAML frontmatter carries the project's
// intent (title, one-liner, phase, health) and the repos it owns. Each repo is
// then matched to a local checkout by scanning a workspace folder for git
// repositories and reading their `origin` remote.

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;

function stripRepoComment(value) {
  return String(value).split('#', 1)[0].trim();
}

function unquote(value) {
  const s = String(value).trim();
  if (s.length >= 2 && s[0] === s[s.length - 1] && (s[0] === '"' || s[0] === "'")) return s.slice(1, -1);
  return s;
}

// The minimal YAML subset the portfolio files use: `key: value` and `key:`
// followed by `  - item` lines. Nested mappings are skipped. Only repo lines
// have trailing `# comment` annotations stripped; other values keep '#'.
function parseFrontmatter(text) {
  const m = FRONTMATTER.exec(String(text));
  if (!m) return {};
  const out = {};
  let key = null;
  for (const raw of m[1].split(/\r?\n/)) {
    if (!raw.trim() || raw.trimStart().startsWith('#')) continue;
    if (raw.startsWith('  - ') || raw.startsWith('- ')) {
      if (!key) continue;
      if (!Array.isArray(out[key])) out[key] = [];
      let item = raw.slice(raw.indexOf('- ') + 2).trim();
      if (key === 'repos') item = stripRepoComment(item);
      out[key].push(unquote(item));
      continue;
    }
    if (raw.startsWith(' ')) continue;   // nested mapping: not used here
    const colon = raw.indexOf(':');
    if (colon < 0) continue;
    key = raw.slice(0, colon).trim();
    let value = raw.slice(colon + 1);
    value = key === 'repos' ? stripRepoComment(value) : value.trim();
    out[key] = value ? unquote(value) : [];
  }
  return out;
}

// `github.com/owner/name`, `owner/name` or a git URL → `owner/name`, else null.
// Hand-written repo lists sometimes carry prose or shorthand, which is dropped.
function normalizeRepo(entry) {
  let s = String(entry || '').trim().replace(/\/+$/, '').replace(/\.git$/, '');
  if (!s || /[\s,]/.test(s)) return null;
  s = s.replace(/^https?:\/\//, '').replace(/^ssh:\/\//, '').replace(/^git@/, '');
  s = s.replace(/^[^/:]+\.[^/:]+[:/]/, '');   // drop a host: github.com/ or github.com:
  const parts = s.split('/');
  if (parts.length !== 2 || !parts.every(p => /^[A-Za-z0-9_.-]+$/.test(p))) return null;
  return `${parts[0]}/${parts[1]}`;
}

function scalar(value) {
  return typeof value === 'string' ? value : '';
}

// A portfolio folder (or a folder containing `portfolio/`) → projects
function readPortfolio(dir) {
  const nested = path.join(dir, 'portfolio');
  const folder = fs.existsSync(nested) && fs.statSync(nested).isDirectory() ? nested : dir;
  let names;
  try { names = fs.readdirSync(folder); } catch { return []; }
  const projects = [];
  for (const name of names.sort()) {
    if (!name.endsWith('.md') || name.toLowerCase() === 'readme.md') continue;
    let fm;
    try { fm = parseFrontmatter(fs.readFileSync(path.join(folder, name), 'utf8')); } catch { continue; }
    const slug = scalar(fm.slug) || name.slice(0, -3);
    if (!scalar(fm.title) && !Array.isArray(fm.repos)) continue;   // not a project file
    const repos = [];
    for (const r of Array.isArray(fm.repos) ? fm.repos : []) {
      const repo = normalizeRepo(r);
      if (repo && !repos.includes(repo)) repos.push(repo);
    }
    projects.push({
      slug,
      title: scalar(fm.title) || slug,
      oneLiner: scalar(fm.one_liner),
      phase: scalar(fm.phase),
      health: scalar(fm.health),
      oss: scalar(fm.oss),
      repos,
    });
  }
  return projects;
}

// The `origin` remote URL of a checkout, read from its git config
function originUrl(repoDir) {
  const dotGit = path.join(repoDir, '.git');
  let gitDir = dotGit;
  try {
    if (fs.statSync(dotGit).isFile()) {
      const m = /^gitdir:\s*(.+)$/m.exec(fs.readFileSync(dotGit, 'utf8'));
      if (!m) return null;
      gitDir = path.resolve(repoDir, m[1].trim());
      const common = path.join(gitDir, 'commondir');
      if (fs.existsSync(common)) gitDir = path.resolve(gitDir, fs.readFileSync(common, 'utf8').trim());
    }
    const config = fs.readFileSync(path.join(gitDir, 'config'), 'utf8');
    const section = /\[remote "origin"\]([\s\S]*?)(?=\n\[|$)/.exec(config);
    const url = section && /^\s*url\s*=\s*(.+)$/m.exec(section[1]);
    return url ? url[1].trim() : null;
  } catch {
    return null;
  }
}

const SCAN_SKIP = new Set(['node_modules', 'Library', 'Applications', 'vendor', 'dist', 'build', 'venv']);

// Breadth-first scan of a workspace for git checkouts, to `maxDepth` levels
// below it. Hidden folders (.git, .claude worktrees, caches) and dependency
// folders are skipped. Returns { 'owner/name': path }, shallowest path first.
function scanWorkspace(root, maxDepth = 4) {
  const found = {};
  let level = [root];
  for (let depth = 0; depth <= maxDepth && level.length; depth++) {
    const next = [];
    for (const dir of level) {
      let entries;
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
      if (depth > 0 && entries.some(e => e.name === '.git')) {
        const repo = normalizeRepo(originUrl(dir));
        if (repo && !found[repo]) found[repo] = dir;
      }
      if (depth === maxDepth) continue;
      for (const e of entries) {
        if (!e.isDirectory() || e.name.startsWith('.') || SCAN_SKIP.has(e.name)) continue;
        next.push(path.join(dir, e.name));
      }
    }
    level = next;
  }
  return found;
}

function isInside(child, parent) {
  const rel = path.relative(parent, child);
  return rel === '' || (!!rel && !rel.startsWith('..') && !path.isAbsolute(rel));
}

function commonParent(paths) {
  if (!paths.length) return null;
  let parts = path.resolve(paths[0]).split(path.sep);
  for (const p of paths.slice(1)) {
    const other = path.resolve(p).split(path.sep);
    let i = 0;
    while (i < parts.length && i < other.length && parts[i] === other[i]) i++;
    parts = parts.slice(0, i);
  }
  return parts.join(path.sep) || path.sep;
}

// A project's folder: <workspace>/<slug> when it exists and holds every local
// checkout; otherwise the deepest folder holding them all, unless that's the
// workspace itself or above; otherwise <workspace>/<slug> if it exists.
function projectRoot(slug, checkouts, workspaceRoot) {
  const bySlug = path.join(workspaceRoot, slug);
  const slugExists = fs.existsSync(bySlug) && fs.statSync(bySlug).isDirectory();
  if (slugExists && checkouts.every(c => isInside(c, bySlug))) return bySlug;
  const common = commonParent(checkouts);
  if (common && isInside(common, workspaceRoot) && path.resolve(common) !== path.resolve(workspaceRoot)) return common;
  return slugExists ? bySlug : null;
}

// Match each project's repos to local checkouts and work out its folder.
// Repos with no local checkout are kept with path null.
function resolveProjects(projects, repoPaths, workspaceRoot) {
  return projects.map(p => {
    const repos = p.repos.map(repo => ({ repo, path: repoPaths[repo] || null }));
    const checkouts = repos.filter(r => r.path).map(r => r.path);
    return { ...p, repos, root: projectRoot(p.slug, checkouts, workspaceRoot) };
  });
}

// Re-import: the portfolio's projects, in its order, keeping a folder the user
// set by hand (rootPinned) for projects that were already there.
// Projects added from a folder (source 'folder') aren't in the portfolio, so
// they are kept, after the portfolio's projects, unless a portfolio project now
// has the same slug.
function mergeProjects(existing, imported) {
  const prior = Array.isArray(existing) ? existing : [];
  const bySlug = new Map(prior.map(p => [p.slug, p]));
  const merged = imported.map(p => {
    const old = bySlug.get(p.slug);
    return old && old.rootPinned && old.root ? { ...p, root: old.root, rootPinned: true } : p;
  });
  const slugs = new Set(merged.map(p => p.slug));
  return merged.concat(prior.filter(p => p.source === 'folder' && !slugs.has(p.slug)));
}

// Import a portfolio: read it, scan the workspace, resolve and merge. A folder
// with no project files is refused rather than treated as an empty portfolio,
// which would drop every project.
function importProjects({ portfolioDir, workspaceRoot, existing }) {
  const imported = readPortfolio(portfolioDir);
  if (!imported.length) {
    throw new Error(`No project files found in ${portfolioDir}. A portfolio is a folder of <slug>.md files with a title or repos in their frontmatter, or a repo containing portfolio/. To add a single project, use Add Project Folder.`);
  }
  const resolved = resolveProjects(imported, scanWorkspace(workspaceRoot), workspaceRoot);
  return mergeProjects(existing, resolved);
}

function readFrontmatterFile(file) {
  try { return parseFrontmatter(fs.readFileSync(file, 'utf8')); } catch { return {}; }
}

// A project made from one folder: the folder is its root, its repos are the
// folder's own checkout and any checkouts up to two levels below it. Title,
// phase and health come from RELEASE.md / PRODUCT.md frontmatter when present.
function projectFromFolder(dir) {
  const release = readFrontmatterFile(path.join(dir, 'RELEASE.md'));
  const product = readFrontmatterFile(path.join(dir, 'PRODUCT.md'));
  const base = path.basename(dir);
  const slug = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
  const found = {};
  const own = fs.existsSync(path.join(dir, '.git')) ? normalizeRepo(originUrl(dir)) : null;
  if (own) found[own] = dir;
  for (const [repo, p] of Object.entries(scanWorkspace(dir, 2))) if (!found[repo]) found[repo] = p;
  return {
    slug,
    title: scalar(release.project) || scalar(product.product) || scalar(release.title) || base,
    oneLiner: scalar(release.release) || '',
    phase: scalar(release.phase) || '',
    health: scalar(release.health) || '',
    oss: '',
    repos: Object.entries(found).map(([repo, p]) => ({ repo, path: p })),
    root: dir,
    source: 'folder',
  };
}

// Add (or replace, by slug) a folder project
function addFolderProject(existing, dir) {
  const project = projectFromFolder(dir);
  const prior = (Array.isArray(existing) ? existing : []).filter(p => p.slug !== project.slug);
  return { project, projects: prior.concat(project) };
}

// ── Section home (a status board pinned first in a section) ──────────────────
//
// prefs.sectionHome[<section>] = { refresh, page, projectRefresh, actionCommand }
//   refresh        shell command that (re)renders the all-projects page
//   page           that page's URL (file:// or http(s); ~ and bare paths allowed)
//   projectRefresh shell command template; {root} is the active project's
//                  folder; its stdout names the per-project page it rendered
//   actionCommand  shell command run for teamaicoder://action links on the
//                  board; it gets the link's JSON payload on stdin

const HOME_SECTIONS = ['ideas', 'design', 'plan', 'test', 'deploy', 'operate'];

// A page location → a file:// or http(s) URL, or null. Accepts ~/…, bare
// absolute paths and file://~/… (expanded against home).
function normalizePageUrl(value, home) {
  if (typeof value !== 'string' || !value.trim()) return null;
  let s = value.trim();
  if (/^file:\/\/~(\/|$)/.test(s)) s = s.slice('file://'.length);
  if (s === '~' || s.startsWith('~/')) s = path.join(home, s.slice(1));
  if (path.isAbsolute(s)) return pathToFileURL(s).href;
  try {
    const u = new URL(s);
    return ['file:', 'http:', 'https:'].includes(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
}

function normalizeHomeEntry(raw, home) {
  if (!raw || typeof raw !== 'object') return null;
  const cmd = v => (typeof v === 'string' && v.trim() ? v.trim() : null);
  const entry = {
    refresh: cmd(raw.refresh),
    page: normalizePageUrl(raw.page, home),
    projectRefresh: cmd(raw.projectRefresh),
    actionCommand: cmd(raw.actionCommand),
  };
  return entry.page || entry.projectRefresh ? entry : null;
}

// prefs.sectionHome → only known sections with a usable entry
function normalizeSectionHome(raw, home = os.homedir()) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const id of HOME_SECTIONS) {
    const entry = normalizeHomeEntry(raw[id], home);
    if (entry) out[id] = entry;
  }
  return out;
}

// The page a refresh command says it rendered, as a URL, or null. Prefers a
// line starting with "wrote "; takes the last token there that is an http(s) or
// file URL or a path ending in .html/.htm; otherwise the last such token on any
// line.
function parseRenderedPage(stdout, home = os.homedir()) {
  const lines = String(stdout || '').split(/\r?\n/);
  const pick = list => {
    for (let i = list.length - 1; i >= 0; i--) {
      const tokens = list[i].trim().split(/\s+/);
      for (let j = tokens.length - 1; j >= 0; j--) {
        const tok = tokens[j].replace(/^[("'`<\[]+|[)"'`>\],;:.]+$/g, '');
        if (/^(https?|file):\/\//i.test(tok) || /\.html?$/i.test(tok)) {
          const url = normalizePageUrl(tok, home);
          if (url) return url;
        }
      }
    }
    return null;
  };
  return pick(lines.filter(l => /^\s*wrote\s/i.test(l))) || pick(lines);
}

// Quote a value for a POSIX shell
function shellQuote(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}

// The project refresh command with {root} filled in (shell-quoted)
function fillProjectCommand(template, root) {
  return String(template).replace(/\{root\}/g, shellQuote(root));
}

// The last few lines of a command's error output, for showing inline
function outputTail(text, maxLines = 6, maxChars = 800) {
  const lines = String(text || '').trimEnd().split(/\r?\n/).filter(Boolean);
  return lines.slice(-maxLines).join('\n').slice(-maxChars);
}

// ── Board actions (teamaicoder:// links in a Status tab) ─────────────────────
//
// A status board page acts on its items through two link forms, honoured only
// in a Status tab (see CLAUDE.md "Board actions"):
//   teamaicoder://terminal?project=<slug>&prompt=<text>
//   teamaicoder://action?payload=<JSON object>

const APP_SCHEME = 'teamaicoder:';
const IN_APP_PARAM = 'in';
const IN_APP_VALUE = 'teamaicoder';
const PROMPT_MAX_CHARS = 4000;
const ACTION_PAYLOAD_MAX_BYTES = 64 * 1024;

function isAppUrl(url) {
  return typeof url === 'string' && url.trim().toLowerCase().startsWith(`${APP_SCHEME}//`);
}

const SLUG = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

// A board prompt made safe to type: control characters (newlines included)
// become spaces, then it is trimmed and capped
function cleanPrompt(text) {
  return String(text == null ? '' : text)
    .replace(/[\u0000-\u001f\u007f-\u009f]+/g, ' ')
    .trim()
    .slice(0, PROMPT_MAX_CHARS);
}

// The shell command that starts Claude Code with a prompt, typed into a new
// terminal: `claude '<prompt>'`, or just `claude` for an empty prompt
function claudeCommand(prompt) {
  const p = cleanPrompt(prompt);
  return p ? `claude ${shellQuote(p)}` : 'claude';
}

// A terminal request { project, prompt } (from a link or an action's followup)
// → { ok: true, project, prompt } or { ok: false, error }
function validateTerminalRequest(req) {
  const project = req && typeof req.project === 'string' ? req.project.trim() : '';
  if (!project) return { ok: false, error: 'The terminal link names no project.' };
  if (!SLUG.test(project)) return { ok: false, error: `"${project.slice(0, 80)}" is not a project slug.` };
  const prompt = req && req.prompt != null ? cleanPrompt(req.prompt) : '';
  return { ok: true, project, prompt };
}

// An action payload (JSON text) → { ok: true, payload, json } or { ok: false, error }
function parseActionPayload(text) {
  if (typeof text !== 'string' || !text.trim()) return { ok: false, error: 'The action link has no payload.' };
  if (Buffer.byteLength(text, 'utf8') > ACTION_PAYLOAD_MAX_BYTES) {
    return { ok: false, error: `The action payload is larger than ${ACTION_PAYLOAD_MAX_BYTES / 1024} KB.` };
  }
  let payload;
  try { payload = JSON.parse(text); } catch { return { ok: false, error: 'The action payload is not valid JSON.' }; }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, error: 'The action payload must be a JSON object.' };
  }
  return { ok: true, payload, json: JSON.stringify(payload) };
}

// A teamaicoder:// URL → { ok: true, kind: 'terminal', project, prompt },
// { ok: true, kind: 'action', payload, json }, or { ok: false, error }.
// Returns null for URLs that aren't teamaicoder:// at all.
function parseAppUrl(url) {
  if (!isAppUrl(url)) return null;
  let u;
  try { u = new URL(url.trim()); } catch { return { ok: false, error: 'The teamaicoder:// link is malformed.' }; }
  // teamaicoder://terminal?… parses with host "terminal"; accept a path form too
  const kind = (u.hostname || u.pathname.replace(/^\/+/, '').split('/')[0]).toLowerCase();
  if (kind === 'terminal') {
    const res = validateTerminalRequest({ project: u.searchParams.get('project'), prompt: u.searchParams.get('prompt') });
    return res.ok ? { kind, ...res } : res;
  }
  if (kind === 'action') {
    const res = parseActionPayload(u.searchParams.get('payload'));
    return res.ok ? { kind, ...res } : res;
  }
  return { ok: false, error: `Unknown teamaicoder:// link "${kind.slice(0, 40)}".` };
}

// An action payload's followup → a validated terminal request, or null when
// there is none. An invalid followup returns { ok: false, error }.
function actionFollowup(payload) {
  const f = payload && payload.followup;
  if (f == null) return null;
  if (typeof f !== 'object' || Array.isArray(f)) return { ok: false, error: 'The action\'s followup must be an object.' };
  return validateTerminalRequest(f);
}

// The last non-empty line of a command's output, for a brief success message
function lastLine(text, maxChars = 200) {
  const lines = String(text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  return (lines[lines.length - 1] || '').slice(0, maxChars);
}

// Status-tab pages get ?in=teamaicoder on file:// URLs so a page can tell it
// is inside the app. Other URLs, and ones already marked, are unchanged.
function addInAppMarker(url) {
  let u;
  try { u = new URL(url); } catch { return url; }
  if (u.protocol !== 'file:' || u.searchParams.get(IN_APP_PARAM) === IN_APP_VALUE) return url;
  u.searchParams.append(IN_APP_PARAM, IN_APP_VALUE);
  return u.href;
}

// The URL without the in-app marker, for comparing and remembering URLs
function stripInAppMarker(url) {
  let u;
  try { u = new URL(url); } catch { return url; }
  if (u.protocol !== 'file:') return url;
  const params = [...u.searchParams].filter(([k, v]) => !(k === IN_APP_PARAM && v === IN_APP_VALUE));
  if (params.length === [...u.searchParams].length) return url;
  u.search = params.length ? new URLSearchParams(params).toString() : '';
  return u.href;
}

// ── Opening pages in the preview ─────────────────────────────────────────────

// A URL a terminal may open in the preview: http(s) or file. Returns the
// normalised URL or null.
function previewOpenUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return null;
  try {
    const u = new URL(url.trim());
    return u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'file:' ? u.href : null;
  } catch {
    return null;
  }
}

// One request line from teamai-open → { url, ptyId } or null
function parseOpenRequest(line) {
  let msg;
  try { msg = JSON.parse(String(line)); } catch { return null; }
  if (!msg || typeof msg !== 'object') return null;
  const url = previewOpenUrl(msg.url);
  if (!url) return null;
  const ptyId = msg.ptyId == null || msg.ptyId === '' ? null : String(msg.ptyId);
  return { url, ptyId };
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

function ptySpawn(nodePty, ptys, seq, { cwd, cols = 80, rows = 24, env = {} }, onData, onExit) {
  if (!nodePty) throw new Error('node-pty is not installed. Run: npm run setup');

  const id = String(seq);
  const shell = process.env.SHELL || (process.platform === 'win32' ? 'cmd.exe' : '/bin/bash');

  const pty = nodePty.spawn(shell, [], {
    name: 'xterm-256color',
    cols,
    rows,
    cwd,
    env: { ...process.env, ...env },
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
  loadPrefs, savePrefs, normalizeWorkbenchUrl, normalizeSplitRatio,
  chromeUserAgent, windowOpenTarget,
  SIGN_IN_FIREFOX_UA, FIREFOX_SIGN_IN_URLS, signInRequestHeaders,
  parseFrontmatter, normalizeRepo, readPortfolio, originUrl, scanWorkspace,
  projectRoot, resolveProjects, mergeProjects, importProjects,
  projectFromFolder, addFolderProject,
  previewOpenUrl, parseOpenRequest,
  HOME_SECTIONS, normalizePageUrl, normalizeSectionHome, parseRenderedPage, shellQuote, fillProjectCommand, outputTail,
  PROMPT_MAX_CHARS, ACTION_PAYLOAD_MAX_BYTES,
  isAppUrl, parseAppUrl, cleanPrompt, claudeCommand, validateTerminalRequest, parseActionPayload,
  actionFollowup, lastLine, addInAppMarker, stripInAppMarker,
  gitBranch,
  ptySpawn, ptyWrite, ptyResize, ptyKill,
};
