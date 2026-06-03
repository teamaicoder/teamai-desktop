'use strict';

// ── SVG icon library ──────────────────────────────────────────────────────────
const IC = {
  folder:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z"/></svg>`,
  fileMd:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  fileJson:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><path d="M10 13a2 2 0 1 0 0-2M14 11a2 2 0 1 0 0 2"/></svg>`,
  fileText:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`,
  terminal:  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4,17 10,11 4,5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`,
  arrowUp:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5,12 12,5 19,12"/></svg>`,
  starOn:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>`,
  starOff:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>`,
  close:     `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  chevron:   `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9,18 15,12 9,6"/></svg>`,
  folderOpen:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  changeRoot:`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>`,
  edit:      `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  eye:       `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  save:      `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></svg>`,
  branch:    `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>`,
  fileImg:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>`,
  fileHtml:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/></svg>`,
  trash:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`,
  newFile:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>`,
  newFolder: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>`,
  browser:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
};

// ── CodeMirror mode map ───────────────────────────────────────────────────────
const CM_MODE_MAP = {
  '.js':   { name: 'javascript' },
  '.mjs':  { name: 'javascript' },
  '.cjs':  { name: 'javascript' },
  '.ts':   { name: 'javascript', typescript: true },
  '.tsx':  { name: 'javascript', typescript: true },
  '.jsx':  { name: 'javascript' },
  '.yaml': 'yaml',
  '.yml':  'yaml',
  '.py':   'python',
  '.sh':   'shell',
  '.bash': 'shell',
  '.zsh':  'shell',
  '.fish': 'shell',
  '.css':  'css',
  '.scss': 'css',
  '.html': 'htmlmixed',
  '.htm':  'htmlmixed',
  '.xml':  'xml',
  '.svg':  'xml',
  '.go':   'go',
  '.rb':   'ruby',
  '.rs':   'rust',
  '.c':    'clike',
  '.cpp':  'clike',
  '.h':    'clike',
  '.java': 'clike',
  '.cs':   'clike',
  '.toml': 'toml',
};

const cmInstances = new Map();

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico']);
const HTML_EXTS  = new Set(['.html', '.htm']);
function fileTypeFor(ext) {
  if (ext === '.md')          return 'markdown';
  if (ext === '.json')        return 'json';
  if (IMAGE_EXTS.has(ext))    return 'image';
  if (HTML_EXTS.has(ext))     return 'html';
  return 'text';
}

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  currentDir: null,
  rootDir: null,
  entries: [],
  tabs: [],        // { id, type, title, path?, fileType?, content?, editMode?, dirty?, ptyId? }
  activeTabId: null,
  prefs: { starredFolders: [], lastOpenFolder: null, sectionFolders: {} },
  gitBranches: {}, // path → branch name
  gitScanGen: 0,
};

// ptyId → { term: Terminal, fitAddon: FitAddon }
const terminals = new Map();

// Tab-bar + button: body-appended dropdown menus (fixed-positioned to escape overflow-y:hidden).
// barMenus maps bar element → its current floating menu so we can clean up on re-render.
const barMenus = new WeakMap();

// One document-level handler closes any open dropdown when clicking outside.
let _activeTabMenu = null;
document.addEventListener('click', e => {
  if (!_activeTabMenu) return;
  if (!_activeTabMenu.contains(e.target) && !_activeTabMenu._btn.contains(e.target)) {
    _activeTabMenu.style.display = 'none';
    if (_activeTabMenu._onClose) _activeTabMenu._onClose();
    _activeTabMenu = null;
  }
}, true);

function clearTabAddMenus(bar) {
  const prev = barMenus.get(bar);
  if (prev) {
    if (_activeTabMenu === prev) _activeTabMenu = null;
    prev.remove();
    barMenus.delete(bar);
  }
}

function buildTabAddButton(bar, { onNewFile, onNewBrowser, onNewTerminal, onOpen, onClose }) {
  const wrap = document.createElement('div');
  wrap.className = 'tab-add-wrap';

  const btn = document.createElement('button');
  btn.className = 'tab-add-btn';
  btn.title = 'New tab';
  btn.textContent = '+';
  wrap.appendChild(btn);

  const menu = document.createElement('div');
  menu.className = 'tab-add-menu';
  menu._btn = btn;
  menu._onClose = onClose ?? null;
  document.body.appendChild(menu);
  barMenus.set(bar, menu);

  function closeMenu() {
    menu.style.display = 'none';
    if (_activeTabMenu === menu) _activeTabMenu = null;
    if (onClose) onClose();
  }

  function addItem(icon, label, handler) {
    const item = document.createElement('button');
    item.className = 'tab-add-item';
    item.innerHTML = `${icon} <span>${label}</span>`;
    item.addEventListener('click', e => {
      e.stopPropagation();
      console.log(`[app] tab + menu: "${label}" clicked`);
      closeMenu();
      handler();
    });
    menu.appendChild(item);
  }

  addItem(IC.newFile,  'New File',    () => onNewFile().catch(err => console.error('[app] New File failed:', err)));
  addItem(IC.browser,  'New Browser', () => Promise.resolve(onNewBrowser()).catch(err => console.error('[app] New Browser failed:', err)));
  if (onNewTerminal) {
    addItem(IC.terminal, 'New Terminal', () => Promise.resolve(onNewTerminal()).catch(err => console.error('[app] New Terminal failed:', err)));
  }

  btn.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = menu.style.display === 'flex';
    // Close any other open menu first
    if (_activeTabMenu && _activeTabMenu !== menu) {
      _activeTabMenu.style.display = 'none';
      if (_activeTabMenu._onClose) _activeTabMenu._onClose();
      _activeTabMenu = null;
    }
    if (isOpen) {
      closeMenu();
    } else {
      const r = btn.getBoundingClientRect();
      menu.style.left = r.left + 'px';
      menu.style.top = r.bottom + 4 + 'px';
      menu.style.display = 'flex';
      _activeTabMenu = menu;
      if (onOpen) onOpen();
    }
  });

  return wrap;
}

// ── Utilities ─────────────────────────────────────────────────────────────────
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

function findTabPane(tabId) {
  for (const el of document.querySelectorAll('.tab-pane')) {
    if (el.dataset.tabId === tabId) return el;
  }
  return null;
}

// ── Preferences ───────────────────────────────────────────────────────────────
async function savePrefs() {
  await window.api.savePrefs(state.prefs);
}

function isStarred(path) { return state.prefs.starredFolders.includes(path); }

async function toggleStar(path) {
  const i = state.prefs.starredFolders.indexOf(path);
  if (i >= 0) state.prefs.starredFolders.splice(i, 1);
  else state.prefs.starredFolders.push(path);
  await savePrefs();
  renderSidebarHeader();
  renderStarredSection();
  renderFileList();
}

// ── Navigation ────────────────────────────────────────────────────────────────
async function navigateTo(dir) {
  console.log(`[app] navigateTo "${dir}"`);
  state.entries = await window.api.listDir(dir);
  console.log(`[app] listDir → ${state.entries.length} entries`);
  state.currentDir = dir;
  state.gitBranches = {};
  state.gitScanGen++;
  state.prefs.lastOpenFolder = dir;
  await savePrefs();

  renderSidebarHeader();
  renderSidebarToolbar();
  renderStarredSection();
  renderFileList();

  if (isStarred(dir)) scanGitBranches(state.entries, state.gitScanGen);
}

async function scanGitBranches(entries, gen) {
  const dirs = entries.filter(e => e.isDir);
  await Promise.all(dirs.map(async entry => {
    const branch = await window.api.gitBranch(entry.path);
    if (gen !== state.gitScanGen || !branch) return;
    state.gitBranches[entry.path] = branch;
    // Update just the badge element — no full re-render
    const badge = document.querySelector(`.git-badge[data-path="${entry.path.replace(/"/g, '\\"')}"]`);
    if (badge) {
      badge.innerHTML = `${IC.branch} <span>${esc(branch)}</span>`;
      badge.style.display = 'flex';
    }
  }));
}

// ── Sidebar: header ───────────────────────────────────────────────────────────
function renderSidebarHeader() {
  const dir = state.currentDir;
  const canGoUp = dir && state.rootDir && dir !== state.rootDir;
  const starred = dir && isStarred(dir);
  const name = dir ? window.api.basename(dir) : 'Files';

  const header = document.getElementById('sidebar-header');
  header.innerHTML = '';

  const iconSpan = document.createElement('span');
  iconSpan.className = 'sidebar-header-icon';
  iconSpan.innerHTML = IC.folderOpen;
  header.appendChild(iconSpan);

  const nameSpan = document.createElement('span');
  nameSpan.className = 'sidebar-header-name';
  nameSpan.title = dir || '';
  nameSpan.textContent = name;
  header.appendChild(nameSpan);

  if (canGoUp) {
    const btn = document.createElement('button');
    btn.className = 'icon-btn';
    btn.title = 'Go up';
    btn.innerHTML = IC.arrowUp;
    btn.onclick = () => navigateTo(parentOf(dir));
    header.appendChild(btn);
  }

  if (dir) {
    const btn = document.createElement('button');
    btn.className = `icon-btn${starred ? ' active' : ''}`;
    btn.title = starred ? 'Remove from starred' : 'Star this folder';
    btn.innerHTML = starred ? IC.starOn : IC.starOff;
    btn.onclick = () => toggleStar(dir);
    header.appendChild(btn);
  }

  const changeBtn = document.createElement('button');
  changeBtn.className = 'icon-btn';
  changeBtn.title = 'Change root folder';
  changeBtn.innerHTML = IC.changeRoot;
  changeBtn.onclick = async () => {
    const picked = await window.api.openFolder(state.rootDir ?? window.api.homedir());
    if (!picked) return;
    state.rootDir = picked;
    await navigateTo(picked);
  };
  header.appendChild(changeBtn);
}

// ── Sidebar: toolbar ──────────────────────────────────────────────────────────
function renderSidebarToolbar() {
  const toolbar = document.getElementById('sidebar-toolbar');
  if (!toolbar) return;
  toolbar.innerHTML = '';
  const dir = state.currentDir;
  if (!dir) return;

  const newFileBtn = document.createElement('button');
  newFileBtn.className = 'sidebar-toolbar-btn';
  newFileBtn.title = 'New file in current folder';
  newFileBtn.innerHTML = `${IC.newFile} <span>New File</span>`;
  newFileBtn.onclick = () => startInlineCreate({ parentDir: dir, createDir: false, section: 'build' });
  toolbar.appendChild(newFileBtn);

  const newFolderBtn = document.createElement('button');
  newFolderBtn.className = 'sidebar-toolbar-btn';
  newFolderBtn.title = 'New folder in current folder';
  newFolderBtn.innerHTML = `${IC.newFolder} <span>New Folder</span>`;
  newFolderBtn.onclick = () => startInlineCreate({ parentDir: dir, createDir: true, section: 'build' });
  toolbar.appendChild(newFolderBtn);
}

// ── Sidebar: starred ──────────────────────────────────────────────────────────
function renderStarredSection() {
  const sec = document.getElementById('starred-section');
  const starred = state.prefs.starredFolders;
  sec.innerHTML = '';

  if (starred.length === 0) return;

  const label = document.createElement('div');
  label.className = 'starred-label';
  label.textContent = 'Starred';
  sec.appendChild(label);

  for (const path of starred) {
    const row = document.createElement('div');
    row.className = `starred-row${state.currentDir === path ? ' active' : ''}`;

    row.innerHTML = `<span style="color:var(--color-star);flex-shrink:0">${IC.starOn}</span>
      <span class="starred-row-name" title="${esc(path)}">${esc(window.api.basename(path))}</span>`;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'icon-btn';
    removeBtn.title = 'Remove from starred';
    removeBtn.innerHTML = IC.close;
    removeBtn.style.cssText = 'width:18px;height:18px;opacity:0.5';
    removeBtn.onclick = e => { e.stopPropagation(); toggleStar(path); };
    row.appendChild(removeBtn);

    row.onclick = () => { state.rootDir = path; navigateTo(path); };
    sec.appendChild(row);
  }

  const div = document.createElement('div');
  div.className = 'starred-divider';
  sec.appendChild(div);
}

// ── Sidebar: file list ────────────────────────────────────────────────────────
function renderFileList() {
  const container = document.getElementById('file-list');
  container.innerHTML = '';

  for (const entry of state.entries) {
    container.appendChild(buildFileRow(entry));
  }
}

function buildFileRow(entry) {
  const { path, name, isDir } = entry;
  const ext = window.api.extname(path);
  const starred = isDir && isStarred(path);
  const selected = !isDir && path === state.activeTabId;

  const row = document.createElement('div');
  row.className = `file-row${selected ? ' selected' : ''}`;
  row.dataset.path = path;
  row.addEventListener('contextmenu', e => {
    e.preventDefault();
    window.api.showContextMenu(path, isDir, 'build');
  });

  // ── Main row (icon + name + actions) ────────────────────────────────────
  const main = document.createElement('div');
  main.className = 'file-row-main';

  // Icon
  const iconEl = document.createElement('span');
  iconEl.className = 'file-row-icon';
  if (isDir) {
    iconEl.innerHTML = IC.folder;
    iconEl.style.color = 'var(--color-folder)';
  } else if (ext === '.md') {
    iconEl.innerHTML = IC.fileMd;
    iconEl.style.color = 'var(--color-md)';
  } else if (ext === '.json') {
    iconEl.innerHTML = IC.fileJson;
    iconEl.style.color = 'var(--color-json)';
  } else if (IMAGE_EXTS.has(ext)) {
    iconEl.innerHTML = IC.fileImg;
    iconEl.style.color = 'var(--color-image)';
  } else if (HTML_EXTS.has(ext)) {
    iconEl.innerHTML = IC.fileHtml;
    iconEl.style.color = 'var(--color-html)';
  } else {
    iconEl.innerHTML = IC.fileText;
    iconEl.style.color = 'var(--color-text-file)';
  }
  main.appendChild(iconEl);

  // Name
  const nameEl = document.createElement('span');
  nameEl.className = 'file-row-name';
  nameEl.title = path;
  nameEl.textContent = name;
  main.appendChild(nameEl);

  if (isDir) {
    // Star badge — always visible when starred, hidden on hover (actions replace it)
    if (starred) {
      const starAlways = document.createElement('button');
      starAlways.className = 'file-row-star-always';
      starAlways.title = 'Remove from starred';
      starAlways.innerHTML = IC.starOn;
      starAlways.onclick = e => { e.stopPropagation(); toggleStar(path); };
      main.appendChild(starAlways);
    }

    // Hover actions: new-file, terminal, star, trash
    const actions = document.createElement('div');
    actions.className = 'file-row-actions';

    const newFileBtn = document.createElement('button');
    newFileBtn.className = 'file-row-action';
    newFileBtn.title = 'New file here';
    newFileBtn.innerHTML = IC.newFile;
    newFileBtn.onclick = e => { e.stopPropagation(); startInlineCreate({ parentDir: path, createDir: false, section: 'build' }); };
    actions.appendChild(newFileBtn);

    const termBtn = document.createElement('button');
    termBtn.className = 'file-row-action terminal';
    termBtn.title = 'Open terminal here';
    termBtn.innerHTML = IC.terminal;
    termBtn.onclick = e => { e.stopPropagation(); openTerminalTab(path); };
    actions.appendChild(termBtn);

    const starBtn = document.createElement('button');
    starBtn.className = `file-row-action star${starred ? ' starred' : ''}`;
    starBtn.title = starred ? 'Remove from starred' : 'Star this folder';
    starBtn.innerHTML = starred ? IC.starOn : IC.starOff;
    starBtn.onclick = e => { e.stopPropagation(); toggleStar(path); };
    actions.appendChild(starBtn);

    const trashBtn = document.createElement('button');
    trashBtn.className = 'file-row-action danger';
    trashBtn.title = 'Delete folder';
    trashBtn.innerHTML = IC.trash;
    trashBtn.onclick = e => { e.stopPropagation(); doDeleteEntry(path, true, 'build'); };
    actions.appendChild(trashBtn);

    main.appendChild(actions);

    // Chevron — visible when not hovered (CSS handles this)
    if (!starred) {
      const chev = document.createElement('span');
      chev.className = 'file-row-chevron';
      chev.innerHTML = IC.chevron;
      main.appendChild(chev);
    }

    row.onclick = () => navigateTo(path);
  } else {
    // Hover actions for files: rename, trash
    const actions = document.createElement('div');
    actions.className = 'file-row-actions';

    const renameBtn = document.createElement('button');
    renameBtn.className = 'file-row-action';
    renameBtn.title = 'Rename';
    renameBtn.innerHTML = IC.edit;
    renameBtn.onclick = e => { e.stopPropagation(); startInlineRename({ path, isDir: false, section: 'build' }); };
    actions.appendChild(renameBtn);

    const trashBtn = document.createElement('button');
    trashBtn.className = 'file-row-action danger';
    trashBtn.title = 'Delete file';
    trashBtn.innerHTML = IC.trash;
    trashBtn.onclick = e => { e.stopPropagation(); doDeleteEntry(path, false, 'build'); };
    actions.appendChild(trashBtn);

    main.appendChild(actions);

    row.onclick = () => openFileTab(entry);
  }

  row.appendChild(main);

  // ── Git badge ────────────────────────────────────────────────────────────
  if (isDir) {
    const badge = document.createElement('div');
    badge.className = 'git-badge';
    badge.dataset.path = path;
    const branch = state.gitBranches[path];
    if (branch) {
      badge.innerHTML = `${IC.branch} <span>${esc(branch)}</span>`;
    } else {
      badge.style.display = 'none';
    }
    row.appendChild(badge);
  }

  return row;
}

// ── Tab management ────────────────────────────────────────────────────────────
function setActiveTab(id) {
  state.activeTabId = id;
  renderTabBar();

  document.querySelectorAll('.tab-pane').forEach(pane => {
    const isActive = pane.dataset.tabId === id;
    pane.classList.toggle('active', isActive);
    if (isActive) {
      const tab = state.tabs.find(t => t.id === id);
      if (tab?.type === 'terminal') {
        const ti = terminals.get(tab.ptyId);
        if (ti) requestAnimationFrame(() => ti.fitAddon.fit());
      }
    }
  });

  // Show the active browser view; hide all others
  for (const tab of state.tabs) {
    if (tab.type !== 'browser') continue;
    if (tab.id === id) requestAnimationFrame(() => positionBrowserView(tab));
    else if (tab.viewId) window.api.browserHide(tab.viewId);
  }

  renderFileList();
}

function closeTab(id) {
  const idx = state.tabs.findIndex(t => t.id === id);
  if (idx < 0) return;

  const tab = state.tabs[idx];
  if (tab.type === 'terminal') {
    window.api.ptyKill(tab.ptyId);
    const ti = terminals.get(tab.ptyId);
    if (ti) { try { ti.term.dispose(); } catch { } }
    terminals.delete(tab.ptyId);
  } else if (tab.type === 'browser' && tab.viewId) {
    window.api.browserDestroy(tab.viewId);
  }

  const editor = toastEditorInstances.get(id);
  if (editor) { try { editor.destroy(); } catch { } toastEditorInstances.delete(id); }

  cmInstances.delete(id);

  const pane = findTabPane(id);
  if (pane) pane.remove();

  state.tabs.splice(idx, 1);

  if (state.activeTabId === id) {
    const next = state.tabs[idx < state.tabs.length ? idx : state.tabs.length - 1];
    state.activeTabId = next?.id ?? null;
  }

  renderTabBar();
  if (state.activeTabId) setActiveTab(state.activeTabId);
  updatePanelVisibility();
}

function updatePanelVisibility() {
  const hasTabs = state.tabs.length > 0;
  document.getElementById('tab-bar').hidden = false;
  document.getElementById('tab-bar-divider').hidden = false;
  document.getElementById('empty-state').style.display = hasTabs ? 'none' : 'flex';
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
function renderTabBar() {
  const bar = document.getElementById('tab-bar');
  clearTabAddMenus(bar);
  bar.innerHTML = '';

  for (const tab of state.tabs) {
    const isActive = tab.id === state.activeTabId;
    const isTerminal = tab.type === 'terminal';
    const isBrowser = tab.type === 'browser';

    const chip = document.createElement('div');
    chip.className = `tab-chip${isActive ? ' active' : ''} ${isTerminal ? 'terminal-tab' : isBrowser ? 'browser-tab' : 'file-tab'}`;
    chip.title = tab.path || tab.url || tab.title;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'tab-icon';
    if (isTerminal) {
      iconSpan.innerHTML = IC.terminal;
      iconSpan.style.color = 'var(--color-terminal)';
    } else if (isBrowser) {
      iconSpan.innerHTML = IC.browser;
      iconSpan.style.color = 'var(--color-primary)';
    } else {
      const ext = window.api.extname(tab.path || '');
      if (ext === '.md') { iconSpan.innerHTML = IC.fileMd; iconSpan.style.color = 'var(--color-md)'; }
      else if (ext === '.json') { iconSpan.innerHTML = IC.fileJson; iconSpan.style.color = 'var(--color-json)'; }
      else { iconSpan.innerHTML = IC.fileText; iconSpan.style.color = 'var(--color-text-file)'; }
    }
    chip.appendChild(iconSpan);

    const titleSpan = document.createElement('span');
    titleSpan.className = 'tab-title';
    titleSpan.textContent = tab.title;
    chip.appendChild(titleSpan);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'tab-close';
    closeBtn.innerHTML = IC.close;
    closeBtn.title = 'Close tab';
    closeBtn.onclick = e => { e.stopPropagation(); closeTab(tab.id); };
    chip.appendChild(closeBtn);

    chip.onclick = () => setActiveTab(tab.id);
    bar.appendChild(chip);
  }

  bar.appendChild(buildTabAddButton(bar, {
    onNewFile: async () => {
      const defaultPath = state.currentDir || window.api.homedir();
      console.log(`[app] New File: opening file picker, defaultPath="${defaultPath}"`);
      const picked = await window.api.openFile(defaultPath);
      console.log(`[app] New File: picked="${picked ?? 'cancelled'}"`);
      if (!picked) return;
      openFileTab({ path: picked, name: window.api.basename(picked) });
    },
    onNewBrowser: () => {
      console.log('[app] New Browser: creating browser tab');
      openBrowserTab('');
    },
    onNewTerminal: () => {
      const cwd = state.currentDir || window.api.homedir();
      console.log(`[app] New Terminal: spawning terminal cwd="${cwd}"`);
      openTerminalTab(cwd);
    },
    onOpen: () => {
      // Hide native browser overlay so the dropdown renders on top
      for (const t of state.tabs) { if (t.type === 'browser' && t.viewId) window.api.browserHide(t.viewId); }
    },
    onClose: () => {
      // Restore the active browser view
      const active = state.tabs.find(t => t.id === state.activeTabId);
      if (active?.type === 'browser') requestAnimationFrame(() => positionBrowserView(active));
    },
  }));
}

// ── Tab content (IndexedStack-style: all panes in DOM) ─────────────────────
function syncTabContents() {
  const container = document.getElementById('tab-content');

  // Track existing panes
  const existing = new Map();
  for (const pane of container.querySelectorAll('.tab-pane')) {
    existing.set(pane.dataset.tabId, pane);
  }

  const currentIds = new Set(state.tabs.map(t => t.id));

  // Remove stale panes (shouldn't happen — closeTab removes them, but be safe)
  for (const [id, pane] of existing) {
    if (!currentIds.has(id)) pane.remove();
  }

  // Create new panes
  for (const tab of state.tabs) {
    if (!existing.has(tab.id)) {
      const pane = document.createElement('div');
      pane.className = 'tab-pane';
      pane.dataset.tabId = tab.id;
      container.appendChild(pane);
      buildTabContent(pane, tab);
    }
  }
}

function buildTabContent(pane, tab) {
  if (tab.type === 'terminal') {
    buildTerminalPane(pane, tab);
  } else if (tab.type === 'browser') {
    buildBrowserPane(pane, tab);
  } else {
    buildFilePane(pane, tab);
  }
}

// ── File pane ─────────────────────────────────────────────────────────────────
function buildFilePane(pane, tab) {
  if (tab.content === null) {
    pane.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
    return;
  }

  pane.innerHTML = '';

  const toolbar = document.createElement('div');
  toolbar.className = 'viewer-toolbar';
  pane.appendChild(toolbar);

  const body = document.createElement('div');
  pane.appendChild(body);

  if (tab.fileType === 'markdown') {
    buildMarkdownPane(pane, toolbar, body, tab);
  } else if (tab.fileType === 'json') {
    buildJsonPane(pane, toolbar, body, tab);
  } else if (tab.fileType === 'image') {
    buildImagePane(pane, toolbar, body, tab);
  } else if (tab.fileType === 'html') {
    buildHtmlPane(pane, toolbar, body, tab);
  } else {
    buildTextPane(pane, toolbar, body, tab);
  }
}

function updateTabContent(tabId) {
  const tab = state.tabs.find(t => t.id === tabId);
  if (!tab) return;
  const pane = findTabPane(tabId);
  if (!pane) return;
  buildFilePane(pane, tab);
}

// Markdown
// Tracks active Toast UI Editor instances by tab id so we can destroy them.
const toastEditorInstances = new Map();

function buildMarkdownPane(pane, toolbar, body, tab) {
  body.style.flex = '1';
  body.style.overflow = 'hidden';
  body.style.display = 'flex';
  body.style.flexDirection = 'column';

  if (tab.editMode) {
    body.innerHTML = '';

    const editor = new toastui.Editor({
      el: body,
      initialValue: tab.content || '',
      previewStyle: 'tab',
      initialEditType: 'wysiwyg',
      height: '100%',
      usageStatistics: false,
    });

    toastEditorInstances.set(tab.id, editor);

    editor.on('change', () => {
      if (!tab.dirty) {
        tab.dirty = true;
        const proxy = { get value() { return editor.getMarkdown(); } };
        renderDirtyIndicator(toolbar, tab, proxy);
      }
    });
  } else {
    // Destroy any lingering editor instance for this tab
    const prev = toastEditorInstances.get(tab.id);
    if (prev) { try { prev.destroy(); } catch { } toastEditorInstances.delete(tab.id); }

    body.className = 'markdown-body';
    body.style.overflowY = 'auto';
    body.innerHTML = window.api.renderMarkdown(tab.content || '');

    body.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#')) return;
      e.preventDefault();
      const resolved = window.api.join(window.api.dirname(tab.path), href);
      const name = window.api.basename(resolved);
      openFileTab({ path: resolved, name });
    });
  }

  // Toggle edit button
  const editBtn = document.createElement('button');
  editBtn.className = 'toolbar-btn';
  editBtn.innerHTML = tab.editMode ? `${IC.eye} View` : `${IC.edit} Edit`;
  editBtn.onclick = async () => {
    if (tab.editMode) {
      const editor = toastEditorInstances.get(tab.id);
      tab.content = editor ? editor.getMarkdown() : tab.content;
      if (tab.dirty) {
        tab.dirty = false;
        await window.api.writeFile(tab.path, tab.content);
      }
    }
    tab.editMode = !tab.editMode;
    buildFilePane(pane, tab);
  };
  toolbar.appendChild(editBtn);
}

function renderDirtyIndicator(toolbar, tab, ta) {
  const existing = toolbar.querySelector('.save-btn');
  if (existing) existing.remove();
  if (!tab.dirty) return;

  const saveBtn = document.createElement('button');
  saveBtn.className = 'toolbar-btn primary save-btn';
  saveBtn.innerHTML = `${IC.save} Save`;
  saveBtn.onclick = async () => {
    tab.content = ta.value;
    tab.dirty = false;
    await window.api.writeFile(tab.path, tab.content);
    saveBtn.remove();
  };
  toolbar.insertBefore(saveBtn, toolbar.firstChild);
}

// JSON
function buildJsonPane(pane, toolbar, body, tab) {
  body.className = 'json-view';
  body.style.flex = '1';
  body.style.overflowY = 'auto';

  const content = (tab.content || '').trim();
  if (!content) {
    body.innerHTML = '<span style="color:var(--color-on-surface-muted)">Empty file</span>';
    return;
  }

  let parsed;
  try { parsed = JSON.parse(content); } catch {
    // Invalid JSON — fall back to plain text
    body.style.fontFamily = 'monospace';
    body.style.whiteSpace = 'pre-wrap';
    body.style.wordBreak = 'break-all';
    body.textContent = content;
    return;
  }

  body.innerHTML = `<ul style="padding-left:0">${renderJsonNode(parsed)}</ul>`;
}

function renderJsonNode(value) {
  if (value === null) return `<span class="json-null">null</span>`;
  if (typeof value === 'boolean') return `<span class="json-bool">${value}</span>`;
  if (typeof value === 'number') return `<span class="json-number">${value}</span>`;
  if (typeof value === 'string') return `<span class="json-string">${esc(JSON.stringify(value))}</span>`;

  if (Array.isArray(value)) {
    if (value.length === 0) return `<span class="json-bracket">[]</span>`;
    const items = value.map((v, i) =>
      `<li>${renderJsonNode(v)}${i < value.length - 1 ? '<span class="json-bracket">,</span>' : ''}</li>`
    ).join('');
    return `<details open><summary><span class="json-bracket">[</span><span class="json-preview">${value.length} item${value.length !== 1 ? 's' : ''}</span></summary><ul>${items}</ul><span class="json-bracket">]</span></details>`;
  }

  // Object
  const keys = Object.keys(value);
  if (keys.length === 0) return `<span class="json-bracket">{}</span>`;
  const items = keys.map((k, i) =>
    `<li><span class="json-key">${esc(JSON.stringify(k))}</span><span class="json-bracket">: </span>${renderJsonNode(value[k])}${i < keys.length - 1 ? '<span class="json-bracket">,</span>' : ''}</li>`
  ).join('');
  return `<details open><summary><span class="json-bracket">{</span><span class="json-preview">${keys.length} key${keys.length !== 1 ? 's' : ''}</span></summary><ul>${items}</ul><span class="json-bracket">}</span></details>`;
}

// Code / plain text — backed by CodeMirror for both view and edit modes
function buildTextPane(pane, toolbar, body, tab) {
  // Remove any previous CM instance for this tab (rebuilt on mode toggle)
  cmInstances.delete(tab.id);

  body.className = 'code-pane';
  body.innerHTML = '';

  const ext = window.api.extname(tab.path || '');
  const mode = CM_MODE_MAP[ext] ?? null;

  const cm = CodeMirror(body, {
    value: tab.content || '',
    mode,
    readOnly: !tab.editMode,
    lineNumbers: true,
    lineWrapping: true,
    tabSize: 2,
    indentUnit: 2,
    indentWithTabs: false,
    theme: 'default',
    extraKeys: tab.editMode ? { Tab: 'indentMore', 'Shift-Tab': 'indentLess' } : {},
  });

  cmInstances.set(tab.id, cm);

  if (tab.editMode) {
    const proxy = { get value() { return cm.getValue(); } };
    cm.on('change', () => {
      if (!tab.dirty) { tab.dirty = true; renderDirtyIndicator(toolbar, tab, proxy); }
    });
  }

  const editBtn = document.createElement('button');
  editBtn.className = 'toolbar-btn';
  editBtn.innerHTML = tab.editMode ? `${IC.eye} View` : `${IC.edit} Edit`;
  editBtn.onclick = async () => {
    if (tab.editMode) {
      const inst = cmInstances.get(tab.id);
      tab.content = inst ? inst.getValue() : tab.content;
      if (tab.dirty) { tab.dirty = false; await window.api.writeFile(tab.path, tab.content); }
    }
    tab.editMode = !tab.editMode;
    buildFilePane(pane, tab);
  };
  toolbar.appendChild(editBtn);

  // CM needs a refresh once it's visible in the DOM
  requestAnimationFrame(() => {
    const inst = cmInstances.get(tab.id);
    if (inst) { inst.refresh(); if (tab.editMode) inst.focus(); }
  });
}

// ── HTML preview pane ─────────────────────────────────────────────────────────
function buildHtmlPane(pane, toolbar, body, tab) {
  body.style.flex = '1';
  body.style.display = 'flex';
  body.style.flexDirection = 'column';
  body.style.overflow = 'hidden';

  if (tab.editMode) {
    // Source / edit mode — reuse CodeMirror text pane
    buildTextPane(pane, toolbar, body, tab);

    const previewBtn = document.createElement('button');
    previewBtn.className = 'toolbar-btn';
    previewBtn.innerHTML = `${IC.eye} Preview`;
    previewBtn.onclick = async () => {
      const inst = cmInstances.get(tab.id);
      tab.content = inst ? inst.getValue() : tab.content;
      if (tab.dirty) { tab.dirty = false; await window.api.writeFile(tab.path, tab.content); }
      tab.editMode = false;
      buildFilePane(pane, tab);
    };
    toolbar.insertBefore(previewBtn, toolbar.firstChild);
    return;
  }

  // Preview mode — sandboxed iframe loading the file directly
  const iframe = document.createElement('iframe');
  iframe.className = 'html-preview';
  iframe.src = `file://${tab.path}`;
  iframe.sandbox = 'allow-same-origin allow-forms allow-popups';
  body.appendChild(iframe);

  const sourceBtn = document.createElement('button');
  sourceBtn.className = 'toolbar-btn';
  sourceBtn.innerHTML = `${IC.edit} Source`;
  sourceBtn.onclick = () => { tab.editMode = true; buildFilePane(pane, tab); };
  toolbar.appendChild(sourceBtn);
}

// ── Image pane ────────────────────────────────────────────────────────────────
function buildImagePane(pane, toolbar, body, tab) {
  toolbar.remove(); // no toolbar for image view

  body.className = 'image-pane';

  const img = document.createElement('img');
  img.src = `file://${tab.path}`;
  img.alt = tab.title;
  img.className = 'image-preview';
  img.onerror = () => {
    body.innerHTML = `<p style="color:var(--color-on-surface-muted);text-align:center">
      Could not load image<br><span style="font-size:11px;opacity:0.6">${esc(tab.path)}</span></p>`;
  };
  body.appendChild(img);
}

// ── Terminal pane ─────────────────────────────────────────────────────────────
function buildTerminalPane(pane, tab) {
  pane.classList.add('terminal-pane');
  pane.innerHTML = '<div class="terminal-container"></div>';
  const container = pane.querySelector('.terminal-container');

  if (typeof Terminal === 'undefined') {
    container.innerHTML = '<div class="loading" style="color:#aaa">xterm.js not loaded — run: npm run setup</div>';
    return;
  }

  const term = new Terminal({
    cursorBlink: true,
    cursorStyle: 'block',
    fontFamily: 'Menlo, Monaco, "Cascadia Code", "Courier New", monospace',
    fontSize: 13,
    lineHeight: 1.2,
    scrollback: 10000,
    theme: {
      background: '#1e1e1e', foreground: '#d4d4d4', cursor: '#d4d4d4',
      selectionBackground: 'rgba(255,255,255,0.25)',
      black: '#000000', red: '#cd3131', green: '#0dbc79', yellow: '#e5e510',
      blue: '#2472c8', magenta: '#bc3fbc', cyan: '#11a8cd', white: '#e5e5e5',
      brightBlack: '#666666', brightRed: '#f14c4c', brightGreen: '#23d18b',
      brightYellow: '#f5f543', brightBlue: '#3b8eea', brightMagenta: '#d670d6',
      brightCyan: '#29b8db', brightWhite: '#ffffff',
    },
  });

  const fitAddon = new FitAddon.FitAddon();
  term.loadAddon(fitAddon);

  term.onData(data => window.api.ptyWrite(tab.ptyId, data));
  term.onResize(({ cols, rows }) => window.api.ptyResize(tab.ptyId, cols, rows));

  // Store before open so setActiveTab's RAF can find it
  terminals.set(tab.ptyId, { term, fitAddon });

  // Defer open until the pane is visible — xterm requires the container to have
  // real dimensions when open() is called, so we must wait until setActiveTab
  // has set display:flex on the pane.
  requestAnimationFrame(() => {
    term.open(container);
    fitAddon.fit();
    window.api.ptyResize(tab.ptyId, term.cols, term.rows);
    new ResizeObserver(() => fitAddon.fit()).observe(container);
  });
}

// ── Open file tab ─────────────────────────────────────────────────────────────
async function openFileTab(entry) {
  console.log(`[app] openFileTab "${entry.path}"`);
  const existing = state.tabs.find(t => t.id === entry.path);
  if (existing) { setActiveTab(existing.id); return; }

  const ext = window.api.extname(entry.path);
  const fileType = fileTypeFor(ext);

  const tab = {
    id: entry.path,
    type: 'file',
    fileType,
    title: entry.name,
    path: entry.path,
    content: null,
    editMode: false,
    dirty: false,
  };

  state.tabs.push(tab);
  syncTabContents();
  setActiveTab(tab.id);
  updatePanelVisibility();

  if (fileType === 'image') {
    tab.content = ''; // rendered directly from path — no readFile needed
  } else {
    try {
      tab.content = await window.api.readFile(entry.path);
    } catch (e) {
      tab.content = `Error loading file: ${e.message}`;
    }
  }
  updateTabContent(tab.id);
}

// ── Open terminal tab ─────────────────────────────────────────────────────────
async function openTerminalTab(dir) {
  // Fall back to homedir if the requested directory no longer exists (e.g. cleaned up temp dirs)
  let cwd = dir || window.api.homedir();
  console.log(`[app] openTerminalTab "${cwd}"`);
  let ptyId;
  try {
    ptyId = await window.api.ptySpawn(cwd);
    console.log(`[app] ptySpawn → id=${ptyId}`);
  } catch (e) {
    // First retry with homedir in case cwd no longer exists
    if (cwd !== window.api.homedir()) {
      try {
        cwd = window.api.homedir();
        ptyId = await window.api.ptySpawn(cwd);
        console.log(`[app] ptySpawn fallback homedir → id=${ptyId}`);
      } catch (e2) {
        console.error('[app] ptySpawn failed:', e2.message);
        return;
      }
    } else {
      console.error('[app] ptySpawn failed:', e.message);
      return;
    }
  }

  const tab = {
    id: `terminal_${cwd}_${Date.now()}`,
    type: 'terminal',
    title: window.api.basename(cwd),
    ptyId,
  };

  state.tabs.push(tab);
  syncTabContents();
  setActiveTab(tab.id);
  updatePanelVisibility();
}

// ── Open browser tab ──────────────────────────────────────────────────────────
async function openBrowserTab(initialUrl) {
  console.log('[app] openBrowserTab', initialUrl);
  const viewId = await window.api.browserCreate();
  console.log('[app] browserCreate → viewId=', viewId);
  const id = `browser_${Date.now()}`;
  const tab = {
    id, type: 'browser', viewId,
    title: initialUrl ? (() => { try { return new URL(initialUrl).hostname; } catch { return initialUrl; } })() : 'New Tab',
    url: initialUrl,
  };
  state.tabs.push(tab);
  syncTabContents();
  setActiveTab(tab.id);
  updatePanelVisibility();
  if (initialUrl) window.api.browserNavigate(viewId, initialUrl).catch(() => {});
}

// ── Browser pane ──────────────────────────────────────────────────────────────
// The WebContentsView is a native overlay managed by the main process.
// This pane only renders the toolbar; the placeholder div provides bounds.
function buildBrowserPane(pane, tab, onTitleChange = renderTabBar) {
  pane.classList.add('browser-pane');

  const toolbar = document.createElement('div');
  toolbar.className = 'viewer-toolbar browser-toolbar';
  pane.appendChild(toolbar);

  const urlInput = document.createElement('input');
  urlInput.type = 'text';
  urlInput.className = 'browser-url-input';
  urlInput.value = tab.url || '';
  urlInput.placeholder = 'https://localhost:3000';
  urlInput.spellcheck = false;
  toolbar.appendChild(urlInput);

  // Transparent placeholder — its bounding rect tells the main process where to position the view
  const placeholder = document.createElement('div');
  placeholder.className = 'browser-placeholder';
  pane.appendChild(placeholder);

  const navigate = async raw => {
    let url = raw.trim();
    if (!url) return;
    if (!/^[a-z][a-z0-9+\-.]*:\/\//i.test(url)) url = 'https://' + url;
    try { tab.title = new URL(url).hostname; } catch { tab.title = url; }
    tab.url = url;
    urlInput.value = url;
    onTitleChange();
    if (tab.viewId) window.api.browserNavigate(tab.viewId, url).catch(() => {});
  };

  urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') navigate(urlInput.value); });
  urlInput.addEventListener('focus', () => urlInput.select());

  if (!tab.url) requestAnimationFrame(() => urlInput.focus());
}

// ── Position a browser view over its placeholder ───────────────────────────
function positionBrowserView(tab) {
  if (tab?.type !== 'browser' || !tab.viewId) return;
  const pane = findTabPane(tab.id);
  if (!pane || !pane.classList.contains('active')) return;
  const placeholder = pane.querySelector('.browser-placeholder');
  if (!placeholder) return;
  const r = placeholder.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return;
  window.api.browserShow(tab.viewId, { x: r.x, y: r.y, width: r.width, height: r.height });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function parentOf(p) {
  // Split on both / and \, remove trailing separator, return everything up to last separator
  const parts = p.replace(/[/\\]+$/, '').split(/[/\\]/);
  parts.pop();
  return parts.join('/') || '/';
}

// ── File management helpers ────────────────────────────────────────────────────

async function doDeleteEntry(entryPath, isDir, section) {
  const result = await window.api.deleteEntry(entryPath, isDir);
  if (!result?.deleted) return;
  const sec = SECTIONS[section];
  if (sec) sec.navigateTo(sec.s.currentDir);
  else navigateTo(state.currentDir);
}

function startInlineRename({ path: entryPath, isDir, section }) {
  const sec = SECTIONS[section];
  const container = sec ? sec.el('file-list') : document.getElementById('file-list');
  if (!container) return;
  const basename = window.api.basename(entryPath);
  const dir = window.api.dirname(entryPath);

  let targetRow = null;
  for (const row of container.querySelectorAll('.file-row')) {
    if (row.dataset.path === entryPath) { targetRow = row; break; }
  }
  if (!targetRow) return;

  const nameEl = targetRow.querySelector('.file-row-name');
  if (!nameEl) return;

  const input = document.createElement('input');
  input.type = 'text';
  input.value = basename;
  input.className = 'inline-input';
  nameEl.replaceWith(input);

  if (!isDir) {
    const dot = basename.lastIndexOf('.');
    input.setSelectionRange(0, dot > 0 ? dot : basename.length);
  } else {
    input.select();
  }

  let done = false;

  const commit = async () => {
    if (done) return; done = true;
    const newName = input.value.trim();
    if (!newName || newName === basename) { rollback(); return; }
    const newPath = window.api.join(dir, newName);
    try {
      await window.api.renameEntry(entryPath, newPath);
      if (sec) sec.navigateTo(sec.s.currentDir);
      else navigateTo(state.currentDir);
    } catch (e) {
      done = false;
      alert(`Rename failed: ${e.message}`);
      input.focus();
    }
  };

  const rollback = () => { if (input.isConnected) input.replaceWith(nameEl); };

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { e.preventDefault(); done = true; rollback(); }
  });
  input.addEventListener('blur', () => { if (!done) { done = true; rollback(); } });
  input.focus();
}

async function startInlineCreate({ parentDir, createDir, section }) {
  const sec = SECTIONS[section];
  const navigateFn = sec ? (d => sec.navigateTo(d)) : navigateTo;
  const currentDir  = sec ? sec.s.currentDir : state.currentDir;
  const container   = sec ? sec.el('file-list') : document.getElementById('file-list');
  if (!container) return;

  if (currentDir !== parentDir) await navigateFn(parentDir);

  const row = document.createElement('div');
  row.className = 'file-row new-entry-row';

  const main = document.createElement('div');
  main.className = 'file-row-main';

  const iconEl = document.createElement('span');
  iconEl.className = 'file-row-icon';
  iconEl.innerHTML = createDir ? IC.folder : IC.fileText;
  iconEl.style.color = createDir ? 'var(--color-folder)' : 'var(--color-text-file)';
  main.appendChild(iconEl);

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'inline-input';
  input.placeholder = createDir ? 'folder-name' : 'file-name.md';
  main.appendChild(input);

  row.appendChild(main);
  container.insertBefore(row, container.firstChild);
  input.focus();

  let done = false;

  const commit = async () => {
    if (done) return; done = true;
    const name = input.value.trim();
    if (!name) { row.remove(); return; }
    const newPath = window.api.join(parentDir, name);
    try {
      if (createDir) await window.api.mkdir(newPath);
      else           await window.api.touch(newPath);
      navigateFn(parentDir);
    } catch (e) {
      done = false;
      alert(`Create failed: ${e.message}`);
      input.focus();
    }
  };

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { e.preventDefault(); done = true; row.remove(); }
  });
  input.addEventListener('blur', () => { if (!done) { done = true; row.remove(); } });
}

// ── FileBrowserSection ────────────────────────────────────────────────────────
// Shared file-browser implementation used by every top-level section except Build.

class FileBrowserSection {
  constructor(id, label) {
    this.id = id;
    this.label = label;
    this.prefix = `${id}:`;
    this.s = {
      currentDir: null, rootDir: null, entries: [],
      tabs: [], activeTabId: null,
      gitBranches: {}, gitScanGen: 0,
      initialized: false,
    };
    this.terminalPtyId = null;
    this._pane = null;
  }

  el(cls) {
    return this._pane ? this._pane.querySelector(`.fbs-${cls}`) : null;
  }

  // ── Prefs ─────────────────────────────────────────────────────────────────
  _getPrefs() {
    if (!state.prefs.sectionFolders) state.prefs.sectionFolders = {};
    if (!state.prefs.sectionFolders[this.id]) state.prefs.sectionFolders[this.id] = {};
    return state.prefs.sectionFolders[this.id];
  }

  getStarredFolder() { return this._getPrefs().folder ?? null; }

  async toggleStar(path) {
    const p = this._getPrefs();
    p.folder = p.folder === path ? null : path;
    await savePrefs();
    this.renderSidebarHeader();
    this.renderStarredSection();
    this.renderFileList();
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  async navigateTo(dir) {
    this.s.entries = await window.api.listDir(dir);
    this.s.currentDir = dir;
    this.s.gitBranches = {};
    this.s.gitScanGen++;
    this._getPrefs().lastFolder = dir;
    await savePrefs();
    this.renderSidebarHeader();
    this.renderSidebarToolbar();
    this.renderStarredSection();
    this.renderFileList();
    if (this.getStarredFolder() === dir) this._scanGitBranches(this.s.entries, this.s.gitScanGen);
  }

  async _scanGitBranches(entries, gen) {
    const dirs = entries.filter(e => e.isDir);
    await Promise.all(dirs.map(async entry => {
      const branch = await window.api.gitBranch(entry.path);
      if (gen !== this.s.gitScanGen || !branch) return;
      this.s.gitBranches[entry.path] = branch;
      const badge = this.el('file-list')?.querySelector(`.git-badge[data-path="${entry.path.replace(/"/g, '\\"')}"]`);
      if (badge) {
        badge.innerHTML = `${IC.branch} <span>${esc(branch)}</span>`;
        badge.style.display = 'flex';
      }
    }));
  }

  // ── Sidebar header ────────────────────────────────────────────────────────
  renderSidebarHeader() {
    const dir = this.s.currentDir;
    const canGoUp = dir && this.s.rootDir && dir !== this.s.rootDir;
    const starred = dir && this.getStarredFolder() === dir;
    const name = dir ? window.api.basename(dir) : this.label;

    const header = this.el('sidebar-header');
    if (!header) return;
    header.innerHTML = '';

    const iconSpan = document.createElement('span');
    iconSpan.className = 'sidebar-header-icon';
    iconSpan.innerHTML = IC.folderOpen;
    header.appendChild(iconSpan);

    const nameSpan = document.createElement('span');
    nameSpan.className = 'sidebar-header-name';
    nameSpan.title = dir || '';
    nameSpan.textContent = name;
    header.appendChild(nameSpan);

    if (canGoUp) {
      const btn = document.createElement('button');
      btn.className = 'icon-btn';
      btn.title = 'Go up';
      btn.innerHTML = IC.arrowUp;
      btn.onclick = () => this.navigateTo(parentOf(dir));
      header.appendChild(btn);
    }

    if (dir) {
      const btn = document.createElement('button');
      btn.className = `icon-btn${starred ? ' active' : ''}`;
      btn.title = starred ? `Remove ${this.label} folder` : `Set as ${this.label} folder`;
      btn.innerHTML = starred ? IC.starOn : IC.starOff;
      btn.onclick = () => this.toggleStar(dir);
      header.appendChild(btn);
    }

    const changeBtn = document.createElement('button');
    changeBtn.className = 'icon-btn';
    changeBtn.title = 'Change folder';
    changeBtn.innerHTML = IC.changeRoot;
    changeBtn.onclick = async () => {
      const picked = await window.api.openFolder(this.s.rootDir ?? window.api.homedir());
      if (!picked) return;
      this.s.rootDir = picked;
      await this.navigateTo(picked);
    };
    header.appendChild(changeBtn);
  }

  // ── Sidebar toolbar ───────────────────────────────────────────────────────
  renderSidebarToolbar() {
    const toolbar = this.el('sidebar-toolbar');
    if (!toolbar) return;
    toolbar.innerHTML = '';
    const dir = this.s.currentDir;
    if (!dir) return;

    const newFileBtn = document.createElement('button');
    newFileBtn.className = 'sidebar-toolbar-btn';
    newFileBtn.title = 'New file in current folder';
    newFileBtn.innerHTML = `${IC.newFile} <span>New File</span>`;
    newFileBtn.onclick = () => startInlineCreate({ parentDir: dir, createDir: false, section: this.id });
    toolbar.appendChild(newFileBtn);

    const newFolderBtn = document.createElement('button');
    newFolderBtn.className = 'sidebar-toolbar-btn';
    newFolderBtn.title = 'New folder in current folder';
    newFolderBtn.innerHTML = `${IC.newFolder} <span>New Folder</span>`;
    newFolderBtn.onclick = () => startInlineCreate({ parentDir: dir, createDir: true, section: this.id });
    toolbar.appendChild(newFolderBtn);
  }

  // ── Starred section ───────────────────────────────────────────────────────
  renderStarredSection() {
    const sec = this.el('starred-section');
    if (!sec) return;
    sec.innerHTML = '';
    const folder = this.getStarredFolder();
    if (!folder) return;

    const label = document.createElement('div');
    label.className = 'starred-label';
    label.textContent = `${this.label} Folder`;
    sec.appendChild(label);

    const row = document.createElement('div');
    row.className = `starred-row${this.s.currentDir === folder ? ' active' : ''}`;
    row.innerHTML = `<span style="color:var(--color-star);flex-shrink:0">${IC.starOn}</span>
      <span class="starred-row-name" title="${esc(folder)}">${esc(window.api.basename(folder))}</span>`;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'icon-btn';
    removeBtn.title = `Remove ${this.label} folder`;
    removeBtn.innerHTML = IC.close;
    removeBtn.style.cssText = 'width:18px;height:18px;opacity:0.5';
    removeBtn.onclick = e => { e.stopPropagation(); this.toggleStar(folder); };
    row.appendChild(removeBtn);

    row.onclick = () => { this.s.rootDir = folder; this.navigateTo(folder); };
    sec.appendChild(row);

    const div = document.createElement('div');
    div.className = 'starred-divider';
    sec.appendChild(div);
  }

  // ── File list ─────────────────────────────────────────────────────────────
  renderFileList() {
    const container = this.el('file-list');
    if (!container) return;
    container.innerHTML = '';
    for (const entry of this.s.entries) {
      container.appendChild(this.buildFileRow(entry));
    }
  }

  buildFileRow(entry) {
    const { path, name, isDir } = entry;
    const ext = window.api.extname(path);
    const isStarredFolder = isDir && this.getStarredFolder() === path;
    const selected = !isDir && `${this.prefix}${path}` === this.s.activeTabId;

    const row = document.createElement('div');
    row.className = `file-row${selected ? ' selected' : ''}`;
    row.dataset.path = path;
    row.addEventListener('contextmenu', e => {
      e.preventDefault();
      window.api.showContextMenu(path, isDir, this.id);
    });

    const main = document.createElement('div');
    main.className = 'file-row-main';

    const iconEl = document.createElement('span');
    iconEl.className = 'file-row-icon';
    if (isDir) {
      iconEl.innerHTML = IC.folder;
      iconEl.style.color = 'var(--color-folder)';
    } else if (ext === '.md') {
      iconEl.innerHTML = IC.fileMd;
      iconEl.style.color = 'var(--color-md)';
    } else if (ext === '.json') {
      iconEl.innerHTML = IC.fileJson;
      iconEl.style.color = 'var(--color-json)';
    } else if (IMAGE_EXTS.has(ext)) {
      iconEl.innerHTML = IC.fileImg;
      iconEl.style.color = 'var(--color-image)';
    } else if (HTML_EXTS.has(ext)) {
      iconEl.innerHTML = IC.fileHtml;
      iconEl.style.color = 'var(--color-html)';
    } else {
      iconEl.innerHTML = IC.fileText;
      iconEl.style.color = 'var(--color-text-file)';
    }
    main.appendChild(iconEl);

    const nameEl = document.createElement('span');
    nameEl.className = 'file-row-name';
    nameEl.title = path;
    nameEl.textContent = name;
    main.appendChild(nameEl);

    if (isDir) {
      if (isStarredFolder) {
        const starAlways = document.createElement('button');
        starAlways.className = 'file-row-star-always';
        starAlways.title = `Remove ${this.label} folder`;
        starAlways.innerHTML = IC.starOn;
        starAlways.onclick = e => { e.stopPropagation(); this.toggleStar(path); };
        main.appendChild(starAlways);
      }

      const actions = document.createElement('div');
      actions.className = 'file-row-actions';

      const newFileBtn = document.createElement('button');
      newFileBtn.className = 'file-row-action';
      newFileBtn.title = 'New file here';
      newFileBtn.innerHTML = IC.newFile;
      newFileBtn.onclick = e => { e.stopPropagation(); startInlineCreate({ parentDir: path, createDir: false, section: this.id }); };
      actions.appendChild(newFileBtn);

      const starBtn = document.createElement('button');
      starBtn.className = `file-row-action star${isStarredFolder ? ' starred' : ''}`;
      starBtn.title = isStarredFolder ? `Remove ${this.label} folder` : `Set as ${this.label} folder`;
      starBtn.innerHTML = isStarredFolder ? IC.starOn : IC.starOff;
      starBtn.onclick = e => { e.stopPropagation(); this.toggleStar(path); };
      actions.appendChild(starBtn);

      const trashBtn = document.createElement('button');
      trashBtn.className = 'file-row-action danger';
      trashBtn.title = 'Delete folder';
      trashBtn.innerHTML = IC.trash;
      trashBtn.onclick = e => { e.stopPropagation(); doDeleteEntry(path, true, this.id); };
      actions.appendChild(trashBtn);

      main.appendChild(actions);

      if (!isStarredFolder) {
        const chev = document.createElement('span');
        chev.className = 'file-row-chevron';
        chev.innerHTML = IC.chevron;
        main.appendChild(chev);
      }

      row.onclick = () => this.navigateTo(path);
    } else {
      const actions = document.createElement('div');
      actions.className = 'file-row-actions';

      const renameBtn = document.createElement('button');
      renameBtn.className = 'file-row-action';
      renameBtn.title = 'Rename';
      renameBtn.innerHTML = IC.edit;
      renameBtn.onclick = e => { e.stopPropagation(); startInlineRename({ path, isDir: false, section: this.id }); };
      actions.appendChild(renameBtn);

      const trashBtn = document.createElement('button');
      trashBtn.className = 'file-row-action danger';
      trashBtn.title = 'Delete file';
      trashBtn.innerHTML = IC.trash;
      trashBtn.onclick = e => { e.stopPropagation(); doDeleteEntry(path, false, this.id); };
      actions.appendChild(trashBtn);

      main.appendChild(actions);

      row.onclick = () => this.openFileTab(entry);
    }

    row.appendChild(main);

    if (isDir) {
      const badge = document.createElement('div');
      badge.className = 'git-badge';
      badge.dataset.path = path;
      const branch = this.s.gitBranches[path];
      if (branch) {
        badge.innerHTML = `${IC.branch} <span>${esc(branch)}</span>`;
      } else {
        badge.style.display = 'none';
      }
      row.appendChild(badge);
    }

    return row;
  }

  // ── Tab system ────────────────────────────────────────────────────────────
  setActiveTab(id) {
    this.s.activeTabId = id;
    this.renderTabBar();
    this.el('tab-content')?.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.dataset.tabId === id);
    });
    for (const tab of this.s.tabs) {
      if (tab.type !== 'browser') continue;
      if (tab.id === id) requestAnimationFrame(() => this._positionBrowserView(tab));
      else if (tab.viewId) window.api.browserHide(tab.viewId);
    }
    this.renderFileList();
  }

  _positionBrowserView(tab) {
    if (tab?.type !== 'browser' || !tab.viewId) return;
    const content = this.el('tab-content');
    if (!content) return;
    const pane = content.querySelector(`.tab-pane[data-tab-id="${tab.id}"]`) ||
      [...content.querySelectorAll('.tab-pane')].find(p => p.dataset.tabId === tab.id);
    if (!pane || !pane.classList.contains('active')) return;
    const placeholder = pane.querySelector('.browser-placeholder');
    if (!placeholder) return;
    const r = placeholder.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    window.api.browserShow(tab.viewId, { x: r.x, y: r.y, width: r.width, height: r.height });
  }

  closeTab(id) {
    const idx = this.s.tabs.findIndex(t => t.id === id);
    if (idx < 0) return;
    const tab = this.s.tabs[idx];
    if (tab.path) window.api.unwatchFile(tab.path);
    if (tab.type === 'browser' && tab.viewId) window.api.browserDestroy(tab.viewId);
    const editor = toastEditorInstances.get(id);
    if (editor) { try { editor.destroy(); } catch { } toastEditorInstances.delete(id); }
    cmInstances.delete(id);
    const content = this.el('tab-content');
    if (content) {
      for (const p of content.querySelectorAll('.tab-pane')) {
        if (p.dataset.tabId === id) { p.remove(); break; }
      }
    }
    this.s.tabs.splice(idx, 1);
    if (this.s.activeTabId === id) {
      const next = this.s.tabs[idx < this.s.tabs.length ? idx : this.s.tabs.length - 1];
      this.s.activeTabId = next?.id ?? null;
    }
    this.renderTabBar();
    if (this.s.activeTabId) this.setActiveTab(this.s.activeTabId);
    this.updatePanelVisibility();
  }

  updatePanelVisibility() {
    const hasTabs = this.s.tabs.length > 0;
    const bar = this.el('tab-bar');
    const divider = this.el('tab-bar-divider');
    const empty = this.el('empty-state');
    if (bar) bar.hidden = false;
    if (divider) divider.hidden = false;
    if (empty) empty.style.display = hasTabs ? 'none' : 'flex';
  }

  renderTabBar() {
    const bar = this.el('tab-bar');
    if (!bar) return;
    clearTabAddMenus(bar);
    bar.innerHTML = '';

    for (const tab of this.s.tabs) {
      const isActive = tab.id === this.s.activeTabId;
      const isBrowser = tab.type === 'browser';
      const chip = document.createElement('div');
      chip.className = `tab-chip${isActive ? ' active' : ''} ${isBrowser ? 'browser-tab' : 'file-tab'}`;
      chip.title = tab.path || tab.url || tab.title;

      const iconSpan = document.createElement('span');
      iconSpan.className = 'tab-icon';
      if (isBrowser) {
        iconSpan.innerHTML = IC.browser;
        iconSpan.style.color = 'var(--color-primary)';
      } else {
        const ext = window.api.extname(tab.path || '');
        if (ext === '.md')         { iconSpan.innerHTML = IC.fileMd;   iconSpan.style.color = 'var(--color-md)'; }
        else if (ext === '.json')  { iconSpan.innerHTML = IC.fileJson; iconSpan.style.color = 'var(--color-json)'; }
        else if (IMAGE_EXTS.has(ext)) { iconSpan.innerHTML = IC.fileImg; iconSpan.style.color = 'var(--color-image)'; }
        else if (HTML_EXTS.has(ext))  { iconSpan.innerHTML = IC.fileHtml; iconSpan.style.color = 'var(--color-html)'; }
        else { iconSpan.innerHTML = IC.fileText; iconSpan.style.color = 'var(--color-text-file)'; }
      }
      chip.appendChild(iconSpan);

      const titleSpan = document.createElement('span');
      titleSpan.className = 'tab-title';
      titleSpan.textContent = tab.title;
      chip.appendChild(titleSpan);

      const closeBtn = document.createElement('button');
      closeBtn.className = 'tab-close';
      closeBtn.innerHTML = IC.close;
      closeBtn.title = 'Close tab';
      closeBtn.onclick = e => { e.stopPropagation(); this.closeTab(tab.id); };
      chip.appendChild(closeBtn);

      chip.onclick = () => this.setActiveTab(tab.id);
      bar.appendChild(chip);
    }

    bar.appendChild(buildTabAddButton(bar, {
      onNewFile: async () => {
        const picked = await window.api.openFile(this.s.currentDir || window.api.homedir());
        if (!picked) return;
        this.openFileTab({ path: picked, name: window.api.basename(picked) });
      },
      onNewBrowser: () => this.openBrowserTab(''),
      // FBS sections have a built-in bottom terminal panel — no tab terminal needed
      onOpen: () => {
        for (const t of this.s.tabs) { if (t.type === 'browser' && t.viewId) window.api.browserHide(t.viewId); }
      },
      onClose: () => {
        const active = this.s.tabs.find(t => t.id === this.s.activeTabId);
        if (active?.type === 'browser') requestAnimationFrame(() => this._positionBrowserView(active));
      },
    }));
  }

  syncTabContents() {
    const container = this.el('tab-content');
    if (!container) return;
    const existing = new Map();
    for (const pane of container.querySelectorAll('.tab-pane')) {
      existing.set(pane.dataset.tabId, pane);
    }
    const currentIds = new Set(this.s.tabs.map(t => t.id));
    for (const [id, pane] of existing) {
      if (!currentIds.has(id)) pane.remove();
    }
    for (const tab of this.s.tabs) {
      if (!existing.has(tab.id)) {
        const pane = document.createElement('div');
        pane.className = 'tab-pane';
        pane.dataset.tabId = tab.id;
        container.appendChild(pane);
        if (tab.type === 'browser') buildBrowserPane(pane, tab, () => this.renderTabBar());
        else buildFilePane(pane, tab);
      }
    }
  }

  async openBrowserTab(initialUrl) {
    const viewId = await window.api.browserCreate();
    const id = `${this.prefix}browser_${Date.now()}`;
    const tab = {
      id, type: 'browser', viewId,
      title: initialUrl ? (() => { try { return new URL(initialUrl).hostname; } catch { return initialUrl; } })() : 'New Tab',
      url: initialUrl,
    };
    this.s.tabs.push(tab);
    this.syncTabContents();
    this.setActiveTab(id);
    this.updatePanelVisibility();
    if (initialUrl) window.api.browserNavigate(viewId, initialUrl).catch(() => {});
  }

  async openFileTab(entry) {
    const tabId = `${this.prefix}${entry.path}`;
    const existing = this.s.tabs.find(t => t.id === tabId);
    if (existing) { this.setActiveTab(tabId); return; }

    const ext = window.api.extname(entry.path);
    const fileType = fileTypeFor(ext);

    const tab = {
      id: tabId, type: 'file', fileType,
      title: entry.name, path: entry.path,
      content: null, editMode: false, dirty: false,
    };

    this.s.tabs.push(tab);
    this.syncTabContents();
    this.setActiveTab(tabId);
    this.updatePanelVisibility();

    if (fileType === 'image') {
      tab.content = '';
    } else {
      try {
        tab.content = await window.api.readFile(entry.path);
      } catch (e) {
        tab.content = `Error loading file: ${e.message}`;
      }
    }

    const content = this.el('tab-content');
    if (content) {
      for (const pane of content.querySelectorAll('.tab-pane')) {
        if (pane.dataset.tabId === tabId) { buildFilePane(pane, tab); break; }
      }
    }

    if (fileType !== 'image') window.api.watchFile(entry.path);
  }

  // ── Terminal ──────────────────────────────────────────────────────────────
  async initTerminal() {
    if (this.terminalPtyId !== null) return;
    const cwd = this.s.currentDir || window.api.homedir();
    try {
      this.terminalPtyId = await window.api.ptySpawn(cwd);
    } catch (e) {
      console.error(`[${this.id}] terminal spawn failed:`, e.message);
      const c = this.el('terminal-container');
      if (c) c.innerHTML = '<div class="loading" style="color:#aaa">Terminal unavailable</div>';
      return;
    }

    const container = this.el('terminal-container');
    if (!container) return;

    const term = new Terminal({
      cursorBlink: true, cursorStyle: 'block',
      fontFamily: 'Menlo, Monaco, "Cascadia Code", "Courier New", monospace',
      fontSize: 13, lineHeight: 1.2, scrollback: 10000,
      theme: {
        background: '#1e1e1e', foreground: '#d4d4d4', cursor: '#d4d4d4',
        selectionBackground: 'rgba(255,255,255,0.25)',
        black: '#000000', red: '#cd3131', green: '#0dbc79', yellow: '#e5e510',
        blue: '#2472c8', magenta: '#bc3fbc', cyan: '#11a8cd', white: '#e5e5e5',
        brightBlack: '#666666', brightRed: '#f14c4c', brightGreen: '#23d18b',
        brightYellow: '#f5f543', brightBlue: '#3b8eea', brightMagenta: '#d670d6',
        brightCyan: '#29b8db', brightWhite: '#ffffff',
      },
    });

    const fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);

    term.onData(data => window.api.ptyWrite(this.terminalPtyId, data));
    term.onResize(({ cols, rows }) => window.api.ptyResize(this.terminalPtyId, cols, rows));
    terminals.set(this.terminalPtyId, { term, fitAddon });

    requestAnimationFrame(() => {
      term.open(container);
      fitAddon.fit();
      window.api.ptyResize(this.terminalPtyId, term.cols, term.rows);
      new ResizeObserver(() => fitAddon.fit()).observe(container);
    });
  }

  initSplitHandle() {
    const handle = this.el('split-handle');
    const termArea = this.el('terminal-area');
    if (!handle || !termArea) return;

    let dragging = false, startY = 0, startH = 0;

    handle.addEventListener('mousedown', e => {
      dragging = true; startY = e.clientY; startH = termArea.offsetHeight;
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });

    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      const newH = Math.max(80, Math.min(600, startH + (startY - e.clientY)));
      termArea.style.height = `${newH}px`;
      if (this.terminalPtyId !== null) {
        const ti = terminals.get(this.terminalPtyId);
        if (ti) ti.fitAddon.fit();
      }
    });

    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    });
  }

  // ── DOM generation ────────────────────────────────────────────────────────
  buildDOM() {
    const pane = document.getElementById(`section-${this.id}`);
    if (!pane) return;
    this._pane = pane;
    pane.innerHTML = `
      <div class="fbs-sidebar">
        <div class="fbs-sidebar-header"></div>
        <div class="divider-h"></div>
        <div class="fbs-sidebar-toolbar sidebar-toolbar"></div>
        <div class="fbs-sidebar-body">
          <div class="fbs-starred-section"></div>
          <div class="fbs-file-list"></div>
        </div>
      </div>
      <div class="divider-v"></div>
      <div class="fbs-right-panel">
        <div class="fbs-file-area">
          <div class="fbs-tab-bar"></div>
          <div class="divider-h fbs-tab-bar-divider"></div>
          <div class="fbs-tab-content">
            <div class="fbs-empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5"
                   stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
              <p>Select a file to preview</p>
            </div>
          </div>
        </div>
        <div class="fbs-split-handle"></div>
        <div class="fbs-terminal-area">
          <div class="fbs-terminal-header"><span>Terminal</span></div>
          <div class="fbs-terminal-container"></div>
        </div>
      </div>`;
  }

  // ── Init / visibility ─────────────────────────────────────────────────────
  async init() {
    if (this.s.initialized) return;
    this.s.initialized = true;
    this.buildDOM();
    const p = this._getPrefs();
    const startDir = p.folder || p.lastFolder || window.api.homedir();
    this.s.rootDir = startDir;
    await this.navigateTo(startDir);
    this.renderTabBar();
    this.updatePanelVisibility();
    this.initSplitHandle();
    await this.initTerminal();
  }

  onVisible() {
    if (this.terminalPtyId !== null) {
      const ti = terminals.get(this.terminalPtyId);
      if (ti) requestAnimationFrame(() => ti.fitAddon.fit());
    }
    const active = this.s.tabs.find(t => t.id === this.s.activeTabId);
    if (active?.type === 'browser') requestAnimationFrame(() => this._positionBrowserView(active));
  }
}

// Section instances — created at module load, initialised lazily on first visit
const SECTIONS = Object.fromEntries([
  ['ideas',   'Ideas'],
  ['design',  'Design'],
  ['plan',    'Plan & Track'],
  ['test',    'Test'],
  ['deploy',  'Deploy'],
  ['operate', 'Operate'],
].map(([id, label]) => [id, new FileBrowserSection(id, label)]));

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  console.log('[app] init() start');

  if (!window.api) throw new Error('window.api is undefined — preload did not run correctly');

  console.log('[app] loading prefs');
  state.prefs = await window.api.loadPrefs();
  console.log('[app] prefs loaded:', JSON.stringify(state.prefs));

  const startDir = state.prefs.lastOpenFolder || window.api.homedir();
  state.rootDir = startDir;
  console.log('[app] startDir:', startDir);

  // Register PTY event listeners once
  window.api.onPtyData(({ id, data }) => {
    const ti = terminals.get(id);
    if (ti) ti.term.write(data);
    else console.warn(`[app] pty:data for unknown id=${id}`);
  });

  window.api.onPtyExit(({ id }) => {
    console.log(`[app] pty:exit id=${id}`);
    const ti = terminals.get(id);
    if (ti) ti.term.write('\r\n\x1b[90m[Process exited]\x1b[0m\r\n');
  });

  // Context menu actions (rename, new-file, new-folder, refresh) from native menu
  window.api.onCtxAction(({ type, path: ctxPath, isDir, parentDir, section }) => {
    const sec = SECTIONS[section];
    const navigateFn = sec ? (d => sec.navigateTo(d)) : navigateTo;
    const currentDir  = sec ? sec.s.currentDir : state.currentDir;
    if (type === 'refresh') {
      navigateFn(currentDir);
    } else if (type === 'rename') {
      startInlineRename({ path: ctxPath, isDir, section });
    } else if (type === 'new-file') {
      startInlineCreate({ parentDir, createDir: false, section });
    } else if (type === 'new-folder') {
      startInlineCreate({ parentDir, createDir: true, section });
    }
  });

  // Browser view navigation events from main process
  window.api.onBrowserEvent(({ id: viewId, type, url, title }) => {
    const tab = state.tabs.find(t => t.viewId === viewId);
    if (!tab) return;
    if (type === 'navigate' && url) {
      tab.url = url;
      try { tab.title = new URL(url).hostname; } catch { tab.title = url; }
      const pane = findTabPane(tab.id);
      if (pane) { const inp = pane.querySelector('.browser-url-input'); if (inp) inp.value = url; }
      renderTabBar();
    } else if (type === 'title' && title && !tab.url) {
      tab.title = title;
      renderTabBar();
    }
  });

  // Reposition browser views on window resize
  window.addEventListener('resize', () => {
    const active = state.tabs.find(t => t.id === state.activeTabId);
    if (active?.type === 'browser') positionBrowserView(active);
  });

  // Auto-reload: when a watched file changes, reload any matching tab in view mode
  window.api.onFileChanged(({ filePath }) => {
    for (const sec of Object.values(SECTIONS)) {
      const tabId = `${sec.prefix}${filePath}`;
      const tab = sec.s.tabs.find(t => t.id === tabId);
      if (!tab || tab.editMode) continue;
      window.api.readFile(filePath).then(content => {
        tab.content = content;
        const contentEl = sec.el('tab-content');
        if (contentEl) {
          for (const pane of contentEl.querySelectorAll('.tab-pane')) {
            if (pane.dataset.tabId === tabId) { buildFilePane(pane, tab); break; }
          }
        }
      }).catch(() => {});
    }
  });

  await navigateTo(startDir);
  renderTabBar();
  updatePanelVisibility();
  console.log('[app] init() complete');
}

// Test helpers — only used when NODE_ENV=test (Playwright UI tests)
window._testNavigateTo = async (dir) => {
  state.rootDir = dir;
  await navigateTo(dir);
};

// Global safety nets — surface any unhandled promise rejections or JS errors
window.addEventListener('unhandledrejection', e => {
  console.error('[app] unhandledrejection:', e.reason?.stack ?? e.reason);
});
window.addEventListener('error', e => {
  console.error('[app] uncaught error:', e.message, e.filename, e.lineno);
});

// ── Top-level navigation ──────────────────────────────────────────────────
function initTopNav() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const section = tab.dataset.section;
      tabs.forEach(t => t.classList.toggle('active', t === tab));
      document.querySelectorAll('.section-pane').forEach(pane => {
        pane.classList.toggle('active', pane.id === `section-${section}`);
      });

      if (section === 'build') {
        // Re-fit terminal, reposition browser view
        const active = state.tabs.find(t => t.id === state.activeTabId);
        if (active?.type === 'terminal') {
          const ti = terminals.get(active.ptyId);
          if (ti) requestAnimationFrame(() => ti.fitAddon.fit());
        }
        if (active?.type === 'browser') requestAnimationFrame(() => positionBrowserView(active));
        // Hide browser views belonging to FBS sections
        for (const s of Object.values(SECTIONS)) {
          for (const t of s.s.tabs) { if (t.type === 'browser' && t.viewId) window.api.browserHide(t.viewId); }
        }
      } else {
        // Hide build browser views when leaving Build
        for (const t of state.tabs) { if (t.type === 'browser' && t.viewId) window.api.browserHide(t.viewId); }
      }

      // All other sections: init on first visit, re-fit terminal / show browser on subsequent visits
      const sec = SECTIONS[section];
      if (sec) {
        sec.init();
        sec.onVisible();
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('[app] DOMContentLoaded — calling init()');
  initTopNav();
  init().catch(err => {
    document.body.innerHTML = `
      <div style="padding:24px;font-family:monospace;color:#c00;white-space:pre-wrap">
        <strong>Startup error</strong>\n\n${err?.stack ?? err}
      </div>`;
    console.error('[app] init() failed:', err);
  });
});
