import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const DIST = new URL('../dist/', import.meta.url).pathname;
const read = (file: string) => readFileSync(join(DIST, file), 'utf8');
const SITE = 'https://chaalwise.com';

/** Every built page, as its address. */
function pages(dir = DIST): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === '_astro' ? [] : pages(path);
    return name.endsWith('.html') ? [`/${path.slice(DIST.length).replace(/index\.html$/, '')}`] : [];
  });
}
const html = (page: string) => read(page.endsWith('.html') ? page : `${page}index.html`);
const PRIVATE = ['/progress/', '/review/', '/404.html'];
const indexable = pages().filter((p) => !PRIVATE.includes(p));
const jsonLd = (page: string) =>
  [...html(page).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]!));

describe('what search engines are told', () => {
  it('lists every public page in the sitemap, and no private one', () => {
    const urls = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(urls.sort()).toEqual(indexable.map((p) => `${SITE}${p}`).sort());
  });

  it('points to the sitemap from robots.txt', () => {
    expect(read('robots.txt')).toContain(`Sitemap: ${SITE}/sitemap.xml`);
  });

  it('gives every public page one canonical address on chaalwise.com, the same as its share address', () => {
    for (const page of indexable) {
      const h = html(page);
      expect(h.match(/<link rel="canonical" href="([^"]+)"/)?.[1], page).toBe(`${SITE}${page}`);
      expect(h, page).not.toContain('name="robots"');
    }
  });

  it('keeps the learner’s own pages and the not-found page out of search', () => {
    for (const page of PRIVATE) expect(html(page), page).toContain('<meta name="robots" content="noindex">');
  });

  it('gives every public page its own title and one main heading', () => {
    const titles = indexable.map((p) => html(p).match(/<title>([^<]*)<\/title>/)![1]);
    expect(titles.filter((t, i) => titles.indexOf(t) !== i)).toEqual([]);
    for (const page of indexable) expect(html(page).match(/<h1[\s>]/g)?.length, page).toBe(1);
  });

  it('gives every public page a description search results show in full', () => {
    const lengths = indexable.map(
      (p) => [p, html(p).match(/<meta name="description" content="([^"]*)"/)![1]!.length] as const,
    );
    expect(lengths.filter(([, n]) => n < 50 || n > 160)).toEqual([]);
  });

  it('says what kind of page a lesson or reference entry is, when there is room', () => {
    const description = (p: string) => html(p).match(/<meta name="description" content="([^"]*)"/)![1];
    expect(description('/chess/fork/')).toMatch(/A free chess lesson\.$/);
    expect(description('/reference/chess/fork/')).toMatch(/From the Chaalwise chess reference\.$/);
  });

  it('names what the site teaches in the home page title and description', () => {
    const h = html('/');
    expect(h.match(/<title>([^<]*)<\/title>/)![1]).toMatch(/strategy/i);
    expect(h.match(/<meta name="description" content="([^"]*)"/)![1]).toMatch(/strategy/i);
  });

  it('describes the site and its maker as structured data on the home page', () => {
    const types = jsonLd('/')
      .flatMap((d) => d['@graph'] ?? [d])
      .map((d) => d['@type']);
    expect(types).toEqual(expect.arrayContaining(['WebSite', 'Organization']));
  });

  it('marks each lesson as a free learning resource', () => {
    for (const page of ['/chess/castling/', '/skills/blunder-check/', '/poker/outs-and-odds/', '/cases/quiz-night/']) {
      expect(existsSync(join(DIST, page, 'index.html')), page).toBe(true);
      const [resource] = jsonLd(page);
      expect(resource, page).toMatchObject({
        '@type': 'LearningResource',
        isAccessibleForFree: true,
        url: `${SITE}${page}`,
      });
    }
  });
});
