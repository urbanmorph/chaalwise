import { describe, expect, it } from 'vitest';
import { playTurn } from '../src/play';

describe('one turn of a play-out against the lone king', () => {
  it('wins on checkmate, with no reply', () => {
    expect(playTurn('k7/8/1K6/8/8/8/7Q/8 w - - 0 1', 'h2h8', 5)).toMatchObject({ status: 'won', reply: undefined });
  });

  it('loses on stalemate, and says why', () => {
    expect(playTurn('k7/8/8/2Q5/8/8/8/4K3 w - - 0 1', 'c5c7', 5)).toMatchObject({
      status: 'lost',
      reason: 'stalemate',
      nudge: { id: 'stalemate' },
    });
  });

  it('loses when the king takes the only piece that could mate', () => {
    expect(playTurn('8/8/8/3k4/8/8/8/2Q1K3 w - - 0 1', 'c1c4', 5)).toMatchObject({
      status: 'lost',
      reason: 'piece-lost',
      reply: 'd5c4',
      nudge: { id: 'hanging' },
    });
  });

  it('loses when the last allowed move does not mate', () => {
    expect(playTurn('8/8/8/4k3/8/8/8/4KQ2 w - - 0 1', 'f1f3', 1)).toMatchObject({
      status: 'lost',
      reason: 'out-of-moves',
    });
  });

  it('otherwise replies and carries on', () => {
    const turn = playTurn('8/8/8/4k3/8/8/8/4KQ2 w - - 0 1', 'f1f3', 10);
    expect(turn).toMatchObject({ status: 'playing', reason: undefined });
    expect(turn.reply).toMatch(/^e5/);
    expect(turn.fen.split(' ')[1]).toBe('w');
  });
});
