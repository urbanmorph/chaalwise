import { execSync } from 'node:child_process';
import svelte from '@astrojs/svelte';
import { defineConfig } from 'astro/config';
import redirects from './src/integrations/redirects';
import serviceWorker from './src/integrations/service-worker';

/** Identifies the build in the page, so a stale copy is easy to spot. */
const buildId =
  process.env.BUILD_ID ??
  (() => {
    try {
      return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim();
    } catch {
      return 'dev';
    }
  })();

export default defineConfig({
  site: 'https://chaalwise.com',
  trailingSlash: 'ignore',
  // Inline styles: no render-blocking stylesheet request on a slow connection.
  build: { format: 'directory', inlineStylesheets: 'always' },
  integrations: [svelte(), redirects(), serviceWorker()],
  vite: {
    // Name workers like every other build file (name.hash.js), so the offline worker caches them.
    worker: { rollupOptions: { output: { entryFileNames: '_astro/[name].[hash].js' } } },
    define: {
      __BUILD_ID__: JSON.stringify(buildId),
      // A tombstone build must not register a worker, or the tombstone's reload re-installs it forever.
      __TOMBSTONE__: JSON.stringify(process.env.SW_TOMBSTONE === '1'),
    },
  },
});
