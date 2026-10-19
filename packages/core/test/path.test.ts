import { describe, expect, it } from 'vitest';
import { learningPath } from '../src/path';

const chess = (id: string, stage: number, order: number) => ({ id, game: 'chess', stage, order });
const strategy = (id: string, after: string, order = 1) => ({ id, game: 'strategy', stage: 0, order, after });

describe('the learning path', () => {
  it('orders game lessons by stage, then order', () => {
    const path = learningPath([chess('b', 1, 1), chess('a', 0, 2), chess('c', 0, 1)]);
    expect(path.map((l) => l.id)).toEqual(['c', 'a', 'b']);
  });

  it('puts each strategy lesson right after the lesson it follows, in its own order', () => {
    const path = learningPath([
      chess('x', 1, 1),
      chess('y', 1, 2),
      strategy('s2', 'x', 2),
      strategy('s1', 'x', 1),
      strategy('s3', 'y'),
    ]);
    expect(path.map((l) => l.id)).toEqual(['x', 's1', 's2', 'y', 's3']);
  });

  it('can chain a strategy lesson after another', () => {
    const path = learningPath([chess('x', 0, 1), strategy('s1', 'x'), strategy('s2', 's1')]);
    expect(path.map((l) => l.id)).toEqual(['x', 's1', 's2']);
  });

  it('refuses lessons that only follow each other, which would never be reached', () => {
    expect(() => learningPath([chess('x', 0, 1), strategy('s1', 's2'), strategy('s2', 's1')])).toThrow(
      /never reached: s1, s2/,
    );
  });

  it('refuses a strategy lesson that follows a lesson that does not exist', () => {
    expect(() => learningPath([chess('x', 0, 1), strategy('s1', 'nope')])).toThrow(
      /s1 comes after nope, which does not exist/,
    );
  });
});
