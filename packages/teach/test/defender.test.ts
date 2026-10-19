import { describe, expect, it } from 'vitest';
import { loneKingMove } from '../src/defender';
import { kingMoves } from '../src/endgame';
import { legalMoves, play } from '../src/position';
import { pos } from './helpers';

describe('the lone-king defender', () => {
  it('has no move when stalemated', () => {
    expect(loneKingMove(pos('k7/8/1Q6/8/8/8/8/4K3 b - - 0 1'))).toBeUndefined();
  });

  it('takes a piece left undefended next to it', () => {
    expect(loneKingMove(pos('8/8/8/3k4/3Q4/8/8/7K b - - 0 1'))).toBe('d5d4');
  });

  it('heads for the most room, so the learner has to box it in', () => {
    const p = pos('8/8/8/8/3k4/8/8/4KQ2 b - - 0 1');
    const room = (uci: string) => kingMoves(play(p, uci), 'black');
    const best = Math.max(...legalMoves(p).map(room));
    expect(room(loneKingMove(p)!)).toBe(best);
  });
});
