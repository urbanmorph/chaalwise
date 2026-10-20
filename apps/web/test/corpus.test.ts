import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { askedIds, corpus } from './content';

describe('the question corpus', () => {
  it('holds every question once, each under its game and idea', () => {
    expect(corpus.size).toBeGreaterThan(200);
    for (const id of corpus.keys()) expect(id, id).toMatch(/^(chess|poker|labs|life)\/[a-z0-9-]+\/[a-z0-9-]+$/);
  });

  it('gives every question its own review card', () => {
    const cards = [...corpus].map(([id, data]) => (data.card as string | undefined) ?? id);
    expect(new Set(cards).size).toBe(cards.length);
  });

  it('asks only questions that exist', () => {
    for (const id of askedIds()) expect(corpus.has(id), id).toBe(true);
  });

  it('has no question that nothing asks and nothing practises', () => {
    const asked = new Set(askedIds());
    expect([...corpus].filter(([id, data]) => !asked.has(id) && !data.measures).map(([id]) => id)).toEqual([]);
  });

  it('keeps boards to chess: life questions are about life, and poker and the labs have no chess board yet', () => {
    const boarded = [...corpus].filter(
      ([id, data]) => !id.startsWith('chess/') && (data.position || data.kind !== 'choice'),
    );
    expect(boarded.map(([id]) => id)).toEqual([]);
  });
});

describe('every strategy idea', () => {
  const ideas = readdirSync(new URL('../src/content/lessons/strategy/', import.meta.url)).map((f) =>
    f.replace('.md', ''),
  );
  const inIdea = (idea: string) => [...corpus].filter(([id]) => id.split('/')[1] === idea);

  /** Review shows one question of an idea at a time, so each idea needs several to vary. */
  it('has at least three questions off the board, unless it already has five in all', () => {
    const thin = ideas.filter((idea) => {
      const all = inIdea(idea);
      return all.filter(([id]) => id.startsWith('life/')).length < 3 && all.length < 5;
    });
    expect(thin).toEqual([]);
  });

  it('measures one track off the board, so its questions are variants of each other', () => {
    const mixed = ideas.filter(
      (idea) =>
        new Set(
          inIdea(idea)
            .filter(([id]) => id.startsWith('life/'))
            .map(([, d]) => d.measures),
        ).size > 1,
    );
    expect(mixed).toEqual([]);
  });
});

describe('every question names its setting', () => {
  /**
   * Terms that belong to one game or sport, with little everyday meaning of their own.
   * A question about life that uses one must say which game it means: mixed practice
   * and review show it alone, with no lesson around it to say so.
   */
  const GAMES: [name: RegExp, terms: RegExp][] = [
    [
      /\bchess\b/i,
      /\b(knight|bishop|rook|pawn|checkmate|stalemate|castling|en passant|back rank|sicilian|recapture)s?\b/i,
    ],
    [/\bpoker\b/i, /\b(the flop|river card|turn card|big blind|pot odds|check-raise|hole cards|all-in)\b/i],
    [/\b(football|soccer)\b/i, /\b(penalty kick|penalty taker|goalkeeper|offside|free kick|corner kick)s?\b/i],
    [/\bcricket\b/i, /\b(wicket|innings|bowler|batsman|lbw)s?\b/i],
    [/\btennis\b/i, /\b(deuce|double fault|tiebreak|break point)s?\b/i],
    [/\bgolf\b/i, /\b(birdie|bogey|putt)s?\b/i],
    [/\bbasketball\b/i, /\b(free throw|three-pointer)s?\b/i],
  ];

  it('names the game whenever a question about life uses its terms', () => {
    const unnamed = [...corpus]
      .filter(([id]) => id.startsWith('life/'))
      .flatMap(([id, data]) => {
        const text = JSON.stringify(data);
        return GAMES.filter(([name, terms]) => terms.test(text) && !name.test(text)).map(
          ([name]) => `${id}: ${name.source}`,
        );
      });
    expect(unnamed).toEqual([]);
  });

  it('names the setting in the question itself, not only in the feedback', () => {
    const unnamed = [...corpus]
      .filter(([id]) => id.startsWith('life/'))
      .flatMap(([id, data]) => {
        const prompt = `${data.prompt as string} ${(data.alongside as string | undefined) ?? ''}`;
        return GAMES.filter(([name, terms]) => terms.test(prompt) && !name.test(prompt)).map(
          ([name]) => `${id}: ${name.source}`,
        );
      });
    expect(unnamed).toEqual([]);
  });
});
