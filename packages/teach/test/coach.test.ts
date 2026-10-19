import { describe, expect, it } from 'vitest';
import { nudgeAfter } from '../src/coach';
import { pos } from './helpers';

describe('coach nudges after a learner move', () => {
  it('warns when the move leaves a piece to be taken for free', () => {
    // Qc4+ lands next to the black king on d5 with nothing defending it.
    expect(nudgeAfter(pos('8/8/8/3k4/8/8/8/2Q1K3 w - - 0 1'), 'c1c4')).toMatchObject({
      id: 'hanging',
      text: expect.stringMatching(/queen on c4/),
    });
  });

  it('says "can be won" rather than "for free" when the piece is defended but attacked by something cheaper', () => {
    // Re5 lands where the d6 pawn takes it; the d4 pawn takes back, but a rook for a pawn is still a loss.
    const n = nudgeAfter(pos('4k3/8/3p4/7R/3P4/8/8/6K1 w - - 0 1'), 'h5e5');
    expect(n?.text).toMatch(/rook on e5 can be won/);
    expect(n?.text).not.toMatch(/for free/);
  });

  it('warns when the lone king has one square left, before a stalemate', () => {
    // After Qd7 the king on a8 can only go to b8.
    expect(nudgeAfter(pos('k7/8/8/8/8/8/3Q4/4K3 w - - 0 1'), 'd2d7')?.id).toBe('stalemate-risk');
  });

  it('explains a stalemate when the move leaves no legal move and no check', () => {
    // After Qc7 the king on a8 has no square and is not in check.
    expect(nudgeAfter(pos('k7/8/8/2Q5/8/8/8/4K3 w - - 0 1'), 'c5c7')?.id).toBe('stalemate');
  });

  it('says nothing about a good, ordinary move', () => {
    expect(nudgeAfter(pos('8/8/8/4k3/8/8/8/4KQ2 w - - 0 1'), 'f1f3')).toBeUndefined();
  });

  it('does not nudge a move that mates', () => {
    expect(nudgeAfter(pos('k7/8/1K6/8/8/8/7Q/8 w - - 0 1'), 'h2h8')).toBeUndefined();
  });
});
