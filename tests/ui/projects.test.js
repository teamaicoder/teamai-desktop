'use strict';

// UI tests for projects: import from a portfolio folder, the project switcher,
// and choosing a project (Build sidebar repos, sections pointed at its folder).
// Run: npm run test:ui

const fs = require('fs');
const os = require('os');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { launchApp } = require('./helpers/app');

// A portfolio of two made-up projects and a workspace holding some of their repos
function makeFixture() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tac-projects-'));
  const portfolio = path.join(tmp, 'specs', 'portfolio');
  const workspace = path.join(tmp, 'workspace');
  fs.mkdirSync(portfolio, { recursive: true });

  const project = (slug, lines) =>
    fs.writeFileSync(path.join(portfolio, `${slug}.md`), `---\n${lines.join('\n')}\n---\n`);
  project('alpha', [
    'slug: alpha', 'title: Alpha App', 'phase: build', 'health: green',
    'repos:', '  - github.com/example-org/alpha-app  # PUBLIC', '  - github.com/example-org/alpha-docs',
  ]);
  project('beta', [
    'slug: beta', 'title: Beta Tools', 'phase: plan', 'health: amber',
    'repos:', '  - github.com/example-org/beta-cli',
  ]);
  fs.writeFileSync(path.join(portfolio, 'README.md'), '# Portfolio\n');

  const checkout = (dir, repo) => {
    fs.mkdirSync(path.join(dir, '.git'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.git', 'config'), `[remote "origin"]\n\turl = git@github.com:${repo}.git\n`);
    fs.writeFileSync(path.join(dir, 'README.md'), `# ${repo}\n`);
  };
  checkout(path.join(workspace, 'alpha', 'alpha-app'), 'example-org/alpha-app');
  checkout(path.join(workspace, 'beta', 'beta-cli'), 'example-org/beta-cli');

  return { tmp, specs: path.join(tmp, 'specs'), workspace, cleanup: () => fs.rmSync(tmp, { recursive: true, force: true }) };
}

async function importFixture(win, fx) {
  await win.evaluate(([p, w]) => window._testImportProjects(p, w), [fx.specs, fx.workspace]);
}

test.describe('Projects', () => {
  let fx;
  test.beforeEach(() => { fx = makeFixture(); });
  test.afterEach(() => fx.cleanup());

  test('importing a portfolio lists its projects in the switcher', async () => {
    const { app, win } = await launchApp();
    try {
      await expect(win.locator('#project-switcher')).toContainText('Projects');
      await importFixture(win, fx);
      await expect(win.locator('#project-switcher')).toContainText('Choose project');

      await win.locator('#project-switcher').click();
      const items = win.locator('#project-menu .project-menu-item[data-slug]');
      await expect(items).toHaveCount(2);
      await expect(items.nth(0)).toContainText('Alpha App');
      await expect(items.nth(0).locator('.project-health.green')).toHaveCount(1);
      await expect(items.nth(0).locator('.project-phase')).toHaveText('build');
      await expect(items.nth(1)).toContainText('Beta Tools');
      await expect(win.locator('#project-menu')).toContainText('Re-import projects');

      await win.keyboard.press('Escape');
      await expect(win.locator('#project-menu')).toHaveCount(0);
    } finally {
      await app.close();
    }
  });

  test('importing a folder with no project files keeps the projects; a folder can be added as a project', async () => {
    const { app, win } = await launchApp();
    try {
      await importFixture(win, fx);
      const solo = path.join(fx.workspace, 'solo');
      fs.mkdirSync(solo, { recursive: true });
      fs.writeFileSync(path.join(solo, 'RELEASE.md'), '---\nproject: Solo Project\nphase: build\nhealth: amber\n---\n');
      await win.evaluate(([p, w]) => window._testImportProjects(p, w), [solo, fx.workspace]);

      await win.locator('#project-switcher').click();
      await expect(win.locator('#project-menu .project-menu-item[data-slug]')).toHaveCount(2);
      await win.keyboard.press('Escape');

      await win.evaluate(dir => window._testAddProjectFolder(dir), solo);
      await expect(win.locator('#project-switcher')).toContainText('Solo Project');
      await win.locator('#project-switcher').click();
      const items = win.locator('#project-menu .project-menu-item[data-slug]');
      await expect(items).toHaveCount(3);
      await expect(items.nth(2)).toContainText('Solo Project');
      await win.keyboard.press('Escape');

      // Re-import keeps the folder project
      await win.evaluate(([p, w]) => window._testImportProjects(p, w), [fx.specs, fx.workspace]);
      await win.locator('#project-switcher').click();
      await expect(win.locator('#project-menu .project-menu-item[data-slug]')).toHaveCount(3);
    } finally {
      await app.close();
    }
  });

  test('choosing a project opens its folder and lists its repos', async () => {
    const { app, win } = await launchApp();
    try {
      await importFixture(win, fx);
      await win.locator('#project-switcher').click();
      await win.locator('#project-menu .project-menu-item[data-slug="alpha"]').click();

      await expect(win.locator('#project-switcher')).toContainText('Alpha App');
      await expect(win.locator('#sidebar-header .sidebar-header-name')).toHaveText('alpha');

      const repos = win.locator('#starred-section .project-repo');
      await expect(repos).toHaveCount(3);   // project folder, alpha-app, alpha-docs
      await expect(repos.nth(1)).toContainText('alpha-app');
      await expect(repos.nth(2)).toContainText('alpha-docs');
      await expect(repos.nth(2)).toHaveClass(/missing/);
      await expect(repos.nth(2)).toHaveAttribute('title', /example-org\/alpha-docs/);

      // A repo row opens the checkout
      await repos.nth(1).click();
      await expect(win.locator('#sidebar-header .sidebar-header-name')).toHaveText('alpha-app');
      await expect(win.locator('#file-list')).toContainText('README.md');

      // Sections open at the project's folder
      await win.locator('.nav-tab[data-section="ideas"]').click();
      await expect(win.locator('#section-ideas .fbs-sidebar-header .sidebar-header-name')).toHaveText('alpha');

      // Switching project moves an already-open section too
      await win.locator('#project-switcher').click();
      await win.locator('#project-menu .project-menu-item[data-slug="beta"]').click();
      await expect(win.locator('#section-ideas .fbs-sidebar-header .sidebar-header-name')).toHaveText('beta');
    } finally {
      await app.close();
    }
  });

  test('Projects → Re-import picks up portfolio changes', async () => {
    const { app, win } = await launchApp();
    try {
      await importFixture(win, fx);
      fs.writeFileSync(path.join(fx.specs, 'portfolio', 'gamma.md'), '---\nslug: gamma\ntitle: Gamma\nrepos:\n  - example-org/gamma\n---\n');
      await app.evaluate(({ Menu }) => Menu.getApplicationMenu().getMenuItemById('projects-reimport').click());
      await win.locator('#project-switcher').click();
      await expect(win.locator('#project-menu .project-menu-item[data-slug]')).toHaveCount(3);
      // No local folder for gamma, so it can't be chosen
      await expect(win.locator('#project-menu .project-menu-item[data-slug="gamma"]')).toBeDisabled();
    } finally {
      await app.close();
    }
  });

  test('the active project and its import survive a restart', async () => {
    const first = await launchApp();
    await importFixture(first.win, fx);
    await first.win.locator('#project-switcher').click();
    await first.win.locator('#project-menu .project-menu-item[data-slug="beta"]').click();
    await expect(first.win.locator('#project-switcher')).toContainText('Beta Tools');
    await first.app.close();

    const { app, win } = await launchApp({ userData: first.userData });
    try {
      await expect(win.locator('#project-switcher')).toContainText('Beta Tools');
      await expect(win.locator('#sidebar-header .sidebar-header-name')).toHaveText('beta');
      await expect(win.locator('#starred-section .project-repo')).toHaveCount(2);
    } finally {
      await app.close();
    }
  });
});
