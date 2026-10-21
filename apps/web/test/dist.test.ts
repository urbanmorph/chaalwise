import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isHashedAsset } from '../src/sw/rules';

/** These tests read the built site, not the source. Run `pnpm build` first. */
const DIST = new URL('../dist/', import.meta.url).pathname;
if (!existsSync(join(DIST, 'index.html'))) throw new Error('No build found: run `pnpm build` first.');

const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)],
  );
const all = files(DIST).map((f) => `/${relative(DIST, f)}`);
const htmlFiles = all.filter((f) => f.endsWith('.html'));
const read = (path: string) => readFileSync(join(DIST, path), 'utf8');

/** The worker starts with `self.__PRECACHE__={...};` so the list can be read back. */
const precache = (): { version: string; pages: string[]; assets: string[] } => {
  const first = read('sw.js').split('\n')[0]!;
  return JSON.parse(first.replace(/^self\.__PRECACHE__=/, '').replace(/;$/, ''));
};

describe('the offline worker', () => {
  it('precaches every page, by the URL a learner visits', () => {
    const urls = htmlFiles.filter((f) => f.endsWith('index.html')).map((f) => f.replace(/index\.html$/, ''));
    expect(precache().pages.sort()).toEqual(urls.sort());
  });

  it('leaves out the 404 page, which Cloudflare only serves by redirect', () => {
    expect(precache().pages).not.toContain('/404.html');
  });

  it('precaches every build file, and every one of them is content-hashed', () => {
    const built = all.filter((f) => f.startsWith('/_astro/'));
    expect(built.length).toBeGreaterThan(0);
    expect(built.filter((f) => !isHashedAsset(f))).toEqual([]);
    expect(precache().assets.sort()).toEqual(built.sort());
  });

  it('versions itself by content, so any change installs a new worker', () => {
    expect(precache().version).toMatch(/^[0-9a-f]{16}$/);
  });

  it('is not the tombstone in a normal build', () => {
    expect(read('sw.js')).not.toMatch(/unregister\(\)/);
  });
});

describe('response headers', () => {
  const headers = read('_headers');
  it('serves the worker no-cache, so browsers always see a new one', () => {
    expect(headers).toMatch(/^\/sw\.js\n\s+Cache-Control: no-cache$/m);
  });
  it('lets browsers keep hashed build files forever', () => {
    expect(headers).toMatch(/^\/_astro\/\*\n\s+Cache-Control: public, max-age=31536000, immutable$/m);
  });
});

describe.each(htmlFiles)('%s', (page) => {
  const html = read(page);
  it('loads nothing from other sites, and links only to known ones', () => {
    const external = [...html.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)]
      .map((m) => m[1]!)
      .filter(
        (url) =>
          !/^https:\/\/(github\.com|lichess\.org|database\.lichess\.org|chaalwise\.com|www\.urbanmorph\.com|doi\.org|www1\.udel\.edu)\//.test(
            url,
          ),
      );
    expect(external).toEqual([]);
    expect(html).not.toMatch(/<link[^>]+href="https?:/);
  });
  it('keeps the space between words and links (Astro drops it at some line breaks)', () => {
    const text = html.replace(/<(script|style)[\s\S]*?<\/\1>/g, '');
    expect(text.match(/[\w.,;:]<a\s[^>]*>[^<]*/g) ?? []).toEqual([]);
    expect(text.match(/<\/a>[\w(]/g) ?? []).toEqual([]);
  });
  it('downloads no fonts: the family uses the system sans and mono', () => {
    expect(html).not.toMatch(/\.woff2/);
  });
  it('says "points", never "chips"', () => {
    expect(html).not.toMatch(/\bchips?\b/i);
  });
  it('has a language, a skip link and the theme colours for both themes', () => {
    expect(html).toMatch(/<html lang="en"/);
    expect(html).toMatch(/<a [^>]*href="#main"[^>]*>Skip to content/);
    expect(html).toMatch(/<meta name="theme-color" content="#[0-9a-f]{6}" media="\(prefers-color-scheme: light\)"/i);
    expect(html).toMatch(/<meta name="theme-color" content="#[0-9a-f]{6}" media="\(prefers-color-scheme: dark\)"/i);
  });
});

describe('credits', () => {
  it('credits the Lichess projects the board and rules come from, with their licences, in CREDITS.md', () => {
    const credits = readFileSync(new URL('../../../CREDITS.md', import.meta.url), 'utf8');
    expect(credits).toMatch(/chessground/);
    expect(credits).toMatch(/chessops/);
    expect(credits).toMatch(/GPL-3\.0/);
    expect(credits).toMatch(/not part of or endorsed by Lichess/);
    // The notices the GPL and AGPL ask an interactive program to show: copyright, no warranty, the licence.
    expect(credits).toMatch(/Copyright/);
    expect(credits).toMatch(/no warranty/);
  });
});
