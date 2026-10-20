import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';

export interface Redirect {
  /** The old address, with its trailing slash. */
  from: string;
  /** Where it lives now: a page on the site, or a full URL. */
  to: string;
}

/**
 * Addresses that have changed, so old links and bookmarks still land. Add one
 * whenever a lesson or page moves; the build fails if a target is not a page.
 */
export const REDIRECTS: Redirect[] = [
  // Stage 0 was split into one-idea lessons (b1eec04).
  { from: '/chess/check-and-mate/', to: '/chess/mate-stalemate/' },
  { from: '/chess/pieces/', to: '/chess/rook-bishop/' },
  { from: '/chess/special-moves/', to: '/chess/castling/' },
  // The credits page became CREDITS.md, linked from the footer (da5c194).
  { from: '/credits/', to: 'https://github.com/urbanmorph/chaalwise/blob/main/CREDITS.md' },
];

/** What is wrong with a list of redirects, given which pages the build has. */
export function redirectIssues(redirects: Redirect[], isPage: (path: string) => boolean): string[] {
  return redirects.flatMap(({ from, to }) => [
    ...(to.startsWith('/') && !isPage(to) ? [`${from} redirects to ${to}, which is not a page`] : []),
    ...(isPage(from) ? [`${from} redirects, but it is still a page`] : []),
  ]);
}

/** Cloudflare's `_redirects` lines: each old address with and without its trailing slash, moved permanently. */
export const redirectRules = (redirects: Redirect[]): string =>
  redirects.map(({ from, to }) => `${from} ${to} 301\n${from.replace(/\/$/, '')} ${to} 301\n`).join('');

/** Writes dist/_redirects after the build, and fails the build if a redirect is wrong. */
export default function redirects(): AstroIntegration {
  return {
    name: 'chaalwise:redirects',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const dist = fileURLToPath(dir);
        const issues = redirectIssues(REDIRECTS, (path) => existsSync(join(dist, path, 'index.html')));
        if (issues.length) throw new Error(`Redirects:\n${issues.join('\n')}`);
        await writeFile(join(dist, '_redirects'), redirectRules(REDIRECTS));
        logger.info(`_redirects: ${REDIRECTS.length} old addresses`);
      },
    },
  };
}
