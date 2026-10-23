import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

/** Reads the built site (run `pnpm build` first) and the lesson files. */
const dist = (file: string) => readFileSync(new URL(`../dist/${file}`, import.meta.url), 'utf8');
const steps = (lesson: string): { kind?: string; id?: string; ask?: string; text?: string; highlight?: string[] }[] =>
  parse(readFileSync(new URL(`../src/content/lessons/${lesson}.md`, import.meta.url), 'utf8').split('---')[1]!).steps;

describe('a beginner who only wants chess or poker', () => {
  it('is pointed to each game’s first lesson from the home page and where to start', () => {
    for (const page of ['index.html', 'start/index.html']) {
      const line = dist(page).match(/<p class="new-to-game"[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? '';
      expect(line).toContain('href="/chess/"');
      expect(line).toContain('href="/poker/"');
    }
  });

  it('meets every piece, by its picture on the board, before the first lesson names it', () => {
    const meet = steps('chess/board').slice(0, 6);
    expect(meet.map((s) => s.kind)).toEqual(Array(6).fill('read'));
    const named = meet.map((s) => s.text!.match(/\b(rook|knight|bishop|queen|king|pawn)s?\b/i)![1]!.toLowerCase());
    expect(named.sort()).toEqual(['bishop', 'king', 'knight', 'pawn', 'queen', 'rook']);
    for (const s of meet) expect(s.highlight?.length).toBeGreaterThan(0);
  });

  it('is taught pot odds before being asked about them', () => {
    const ids = steps('poker/outs-and-odds').map((s) => s.id ?? s.ask);
    expect(ids.indexOf('pot-odds')).toBeGreaterThan(-1);
    expect(ids.indexOf('pot-odds')).toBeLessThan(ids.indexOf('poker/outs-and-odds/pot-odds'));
  });

  it('gets a key to chess notation on every strategy lesson, all of which show chess moves', () => {
    const lessons = readdirSync(new URL('../src/content/lessons/strategy/', import.meta.url)).map((f) =>
      f.replace(/\.md$/, ''),
    );
    expect(lessons.length).toBeGreaterThan(20);
    for (const slug of lessons) {
      const key = dist(`skills/${slug}/index.html`).match(/<p class="notation-key"[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? '';
      expect(key, slug).toContain('href="/chess/notation/"');
      expect(key, slug).toMatch(/N[^a-z]*knight/);
    }
  });
});

describe('amounts', () => {
  it('says once, on a case with rupee amounts, that they are rupees', () => {
    expect(dist('cases/cafe-supplier/index.html')).toContain('amounts are in Indian rupees (₹)');
    expect(dist('cases/group-project/index.html')).not.toContain('Indian rupees');
  });

  it('marks the home page’s amount so it can be written the reader’s way', () => {
    expect(dist('index.html')).toMatch(/<span class="amount"[^>]*>₹40 lakh<\/span>/);
  });
});
