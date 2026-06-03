'use strict';

const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/ui',
  timeout: 30000,
  // Run tests serially — Electron launches a real window, parallel would clash
  workers: 1,
  reporter: 'list',
  use: {
    // Capture screenshots on failure
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  // Don't run Jest unit tests
  testMatch: ['**/tests/ui/**/*.test.js'],
});
