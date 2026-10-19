import { describe, expect, it } from 'vitest';
import { arrowPoints, isKnightMove, squareCenter } from '../src/lib/arrows';

/** Points are in square units on the board as the learner sees it: x to the right, y down, 0 to 8. */
describe('arrow geometry', () => {
  it('puts each square at its centre, turning the board for Black', () => {
    expect(squareCenter('a1', 'white')).toEqual([0.5, 7.5]);
    expect(squareCenter('h8', 'white')).toEqual([7.5, 0.5]);
    expect(squareCenter('a1', 'black')).toEqual([7.5, 0.5]);
  });

  it('knows a knight move by its shape', () => {
    expect(isKnightMove('g1', 'f3')).toBe(true);
    expect(isKnightMove('b1', 'd2')).toBe(true);
    expect(isKnightMove('e2', 'e4')).toBe(false);
    expect(isKnightMove('c1', 'h6')).toBe(false);
  });

  it('draws other moves as one straight line', () => {
    expect(arrowPoints('e2', 'e4', 'white')).toEqual([
      [4.5, 6.5],
      [4.5, 4.5],
    ]);
  });

  it('draws a knight move as an L: two squares along the long side, then one across', () => {
    expect(arrowPoints('g1', 'f3', 'white')).toEqual([
      [6.5, 7.5],
      [6.5, 5.5],
      [5.5, 5.5],
    ]);
    expect(arrowPoints('b1', 'd2', 'white')).toEqual([
      [1.5, 7.5],
      [3.5, 7.5],
      [3.5, 6.5],
    ]);
  });

  it('turns the L with the board for Black', () => {
    expect(arrowPoints('g1', 'f3', 'black')).toEqual([
      [1.5, 0.5],
      [1.5, 2.5],
      [2.5, 2.5],
    ]);
  });
});
