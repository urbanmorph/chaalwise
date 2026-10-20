import { seeded } from '@chaalwise/teach/generate';
import { fromFen, legal } from '@chaalwise/teach/position';
import { describe, expect, it } from 'vitest';
import { coachNote, gentleReply } from '../src/lib/first-moves';
import { START, playUci } from '../src/lib/chess';

describe('the gentle bot for a first game', () => {
  it('always plays a legal move', () => {
    const fen = playUci(START, 'e2e4');
    for (let seed = 1; seed <= 20; seed++) {
      const reply = gentleReply(fen, seeded(seed))!;
      expect(legal(fromFen(fen), reply), reply).toBeDefined();
    }
  });

  it('does not take your pieces while it has a quiet move, so a first game is not a beating', () => {
    // White's queen hangs on d5, but Black has quiet moves.
    const fen = 'rnbqkbnr/ppp1pppp/8/3Q4/8/8/PPPP1PPP/RNB1KBNR b KQkq - 0 3';
    for (let seed = 1; seed <= 30; seed++) expect(gentleReply(fen, seeded(seed))).not.toMatch(/d5$/);
  });

  it('has nothing to play when the game is over', () => {
    expect(gentleReply('7k/6Q1/6K1/8/8/8/8/8 b - - 0 1', seeded(1))).toBeUndefined();
  });
});

describe('the coach, explaining each rule the first time it comes up', () => {
  it('explains a capture, check, castling and promotion when the learner makes one', () => {
    expect(coachNote('rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2', 'e4d5')).toMatch(/took/i);
    expect(coachNote('rnbqkbnr/ppppp1pp/8/5p2/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2', 'd1h5')).toMatch(/check/i);
    expect(coachNote('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1', 'e1g1')).toMatch(/castl/i);
    expect(coachNote('k7/4P3/8/8/8/8/8/4K3 w - - 0 1', 'e7e8q')).toMatch(/queen/i);
  });

  it('warns when the bot puts the learner in check, with the three ways out', () => {
    expect(coachNote('rnbqkbnr/pppp1ppp/8/4p3/5P2/8/PPPPP1PP/RNBQKBNR b KQkq - 0 2', 'd8h4')).toMatch(
      /move the king, block .* take/i,
    );
  });

  it('says nothing for a quiet move', () => {
    expect(coachNote(START, 'g1f3')).toBeUndefined();
  });
});
