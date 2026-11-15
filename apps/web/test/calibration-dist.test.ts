import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/** These tests read the built site, not the source. Run `pnpm build` first. */
const DIST = new URL('../dist/', import.meta.url).pathname;
if (!existsSync(join(DIST, 'index.html'))) throw new Error('No build found: run `pnpm build` first.');
const read = (file: string) => readFileSync(join(DIST, file), 'utf8').replaceAll('&quot;', '"');

/** An island's props, by its component's name. */
const props = (html: string, name: string) =>
  [...html.matchAll(/<astro-island[^>]*component-url="[^"]*\/(\w+)\.[^"]*"[^>]*props="([^"]*)"/g)]
    .map((m) => [m[1], m[2]!.replaceAll('&quot;', '"')] as const)
    .find(([n]) => n === name)?.[1] ?? '';

describe('calibration on the built site', () => {
  it('places every review card in its setting on the progress page: chess, poker, labs or life', () => {
    const settings = props(readFileSync(join(DIST, 'progress/index.html'), 'utf8'), 'SkillProfile');
    expect(settings).toContain('"reference/labs/prisoners-dilemma/repeat":[0,"labs"]');
    expect(settings).toContain('"poker/a-bet-tells-a-story/compare":[0,"poker"]');
    expect(settings).toContain('"chess/blunder-check/first-question":[0,"chess"]');
    // A strategy question set on a board is a chess question; the same idea at work is a life one.
    expect(settings).toContain('"strategy/blunder-check/compare":[0,"chess"]');
    expect(settings).toContain('"fits/blunder-check/angry-email":[0,"life"]');
  });

  it('offers a calibration round with mixed practice in review, and explains it', () => {
    const review = read('review/index.html');
    expect(review).toContain('How sure? A calibration round');
    expect(review).toContain('10 questions mixed from chess, poker, the labs and life');
  });

  it('explains the score in plain words on the progress page', () => {
    expect(read('progress/index.html')).toContain('0 is perfect, lower is better, and always saying 50% scores 0.25');
  });
});
