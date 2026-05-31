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
};

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  currentDir: null,
  rootDir: null,
  entries: [],
  tabs: [],        // { id, type, title, path?, fileType?, content?, editMode?, dirty?, ptyId? }
  activeTabId: null,
  prefs: { starredFolders: [], lastOpenFolder: null },
  gitBranches: {}, // path → branch name
  gitScanGen: 0,
};

// ptyId → { term: Terminal, fitAddon: FitAddon }
const terminals = new Map();

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

    // Hover actions: terminal + star toggle
    const actions = document.createElement('div');
    actions.className = 'file-row-actions';

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
        // Re-fit xterm when tab becomes visible
        const ti = terminals.get(tab.ptyId);
        if (ti) requestAnimationFrame(() => ti.fitAddon.fit());
      }
    }
  });

  // Update file list selection highlight
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
  }

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
  const hasTabss = state.tabs.length > 0;
  document.getElementById('tab-bar').hidden = !hasTabss;
  document.getElementById('tab-bar-divider').hidden = !hasTabss;
  document.getElementById('empty-state').style.display = hasTabss ? 'none' : 'flex';
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
function renderTabBar() {
  const bar = document.getElementById('tab-bar');
  bar.innerHTML = '';

  for (const tab of state.tabs) {
    const isActive = tab.id === state.activeTabId;
    const isTerminal = tab.type === 'terminal';

    const chip = document.createElement('div');
    chip.className = `tab-chip${isActive ? ' active' : ''} ${isTerminal ? 'terminal-tab' : 'file-tab'}`;
    chip.title = tab.path || tab.title;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'tab-icon';
    if (isTerminal) {
      iconSpan.innerHTML = IC.terminal;
      iconSpan.style.color = 'var(--color-terminal)';
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
function buildMarkdownPane(pane, toolbar, body, tab) {
  body.className = 'markdown-body';
  body.style.flex = '1';
  body.style.overflowY = 'auto';

  if (tab.editMode) {
    // Edit mode: textarea
    body.style.padding = '0';
    body.style.maxWidth = '100%';
    body.innerHTML = '';

    const ta = document.createElement('textarea');
    ta.className = 'text-editor';
    ta.value = tab.content || '';
    ta.oninput = () => {
      if (!tab.dirty) { tab.dirty = true; renderDirtyIndicator(toolbar, tab, ta); }
    };
    body.appendChild(ta);
    ta.focus();

    renderDirtyIndicator(toolbar, tab, ta);
  } else {
    body.innerHTML = window.api.renderMarkdown(tab.content || '');
  }

  // Toggle edit button
  const editBtn = document.createElement('button');
  editBtn.className = 'toolbar-btn';
  editBtn.innerHTML = tab.editMode ? `${IC.eye} View` : `${IC.edit} Edit`;
  editBtn.onclick = async () => {
    if (tab.editMode && tab.dirty) {
      const ta = pane.querySelector('textarea');
      if (ta) { tab.content = ta.value; tab.dirty = false; }
      await window.api.writeFile(tab.path, tab.content);
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

// Plain text
function buildTextPane(pane, toolbar, body, tab) {
  if (tab.editMode) {
    body.innerHTML = '';
    body.style.flex = '1';
    body.style.display = 'flex';
    body.style.flexDirection = 'column';

    const ta = document.createElement('textarea');
    ta.className = 'text-editor';
    ta.value = tab.content || '';
    ta.oninput = () => {
      if (!tab.dirty) { tab.dirty = true; renderDirtyIndicator(toolbar, tab, ta); }
    };
    body.appendChild(ta);
    ta.focus();

    renderDirtyIndicator(toolbar, tab, ta);
  } else {
    body.className = 'text-view';
    body.style.flex = '1';
    body.textContent = tab.content || '';
  }

  const editBtn = document.createElement('button');
  editBtn.className = 'toolbar-btn';
  editBtn.innerHTML = tab.editMode ? `${IC.eye} View` : `${IC.edit} Edit`;
  editBtn.onclick = async () => {
    if (tab.editMode && tab.dirty) {
      const ta = pane.querySelector('textarea');
      if (ta) { tab.content = ta.value; tab.dirty = false; }
      await window.api.writeFile(tab.path, tab.content);
    }
    tab.editMode = !tab.editMode;
    buildFilePane(pane, tab);
  };
  toolbar.appendChild(editBtn);
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
  term.open(container);

  requestAnimationFrame(() => {
    fitAddon.fit();
    window.api.ptyResize(tab.ptyId, term.cols, term.rows);
  });

  term.onData(data => window.api.ptyWrite(tab.ptyId, data));
  term.onResize(({ cols, rows }) => window.api.ptyResize(tab.ptyId, cols, rows));

  new ResizeObserver(() => fitAddon.fit()).observe(container);

  terminals.set(tab.ptyId, { term, fitAddon });
}

// ── Open file tab ─────────────────────────────────────────────────────────────
async function openFileTab(entry) {
  console.log(`[app] openFileTab "${entry.path}"`);
  const existing = state.tabs.find(t => t.id === entry.path);
  if (existing) { setActiveTab(existing.id); return; }

  const ext = window.api.extname(entry.path);
  const fileType = ext === '.md' ? 'markdown' : ext === '.json' ? 'json' : 'text';

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

  try {
    tab.content = await window.api.readFile(entry.path);
  } catch (e) {
    tab.content = `Error loading file: ${e.message}`;
  }
  updateTabContent(tab.id);
}

// ── Open terminal tab ─────────────────────────────────────────────────────────
async function openTerminalTab(dir) {
  console.log(`[app] openTerminalTab "${dir}"`);
  let ptyId;
  try {
    ptyId = await window.api.ptySpawn(dir);
    console.log(`[app] ptySpawn → id=${ptyId}`);
  } catch (e) {
    console.error('[app] ptySpawn failed:', e.message);
    alert(`Terminal error: ${e.message}`);
    return;
  }

  const tab = {
    id: `terminal_${dir}_${Date.now()}`,
    type: 'terminal',
    title: window.api.basename(dir),
    ptyId,
  };

  state.tabs.push(tab);
  syncTabContents();
  setActiveTab(tab.id);
  updatePanelVisibility();
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function parentOf(p) {
  // Split on both / and \, remove trailing separator, return everything up to last separator
  const parts = p.replace(/[/\\]+$/, '').split(/[/\\]/);
  parts.pop();
  return parts.join('/') || '/';
}

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

  await navigateTo(startDir);
  updatePanelVisibility();
  console.log('[app] init() complete');
}

// Global safety nets — surface any unhandled promise rejections or JS errors
window.addEventListener('unhandledrejection', e => {
  console.error('[app] unhandledrejection:', e.reason?.stack ?? e.reason);
});
window.addEventListener('error', e => {
  console.error('[app] uncaught error:', e.message, e.filename, e.lineno);
});

document.addEventListener('DOMContentLoaded', () => {
  console.log('[app] DOMContentLoaded — calling init()');
  init().catch(err => {
    document.body.innerHTML = `
      <div style="padding:24px;font-family:monospace;color:#c00;white-space:pre-wrap">
        <strong>Startup error</strong>\n\n${err?.stack ?? err}
      </div>`;
    console.error('[app] init() failed:', err);
  });
});
