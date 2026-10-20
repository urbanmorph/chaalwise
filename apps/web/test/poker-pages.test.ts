import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const dist = (file: string) => readFileSync(new URL(`../dist/${file}`, import.meta.url), 'utf8');
const mainOf = (file: string) =>
  dist(file)
    .match(/<main[\s\S]*?<\/main>/)![0]
    .replace(/\s+/g, ' ');
const main = mainOf('poker/first-hands/index.html');

const LESSONS = [
  'hand-rankings',
  'starting-hands',
  'position',
  'outs-and-odds',
  'expected-value',
  'reading-the-board',
  'why-you-bet',
];
const POKER_PAGES = [
  'poker/index.html',
  'poker/first-hands/index.html',
  ...LESSONS.map((slug) => `poker/${slug}/index.html`),
];

describe('the poker pages keep to the terms: practice points, never money', () => {
  it('say plainly that practice points are free and can never be bought or cashed out', () => {
    expect(main).toMatch(/Practice points are free and can never be bought, sold or cashed out/);
    expect(mainOf('poker/index.html')).toMatch(/Practice points are free and can never be bought, sold or cashed out/);
  });

  it('use no money words', () => {
    for (const page of POKER_PAGES)
      expect(mainOf(page), page).not.toMatch(/\bchips?\b|\bcash\b|jackpot|₹|rupee|\bwager|\bstake\b|real money/i);
  });

  it('link nowhere off the site', () => {
    for (const page of POKER_PAGES) expect(mainOf(page), page).not.toMatch(/href="https?:/);
  });
});

describe('the poker course', () => {
  it('starts with the first hands, then the lessons in order', () => {
    const index = mainOf('poker/index.html');
    const at = ['/poker/first-hands/', ...LESSONS.map((slug) => `/poker/${slug}/`)].map((href) =>
      index.indexOf(`href="${href}"`),
    );
    expect(at.every((i) => i >= 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });

  it('gives every lesson its own page, in a rail of poker lessons only, with a way in for newcomers', () => {
    for (const slug of LESSONS) {
      const page = dist(`poker/${slug}/index.html`);
      expect(page, slug).toContain('href="/poker/first-hands/"');
      expect(page, slug).toContain('href="/poker/"');
      expect(page, slug).not.toMatch(/data-lesson="chess\//);
    }
  });

  it('keeps poker lessons out of the chess path', () => {
    expect(dist('chess/fork/index.html')).not.toMatch(/data-lesson="poker\//);
    expect(mainOf('chess/index.html')).not.toMatch(/href="\/poker\/hand-rankings\/"/);
  });

  it('lets you try the idea on six poker reference entries, at the table, never only read it', () => {
    for (const slug of ['hand-rankings', 'outs', 'pot-odds', 'expected-value', 'position', 'bluff'])
      expect(dist(`reference/poker/${slug}/index.html`), slug).toMatch(/<section class="try/);
    // The question shows its cards at the table: the pot and the price of the call travel with it.
    expect(dist('reference/poker/pot-odds/index.html')).toContain('&quot;toCall&quot;:4');
  });

  it('links each poker reference entry to the lesson that teaches it', () => {
    expect(dist('reference/poker/outs/index.html')).toContain('href="/poker/outs-and-odds/"');
    expect(dist('reference/poker/hand-rankings/index.html')).toContain('href="/poker/hand-rankings/"');
  });
});

describe('the way into poker', () => {
  it('is offered on every poker reference page, and in the guide to playing elsewhere', () => {
    for (const slug of ['outs', 'pot-odds', 'hand-rankings', 'position'])
      expect(dist(`reference/poker/${slug}/index.html`), slug).toContain('href="/poker/first-hands/"');
    expect(dist('play-elsewhere/index.html')).toContain('href="/poker/first-hands/"');
  });
});

describe('the strategy tracks poker trains', () => {
  const TRAINED = {
    'weigh-odds': '/poker/outs-and-odds/',
    'size-risk': '/poker/starting-hands/',
    'read-hidden': '/poker/position/',
    bluff: '/poker/why-you-bet/',
  };

  it('link from each track course to its poker lessons, with a way in for newcomers', () => {
    for (const [track, href] of Object.entries(TRAINED)) {
      const html = mainOf(`skills/${track}/index.html`);
      expect(html, track).toMatch(new RegExp(`Shown and practised in poker:.*?href="${href}"`));
      expect(html, track).toContain('href="/poker/first-hands/"');
    }
    expect(mainOf('skills/think-ahead/index.html')).not.toContain('href="/poker/first-hands/"');
  });

  it('link from the strategy page to the poker lessons for each track', () => {
    const index = dist('skills/index.html');
    for (const [track, href] of Object.entries(TRAINED)) {
      const section = index.match(new RegExp(`<section id="${track}"[\\s\\S]*?</section>`))![0];
      expect(section, track).toContain(`href="${href}"`);
    }
  });

  it('no longer say poker is still to come', () => {
    for (const page of [
      'index.html',
      'skills/index.html',
      ...Object.keys(TRAINED).map((t) => `skills/${t}/index.html`),
    ])
      expect(mainOf(page), page).not.toMatch(/comes? with poker|poker next|poker will/i);
  });
});
