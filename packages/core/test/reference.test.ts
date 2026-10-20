import { describe, expect, it } from 'vitest';
import { referenceSchema } from '../src/reference';

const base = {
  term: 'Fork',
  game: 'chess',
  kind: 'tactic',
  level: 'beginner',
  summary: 'One piece attacks two at once.',
};

describe('a reference entry', () => {
  it('accepts a plain game entry, with no aliases or links', () => {
    expect(referenceSchema.parse(base)).toMatchObject({ aliases: [], related: [] });
  });

  it('needs a strategy entry to say why it matters, where it shows up in life, and the skill it trains', () => {
    const result = referenceSchema.safeParse({ ...base, game: 'strategy', kind: 'principle' });
    expect(result.success).toBe(false);
    expect(result.error!.issues.map((i) => i.path[0]).sort()).toEqual(['inLife', 'skill', 'why']);
  });

  it('needs an opening to name its family and give its moves', () => {
    const result = referenceSchema.safeParse({ ...base, kind: 'opening' });
    expect(result.error!.issues.map((i) => i.path[0]).sort()).toEqual(['family', 'position']);
    expect(
      referenceSchema.safeParse({ ...base, kind: 'opening', family: 'open', position: 'moves: e4 e5 Nf3 Nc6 Bc4' })
        .success,
    ).toBe(true);
  });

  it('keeps boards to chess', () => {
    expect(referenceSchema.safeParse({ ...base, game: 'poker', kind: 'odds', position: 'start' }).success).toBe(false);
  });

  it('writes the key move in UCI, such as d5c7', () => {
    expect(referenceSchema.safeParse({ ...base, move: 'Nc7' }).success).toBe(false);
    expect(referenceSchema.safeParse({ ...base, position: 'start', move: 'g1f3' }).success).toBe(true);
  });

  describe('try it yourself', () => {
    it('asks one to three questions from the corpus, by id', () => {
      expect(referenceSchema.parse({ ...base, try: ['chess/fork/find', 'chess/fork/defend'] }).try).toHaveLength(2);
      expect(referenceSchema.safeParse({ ...base, try: [] }).success).toBe(false);
      expect(
        referenceSchema.safeParse({ ...base, try: ['chess/a/b', 'chess/a/c', 'chess/a/d', 'chess/a/e'] }).success,
      ).toBe(false);
    });

    it('keeps questions in the corpus, never written into the entry', () => {
      const written = { kind: 'choice', id: 'c', prompt: 'p', options: ['a', 'b'], answer: 0, explanation: 'e' };
      expect(referenceSchema.safeParse({ ...base, try: [written] }).success).toBe(false);
    });

    it('asks each question once', () => {
      expect(referenceSchema.safeParse({ ...base, try: ['chess/fork/find', 'chess/fork/find'] }).success).toBe(false);
    });
  });
});
