import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', testMatch: '**/*.spec.ts', fullyParallel: false, workers: 1, timeout: 90000,
  expect: { timeout: 15000 }, reporter: [['list'], ['json', { outputFile: 'verification-results/browser-results.json' }]],
  use: { headless: true, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: [
    { command: 'node node_modules/next/dist/bin/next start -p 3110', env: { NEXT_BUILD_DIR: '.next-offline-tests' }, url: 'http://localhost:3110/offline', timeout: 60000, reuseExistingServer: false },
    { command: 'node tests/browser/server.mjs', url: 'http://127.0.0.1:3111', timeout: 60000, reuseExistingServer: false },
  ],
});
