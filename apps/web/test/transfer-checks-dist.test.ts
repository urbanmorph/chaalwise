import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { corpus } from './content';

/** These tests read the built site, not the source. Run `pnpm build` first. */
const DIST = new URL('../dist/', import.meta.url).pathname;
if (!existsSync(join(DIST, 'index.html'))) throw new Error('No build found: run `pnpm build` first.');

const pages = readdirSync(DIST, { recursive: true })
  .map(String)
  .filter((f) => /\.(html|txt|xml)$/.test(f));
const read = (file: string) => readFileSync(join(DIST, file), 'utf8');
/** The longest run of a text with no quotes, which pages and island props escape in different ways. */
const plain = (text: string) => text.split(/["'&]/).sort((a, b) => b.length - a.length)[0]!;
const shippedOn = (text: string) => pages.filter((f) => read(f).includes(plain(text)));

const FITS = new URL('../src/content/fits/', import.meta.url);
const situations = readdirSync(FITS, { recursive: true })
  .map(String)
  .filter((f) => f.endsWith('.yaml'))
  .map((f) => parse(readFileSync(new URL(f, FITS), 'utf8')) as { prompt: string; from?: string });
/** What each decision teaches, written for it alone. */
const decisions = [...corpus].filter(([id]) => id.startsWith('later/')).map(([, q]) => q.explanation as string);

describe('the built review page', () => {
  it('carries every "Which idea fits?" situation, and the new ones appear on no other page', () => {
    for (const { prompt, from } of situations) {
      expect(shippedOn(prompt), prompt).toContain('review/index.html');
      if (!from) expect(shippedOn(prompt), prompt).toEqual(['review/index.html']);
    }
  });

  it('carries the cases a week later, whose decisions appear nowhere else: not in practice, the pack or a track page', () => {
    for (const prompt of decisions) expect(shippedOn(prompt), prompt).toEqual(['review/index.html']);
  });

  it('offers the case with the review, and the rounds with mixed practice', () => {
    const review = read('review/index.html');
    const islands = [...review.matchAll(/<astro-island[^>]*component-url="[^"]*\/(\w+)\.[^"]*"[^>]*props="([^"]*)"/g)];
    const props = (name: string) => islands.find(([, n]) => n === name)?.[2] ?? '';
    expect(props('ReviewSession')).toContain('later/wedding-caterer');
    expect(props('MixedPractice')).toContain('fits/blunder-check/angry-email');
  });

  it('counts the situations among the review cards on the progress page', () => {
    expect(read('progress/index.html')).toContain('fits/blunder-check/angry-email');
  });
});
