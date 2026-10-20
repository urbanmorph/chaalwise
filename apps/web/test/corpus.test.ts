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
