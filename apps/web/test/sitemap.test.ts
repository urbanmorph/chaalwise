import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { lastCommitDates, lastmodOf, sitemap, sourcesOf } from '../src/integrations/sitemap';

const WEB = new URL('../', import.meta.url).pathname;
const SITE = 'https://chaalwise.com';

describe('the file each page is written in', () => {
  it('finds lessons, reference entries, cases and strategy lessons in the content, and other pages in src/pages', () => {
    const found = (path: string) => sourcesOf(path).filter((f) => existsSync(`${WEB}${f}`));
    expect(found('poker/hand-rankings/')).toEqual(['src/content/lessons/poker/hand-rankings.md']);
    expect(found('reference/poker/equity/')).toEqual(['src/content/reference/poker/equity.md']);
    expect(found('cases/quiz-night/')).toEqual(['src/content/lessons/cases/quiz-night.md']);
    expect(found('skills/blunder-check/')).toEqual(['src/content/lessons/strategy/blunder-check.md']);
    expect(found('skills/composure/')).toEqual(['src/content/tracks/composure.md']);
    expect(found('labs/nim/')).toEqual(['src/pages/labs/nim.astro']);
    expect(found('poker/drills/')).toEqual(['src/pages/poker/drills.astro']);
    expect(found('labs/')).toEqual(['src/pages/labs/index.astro']);
    expect(found('')).toEqual(['src/pages/index.astro']);
  });
});

describe('when each file last changed', () => {
  it('keeps the newest commit date for each file from git log, newest first', () => {
    const log = '\u00002026-11-12\n\nsrc/a.md\nsrc/b.md\n\u00002026-10-01\n\nsrc/a.md\nsrc/c.md\n';
    expect(lastCommitDates(log)).toEqual(
      new Map([
        ['src/a.md', '2026-11-12'],
        ['src/b.md', '2026-11-12'],
        ['src/c.md', '2026-10-01'],
      ]),
    );
  });

  it('dates a page by its file, and a page whose file git has not seen by the build', () => {
    const dates = new Map([['src/content/reference/poker/equity.md', '2026-11-12']]);
    expect(lastmodOf('reference/poker/equity/', dates, '2026-11-18')).toBe('2026-11-12');
    expect(lastmodOf('reference/poker/new-idea/', dates, '2026-11-18')).toBe('2026-11-18');
  });
});

describe('the sitemap', () => {
  it('gives each page its last change, when known', () => {
    const xml = sitemap(SITE, ['a/', 'b/'], (p) => (p === 'a/' ? '2026-11-12' : undefined));
    expect(xml).toContain(`<url><loc>${SITE}/a/</loc><lastmod>2026-11-12</lastmod></url>`);
    expect(xml).toContain(`<url><loc>${SITE}/b/</loc></url>`);
  });
});

describe('the built sitemap (run pnpm build first)', () => {
  const xml = readFileSync(new URL('../dist/sitemap.xml', import.meta.url), 'utf8');
  const urls = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]!);

  it('dates every page', () => {
    expect(urls.length).toBeGreaterThan(200);
    for (const u of urls) expect(u, u).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>$/);
  });

  it('dates a reference entry by the last commit to its file', () => {
    const file = 'src/content/reference/poker/hand-rankings.md';
    const committed = execFileSync('git', ['log', '-1', '--format=%cs', '--', file], { cwd: WEB }).toString().trim();
    expect(xml).toContain(`<loc>${SITE}/reference/poker/hand-rankings/</loc><lastmod>${committed}</lastmod>`);
  });
});
