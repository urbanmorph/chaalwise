import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { build } from 'esbuild';

const files = async (dir: string): Promise<string[]> =>
  (await readdir(dir, { recursive: true, withFileTypes: true }))
    .filter((e) => e.isFile())
    .map((e) => join(e.parentPath, e.name));

/** A key page, saved when the worker installs: the home page and each section's front page (/chess/, /offline/). */
const isKeyPage = (page: string) => page.split('/').length <= 3;

/**
 * Writes dist/sw.js after the build: the offline worker with its precache list
 * (the key pages and every hashed build file to install with, then the rest of
 * the pages), versioned by the content of those files. With SW_TOMBSTONE=1 it
 * writes the self-removing tombstone instead.
 */
export default function serviceWorker(): AstroIntegration {
  return {
    name: 'chaalwise:service-worker',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const dist = fileURLToPath(dir);
        const src = (name: string) => fileURLToPath(new URL(`../sw/${name}`, import.meta.url));
        const out = join(dist, 'sw.js');
        const bundle = (entry: string, banner?: string) =>
          build({
            entryPoints: [src(entry)],
            outfile: out,
            bundle: true,
            minify: true,
            format: 'iife',
            target: 'es2022',
            ...(banner && { banner: { js: banner } }),
            logLevel: 'warning',
          });

        if (process.env.SW_TOMBSTONE === '1') {
          await bundle('tombstone.ts');
          logger.warn('Wrote the TOMBSTONE worker: it removes the offline cache for every learner.');
          return;
        }

        const paths = (await files(dist)).map((f) => `/${relative(dist, f)}`).sort();
        // Directory pages only: Cloudflare redirects /404.html, so it cannot be precached by that URL.
        const all = paths.filter((p) => p.endsWith('/index.html')).map((p) => p.replace(/index\.html$/, ''));
        const pages = all.filter(isKeyPage);
        const rest = all.filter((p) => !isKeyPage(p));
        const assets = paths.filter((p) => p.startsWith('/_astro/'));
        const hash = createHash('sha256');
        for (const p of [...paths.filter((p) => p.endsWith('.html')), ...assets]) {
          hash.update(p).update(await readFile(join(dist, p)));
        }
        const version = hash.digest('hex').slice(0, 16);
        await bundle('sw.ts', `self.__PRECACHE__=${JSON.stringify({ version, pages, rest, assets })};`);
        logger.info(`sw.js ${version}: ${pages.length} key pages, ${rest.length} more, ${assets.length} build files`);
      },
    },
  };
}
