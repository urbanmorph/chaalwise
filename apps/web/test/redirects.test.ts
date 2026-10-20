import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { redirectIssues, redirectRules } from '../src/integrations/redirects';

/** These tests read the built site's `_redirects`, the file Cloudflare reads. Run `pnpm build` first. */
const DIST = new URL('../dist/', import.meta.url).pathname;
const rules = readFileSync(join(DIST, '_redirects'), 'utf8')
  .split('\n')
  .filter((line) => line.trim() && !line.startsWith('#'))
  .map((line) => line.trim().split(/\s+/));
const page = (path: string) => existsSync(join(DIST, path, 'index.html'));

describe('old lesson and page addresses', () => {
  it('send each old address on, permanently, with and without its trailing slash', () => {
    const map = Object.fromEntries(rules.map(([from, to]) => [from, to]));
    for (const [from, to] of [
      ['/chess/check-and-mate/', '/chess/mate-stalemate/'],
      ['/chess/pieces/', '/chess/rook-bishop/'],
      ['/chess/special-moves/', '/chess/castling/'],
      ['/credits/', 'https://github.com/urbanmorph/chaalwise/blob/main/CREDITS.md'],
    ]) {
      expect(map[from!], from).toBe(to);
      expect(map[from!.slice(0, -1)], from).toBe(to);
    }
    expect(rules.every((r) => r[2] === '301')).toBe(true);
  });

  it('point only at pages the site has, and never hide a page that still exists', () => {
    for (const [from, to] of rules) {
      expect(page(from!), `${from} is still a page`).toBe(false);
      if (to!.startsWith('/')) expect(page(to!), `${to} is not a page`).toBe(true);
    }
  });
});

describe('checking redirects at build time', () => {
  const exists = (pages: string[]) => (path: string) => pages.includes(path);

  it('finds a redirect to a page that is gone, and one from a page that is still there', () => {
    const issues = redirectIssues(
      [
        { from: '/chess/old/', to: '/chess/missing/' },
        { from: '/chess/live/', to: '/chess/new/' },
        { from: '/fine/', to: '/chess/new/' },
        { from: '/away/', to: 'https://github.com/' },
      ],
      exists(['/chess/new/', '/chess/live/']),
    );
    expect(issues).toEqual([
      '/chess/old/ redirects to /chess/missing/, which is not a page',
      '/chess/live/ redirects, but it is still a page',
    ]);
  });

  it('writes each redirect with and without the trailing slash', () => {
    expect(redirectRules([{ from: '/a/', to: '/b/' }])).toBe('/a/ /b/ 301\n/a /b/ 301\n');
  });
});
