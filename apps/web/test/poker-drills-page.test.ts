import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { POKER_DRILLS } from '../src/lib/drill-list';

const dist = (file: string) => readFileSync(new URL(`../dist/${file}`, import.meta.url), 'utf8');
const mainOf = (file: string) =>
  dist(file)
    .match(/<main[\s\S]*?<\/main>/)![0]
    .replace(/\s+/g, ' ');

describe('the poker drills page', () => {
  const main = mainOf('poker/drills/index.html');

  it('has a section for every drill, each with its anchor, its drill and the lesson that teaches it', () => {
    for (const drill of POKER_DRILLS) {
      const section = main.match(new RegExp(`<section id="${drill.id}"[\\s\\S]*?</section>`))?.[0];
      expect(section, drill.id).toBeDefined();
      expect(section, drill.id).toContain(drill.title);
      expect(section, drill.id).toContain(`href="/poker/${drill.lesson}/"`);
      expect(section, drill.id).toContain(`&quot;kind&quot;:[0,&quot;${drill.kind}&quot;]`);
    }
  });

  it('offers the first hands to a learner who has not met poker, and never locks the drills', () => {
    expect(main).toContain('href="/poker/first-hands/"');
    expect(main.match(/<astro-island/g)).toHaveLength(POKER_DRILLS.length);
  });

  it('uses no money words and links nowhere off the site', () => {
    expect(main).not.toMatch(/\bchips?\b|\bcash\b|jackpot|₹|rupee|\bwager|\bstake\b|real money/i);
    expect(main).not.toMatch(/href="https?:/);
  });

  it('is linked from the poker course and the reference search', () => {
    expect(mainOf('poker/index.html')).toContain('href="/poker/drills/"');
    expect(dist('reference/index.html')).toContain('href="/poker/drills/#count-the-outs"');
  });
});
