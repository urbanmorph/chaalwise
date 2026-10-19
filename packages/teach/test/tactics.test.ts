import { describe, expect, it } from 'vitest';
import { forkingMoves, forks, pins, skewers } from '../src/tactics';
import { play } from '../src/position';
import { pos } from './helpers';

describe('pins', () => {
  it('finds a piece pinned to its king', () => {
    expect(pins(pos('4k3/4r3/8/8/8/8/4N3/4K3 w - - 0 1'), 'white')).toEqual([{ pinned: 'e2', by: 'e7', to: 'e1' }]);
  });

  it('finds a piece pinned to a more valuable piece', () => {
    expect(pins(pos('4k3/4p3/8/b7/8/2N5/8/4Q1K1 w - - 0 1'), 'white')).toEqual([{ pinned: 'c3', by: 'a5', to: 'e1' }]);
  });

  it('does not call it a pin when the piece behind is worth less', () => {
    // The queen on e3 stands in front of a knight: losing the knight is not the point.
    expect(pins(pos('4k3/4r3/8/8/8/4Q3/4N3/6K1 w - - 0 1'), 'white')).toEqual([]);
  });
});

describe('forks', () => {
  const p = pos('r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1');

  it('finds a move that attacks the king and a rook at once', () => {
    expect(forkingMoves(p)).toContain('b5c7');
  });

  it('describes the fork after it is played', () => {
    expect(forks(play(p, 'b5c7'), 'white')).toEqual([{ by: 'c7', targets: ['a8', 'e8'] }]);
  });

  it('does not count a fork by a piece that is simply lost', () => {
    // c7 is covered by the bishop on b8, which takes the knight for free.
    expect(forkingMoves(pos('rb2k3/8/8/1N6/8/8/8/4K3 w - - 0 1'))).not.toContain('b5c7');
  });
});

describe('skewers', () => {
  it('finds a check that wins the piece behind the king', () => {
    expect(skewers(pos('7B/8/8/4k3/8/6K1/8/r7 b - - 0 1'), 'white')).toEqual([{ by: 'h8', front: 'e5', behind: 'a1' }]);
  });
});
