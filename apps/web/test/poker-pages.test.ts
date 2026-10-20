import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync(new URL('../dist/poker/first-hands/index.html', import.meta.url), 'utf8');
const main = page.match(/<main[\s\S]*?<\/main>/)![0].replace(/\s+/g, ' ');

describe('the poker pages keep to the terms: practice points, never money', () => {
  it('say plainly that practice points are free and can never be bought or cashed out', () => {
    expect(main).toMatch(/Practice points are free and can never be bought, sold or cashed out/);
  });

  it('use no money words', () => {
    expect(main).not.toMatch(/\bchips?\b|\bcash\b|jackpot|₹|rupee|\bwager|\bstake\b|real money/i);
  });

  it('link nowhere off the site', () => {
    expect(main).not.toMatch(/href="https?:/);
  });
});

describe('the way into poker', () => {
  const dist = (file: string) => readFileSync(new URL(`../dist/${file}`, import.meta.url), 'utf8');

  it('is offered on every poker reference page, and in the guide to playing elsewhere', () => {
    for (const slug of ['outs', 'pot-odds', 'hand-rankings', 'position'])
      expect(dist(`reference/poker/${slug}/index.html`), slug).toContain('href="/poker/first-hands/"');
    expect(dist('play-elsewhere/index.html')).toContain('href="/poker/first-hands/"');
  });
});
