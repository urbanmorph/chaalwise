import { describe, expect, it } from 'vitest';
import { verifyPuzzle } from '../src/verify.ts';

const mateInOne = {
  id: '000rZ',
  fen: '2kr1b1r/p1p2pp1/2pqb3/7p/3N2n1/2NPB3/PPP2PPP/R2Q1RK1 w - - 2 13',
  moves: ['d4e6', 'd6h2'],
  rating: 662,
  themes: ['kingsideAttack', 'mate', 'mateIn1', 'oneMove', 'opening'],
};

describe('verifyPuzzle', () => {
  it('accepts a puzzle whose moves are legal from the FEN, the first being the opponent’s', () => {
    expect(verifyPuzzle(mateInOne)).toBe(true);
    expect(
      verifyPuzzle({
        id: '000Pw',
        fen: '6k1/5p1p/4p3/4q3/3nN3/2Q3P1/PP3P1P/6K1 w - - 2 37',
        moves: ['e4d2', 'd4e2', 'g1f1', 'e2c3'],
        rating: 1530,
        themes: ['fork'],
      }),
    ).toBe(true);
  });

  it('rejects illegal moves, a bad FEN, or an odd number of moves', () => {
    expect(verifyPuzzle({ ...mateInOne, moves: ['a1a8', 'h8h1'] })).toBe(false);
    expect(verifyPuzzle({ ...mateInOne, fen: 'not a fen' })).toBe(false);
    expect(verifyPuzzle({ ...mateInOne, moves: ['d4e6'] })).toBe(false);
    expect(verifyPuzzle({ ...mateInOne, moves: ['zz', 'd6h2'] })).toBe(false);
  });

  it('rejects a mate puzzle whose last move is not mate', () => {
    // Legal moves, but the queen goes elsewhere.
    expect(verifyPuzzle({ ...mateInOne, moves: ['d4e6', 'd6d7'] })).toBe(false);
  });
});
