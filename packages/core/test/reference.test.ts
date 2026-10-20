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
    const choice = {
      kind: 'choice',
      id: 'which',
      prompt: 'Which?',
      options: ['a', 'b'],
      answer: 0,
      explanation: 'Because.',
    };
    const move = {
      kind: 'move',
      id: 'find',
      prompt: 'Find it.',
      position: 'start',
      answers: ['g1f3'],
      explanation: 'Develops.',
    };

    it('takes one to three questions in the lesson formats', () => {
      expect(referenceSchema.parse({ ...base, try: [choice, move] }).try).toHaveLength(2);
      expect(referenceSchema.safeParse({ ...base, try: [] }).success).toBe(false);
      expect(
        referenceSchema.safeParse({ ...base, try: [choice, move, { ...choice, id: 'c' }, { ...choice, id: 'd' }] })
          .success,
      ).toBe(false);
    });

    it('leaves out reading steps: every question is tried', () => {
      expect(referenceSchema.safeParse({ ...base, try: [{ kind: 'read', id: 'r', text: 'Just read.' }] }).success).toBe(
        false,
      );
    });

    it('needs different ids for each question', () => {
      expect(referenceSchema.safeParse({ ...base, try: [choice, choice] }).success).toBe(false);
    });

    it('lets strategy entries show their idea on a chess board, but not poker or the labs, which have no board yet', () => {
      const strategy = { ...base, game: 'strategy', kind: 'principle', why: 'w', inLife: 'l', skill: 'think-ahead' };
      expect(referenceSchema.safeParse({ ...strategy, try: [move] }).success).toBe(true);
      expect(referenceSchema.safeParse({ ...base, game: 'poker', kind: 'odds', try: [move] }).success).toBe(false);
      expect(referenceSchema.safeParse({ ...base, game: 'poker', kind: 'odds', try: [choice] }).success).toBe(true);
    });
  });
});
