import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';

/** Pages that are the learner's own, or not a page at all: marked noindex, and left out of the sitemap. */
export const PRIVATE_PAGES = ['progress/', 'review/', '404/'];

/** The sitemap: every public page, by its full address. */
export const sitemap = (site: string, paths: string[]): string =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths
    .filter((p) => !PRIVATE_PAGES.includes(p))
    .sort()
    .map((p) => `  <url><loc>${new URL(p, site).href}</loc></url>\n`)
    .join('')}</urlset>\n`;

/** Writes dist/sitemap.xml after the build; robots.txt points to it. */
export default function sitemapIntegration(): AstroIntegration {
  let site = '';
  return {
    name: 'chaalwise:sitemap',
    hooks: {
      'astro:config:done': ({ config }) => {
        site = config.site ?? '';
      },
      'astro:build:done': async ({ dir, pages, logger }) => {
        if (!site) throw new Error('The sitemap needs `site` in astro.config.');
        const xml = sitemap(
          site,
          pages.map((p) => p.pathname),
        );
        await writeFile(join(fileURLToPath(dir), 'sitemap.xml'), xml);
        logger.info(`sitemap.xml: ${xml.split('<url>').length - 1} pages`);
      },
    },
  };
}
