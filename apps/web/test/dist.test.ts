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

/** Width and height of a WebP file with a VP8X header, as the browser's encoder writes it (scripts/screenshots.mjs). */
const webpSize = (file: Buffer): [number, number] => {
  expect(file.subarray(8, 16).toString()).toBe('WEBPVP8X');
  return [file.readUIntLE(24, 3) + 1, file.readUIntLE(27, 3) + 1];
};

describe('installing the app', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  type Screenshot = { src: string; sizes: string; type: string; form_factor: string; label: string };
  const screenshots: Screenshot[] = manifest.screenshots ?? [];

  it('names the app by a fixed id and language in the manifest', () => {
    expect(manifest).toMatchObject({ id: '/', lang: 'en', start_url: '/', display: 'standalone' });
  });
  it('shows a phone and a desktop screenshot in the install dialog', () => {
    expect(screenshots.map((s) => s.form_factor).sort()).toEqual(['narrow', 'wide']);
  });
  it.each(['narrow', 'wide'])('declares the real size and type of the %s screenshot, small enough to fetch', (form) => {
    const shot = screenshots.find((s) => s.form_factor === form)!;
    expect(shot.label).toBeTruthy();
    const file = readFileSync(join(DIST, shot.src));
    expect(file.length).toBeLessThan(300_000);
    expect(shot.type).toBe('image/webp');
    const [width, height] = webpSize(file);
    expect(shot.sizes).toBe(`${width}x${height}`);
    // What Chrome accepts: each side 320 to 3840 pixels, the long side at most 2.3 times the short.
    for (const side of [width, height]) {
      expect(side).toBeGreaterThanOrEqual(320);
      expect(side).toBeLessThanOrEqual(3840);
    }
    expect(Math.max(width, height) / Math.min(width, height)).toBeLessThanOrEqual(2.3);
    expect(form === 'narrow' ? height > width : width > height).toBe(true);
  });
  it('keeps the screenshots out of the offline cache: only the install dialog fetches them', () => {
    expect(screenshots.length).toBeGreaterThan(0);
    const { pages, assets } = precache();
    for (const { src } of screenshots) expect([...pages, ...assets]).not.toContain(src);
    expect(read('sw.js')).not.toMatch(/screenshot/);
  });
  it('offers a hidden install button and the iPhone guide on every page', () => {
    for (const page of htmlFiles) {
      const html = read(page);
      expect(html, page).toMatch(/<button[^>]*id="install-app"[^>]*hidden[^>]*>\s*Install app/);
      expect(html, page).toMatch(/<dialog[^>]*id="install-guide"/);
    }
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
    // The canonical address names this page; it loads nothing.
    expect(html).not.toMatch(/<link(?![^>]*rel="canonical")[^>]+href="https?:/);
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

describe('notched phones', () => {
  const html = read('index.html');
  const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('');
  /** A rule's declarations, with custom properties replaced by their values. */
  const rule = (selector: string) => {
    const escaped = selector.replace(/[.:]/g, '\\$&');
    const body = css.match(new RegExp(`(?:^|\\})${escaped}(?:\\[data-astro-cid-\\w+\\])?\\{([^}]*)\\}`))?.[1] ?? '';
    return body.replace(/var\((--[\w-]+)\)/g, (v, name) => css.match(new RegExp(`${name}:([^;}]+)`))?.[1] ?? v);
  };

  it('lets the page fill the screen around a notch', () => {
    for (const page of htmlFiles) {
      expect(read(page), page).toMatch(/<meta name="viewport" content="[^"]*\bviewport-fit=cover\b/);
    }
  });
  it.each([
    ['.site-header', ['top']],
    ['.site-footer', ['bottom']],
    ['.wrap', ['left', 'right']],
    ['.update', ['left', 'right']],
    ['.skip', ['left']],
    ['.skip:focus', ['top']],
  ])('keeps %s clear of the notch and rounded corners', (selector, sides) => {
    for (const side of sides) expect(rule(selector)).toContain(`env(safe-area-inset-${side})`);
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
