'use strict';

// Saved session: the tabs open in Build and in each section, restored on the
// next launch. Shared by the renderer (a plain <script>, exposed as
// window.TacSession), the main process and the unit tests (require()).
//
// Shape, as stored in prefs.session:
//   { version: 1, activeSection: 'build',
//     sections: { build: { tabs: [...], active: 0 }, ideas: { ... }, ... } }
// Tab entries:
//   { type: 'file', path }
//   { type: 'terminal', cwd, claude }           claude: `claude` was running
//   { type: 'browser', url }
//   { type: 'split', cwd, url, claude }
// While the app runs, terminal and split entries also carry ptyId so the main
// process can refresh cwd/claude from the live terminal when the app quits.
// ptyId is dropped when a saved session is loaded.
(function (root) {
  const VERSION = 1;
  const SECTION_IDS = ['build', 'ideas', 'design', 'plan', 'test', 'deploy', 'operate'];
  const TOP_SECTIONS = SECTION_IDS.concat(['workbench']);

  const str = v => (typeof v === 'string' && v.trim() ? v : null);

  // A preview URL worth restoring: http(s) or file
  function restorableUrl(url) {
    if (!str(url)) return '';
    try {
      const { protocol } = new URL(url);
      return protocol === 'http:' || protocol === 'https:' || protocol === 'file:' ? url : '';
    } catch {
      return '';
    }
  }

  // One live tab (renderer tab object) → saved entry, or null if not restorable
  function serializeTab(tab) {
    if (!tab || typeof tab !== 'object') return null;
    const live = tab.ptyId != null ? { ptyId: tab.ptyId } : {};
    switch (tab.type) {
      case 'file':
        return str(tab.path) ? { type: 'file', path: tab.path } : null;
      case 'terminal':
        return str(tab.cwd) ? { type: 'terminal', cwd: tab.cwd, claude: !!tab.claude, ...live } : null;
      case 'browser':
        return { type: 'browser', url: restorableUrl(tab.url) };
      case 'split':
        return str(tab.cwd)
          ? { type: 'split', cwd: tab.cwd, url: restorableUrl(tab.url), claude: !!tab.claude, ...live }
          : null;
      default:
        return null;
    }
  }

  // A tab system's tabs and active tab → { tabs, active } (active is an index or null)
  function serializeTabs(tabs, activeTabId) {
    const out = [];
    let active = null;
    for (const tab of Array.isArray(tabs) ? tabs : []) {
      const entry = serializeTab(tab);
      if (!entry) continue;
      if (tab.id === activeTabId) active = out.length;
      out.push(entry);
    }
    return { tabs: out, active };
  }

  // A saved entry, checked; ptyId is runtime-only and dropped
  function normalizeEntry(e) {
    if (!e || typeof e !== 'object') return null;
    switch (e.type) {
      case 'file':
        return str(e.path) ? { type: 'file', path: e.path } : null;
      case 'terminal':
        return str(e.cwd) ? { type: 'terminal', cwd: e.cwd, claude: e.claude === true } : null;
      case 'browser':
        return { type: 'browser', url: restorableUrl(e.url) };
      case 'split':
        return str(e.cwd) ? { type: 'split', cwd: e.cwd, url: restorableUrl(e.url), claude: e.claude === true } : null;
      default:
        return null;
    }
  }

  function normalizeSection(sec, id) {
    const raw = sec && Array.isArray(sec.tabs) ? sec.tabs : [];
    // Terminal tabs only exist in Build; sections have a fixed bottom terminal
    const tabs = raw.map(normalizeEntry).filter(e => e && (id === 'build' || e.type !== 'terminal'));
    const a = sec && Number.isInteger(sec.active) ? sec.active : null;
    return { tabs, active: a !== null && a >= 0 && a < tabs.length ? a : (tabs.length ? 0 : null) };
  }

  // A saved session from prefs → a clean session (an empty one if it's malformed)
  function normalizeSession(raw) {
    const s = raw && typeof raw === 'object' ? raw : {};
    const sections = {};
    for (const id of SECTION_IDS) sections[id] = normalizeSection(s.sections && s.sections[id], id);
    const activeSection = TOP_SECTIONS.includes(s.activeSection) ? s.activeSection : 'build';
    return { version: VERSION, activeSection, sections };
  }

  // Which restored terminals should run `claude --continue`: entries that had
  // claude running, but only when that cwd had exactly one such terminal
  // (--continue resumes the latest conversation in a folder; two terminals
  // would resume the same one). Returns a Set of "section:index" keys.
  function claudeContinueKeys(session) {
    const byCwd = new Map();
    for (const [id, sec] of Object.entries((session && session.sections) || {})) {
      (sec.tabs || []).forEach((e, i) => {
        if ((e.type === 'terminal' || e.type === 'split') && e.claude) {
          const list = byCwd.get(e.cwd) || [];
          list.push(`${id}:${i}`);
          byCwd.set(e.cwd, list);
        }
      });
    }
    const keys = new Set();
    for (const list of byCwd.values()) if (list.length === 1) keys.add(list[0]);
    return keys;
  }

  // Refresh terminal entries from live terminal details: infoById maps ptyId →
  // { cwd, claude }. Entries without live details are left as they are.
  function applyPtyInfo(session, infoById) {
    for (const sec of Object.values((session && session.sections) || {})) {
      for (const e of sec.tabs || []) {
        if (e.ptyId == null) continue;
        const info = infoById[e.ptyId];
        if (!info) continue;
        if (str(info.cwd)) e.cwd = info.cwd;
        if (typeof info.claude === 'boolean') e.claude = info.claude;
      }
    }
    return session;
  }

  // Is a process command line (ps args) Claude Code? Native installs run the
  // `claude` binary; npm installs run `node …/claude`.
  function isClaudeCommand(args) {
    if (!str(args)) return false;
    const tokens = args.trim().split(/\s+/).slice(0, 2);
    return tokens.some(t => {
      const base = t.split('/').pop();
      return base === 'claude' || t.includes('@anthropic-ai/claude-code');
    });
  }

  // `lsof -a -p PID -d cwd -Fn` output → the cwd, or null
  function parseLsofCwd(out) {
    for (const line of String(out || '').split('\n')) {
      if (line.startsWith('n') && line.length > 1) return line.slice(1);
    }
    return null;
  }

  const api = {
    VERSION, SECTION_IDS,
    restorableUrl, serializeTab, serializeTabs,
    normalizeSession, claudeContinueKeys, applyPtyInfo,
    isClaudeCommand, parseLsofCwd,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TacSession = api;
})(typeof window !== 'undefined' ? window : globalThis);
