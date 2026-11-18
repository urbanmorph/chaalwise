import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { CANONICAL_ELSEWHERE } from '../lib/canonical';

/** Pages that are the learner's own, or not a page at all: marked noindex, and left out of the sitemap. */
export const PRIVATE_PAGES = ['progress/', 'review/', 'offline/', '404/'];

/**
 * The files a page may be written in, relative to apps/web, most likely first: its lesson, case, strategy lesson,
 * course or reference entry in the content, else its own file in src/pages.
 */
export function sourcesOf(path: string): string[] {
  const p = path.replace(/\/$/, '');
  if (!p) return ['src/pages/index.astro'];
  const slug = p.split('/').pop();
  const content = p.startsWith('skills/')
    ? [`src/content/lessons/strategy/${slug}.md`, `src/content/tracks/${slug}.md`]
    : [`src/content/lessons/${p}.md`, `src/content/${p}.md`];
  return [...content, `src/pages/${p}.astro`, `src/pages/${p}/index.astro`];
}

/** Each file's newest commit date, from `git log --format=%x00%cs --name-only` (newest commit first). */
export function lastCommitDates(log: string): Map<string, string> {
  const dates = new Map<string, string>();
  for (const commit of log.split('\0').slice(1)) {
    const [date, ...files] = commit.split('\n');
    for (const file of files) if (file && !dates.has(file)) dates.set(file, date!);
  }
  return dates;
}

/** When a page last changed: the newest commit to its file, or the build date for a file git has not seen. */
export const lastmodOf = (path: string, dates: Map<string, string>, built: string): string =>
  sourcesOf(path)
    .map((file) => dates.get(file))
    .find(Boolean) ?? built;

/** The sitemap: every public page that is its own canonical address, by its full address, with its last change when known. */
export const sitemap = (
  site: string,
  paths: string[],
  lastmod: (path: string) => string | undefined = () => undefined,
): string =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths
    .filter((p) => !PRIVATE_PAGES.includes(p) && !(`/${p}` in CANONICAL_ELSEWHERE))
    .sort()
    .map((p) => {
      const date = lastmod(p);
      return `  <url><loc>${new URL(p, site).href}</loc>${date ? `<lastmod>${date}</lastmod>` : ''}</url>\n`;
    })
    .join('')}</urlset>\n`;

/**
 * Commit dates of every file under src/, relative to apps/web. Undefined without git, or in a shallow clone, where
 * the oldest commit fetched would claim every file it holds: better no date than a wrong one.
 */
function gitDates(cwd: string): Map<string, string> | undefined {
  const git = (...args: string[]) => execFileSync('git', args, { cwd, maxBuffer: 64 << 20 }).toString();
  try {
    if (git('rev-parse', '--is-shallow-repository').trim() === 'true') return undefined;
    return lastCommitDates(git('log', '--format=%x00%cs', '--name-only', '--relative', '--', 'src'));
  } catch {
    return undefined;
  }
}

/** Writes dist/sitemap.xml after the build; robots.txt points to it. */
export default function sitemapIntegration(): AstroIntegration {
  let site = '';
  let root = '';
  return {
    name: 'chaalwise:sitemap',
    hooks: {
      'astro:config:done': ({ config }) => {
        site = config.site ?? '';
        root = fileURLToPath(config.root);
      },
      'astro:build:done': async ({ dir, pages, logger }) => {
        if (!site) throw new Error('The sitemap needs `site` in astro.config.');
        const dates = gitDates(root);
        if (!dates) logger.warn('No full git history (a shallow clone?): sitemap.xml goes out without <lastmod>.');
        const built = new Date().toISOString().slice(0, 10);
        const xml = sitemap(
          site,
          pages.map((p) => p.pathname),
          dates && ((p) => lastmodOf(p, dates, built)),
        );
        await writeFile(join(fileURLToPath(dir), 'sitemap.xml'), xml);
        logger.info(`sitemap.xml: ${xml.split('<url>').length - 1} pages`);
      },
    },
  };
}
