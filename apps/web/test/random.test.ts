import { describe, expect, it } from 'vitest';
import { shuffle } from '../src/lib/random';

describe('shuffle', () => {
  it('returns a new array with the same items', () => {
    const items = [1, 2, 3, 4, 5];
    const out = shuffle(items);
    expect(out).not.toBe(items);
    expect([...out].sort()).toEqual(items);
  });

  it('puts every item in every place about equally often (Fisher–Yates, not a biased sort)', () => {
    const counts = Array.from({ length: 4 }, () => [0, 0, 0, 0]);
    for (let n = 0; n < 8000; n++) shuffle([0, 1, 2, 3]).forEach((item, place) => counts[item]![place]!++);
    for (const row of counts) for (const c of row) expect(c).toBeGreaterThan(1700);
  });
});
