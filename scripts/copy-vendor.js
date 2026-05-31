#!/usr/bin/env node
// Copies xterm.js assets from the sibling Flutter project's bundled assets.
// Run once after `npm install`: npm run setup

const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', '..', 'app', 'md_browser', 'assets', 'terminal');
const dst = path.join(__dirname, '..', 'renderer', 'vendor');

fs.mkdirSync(dst, { recursive: true });

const files = ['xterm.js', 'xterm-addon-fit.js', 'xterm.css'];
let ok = true;
for (const file of files) {
  const srcPath = path.join(src, file);
  const dstPath = path.join(dst, file);
  if (!fs.existsSync(srcPath)) {
    console.error(`Missing: ${srcPath}`);
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
