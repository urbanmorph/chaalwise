import { SKILL_IDS } from '@chaalwise/core/skills';
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const dist = (file: string) => readFileSync(new URL(`../dist/${file}`, import.meta.url), 'utf8');
const names = (dir: string) => readdirSync(new URL(dir, import.meta.url)).map((f) => f.replace('.md', ''));
const START = '/chess/coordinates/';
const offersStart = (html: string) => new RegExp(`class="new-to-chess"[^>]*>[\\s\\S]*?href="${START}"`).test(html);

describe('pages that explain an idea through chess', () => {
  it('start from the first chess lesson', () => {
    const first = readFileSync(new URL('../src/content/lessons/chess/coordinates.md', import.meta.url), 'utf8');
    expect(first).toMatch(/^stage: 0$/m);
    expect(first).toMatch(/^order: 1$/m);
  });

  it('offer chess from the beginning on every strategy lesson', () => {
    for (const id of names('../src/content/lessons/strategy/'))
      expect(offersStart(dist(`skills/${id}/index.html`)), id).toBe(true);
  });

  it('offer it on every course that shows or practises chess, and only those', () => {
    for (const id of SKILL_IDS) {
      const html = dist(`skills/${id}/index.html`);
      const chess =
        html.includes('data-practice-count') ||
        /href="\/chess\/[a-z-]+\/"/.test(html.replace(/<header[\s\S]*?<\/header>/, ''));
      expect(offersStart(html), id).toBe(chess);
    }
  });

  it('offer it on every reference entry drawn on a chess board', () => {
    const boards = readdirSync(new URL('../dist/reference/', import.meta.url), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .flatMap((game) =>
        readdirSync(new URL(`../dist/reference/${game.name}/`, import.meta.url)).map(
          (slug) => `reference/${game.name}/${slug}/index.html`,
        ),
      )
      .map((file) => ({ file, html: dist(file) }))
      .filter(({ html }) => html.includes('<figure class="board'));
    expect(boards.length).toBeGreaterThan(10);
    for (const { file, html } of boards) expect(offersStart(html), file).toBe(true);
  });

  it('leave chess lessons alone: they are the course itself', () => {
    expect(offersStart(dist('chess/knight/index.html'))).toBe(false);
  });
});
