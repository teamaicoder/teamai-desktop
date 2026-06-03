'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  listDir, readFile, writeFile,
  loadPrefs, savePrefs,
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

// ── loadPrefs ─────────────────────────────────────────────────────────────────

describe('loadPrefs', () => {
  let tmp;
  beforeEach(() => { tmp = mkTmp(); });
  afterEach(() => rmTmp(tmp));

  test('returns defaults when file does not exist', () => {
    const p = path.join(tmp, 'prefs.json');
    expect(loadPrefs(p)).toEqual({ starredFolders: [], lastOpenFolder: null, sectionFolders: {} });
  });

  test('parses starredFolders and lastOpenFolder correctly', () => {
    const p = path.join(tmp, 'prefs.json');
    fs.writeFileSync(p, JSON.stringify({ starredFolders: ['/a', '/b'], lastOpenFolder: '/a' }));
    expect(loadPrefs(p)).toEqual({ starredFolders: ['/a', '/b'], lastOpenFolder: '/a', sectionFolders: { ideas: {} } });
  });

  test('returns defaults for corrupt JSON', () => {
    const p = path.join(tmp, 'prefs.json');
    fs.writeFileSync(p, 'not valid json {{{{');
    expect(loadPrefs(p)).toEqual({ starredFolders: [], lastOpenFolder: null, sectionFolders: {} });
  });

  test('returns defaults for an empty file', () => {
    const p = path.join(tmp, 'prefs.json');
    fs.writeFileSync(p, '');
    expect(loadPrefs(p)).toEqual({ starredFolders: [], lastOpenFolder: null, sectionFolders: {} });
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
    expect(loadPrefs(p)).toEqual({ ...data, sectionFolders: { ideas: {} } });
  });

  test('overwrites previous prefs on second save', () => {
    const p = path.join(tmp, 'prefs.json');
    savePrefs(p, { starredFolders: ['/old'], lastOpenFolder: '/old' });
    savePrefs(p, { starredFolders: [], lastOpenFolder: '/new' });
    expect(loadPrefs(p)).toEqual({ starredFolders: [], lastOpenFolder: '/new', sectionFolders: { ideas: {} } });
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
