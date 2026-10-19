import { describe, expect, it } from 'vitest';
import { makeUci } from 'chessops/util';
import { captures, checks, opponentThreats, threats } from '../src/forcing';
import { hangingPieces } from '../src/hanging';
import { play } from '../src/position';
import { pos } from './helpers';

const legalUcis = (p: ReturnType<typeof pos>) =>
  [...p.allDests()].flatMap(([from, tos]) => [...tos].map((to) => makeUci({ from, to })));

describe('checks, captures and threats (the blunder check)', () => {
  const p = pos('4k3/8/8/3n4/8/8/8/3QK3 w - - 0 1');

  it('lists exactly the moves that give check', () => {
    const found = new Set(checks(p));
    expect(found).toContain('d1a4');
    expect(found).toContain('d1h5');
    for (const uci of legalUcis(p)) expect(found.has(uci)).toBe(play(p, uci).isCheck());
  });

  it('lists exactly the moves that capture', () => {
    expect(captures(p)).toEqual(['d1d5']);
  });

  it('lists quiet moves that attack something that can then be won', () => {
    const q = pos('4k3/8/8/8/2n5/8/8/3QK3 w - - 0 1');
    const found = threats(q);
    expect(found).toContain('d1d4');
    for (const uci of found) {
      const after = play(q, uci);
      expect(after.isCheck()).toBe(false);
      expect(hangingPieces(after, 'black').length).toBeGreaterThan(0);
    }
  });

  it('shows what the opponent threatens if you do nothing', () => {
    // The knight on c3 attacks the queen on d1.
    expect(opponentThreats(pos('4k3/8/8/8/8/2n5/8/3QK3 w - - 0 1'))).toContainEqual({
      uci: 'c3d1',
      kind: 'capture',
      wins: 6,
    });
  });

  it('scores each capture on its own: a queen taking a defended rook is not a threat', () => {
    // Black to move; if it were White's move, Nxb5 wins the rook but Qxb5 cxb5 loses the queen.
    const found = opponentThreats(pos('4k3/8/2p5/1r6/8/2N5/1Q6/4K3 b - - 0 1')).map((t) => t.uci);
    expect(found).toContain('c3b5');
    expect(found).not.toContain('b2b5');
  });

  it('includes a mate the opponent threatens', () => {
    expect(opponentThreats(pos('4r1k1/5ppp/8/8/8/8/5PPP/6K1 w - - 0 1'))).toContainEqual({
      uci: 'e8e1',
      kind: 'mate',
      wins: Infinity,
    });
  });
});
