import { describe, expect, it } from 'vitest';
import { INITIAL_FEN } from 'chessops/fen';
import { backRankWeak, edgeDistance, kingMoves, materialSignature } from '../src/endgame';
import { pos, sq } from './helpers';

describe('endgame helpers', () => {
  it('names the basic mating material', () => {
    expect(materialSignature(pos('8/8/8/4k3/8/8/8/4KQ2 w - - 0 1'))).toEqual({
      signature: 'KQvK',
      strong: 'white',
    });
    expect(materialSignature(pos('8/8/8/4k3/8/8/8/r3K3 w - - 0 1'))).toEqual({
      signature: 'KRvK',
      strong: 'black',
    });
    expect(materialSignature(pos(INITIAL_FEN))).toBeUndefined();
  });

  it("counts a king's legal moves", () => {
    // The queen on f1 covers the f-file, leaving d4, d5, d6, e4 and e6.
    expect(kingMoves(pos('8/8/8/4k3/8/8/8/4KQ2 b - - 0 1'), 'black')).toBe(5);
  });

  it('measures how far a square is from the edge', () => {
    expect(edgeDistance(sq('a4'))).toBe(0);
    expect(edgeDistance(sq('e5'))).toBe(3);
  });

  it('spots a king trapped on its back rank by its own pawns, even with squares along that rank', () => {
    const p = pos('4r1k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1');
    expect(backRankWeak(p, 'white')).toBe(true);
    expect(backRankWeak(pos('4r1k1/5ppp/8/8/8/7P/5PP1/3R2K1 w - - 0 1'), 'white')).toBe(false);
  });
});
