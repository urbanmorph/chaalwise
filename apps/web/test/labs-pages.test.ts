import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { measure } from '../scripts/budget.mjs';
import { LABS } from '../src/lib/labs/labs';

/** These tests read the built site, not the source. Run `pnpm build` first. */
const DIST = new URL('../dist/', import.meta.url).pathname;
const page = (path: string) => {
  const file = `${DIST}${path}index.html`;
  if (!existsSync(file)) throw new Error(`No built page ${path}: run \`pnpm build\` first.`);
  return readFileSync(file, 'utf8');
};
const tryIt = (html: string) => html.match(/<section class="try[\s\S]*?<\/section>/)?.[0] ?? '';

describe('the labs pages', () => {
  it('the index lists every lab, each with its idea, its track and five minutes', () => {
    const html = page('labs/');
    for (const lab of LABS) {
      expect(html).toContain(`href="/labs/${lab.slug}/"`);
      expect(html).toContain(`href="/skills/${lab.track}/"`);
    }
    expect(html.match(/5 minutes/g)).toHaveLength(LABS.length);
  });

  for (const lab of LABS) {
    describe(lab.title, () => {
      const html = page(`labs/${lab.slug}/`);

      it('draws the game at build time, so the page does not move when its script loads', () => {
        expect(html).toMatch(/<astro-island[^>]*client="load"/);
        expect(html).toContain('class="lab card"');
      });

      it("ends with the reference entry's questions, counted towards the lab's track", () => {
        const section = tryIt(html);
        expect(section).toContain('Try it yourself');
        // Each question from the entry carries the lab's track.
        const steps = JSON.parse(
          section
            .match(/data-steps="([^"]*)"/)![1]!
            .replaceAll('&quot;', '"')
            .replaceAll('&#39;', "'")
            .replaceAll('&amp;', '&'),
        );
        expect(steps.length).toBeGreaterThan(0);
        for (const step of steps) expect(step.measures).toBe(lab.track);
      });

      it('links to its reference entries and its track course', () => {
        expect(html).toContain(`href="/reference/${lab.entry}/"`);
        for (const id of lab.read) expect(html).toContain(`href="/reference/${id}/"`);
        expect(html).toContain(`href="/skills/${lab.track}/"`);
      });

      it('says points, never chips or money', () => {
        const text = html.replace(/<script[\s\S]*?<\/script>|<[^>]+>/g, ' ');
        expect(text).not.toMatch(/\bchips?\b|₹|\$\d|rupees?/i);
      });

      it('keeps its JavaScript within the 40 KB budget for interactive pages', () => {
        const measured = measure(DIST).find((p) => p.page === `/labs/${lab.slug}/`)!;
        expect(measured.bytes).toBeLessThan(40_000);
      });
    });
  }
});

describe('the labs, linked where learners look', () => {
  const page = (file: string) => readFileSync(new URL(`../dist/${file}`, import.meta.url), 'utf8');

  it('are offered on the home page and the strategy page', () => {
    for (const file of ['index.html', 'skills/index.html']) expect(page(file), file).toContain('href="/labs/"');
  });

  it('are the practice for the tracks they train, on each course page, instead of "comes with"', () => {
    const course = page('skills/cooperate/index.html');
    expect(course).toContain('href="/labs/prisoners-dilemma/"');
    expect(course).not.toMatch(/Comes with the game-theory labs/);
  });

  it('are linked from the reference entries they play out', () => {
    expect(page('reference/labs/prisoners-dilemma/index.html')).toContain('href="/labs/prisoners-dilemma/"');
    expect(page('reference/strategy/winners-curse/index.html')).toContain('href="/labs/sealed-bid-auction/"');
  });
});
