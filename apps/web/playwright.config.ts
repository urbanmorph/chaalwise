import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;

export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/build.setup.ts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // One server and one served build, switched by tests: they must run in turn.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: `node e2e/server.mjs ${PORT} e2e/.builds`,
    url: `http://localhost:${PORT}/__deploy/A`,
    reuseExistingServer: false,
  },
});
