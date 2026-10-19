import { describe, expect, it } from 'vitest';
import { exchange } from '../src/exchange';
import { pos, sq } from './helpers';

/** Material won by the side that starts capturing, if both sides capture only while it pays. */
describe('exchange counting on a square', () => {
  it('wins an undefended pawn', () => {
    expect(exchange(pos('4k3/8/8/3p4/8/8/8/3RK3 w - - 0 1'), sq('d5'), 'white')).toBe(1);
  });

  it('does not take a pawn defended by a pawn with a rook', () => {
    expect(exchange(pos('4k3/8/4p3/3p4/8/8/8/3RK3 w - - 0 1'), sq('d5'), 'white')).toBe(0);
  });

  it('wins a knight defended by a pawn when taking with a pawn', () => {
    expect(exchange(pos('4k3/8/4p3/3n4/4P3/8/8/4K3 w - - 0 1'), sq('d5'), 'white')).toBe(2);
  });

  it('counts pieces lined up behind each other (x-rays)', () => {
    // Rxd5 Rxd5 Qxd5: a pawn up.
    expect(exchange(pos('4k3/3r4/8/3p4/8/8/3R4/3QK3 w - - 0 1'), sq('d5'), 'white')).toBe(1);
  });

  it('never lets the king capture onto a defended square', () => {
    expect(exchange(pos('4k3/8/8/8/8/8/3n4/4K3 w - - 0 1'), sq('d2'), 'white')).toBe(3);
    expect(exchange(pos('4k3/8/8/8/1b6/8/3n4/4K3 w - - 0 1'), sq('d2'), 'white')).toBe(0);
  });

  it('is zero when nothing can capture', () => {
    expect(exchange(pos('4k3/8/8/3p4/8/8/8/4K3 w - - 0 1'), sq('d5'), 'white')).toBe(0);
  });
});
