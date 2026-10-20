import { referenceSchema, type ReferenceEntry } from '@chaalwise/core/reference';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { entryHref, numberedMoves, referenceIssues } from '../src/lib/reference';
import { matchesQuery, searchText } from '../src/lib/search';

const entry = (fields: Record<string, unknown>) =>
  referenceSchema.parse({
    term: 'Fork',
    game: 'chess',
    kind: 'tactic',
    level: 'beginner',
    summary: 'One piece attacks two.',
    ...fields,
  });

describe('checking a chess entry', () => {
  it('accepts a legal position and a legal key move', () => {
    expect(referenceIssues(entry({ position: 'r3k3/5ppp/8/3N4/8/8/5PPP/6K1 w - - 0 1', move: 'd5c7' }))).toEqual([]);
  });

  it('rejects an illegal move, an impossible position and moves that are not legal', () => {
    expect(referenceIssues(entry({ position: 'start', move: 'e2e5' }))[0]!.message).toMatch(/not a legal move/);
    expect(referenceIssues(entry({ position: '8/8/8/8/8/8/8/8 w - - 0 1', move: 'e2e4' })).length).toBeGreaterThan(0);
    expect(referenceIssues(entry({ position: 'moves: e4 e5 Nf9' }))[0]!.path).toEqual(['position']);
  });

  it('asks for castling written as the king moves, like the lessons', () => {
    const fen = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
    expect(referenceIssues(entry({ position: fen, move: 'e1h1' }))[0]!.message).toMatch(/write it as e1g1/);
  });
});

describe('showing an entry', () => {
  it('numbers an opening’s moves the way books do', () => {
    expect(numberedMoves('e4 e5 Nf3 Nc6 Bc4')).toBe('1.e4 e5 2.Nf3 Nc6 3.Bc4');
    expect(numberedMoves('d4')).toBe('1.d4');
  });

  it('links an entry by its game and name', () => {
    expect(entryHref('chess/fork')).toBe('/reference/chess/fork/');
  });
});

describe('search', () => {
  const kid = entry({
    term: "King's Indian Defence",
    kind: 'opening',
    family: 'indian',
    position: 'moves: d4 Nf6',
    aliases: ['KID'],
    summary: 'Black lets White build a centre.',
  });
  const text = searchText(kid as ReferenceEntry);

  it('finds an entry by its name, another name, or words in its summary, ignoring case and accents', () => {
    for (const q of ['kings indian', "King's", 'kid', 'centre', 'INDIAN DEF'])
      expect(matchesQuery(text, q), q).toBe(true);
    expect(matchesQuery(searchText(entry({ term: 'Grünfeld Defence' })), 'grunfeld')).toBe(true);
  });

  it('needs every word to match, and matches everything when the query is empty', () => {
    expect(matchesQuery(text, 'indian fork')).toBe(false);
    expect(matchesQuery(text, '  ')).toBe(true);
  });
});

describe('the reference page as built', () => {
  const html = readFileSync(new URL('../dist/reference/index.html', import.meta.url), 'utf8');

  // A form shown only once the script runs pushes the list down on slow phones (Lighthouse saw a 0.17 shift).
  it('lays out the search form at build time, so the list does not jump when the script starts', () => {
    const form = html.match(/<form[^>]*data-find[^>]*>/)![0];
    expect(form).not.toMatch(/\bhidden\b/);
  });
});

describe('more practice elsewhere', () => {
  const page = (id: string) => readFileSync(new URL(`../dist/reference/${id}/index.html`, import.meta.url), 'utf8');

  it('links to the matching puzzles on Lichess, credited, and says they do not count here', () => {
    const html = page('chess/fork');
    expect(html).toContain('href="https://lichess.org/training/fork"');
    expect(html).toMatch(/on Lichess/);
    expect(html).toMatch(/not counted in your progress here/);
  });

  it('links only where Lichess has an exact match', () => {
    expect(page('chess/outpost')).not.toContain('lichess.org/training');
  });

  it('writes the theme as a Lichess page name', () => {
    expect(
      referenceSchema.safeParse({
        term: 'F',
        game: 'chess',
        kind: 'tactic',
        level: 'beginner',
        summary: 's',
        lichess: 'fork',
      }).success,
    ).toBe(true);
    expect(
      referenceSchema.safeParse({
        term: 'F',
        game: 'chess',
        kind: 'tactic',
        level: 'beginner',
        summary: 's',
        lichess: 'https://lichess.org/x',
      }).success,
    ).toBe(false);
    expect(
      referenceSchema.safeParse({
        term: 'F',
        game: 'poker',
        kind: 'odds',
        level: 'beginner',
        summary: 's',
        lichess: 'fork',
      }).success,
    ).toBe(false);
  });
});
