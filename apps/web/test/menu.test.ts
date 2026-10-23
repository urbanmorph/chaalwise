import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** Reads the built site: run `pnpm build` first. */
const dist = (file: string) => readFileSync(new URL(`../dist/${file}`, import.meta.url), 'utf8');
const menu = (html: string) => html.match(/<header[\s\S]*?<nav[^>]*>([\s\S]*?)<\/nav>/)![1]!;
const footer = (html: string) => html.match(/<footer[\s\S]*?<\/footer>/)![0];

describe('the menu', () => {
  it('leads to the games themselves, for a beginner who only wants chess or poker', () => {
    const labels = [...menu(dist('index.html')).matchAll(/<a href="([^"]+)"[^>]*>\s*([^<]+?)\s*<\/a>/g)].map(
      (m) => `${m[1]} ${m[2]}`,
    );
    expect(labels).toEqual([
      '/skills/ strategy',
      '/chess/ chess',
      '/poker/ poker',
      '/daily/ daily',
      '/review/ review',
      '/progress/ progress',
    ]);
  });

  it('marks the section a page is in, not only its front page', () => {
    expect(menu(dist('chess/blunder-check/index.html'))).toMatch(/<a href="\/chess\/" aria-current="page"/);
    expect(menu(dist('poker/drills/index.html'))).toMatch(/<a href="\/poker\/" aria-current="page"/);
  });

  it('keeps the reference in the footer', () => {
    expect(footer(dist('index.html'))).toContain('href="/reference/"');
  });
});
