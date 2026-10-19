import { describe, expect, it } from 'vitest';
import { hangingPieces, loosePieces } from '../src/hanging';
import { pos } from './helpers';

describe('hanging and loose pieces', () => {
  it('finds a piece that can be taken for free', () => {
    const p = pos('4k3/8/8/3n4/8/8/8/3QK3 w - - 0 1');
    expect(hangingPieces(p, 'black')).toEqual([{ name: 'd5', role: 'knight', loss: 3 }]);
    expect(hangingPieces(p, 'white')).toEqual([]);
  });

  it('finds a defended piece attacked by something cheaper', () => {
    const p = pos('4k3/8/5p2/4r3/3P4/8/8/4K3 w - - 0 1');
    expect(hangingPieces(p, 'black')).toEqual([{ name: 'e5', role: 'rook', loss: 4 }]);
  });

  it('calls an undefended piece loose even before anything attacks it', () => {
    const p = pos('4k3/8/8/3n4/8/8/8/4K3 w - - 0 1');
    expect(hangingPieces(p, 'black')).toEqual([]);
    expect(loosePieces(p, 'black')).toEqual([{ name: 'd5', role: 'knight' }]);
  });

  it('does not call pawns or the king loose', () => {
    expect(loosePieces(pos('4k3/8/8/3p4/8/8/8/4K3 w - - 0 1'), 'black')).toEqual([]);
  });
});
