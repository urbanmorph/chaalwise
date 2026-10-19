import { INITIAL_FEN } from 'chessops/fen';
import { describe, expect, it } from 'vitest';
import { moveSafety } from '../src/safety';
import { pos } from './helpers';

describe('is this move safe?', () => {
  it('calls a quiet developing move safe', () => {
    expect(moveSafety(pos(INITIAL_FEN), 'e2e4')).toMatchObject({ safe: true, net: 0 });
  });

  it('calls a move unsafe when it puts a piece where a pawn takes it', () => {
    const result = moveSafety(pos('4k3/8/4p3/8/8/8/8/3QK3 w - - 0 1'), 'd1d5');
    expect(result).toMatchObject({ safe: false, net: -9 });
    expect(result.losses).toEqual([{ name: 'd5', role: 'queen', loss: 9 }]);
  });

  it('counts what a capture wins against what it then loses', () => {
    // Qxd5 exd5: a knight for the queen.
    expect(moveSafety(pos('4k3/8/4p3/3n4/8/8/8/3QK3 w - - 0 1'), 'd1d5')).toMatchObject({
      safe: false,
      net: -6,
    });
    // exd5 exd5: a knight for a pawn.
    expect(moveSafety(pos('4k3/8/4p3/3n4/4P3/8/8/4K3 w - - 0 1'), 'e4d5')).toMatchObject({
      safe: true,
      net: 2,
    });
  });

  it('calls a move unsafe when it allows mate next move', () => {
    const p = pos('4r1k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1');
    expect(moveSafety(p, 'd1d5')).toMatchObject({ safe: false, allowsMate: 'e8e1' });
    expect(moveSafety(p, 'h2h3')).toMatchObject({ safe: true, allowsMate: undefined });
  });

  it('knows a check limits the reply: the bishop is saved after the king moves', () => {
    expect(moveSafety(pos('4k3/8/5n2/8/6B1/8/8/R3K3 w - - 0 1'), 'a1a8')).toMatchObject({ safe: true, net: 0 });
  });

  it('counts a pawn lost to en passant', () => {
    // After b2b4, the black pawn on a4 can take it en passant, and nothing takes back.
    expect(moveSafety(pos('4k3/8/8/8/p7/8/1P6/4K3 w - - 0 1'), 'b2b4')).toMatchObject({ safe: false, net: -1 });
  });

  it('rejects an illegal move', () => {
    expect(() => moveSafety(pos(INITIAL_FEN), 'e2e5')).toThrow(/legal/);
  });
});
