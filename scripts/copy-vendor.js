#!/usr/bin/env node
// Copies vendor assets from node_modules into renderer/vendor/.
// Run once after `npm install`: npm run setup

const fs = require('fs');
const path = require('path');

const dst = path.join(__dirname, '..', 'renderer', 'vendor');
const nm = path.join(__dirname, '..', 'node_modules');

fs.mkdirSync(dst, { recursive: true });

let ok = true;

// xterm — pulled from node_modules
const xtermFiles = [
  { src: path.join(nm, 'xterm', 'lib', 'xterm.js'),            dst: path.join(dst, 'xterm.js') },
  { src: path.join(nm, 'xterm-addon-fit', 'lib', 'xterm-addon-fit.js'), dst: path.join(dst, 'xterm-addon-fit.js') },
  { src: path.join(nm, 'xterm', 'css', 'xterm.css'),           dst: path.join(dst, 'xterm.css') },
];
for (const { src, dst: dstPath } of xtermFiles) {
  const file = path.basename(dstPath);
  if (!fs.existsSync(src)) {
    console.error(`Missing: ${src} — run npm install`);
    ok = false;
    continue;
  }
  fs.copyFileSync(src, dstPath);
  const size = (fs.statSync(dstPath).size / 1024).toFixed(1);
  console.log(`  Copied ${file} (${size} KB)`);
}

// CodeMirror simple mode addon (required by rust mode)
const cmSimpleSrc = path.join(nm, 'codemirror', 'addon', 'mode', 'simple.js');
const cmSimpleDst = path.join(dst, 'cm-simple.js');
if (!fs.existsSync(cmSimpleSrc)) {
  console.error(`Missing: ${cmSimpleSrc} — run npm install`);
  ok = false;
} else {
  fs.copyFileSync(cmSimpleSrc, cmSimpleDst);
  const size = (fs.statSync(cmSimpleDst).size / 1024).toFixed(1);
  console.log(`  Copied cm-simple.js (${size} KB)`);
}

// CodeMirror language modes
const cmModeDir = path.join(__dirname, '..', 'node_modules', 'codemirror', 'mode');
const cmModeDst = path.join(dst, 'cm-modes');
fs.mkdirSync(cmModeDst, { recursive: true });
for (const mode of ['javascript', 'yaml', 'python', 'shell', 'css', 'xml', 'htmlmixed', 'clike', 'go', 'ruby', 'rust', 'toml']) {
  const srcPath = path.join(cmModeDir, mode, `${mode}.js`);
  const dstPath = path.join(cmModeDst, `${mode}.js`);
  if (!fs.existsSync(srcPath)) { console.error(`Missing mode: ${srcPath}`); ok = false; continue; }
  fs.copyFileSync(srcPath, dstPath);
  const size = (fs.statSync(dstPath).size / 1024).toFixed(1);
  console.log(`  Copied cm-modes/${mode}.js (${size} KB)`);
}

// CodeMirror (required by Toast UI Editor v2)
const cmDistDir = path.join(__dirname, '..', 'node_modules', 'codemirror', 'lib');
for (const file of ['codemirror.js', 'codemirror.css']) {
  const srcPath = path.join(cmDistDir, file);
  const dstPath = path.join(dst, file);
  if (!fs.existsSync(srcPath)) {
    console.error(`Missing: ${srcPath} — run npm install`);
    ok = false;
    continue;
  }
  fs.copyFileSync(srcPath, dstPath);
  const size = (fs.statSync(dstPath).size / 1024).toFixed(1);
  console.log(`  Copied ${file} (${size} KB)`);
}

// Toast UI Editor v2 — copied from node_modules
const toastDistDir = path.join(__dirname, '..', 'node_modules', '@toast-ui', 'editor', 'dist');
for (const file of ['toastui-editor.js', 'toastui-editor.css']) {
  const srcPath = path.join(toastDistDir, file);
  const dstPath = path.join(dst, file);
  if (!fs.existsSync(srcPath)) {
    console.error(`Missing: ${srcPath} — run npm install`);
    ok = false;
    continue;
  }
  fs.copyFileSync(srcPath, dstPath);
  const size = (fs.statSync(dstPath).size / 1024).toFixed(1);
  console.log(`  Copied ${file} (${size} KB)`);
}

if (ok) {
  console.log('\nVendor files ready. Run `npm start` to launch.');
} else {
  console.error('\nSome files could not be copied — check the paths above.');
  process.exit(1);
}
