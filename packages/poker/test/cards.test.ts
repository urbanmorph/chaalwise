import { describe, expect, it } from 'vitest';
import { cardName, deck, rankName, rankPlural, shuffle, type Card } from '../src/cards';
import { seeded } from '../src/random';

describe('cards', () => {
  it('builds a deck of 52 different cards in a fixed order', () => {
    const cards = deck();
    expect(cards).toHaveLength(52);
    expect(new Set(cards).size).toBe(52);
    expect(cards[0]).toBe('2s');
    expect(deck()).toEqual(cards);
  });

  it('shuffles a copy, keeping every card, and repeats with the same seed', () => {
    const cards = deck();
    const once = shuffle(cards, seeded(7));
    expect(cards).toEqual(deck());
    expect(once).not.toEqual(cards);
    expect([...once].sort()).toEqual([...cards].sort());
    expect(shuffle(cards, seeded(7))).toEqual(once);
    expect(shuffle(cards, seeded(8))).not.toEqual(once);
  });

  it('names cards and ranks in plain English', () => {
    expect(cardName('As')).toBe('Ace of spades');
    expect(cardName('Th')).toBe('Ten of hearts');
    expect(cardName('2d' as Card)).toBe('Two of diamonds');
    expect(cardName('Qc')).toBe('Queen of clubs');
    expect(rankName('J')).toBe('jack');
    expect(rankPlural('6')).toBe('sixes');
    expect(rankPlural('A')).toBe('aces');
  });
});

describe('seeded random', () => {
  it('gives numbers in [0, 1) and repeats for a seed', () => {
    const a = seeded(1);
    const b = seeded(1);
    for (let i = 0; i < 100; i++) {
      const x = a();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
      expect(b()).toBe(x);
    }
  });
});
