'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  listDir, readFile, writeFile,
  loadPrefs, savePrefs, normalizeWorkbenchUrl, normalizeSplitRatio,
  chromeUserAgent, windowOpenTarget,
  SIGN_IN_FIREFOX_UA, FIREFOX_SIGN_IN_URLS, signInRequestHeaders,
  parseFrontmatter, normalizeRepo, readPortfolio, originUrl, scanWorkspace,
  projectRoot, resolveProjects, mergeProjects, importProjects,
  gitBranch,
  ptySpawn, ptyWrite, ptyResize, ptyKill,
} = require('../main/handlers');

// ── Dependency smoke tests (catches the class of bug that broke the preload) ─
// These run in Node — same require() resolution the main/preload processes use.

describe('dependency smoke tests', () => {
  test('marked can be required and exports a parse function', () => {
    const { marked } = require('marked');
    expect(typeof marked).toBe('function');
    expect(typeof marked.parse).toBe('function');
  });

  test('marked.parse renders basic markdown to HTML without throwing', () => {
    const { marked } = require('marked');
    const html = marked.parse('# Hello\n\nWorld');
    expect(html).toContain('<h1>');
    expect(html).toContain('Hello');
    expect(html).toContain('World');
  });

  test('marked.parse accepts per-call options without throwing', () => {
    const { marked } = require('marked');
    // This is how main.js calls it — must not throw
    expect(() => marked.parse('line1\nline2', { breaks: true })).not.toThrow();
  });

  test('marked does NOT have setOptions (removed in v9+)', () => {
    // If setOptions exists and throws, it crashes the preload before
    // contextBridge.exposeInMainWorld runs, leaving window.api undefined.
    // Calling it must either not exist or not throw — we guard against both.
    const { marked } = require('marked');
    if (typeof marked.setOptions === 'function') {
      // If it still exists, calling it must not throw
      expect(() => marked.setOptions({ breaks: true })).not.toThrow();
    } else {
      // Expected in marked v9+: setOptions is gone
      expect(marked.setOptions).toBeUndefined();
    }
  });

  test('node-pty can be required', () => {
    expect(() => require('node-pty')).not.toThrow();
  });

  test('handlers module exports all expected functions', () => {
    const h = require('../main/handlers');
    const expected = ['listDir','readFile','writeFile','loadPrefs','savePrefs','gitBranch','ptySpawn','ptyWrite','ptyResize','ptyKill'];
    for (const fn of expected) {
      expect(typeof h[fn]).toBe('function');
    }
  });

  test('preload.js has no top-level require that throws', () => {
    // Simulate the requires the preload performs (minus electron, which isn't available in Jest)
    expect(() => require('path')).not.toThrow();
    expect(() => require('os')).not.toThrow();
    expect(() => require('marked')).not.toThrow();
  });

  test('main.js webPreferences sets sandbox:false so preload can require Node modules', () => {
    // Electron 31+ sandboxes preloads by default, blocking require('path'), require('os') etc.
    // contextIsolation:true is the real security boundary — sandbox:false is needed for the preload.
    const mainSrc = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
    expect(mainSrc).toMatch(/sandbox\s*:\s*false/);
    expect(mainSrc).toMatch(/contextIsolation\s*:\s*true/);
  });
});

// ── Temp dir helpers ──────────────────────────────────────────────────────────

function mkTmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'taic-test-'));
}

function rmTmp(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

// ── listDir ───────────────────────────────────────────────────────────────────

describe('listDir', () => {
  let tmp;
  beforeEach(() => { tmp = mkTmp(); });
  afterEach(() => rmTmp(tmp));

  test('returns [] for a non-existent path', () => {
    expect(listDir(path.join(tmp, 'no-such-dir'))).toEqual([]);
  });

  test('returns [] for an empty directory', () => {
    expect(listDir(tmp)).toEqual([]);
  });

  test('each entry has name, path, and isDir fields', () => {
    fs.writeFileSync(path.join(tmp, 'file.txt'), '');
    const [entry] = listDir(tmp);
    expect(entry).toMatchObject({ name: 'file.txt', isDir: false });
    expect(entry.path).toBe(path.join(tmp, 'file.txt'));
  });

  test('directories sort before files', () => {
    fs.writeFileSync(path.join(tmp, 'aaa.txt'), '');
    fs.mkdirSync(path.join(tmp, 'zzz-dir'));
    const entries = listDir(tmp);
    expect(entries[0].isDir).toBe(true);
    expect(entries[1].isDir).toBe(false);
  });

  test('entries within the same type are sorted case-insensitively', () => {
    fs.writeFileSync(path.join(tmp, 'Zebra.txt'), '');
    fs.writeFileSync(path.join(tmp, 'apple.txt'), '');
    fs.writeFileSync(path.join(tmp, 'Mango.txt'), '');
    const names = listDir(tmp).map(e => e.name);
    expect(names).toEqual(['apple.txt', 'Mango.txt', 'Zebra.txt']);
  });

  test('directories sort among themselves alphabetically', () => {
    fs.mkdirSync(path.join(tmp, 'beta'));
    fs.mkdirSync(path.join(tmp, 'alpha'));
    const dirs = listDir(tmp).filter(e => e.isDir).map(e => e.name);
    expect(dirs).toEqual(['alpha', 'beta']);
  });

  test('returns [] when path is unreadable (permission error)', () => {
    // Make a dir unreadable
    const locked = path.join(tmp, 'locked');
    fs.mkdirSync(locked);
    fs.chmodSync(locked, 0o000);
    expect(listDir(locked)).toEqual([]);
    fs.chmodSync(locked, 0o755); // restore so cleanup works
  });
});

// ── readFile ──────────────────────────────────────────────────────────────────

describe('readFile', () => {
  let tmp;
  beforeEach(() => { tmp = mkTmp(); });
  afterEach(() => rmTmp(tmp));

  test('reads file content correctly', () => {
    const p = path.join(tmp, 'hello.txt');
    fs.writeFileSync(p, 'hello world');
    expect(readFile(p)).toBe('hello world');
  });

  test('reads UTF-8 content (emoji, unicode)', () => {
    const p = path.join(tmp, 'unicode.txt');
    fs.writeFileSync(p, '日本語 🎉', 'utf8');
    expect(readFile(p)).toBe('日本語 🎉');
  });

  test('reads an empty file as empty string', () => {
    const p = path.join(tmp, 'empty.txt');
    fs.writeFileSync(p, '');
    expect(readFile(p)).toBe('');
  });

  test('throws for non-existent file', () => {
    expect(() => readFile(path.join(tmp, 'missing.txt'))).toThrow();
  });
});

// ── writeFile ─────────────────────────────────────────────────────────────────

describe('writeFile', () => {
  let tmp;
  beforeEach(() => { tmp = mkTmp(); });
  afterEach(() => rmTmp(tmp));

  test('creates a new file with the given content', () => {
    const p = path.join(tmp, 'new.txt');
    writeFile(p, 'created');
    expect(fs.readFileSync(p, 'utf8')).toBe('created');
  });

  test('overwrites an existing file', () => {
    const p = path.join(tmp, 'existing.txt');
    fs.writeFileSync(p, 'old');
    writeFile(p, 'new');
    expect(fs.readFileSync(p, 'utf8')).toBe('new');
  });

  test('write then read round-trips correctly', () => {
    const p = path.join(tmp, 'rt.md');
    const content = '# Heading\n\nSome **bold** text.\n';
    writeFile(p, content);
    expect(readFile(p)).toBe(content);
  });
});

// ── normalizeWorkbenchUrl ─────────────────────────────────────────────────────

describe('normalizeWorkbenchUrl', () => {
  test('accepts http and https URLs and normalises them', () => {
    expect(normalizeWorkbenchUrl('https://workbench.example.com')).toBe('https://workbench.example.com/');
    expect(normalizeWorkbenchUrl('  http://localhost:8080/board  ')).toBe('http://localhost:8080/board');
  });

  test('rejects other schemes', () => {
    for (const url of ['file:///etc/passwd', 'javascript:alert(1)', 'ftp://example.com', 'data:text/html,hi']) {
      expect(normalizeWorkbenchUrl(url)).toBeNull();
    }
  });

  test('rejects empty, malformed and non-string values', () => {
    for (const url of ['', '   ', 'not a url', null, undefined, 42, {}]) {
      expect(normalizeWorkbenchUrl(url)).toBeNull();
    }
  });
});

// ── normalizeSplitRatio ───────────────────────────────────────────────────────

describe('normalizeSplitRatio', () => {
  test('keeps a ratio inside the allowed range', () => {
    expect(normalizeSplitRatio(0.5)).toBe(0.5);
    expect(normalizeSplitRatio(0.3)).toBe(0.3);
  });

  test('clamps ratios outside the range', () => {
    expect(normalizeSplitRatio(0)).toBe(0.15);
    expect(normalizeSplitRatio(-2)).toBe(0.15);
    expect(normalizeSplitRatio(0.99)).toBe(0.85);
  });

  test('falls back to the default for missing or invalid values', () => {
    for (const v of [undefined, null, '0.5', NaN, Infinity, {}]) {
      expect(normalizeSplitRatio(v)).toBe(0.4);
    }
  });
});

// ── signInRequestHeaders ──────────────────────────────────────────────────────

describe('signInRequestHeaders', () => {
  test('swaps the user agent for Firefox and drops client hints', () => {
    const out = signInRequestHeaders({
      'User-Agent': 'Mozilla/5.0 Chrome/140.0.0.0 Safari/537.36',
      'sec-ch-ua': '"Chromium";v="140"',
      'Sec-CH-UA-Mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      Accept: 'text/html',
      Cookie: 'a=1',
    });
    expect(out).toEqual({ Accept: 'text/html', Cookie: 'a=1', 'User-Agent': SIGN_IN_FIREFOX_UA });
  });

  test('handles missing headers', () => {
    expect(signInRequestHeaders()).toEqual({ 'User-Agent': SIGN_IN_FIREFOX_UA });
  });

  test('covers only Google sign-in', () => {
    expect(FIREFOX_SIGN_IN_URLS).toEqual(['https://accounts.google.com/*']);
  });

  test('the preview preload uses the same Firefox user agent', () => {
    const preload = fs.readFileSync(path.join(__dirname, '..', 'main', 'preview-preload.js'), 'utf8');
    expect(preload).toContain(`'${SIGN_IN_FIREFOX_UA}'`);
    expect(preload).toContain("'accounts.google.com'");
  });
});

// ── chromeUserAgent ───────────────────────────────────────────────────────────

describe('chromeUserAgent', () => {
  const ELECTRON_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'teamaicoder/1.0.0 Chrome/136.0.7103.48 Electron/44.0.0 Safari/537.36';

  test('removes the Electron and app tokens and keeps the Chrome ones', () => {
    expect(chromeUserAgent(ELECTRON_UA)).toBe(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/136.0.7103.48 Safari/537.36');
  });

  test('leaves a plain Chrome user agent unchanged', () => {
    const chrome = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';
    expect(chromeUserAgent(chrome)).toBe(chrome);
  });

  test('matches the app token case-insensitively', () => {
    expect(chromeUserAgent('A TeamAICoder/2.1 B')).toBe('A B');
  });
});

// ── windowOpenTarget ──────────────────────────────────────────────────────────

describe('windowOpenTarget', () => {
  test('script popups with window features open as child windows', () => {
    expect(windowOpenTarget({ disposition: 'new-window', features: 'width=500,height=600' })).toBe('popup');
    expect(windowOpenTarget({ disposition: 'foreground-tab', features: 'width=500' })).toBe('popup');
  });

  test('links that ask for a new tab open as a preview tab', () => {
    expect(windowOpenTarget({ disposition: 'foreground-tab', features: '' })).toBe('tab');
    expect(windowOpenTarget({ disposition: 'background-tab' })).toBe('tab');
  });

  test('anything else opens as a child window', () => {
    expect(windowOpenTarget({ disposition: 'other' })).toBe('popup');
    expect(windowOpenTarget()).toBe('popup');
  });
});

// ── loadPrefs ─────────────────────────────────────────────────────────────────

// Project fields every loaded prefs object has
const NO_PROJECTS = { projects: [], activeProject: null, portfolioDir: null, workspaceRoot: null };

describe('loadPrefs', () => {
  let tmp;
  beforeEach(() => { tmp = mkTmp(); });
  afterEach(() => rmTmp(tmp));

  test('returns defaults when file does not exist', () => {
    const p = path.join(tmp, 'prefs.json');
    expect(loadPrefs(p)).toEqual({ starredFolders: [], lastOpenFolder: null, sectionFolders: {}, workbenchUrl: null, splitRatio: 0.4, ...NO_PROJECTS });
  });

  test('parses starredFolders and lastOpenFolder correctly', () => {
    const p = path.join(tmp, 'prefs.json');
    fs.writeFileSync(p, JSON.stringify({ starredFolders: ['/a', '/b'], lastOpenFolder: '/a' }));
    expect(loadPrefs(p)).toEqual({ starredFolders: ['/a', '/b'], lastOpenFolder: '/a', sectionFolders: { ideas: {} }, workbenchUrl: null, splitRatio: 0.4, ...NO_PROJECTS });
  });

  test('returns defaults for corrupt JSON', () => {
    const p = path.join(tmp, 'prefs.json');
    fs.writeFileSync(p, 'not valid json {{{{');
    expect(loadPrefs(p)).toEqual({ starredFolders: [], lastOpenFolder: null, sectionFolders: {}, workbenchUrl: null, splitRatio: 0.4, ...NO_PROJECTS });
  });

  test('returns defaults for an empty file', () => {
    const p = path.join(tmp, 'prefs.json');
    fs.writeFileSync(p, '');
    expect(loadPrefs(p)).toEqual({ starredFolders: [], lastOpenFolder: null, sectionFolders: {}, workbenchUrl: null, splitRatio: 0.4, ...NO_PROJECTS });
  });

  test('keeps a valid workbenchUrl and drops an invalid one', () => {
    const p = path.join(tmp, 'prefs.json');
    fs.writeFileSync(p, JSON.stringify({ workbenchUrl: 'https://wb.example.com' }));
    expect(loadPrefs(p).workbenchUrl).toBe('https://wb.example.com/');
    fs.writeFileSync(p, JSON.stringify({ workbenchUrl: 'file:///etc/passwd' }));
    expect(loadPrefs(p).workbenchUrl).toBeNull();
  });

  test('keeps a saved split ratio and clamps an out-of-range one', () => {
    const p = path.join(tmp, 'prefs.json');
    fs.writeFileSync(p, JSON.stringify({ splitRatio: 0.55 }));
    expect(loadPrefs(p).splitRatio).toBe(0.55);
    fs.writeFileSync(p, JSON.stringify({ splitRatio: 3 }));
    expect(loadPrefs(p).splitRatio).toBe(0.85);
  });

  test('coerces missing starredFolders to []', () => {
    const p = path.join(tmp, 'prefs.json');
    fs.writeFileSync(p, JSON.stringify({ lastOpenFolder: '/home' }));
    expect(loadPrefs(p).starredFolders).toEqual([]);
  });

  test('coerces missing lastOpenFolder to null', () => {
    const p = path.join(tmp, 'prefs.json');
    fs.writeFileSync(p, JSON.stringify({ starredFolders: [] }));
    expect(loadPrefs(p).lastOpenFolder).toBeNull();
  });
});

// ── savePrefs ─────────────────────────────────────────────────────────────────

describe('savePrefs', () => {
  let tmp;
  beforeEach(() => { tmp = mkTmp(); });
  afterEach(() => rmTmp(tmp));

  test('writes valid JSON to the given path', () => {
    const p = path.join(tmp, 'prefs.json');
    const data = { starredFolders: ['/x'], lastOpenFolder: '/x' };
    savePrefs(p, data);
    expect(JSON.parse(fs.readFileSync(p, 'utf8'))).toEqual(data);
  });

  test('creates intermediate directories if needed', () => {
    const p = path.join(tmp, 'nested', 'deep', 'prefs.json');
    savePrefs(p, { starredFolders: [], lastOpenFolder: null });
    expect(fs.existsSync(p)).toBe(true);
  });

  test('save then load round-trips correctly', () => {
    const p = path.join(tmp, 'prefs.json');
    const data = { starredFolders: ['/a', '/b'], lastOpenFolder: '/b' };
    savePrefs(p, data);
    expect(loadPrefs(p)).toEqual({ ...data, sectionFolders: { ideas: {} }, workbenchUrl: null, splitRatio: 0.4, ...NO_PROJECTS });
  });

  test('overwrites previous prefs on second save', () => {
    const p = path.join(tmp, 'prefs.json');
    savePrefs(p, { starredFolders: ['/old'], lastOpenFolder: '/old' });
    savePrefs(p, { starredFolders: [], lastOpenFolder: '/new' });
    expect(loadPrefs(p)).toEqual({ starredFolders: [], lastOpenFolder: '/new', sectionFolders: { ideas: {} }, workbenchUrl: null, splitRatio: 0.4, ...NO_PROJECTS });
  });
});

// ── gitBranch ─────────────────────────────────────────────────────────────────

describe('gitBranch', () => {
  test('returns null for a non-existent directory', async () => {
    expect(await gitBranch('/no/such/path/ever')).toBeNull();
  });

  test('returns null for a directory with no git repo', async () => {
    const tmp = mkTmp();
    try {
      expect(await gitBranch(tmp)).toBeNull();
    } finally {
      rmTmp(tmp);
    }
  });

  test('returns the branch name for a git repo', async () => {
    const tmp = mkTmp();
    try {
      // Init a real git repo with a commit so HEAD resolves
      const { execSync } = require('child_process');
      execSync('git init', { cwd: tmp, stdio: 'pipe' });
      execSync('git commit --allow-empty -m "init"', {
        cwd: tmp,
        stdio: 'pipe',
        env: { ...process.env, GIT_AUTHOR_NAME: 'test', GIT_AUTHOR_EMAIL: 'test@test.com',
               GIT_COMMITTER_NAME: 'test', GIT_COMMITTER_EMAIL: 'test@test.com' },
      });
      const branch = await gitBranch(tmp);
      expect(typeof branch).toBe('string');
      expect(branch.length).toBeGreaterThan(0);
    } finally {
      rmTmp(tmp);
    }
  });
});

// ── PTY handlers ──────────────────────────────────────────────────────────────

describe('PTY handlers', () => {
  let nodePty;
  try { nodePty = require('node-pty'); } catch { }

  // Skip PTY tests when node-pty native module is not compiled for this environment (e.g. CI)
  const maybeTest = nodePty ? test : test.skip;

  test('ptySpawn throws when nodePty is null', () => {
    expect(() => ptySpawn(null, new Map(), 1, { cwd: os.homedir() }, () => {}, () => {}))
      .toThrow('node-pty is not installed');
  });

  maybeTest('ptySpawn returns a string id and adds to ptys map', () => {
    const ptys = new Map();
    const id = ptySpawn(nodePty, ptys, 1, { cwd: os.homedir() }, () => {}, () => {});
    expect(typeof id).toBe('string');
    expect(ptys.has(id)).toBe(true);
    ptyKill(ptys, id);
  });

  maybeTest('ptySpawn uses the provided sequence number as id', () => {
    const ptys = new Map();
    const id = ptySpawn(nodePty, ptys, 42, { cwd: os.homedir() }, () => {}, () => {});
    expect(id).toBe('42');
    ptyKill(ptys, id);
  });

  maybeTest('multiple spawns produce unique ids', () => {
    const ptys = new Map();
    const id1 = ptySpawn(nodePty, ptys, 1, { cwd: os.homedir() }, () => {}, () => {});
    const id2 = ptySpawn(nodePty, ptys, 2, { cwd: os.homedir() }, () => {}, () => {});
    expect(id1).not.toBe(id2);
    expect(ptys.size).toBe(2);
    ptyKill(ptys, id1);
    ptyKill(ptys, id2);
  });

  maybeTest('ptyKill removes the pty from the map', () => {
    const ptys = new Map();
    const id = ptySpawn(nodePty, ptys, 1, { cwd: os.homedir() }, () => {}, () => {});
    expect(ptys.has(id)).toBe(true);
    ptyKill(ptys, id);
    expect(ptys.has(id)).toBe(false);
  });

  maybeTest('ptyKill on an unknown id does not throw', () => {
    const ptys = new Map();
    expect(() => ptyKill(ptys, 'no-such-id')).not.toThrow();
  });

  maybeTest('ptyWrite on an unknown id does not throw', () => {
    const ptys = new Map();
    expect(() => ptyWrite(ptys, 'ghost', 'data')).not.toThrow();
  });

  maybeTest('ptyResize on an unknown id does not throw', () => {
    const ptys = new Map();
    expect(() => ptyResize(ptys, 'ghost', 120, 40)).not.toThrow();
  });

  maybeTest('ptyWrite sends data that the shell echoes back', done => {
    const ptys = new Map();
    const received = [];

    const id = ptySpawn(
      nodePty, ptys, 1, { cwd: os.homedir() },
      (_id, data) => {
        received.push(data);
        if (received.join('').includes('taic-ping')) {
          ptyKill(ptys, id);
          done();
        }
      },
      () => {},
    );

    // Give the shell a moment to emit its prompt before writing
    setTimeout(() => ptyWrite(ptys, id, 'echo taic-ping\n'), 200);
  }, 8000);

  maybeTest('ptyResize changes terminal dimensions', () => {
    const ptys = new Map();
    const id = ptySpawn(nodePty, ptys, 1, { cwd: os.homedir() }, () => {}, () => {});
    // Should not throw with various sizes
    expect(() => ptyResize(ptys, id, 220, 50)).not.toThrow();
    expect(() => ptyResize(ptys, id, 80, 24)).not.toThrow();
    ptyKill(ptys, id);
  });

  maybeTest('onExit callback fires and id is removed from map after kill', done => {
    const ptys = new Map();
    const id = ptySpawn(
      nodePty, ptys, 1, { cwd: os.homedir() },
      () => {},
      exitId => {
        expect(exitId).toBe(id);
        expect(ptys.has(id)).toBe(false);
        done();
      },
    );
    setTimeout(() => ptyKill(ptys, id), 200);
  }, 5000);
});

// ── Projects ──────────────────────────────────────────────────────────────────

// A checkout whose origin remote points at owner/name
function makeCheckout(dir, remote) {
  fs.mkdirSync(path.join(dir, '.git'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.git', 'config'),
    `[core]\n\tbare = false\n[remote "origin"]\n\turl = ${remote}\n\tfetch = +refs/heads/*:refs/remotes/origin/*\n`);
}

function writeProject(dir, name, frontmatter) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), `---\n${frontmatter}\n---\n\n# Notes\n`);
}

describe('parseFrontmatter', () => {
  test('reads scalars and lists, stripping comments only from repo lines', () => {
    const fm = parseFrontmatter([
      '---',
      'slug: alpha',
      'title: "Alpha App"',
      'phase: build',
      'repos:',
      '  - github.com/example-org/alpha-app  # PUBLIC — the app',
      '  - github.com/example-org/alpha-infra# PRIVATE',
      'readiness:',
      '  vision: done',
      'blockers:',
      '  - Waiting on issue #12',
      '---',
      'body',
    ].join('\n'));
    expect(fm.slug).toBe('alpha');
    expect(fm.title).toBe('Alpha App');
    expect(fm.repos).toEqual(['github.com/example-org/alpha-app', 'github.com/example-org/alpha-infra']);
    expect(fm.blockers).toEqual(['Waiting on issue #12']);
  });

  test('returns {} without frontmatter', () => {
    expect(parseFrontmatter('# Just a heading')).toEqual({});
  });
});

describe('normalizeRepo', () => {
  test.each([
    ['github.com/example-org/alpha', 'example-org/alpha'],
    ['example-org/alpha', 'example-org/alpha'],
    ['https://github.com/example-org/alpha.git', 'example-org/alpha'],
    ['git@github.com:example-org/alpha.git', 'example-org/alpha'],
    ['ssh://git@github.com/example-org/alpha', 'example-org/alpha'],
    ['github.com/example-org/alpha/', 'example-org/alpha'],
  ])('%s → %s', (input, expected) => {
    expect(normalizeRepo(input)).toBe(expected);
  });

  test.each([
    'The pinout is a provisional guess from photos',
    'github.com/example-org/a, b, c',
    'github.com/example-org',
    '',
    null,
  ])('rejects %p', input => {
    expect(normalizeRepo(input)).toBeNull();
  });
});

describe('readPortfolio', () => {
  let dir;
  beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-')); });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  test('reads project files from portfolio/ and skips the README and prose repo lines', () => {
    const folder = path.join(dir, 'portfolio');
    writeProject(folder, 'alpha.md', 'slug: alpha\ntitle: Alpha\none_liner: The first one\nphase: build\nhealth: green\nrepos:\n  - github.com/example-org/alpha-app\n  - Mechanicals came from photos, not a scan');
    writeProject(folder, 'beta.md', 'title: Beta\nhealth: amber\nrepos:\n  - example-org/beta');
    fs.writeFileSync(path.join(folder, 'README.md'), '# Portfolio\n');
    const projects = readPortfolio(dir);
    expect(projects).toEqual([
      { slug: 'alpha', title: 'Alpha', oneLiner: 'The first one', phase: 'build', health: 'green', oss: '', repos: ['example-org/alpha-app'] },
      { slug: 'beta', title: 'Beta', oneLiner: '', phase: '', health: 'amber', oss: '', repos: ['example-org/beta'] },
    ]);
  });

  test('accepts the portfolio folder itself', () => {
    writeProject(dir, 'gamma.md', 'slug: gamma\ntitle: Gamma\nrepos:\n  - example-org/gamma');
    expect(readPortfolio(dir).map(p => p.slug)).toEqual(['gamma']);
  });

  test('missing folder → []', () => {
    expect(readPortfolio(path.join(dir, 'nope'))).toEqual([]);
  });
});

describe('originUrl', () => {
  let dir;
  beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'origin-')); });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  test('reads origin from .git/config', () => {
    makeCheckout(dir, 'git@github.com:example-org/alpha.git');
    expect(originUrl(dir)).toBe('git@github.com:example-org/alpha.git');
  });

  test('follows a .git file to a worktree common dir', () => {
    const main = path.join(dir, 'main');
    makeCheckout(main, 'https://github.com/example-org/alpha.git');
    const wtGit = path.join(main, '.git', 'worktrees', 'wt');
    fs.mkdirSync(wtGit, { recursive: true });
    fs.writeFileSync(path.join(wtGit, 'commondir'), '../..\n');
    const wt = path.join(dir, 'wt');
    fs.mkdirSync(wt);
    fs.writeFileSync(path.join(wt, '.git'), `gitdir: ${wtGit}\n`);
    expect(originUrl(wt)).toBe('https://github.com/example-org/alpha.git');
  });

  test('no repo or no origin → null', () => {
    expect(originUrl(dir)).toBeNull();
    fs.mkdirSync(path.join(dir, '.git'));
    fs.writeFileSync(path.join(dir, '.git', 'config'), '[core]\n\tbare = false\n');
    expect(originUrl(dir)).toBeNull();
  });
});

describe('scanWorkspace', () => {
  let ws;
  beforeEach(() => { ws = fs.mkdtempSync(path.join(os.tmpdir(), 'ws-')); });
  afterEach(() => fs.rmSync(ws, { recursive: true, force: true }));

  test('maps owner/name to checkouts, nested ones included, skipping hidden and dependency folders', () => {
    makeCheckout(path.join(ws, 'alpha', 'app'), 'git@github.com:example-org/alpha-app.git');
    makeCheckout(path.join(ws, 'alpha', 'app', 'web'), 'https://github.com/example-org/alpha-web.git');
    makeCheckout(path.join(ws, 'beta'), 'https://github.com/example-org/beta');
    makeCheckout(path.join(ws, 'beta', '.claude', 'worktrees', 'x'), 'https://github.com/example-org/hidden');
    makeCheckout(path.join(ws, 'beta', 'node_modules', 'dep'), 'https://github.com/example-org/dep');
    makeCheckout(path.join(ws, 'a', 'b', 'c', 'd', 'e'), 'https://github.com/example-org/too-deep');
    expect(scanWorkspace(ws)).toEqual({
      'example-org/alpha-app': path.join(ws, 'alpha', 'app'),
      'example-org/alpha-web': path.join(ws, 'alpha', 'app', 'web'),
      'example-org/beta': path.join(ws, 'beta'),
    });
  });

  test('keeps the shallowest checkout of a repo', () => {
    makeCheckout(path.join(ws, 'x', 'copy'), 'https://github.com/example-org/alpha');
    makeCheckout(path.join(ws, 'alpha'), 'https://github.com/example-org/alpha');
    expect(scanWorkspace(ws)['example-org/alpha']).toBe(path.join(ws, 'alpha'));
  });
});

describe('projectRoot', () => {
  let ws;
  beforeEach(() => { ws = fs.mkdtempSync(path.join(os.tmpdir(), 'root-')); });
  afterEach(() => fs.rmSync(ws, { recursive: true, force: true }));

  test('<workspace>/<slug> when it holds every checkout', () => {
    fs.mkdirSync(path.join(ws, 'alpha', 'app'), { recursive: true });
    expect(projectRoot('alpha', [path.join(ws, 'alpha', 'app')], ws)).toBe(path.join(ws, 'alpha'));
  });

  test('deepest common folder otherwise', () => {
    const a = path.join(ws, 'group', 'one');
    const b = path.join(ws, 'group', 'two');
    expect(projectRoot('beta', [a, b], ws)).toBe(path.join(ws, 'group'));
    expect(projectRoot('beta', [a], ws)).toBe(a);
  });

  test('never the workspace itself', () => {
    expect(projectRoot('gamma', [path.join(ws, 'one'), path.join(ws, 'two')], ws)).toBeNull();
    fs.mkdirSync(path.join(ws, 'gamma'));
    expect(projectRoot('gamma', [path.join(ws, 'one'), path.join(ws, 'two')], ws)).toBe(path.join(ws, 'gamma'));
  });

  test('no checkouts: <workspace>/<slug> if it exists, else null', () => {
    expect(projectRoot('delta', [], ws)).toBeNull();
    fs.mkdirSync(path.join(ws, 'delta'));
    expect(projectRoot('delta', [], ws)).toBe(path.join(ws, 'delta'));
  });
});

describe('resolveProjects / mergeProjects / importProjects', () => {
  let tmp, ws, portfolio;
  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'import-'));
    ws = path.join(tmp, 'ws');
    portfolio = path.join(tmp, 'specs', 'portfolio');
    makeCheckout(path.join(ws, 'alpha', 'app'), 'git@github.com:example-org/alpha-app.git');
    makeCheckout(path.join(ws, 'alpha', 'infra'), 'git@github.com:example-org/alpha-infra.git');
    writeProject(portfolio, 'alpha.md', 'slug: alpha\ntitle: Alpha\nrepos:\n  - github.com/example-org/alpha-app\n  - github.com/example-org/alpha-infra\n  - github.com/example-org/alpha-docs');
    writeProject(portfolio, 'beta.md', 'slug: beta\ntitle: Beta\nrepos:\n  - github.com/example-org/beta');
  });
  afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }));

  test('matches repos to checkouts and flags missing ones', () => {
    const [alpha, beta] = importProjects({ portfolioDir: path.join(tmp, 'specs'), workspaceRoot: ws, existing: [] });
    expect(alpha.root).toBe(path.join(ws, 'alpha'));
    expect(alpha.repos).toEqual([
      { repo: 'example-org/alpha-app', path: path.join(ws, 'alpha', 'app') },
      { repo: 'example-org/alpha-infra', path: path.join(ws, 'alpha', 'infra') },
      { repo: 'example-org/alpha-docs', path: null },
    ]);
    expect(beta.root).toBeNull();
    expect(beta.repos).toEqual([{ repo: 'example-org/beta', path: null }]);
  });

  test('re-import keeps a pinned folder and drops projects no longer in the portfolio', () => {
    const existing = [
      { slug: 'alpha', title: 'Old', repos: [], root: '/pinned/alpha', rootPinned: true },
      { slug: 'gone', title: 'Gone', repos: [], root: '/x' },
    ];
    const merged = importProjects({ portfolioDir: portfolio, workspaceRoot: ws, existing });
    expect(merged.map(p => p.slug)).toEqual(['alpha', 'beta']);
    expect(merged[0]).toMatchObject({ title: 'Alpha', root: '/pinned/alpha', rootPinned: true });
  });

  test('mergeProjects without existing projects returns the import', () => {
    const imported = resolveProjects([{ slug: 'z', title: 'Z', repos: [] }], {}, ws);
    expect(mergeProjects(undefined, imported)).toEqual(imported);
  });
});

describe('loadPrefs projects', () => {
  test('keeps project fields and drops malformed projects', () => {
    const p = path.join(os.tmpdir(), `prefs-projects-${Date.now()}.json`);
    fs.writeFileSync(p, JSON.stringify({
      projects: [{ slug: 'alpha', title: 'Alpha', repos: [] }, null, { title: 'no slug' }],
      activeProject: 'alpha', portfolioDir: '/specs', workspaceRoot: '/ws',
    }));
    const prefs = loadPrefs(p);
    fs.unlinkSync(p);
    expect(prefs.projects).toEqual([{ slug: 'alpha', title: 'Alpha', repos: [] }]);
    expect(prefs.activeProject).toBe('alpha');
    expect(prefs.portfolioDir).toBe('/specs');
    expect(prefs.workspaceRoot).toBe('/ws');
  });
});
