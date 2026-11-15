import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GAMES, askedIds, corpus } from './content';

describe('the question corpus', () => {
  it('holds every question once, each under its game and idea', () => {
    expect(corpus.size).toBeGreaterThan(200);
    for (const id of corpus.keys())
      expect(id, id).toMatch(/^(chess|poker|labs|life|cases|later)\/[a-z0-9-]+\/[a-z0-9-]+$/);
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
  it('has at least three questions off the board, however many it has on it', () => {
    const thin = ideas.filter((idea) => inIdea(idea).filter(([id]) => id.startsWith('life/')).length < 3);
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
  /** Questions about life off the board: the life questions, and the decisions in the work cases and the cases a week later. */
  const offBoard = [...corpus].filter(([id]) => /^(life|cases|later)\//.test(id));

  it('names the game whenever a question about life uses its terms', () => {
    const unnamed = offBoard.flatMap(([id, data]) => {
      const text = JSON.stringify(data);
      return GAMES.filter(([name, terms]) => terms.test(text) && !name.test(text)).map(
        ([name]) => `${id}: ${name.source}`,
      );
    });
    expect(unnamed).toEqual([]);
  });

  it('names the setting in the question itself, not only in the feedback', () => {
    const unnamed = offBoard.flatMap(([id, data]) => {
      const prompt = `${data.prompt as string} ${(data.alongside as string | undefined) ?? ''}`;
      return GAMES.filter(([name, terms]) => terms.test(prompt) && !name.test(prompt)).map(
        ([name]) => `${id}: ${name.source}`,
      );
    });
    expect(unnamed).toEqual([]);
  });
});
