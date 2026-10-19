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
});
